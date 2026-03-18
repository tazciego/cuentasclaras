<?php
/**
 * consumos.php — Gestión de consumos / ítems del evento
 *
 * GET    /api/consumos.php?evento_id=1           → listar consumos del evento
 * POST   /api/consumos.php                       → agregar consumo
 * PUT    /api/consumos.php                       → actualizar consumo (cantidad, asignados)
 * DELETE /api/consumos.php?id=1                  → eliminar consumo
 *
 * Tablas esperadas:
 *
 *   CREATE TABLE consumos (
 *     id           INT AUTO_INCREMENT PRIMARY KEY,
 *     evento_id    INT NOT NULL,
 *     descripcion  VARCHAR(150) NOT NULL,
 *     precio       DECIMAL(10,2) NOT NULL DEFAULT 0,
 *     cantidad     INT NOT NULL DEFAULT 1,
 *     creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP,
 *     FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
 *   );
 *
 *   CREATE TABLE consumos_invitados (
 *     consumo_id   INT NOT NULL,
 *     invitado_id  INT NOT NULL,
 *     cantidad     INT NOT NULL DEFAULT 1,
 *     PRIMARY KEY (consumo_id, invitado_id),
 *     FOREIGN KEY (consumo_id)  REFERENCES consumos(id)  ON DELETE CASCADE,
 *     FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
 *   );
 */

require_once __DIR__ . '/conexion.php';
headers_api();

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo    = conectar();

// ─── GET: listar consumos con sus asignados ───────────────────────────────────
if ($metodo === 'GET') {
    $evento_id = $_GET['evento_id'] ?? null;

    if (!$evento_id) {
        responder(['error' => 'Se requiere evento_id.'], 422);
    }

    // Consumos del evento
    $stmt = $pdo->prepare('
        SELECT id, descripcion, precio, cantidad, creado_en
        FROM consumos
        WHERE evento_id = ?
        ORDER BY creado_en ASC
    ');
    $stmt->execute([$evento_id]);
    $consumos = $stmt->fetchAll();

    // Asignaciones de cada consumo
    if ($consumos) {
        $ids          = array_column($consumos, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmtA        = $pdo->prepare("
            SELECT ci.consumo_id, ci.invitado_id, ci.cantidad, i.nombre AS invitado_nombre
            FROM consumos_invitados ci
            JOIN invitados i ON i.id = ci.invitado_id
            WHERE ci.consumo_id IN ($placeholders)
        ");
        $stmtA->execute($ids);
        $asignaciones = $stmtA->fetchAll();

        // Indexar asignaciones por consumo_id
        $mapa = [];
        foreach ($asignaciones as $a) {
            $mapa[$a['consumo_id']][] = $a;
        }

        foreach ($consumos as &$c) {
            $c['asignados'] = $mapa[$c['id']] ?? [];
        }
        unset($c);
    }

    responder($consumos);
}

// ─── POST: agregar consumo o registrar asignación ────────────────────────────
if ($metodo === 'POST') {
    $datos = body();

    // Caso especial: solo registrar que un invitado eligió un consumo existente
    if (isset($datos['consumo_id'])) {
        $consumo_id  = (int)$datos['consumo_id'];
        $invitado_id = (int)($datos['invitado_id'] ?? 0);
        $cantidad    = (int)($datos['cantidad']    ?? 1);

        if (!$consumo_id || !$invitado_id) {
            responder(['error' => 'Se requieren consumo_id e invitado_id.'], 422);
        }

        $pdo->prepare('
            INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad)
        ')->execute([$consumo_id, $invitado_id, $cantidad]);

        responder(['mensaje' => 'Asignacion registrada.'], 201);
    }

    $evento_id   = $datos['evento_id']   ?? null;
    $descripcion = trim($datos['descripcion'] ?? '');
    $precio      = (float)($datos['precio']   ?? 0);
    $cantidad    = (int)($datos['cantidad']   ?? 1);
    $asignados   = $datos['asignados']   ?? [];   // array de invitado_id

    if (!$evento_id || !$descripcion) {
        responder(['error' => 'Se requieren evento_id y descripcion.'], 422);
    }
    if ($precio < 0) {
        responder(['error' => 'El precio no puede ser negativo.'], 422);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('
            INSERT INTO consumos (evento_id, descripcion, precio, cantidad)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$evento_id, $descripcion, $precio, $cantidad]);
        $consumo_id = $pdo->lastInsertId();

        // Registrar asignaciones si se enviaron
        if ($asignados) {
            $stmtA = $pdo->prepare('
                INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE cantidad = cantidad + 1
            ');
            foreach ($asignados as $inv_id) {
                $stmtA->execute([$consumo_id, (int)$inv_id]);
            }
        }

        $pdo->commit();
        responder(['id' => $consumo_id, 'mensaje' => 'Consumo agregado.'], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        responder(['error' => 'Error al guardar el consumo.'], 500);
    }
}

// ─── PUT: actualizar consumo y/o asignados ────────────────────────────────────
if ($metodo === 'PUT') {
    $datos = body();
    $id    = $datos['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del consumo.'], 422);
    }

    $pdo->beginTransaction();
    try {
        // Actualizar campos del consumo
        $campos  = [];
        $valores = [];

        if (isset($datos['descripcion'])) { $campos[] = 'descripcion = ?'; $valores[] = trim($datos['descripcion']); }
        if (isset($datos['precio']))      { $campos[] = 'precio = ?';      $valores[] = (float)$datos['precio']; }
        if (isset($datos['cantidad']))    { $campos[] = 'cantidad = ?';    $valores[] = (int)$datos['cantidad']; }

        if ($campos) {
            $valores[] = $id;
            $pdo->prepare('UPDATE consumos SET ' . implode(', ', $campos) . ' WHERE id = ?')
                ->execute($valores);
        }

        // Reemplazar asignaciones si se enviaron
        if (isset($datos['asignados'])) {
            $pdo->prepare('DELETE FROM consumos_invitados WHERE consumo_id = ?')->execute([$id]);

            if ($datos['asignados']) {
                $stmtA = $pdo->prepare('
                    INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad) VALUES (?, ?, 1)
                ');
                foreach ($datos['asignados'] as $inv_id) {
                    $stmtA->execute([$id, (int)$inv_id]);
                }
            }
        }

        $pdo->commit();
        responder(['mensaje' => 'Consumo actualizado.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        responder(['error' => 'Error al actualizar el consumo.'], 500);
    }
}

// ─── DELETE: eliminar consumo ─────────────────────────────────────────────────
if ($metodo === 'DELETE') {
    $id = $_GET['id'] ?? body()['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del consumo.'], 422);
    }

    // ON DELETE CASCADE en consumos_invitados elimina las asignaciones automáticamente
    $pdo->prepare('DELETE FROM consumos WHERE id = ?')->execute([$id]);
    responder(['mensaje' => 'Consumo eliminado.']);
}

responder(['error' => 'Método no soportado.'], 405);
