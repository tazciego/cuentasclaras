<?php
/**
 * consumos.php — Gestión de consumos / ítems del evento
 *
 * GET    /api/consumos.php?evento_id=1   → listar consumos del evento
 * POST   /api/consumos.php               → agregar consumo o registrar asignación
 * PUT    /api/consumos.php               → actualizar consumo (cantidad, asignados)
 * DELETE /api/consumos.php?id=1          → eliminar consumo
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

    // Notificaciones de compartir para un invitado
    if (isset($_GET['notificaciones']) && isset($_GET['invitado_id']) && isset($_GET['evento_id'])) {
        $inv_id = (int)$_GET['invitado_id'];
        $ev_id  = (int)$_GET['evento_id'];
        $stmt = $pdo->prepare("
            SELECT ci.consumo_id, ci.invitado_id, ci.cantidad,
                   COALESCE(ci.estado,'aceptado') AS estado,
                   ci.solicitado_por,
                   c.descripcion AS consumo_nombre, c.precio,
                   i.nombre AS invitado_nombre,
                   i2.nombre AS solicitante_nombre
            FROM consumos_invitados ci
            JOIN consumos c ON c.id = ci.consumo_id
            JOIN invitados i ON i.id = ci.invitado_id
            LEFT JOIN invitados i2 ON i2.id = ci.solicitado_por
            WHERE c.evento_id = ?
              AND (
                (ci.invitado_id = ? AND COALESCE(ci.estado,'aceptado') = 'pendiente'
                 AND ci.solicitado_por IS NOT NULL AND ci.solicitado_por != ?)
                OR
                (ci.solicitado_por = ? AND COALESCE(ci.estado,'aceptado') = 'rechazado')
              )
        ");
        $stmt->execute([$ev_id, $inv_id, $inv_id, $inv_id]);
        responder($stmt->fetchAll());
    }

    $stmt = $pdo->prepare('
        SELECT id, descripcion, precio, cantidad, creado_en
        FROM consumos
        WHERE evento_id = ?
        ORDER BY creado_en ASC
    ');
    $stmt->execute([$evento_id]);
    $consumos = $stmt->fetchAll();

    if ($consumos) {
        $ids          = array_column($consumos, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmtA        = $pdo->prepare("
            SELECT ci.consumo_id, ci.invitado_id, ci.cantidad,
                   COALESCE(ci.estado, 'aceptado') AS estado,
                   ci.solicitado_por,
                   i.nombre AS invitado_nombre,
                   i2.nombre AS solicitante_nombre
            FROM consumos_invitados ci
            JOIN invitados i ON i.id = ci.invitado_id
            LEFT JOIN invitados i2 ON i2.id = ci.solicitado_por
            WHERE ci.consumo_id IN ($placeholders)
              AND ci.cantidad > 0
              AND COALESCE(ci.estado, 'aceptado') != 'rechazado'
        ");
        $stmtA->execute($ids);
        $asignaciones = $stmtA->fetchAll();

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

    // Caso especial: registrar que un invitado eligió un consumo existente
    if (isset($datos['consumo_id'])) {
        $consumo_id  = (int)$datos['consumo_id'];
        $invitado_id = (int)($datos['invitado_id'] ?? 0);
        $cantidad    = (int)($datos['cantidad']    ?? 1);

        if (!$consumo_id || !$invitado_id) {
            responder(['error' => 'Se requieren consumo_id e invitado_id.'], 422);
        }

        // cantidad = 0 → eliminar asignación
        if ($cantidad <= 0) {
            $pdo->prepare('DELETE FROM consumos_invitados WHERE consumo_id = ? AND invitado_id = ?')
                ->execute([$consumo_id, $invitado_id]);
            responder(['mensaje' => 'Asignación eliminada.']);
        }

        $estado        = $datos['estado']        ?? 'aceptado';
        $solicitado_por = isset($datos['solicitado_por']) ? (int)$datos['solicitado_por'] : null;
        $estados_validos = ['aceptado', 'pendiente'];
        if (!in_array($estado, $estados_validos, true)) $estado = 'aceptado';

        $pdo->prepare('
            INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad, estado, solicitado_por)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), estado = VALUES(estado), solicitado_por = VALUES(solicitado_por)
        ')->execute([$consumo_id, $invitado_id, $cantidad, $estado, $solicitado_por]);

        responder(['mensaje' => 'Asignacion registrada.'], 201);
    }

    $evento_id   = $datos['evento_id']   ?? null;
    $descripcion = trim($datos['descripcion'] ?? '');
    $precio      = (float)($datos['precio']   ?? 0);
    $cantidad    = (int)($datos['cantidad']   ?? 1);
    $asignados   = $datos['asignados']   ?? [];

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

        if ($asignados) {
            $stmtA = $pdo->prepare('
                INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad)
            ');
            foreach ($asignados as $asig) {
                if (is_array($asig)) {
                    $inv_id = (int)($asig['invitado_id'] ?? 0);
                    $cant   = max(1, (int)($asig['cantidad'] ?? 1));
                } else {
                    $inv_id = (int)$asig;
                    $cant   = 1;
                }
                if ($inv_id > 0) {
                    $stmtA->execute([$consumo_id, $inv_id, $cant]);
                }
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

    // Caso: actualizar estado de asignación individual (sin id de consumo, con consumo_id + invitado_id)
    if (!isset($datos['id']) && isset($datos['consumo_id']) && isset($datos['invitado_id'])) {
        $consumo_id  = (int)$datos['consumo_id'];
        $invitado_id = (int)$datos['invitado_id'];
        $nuevo_estado = $datos['estado'] ?? null;
        $estados_v = ['aceptado', 'pendiente', 'rechazado'];
        if (!$nuevo_estado || !in_array($nuevo_estado, $estados_v, true)) {
            responder(['error' => 'Estado de asignacion invalido.'], 422);
        }
        $pdo->prepare('UPDATE consumos_invitados SET estado = ? WHERE consumo_id = ? AND invitado_id = ?')
            ->execute([$nuevo_estado, $consumo_id, $invitado_id]);
        responder(['mensaje' => 'Estado de asignacion actualizado.']);
    }

    $id    = $datos['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del consumo.'], 422);
    }

    $pdo->beginTransaction();
    try {
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

        if (isset($datos['asignados'])) {
            $pdo->prepare('DELETE FROM consumos_invitados WHERE consumo_id = ?')->execute([$id]);

            if ($datos['asignados']) {
                $stmtA = $pdo->prepare('
                    INSERT INTO consumos_invitados (consumo_id, invitado_id, cantidad) VALUES (?, ?, ?)
                ');
                foreach ($datos['asignados'] as $asig) {
                    if (is_array($asig)) {
                        $inv_id = (int)($asig['invitado_id'] ?? 0);
                        $cant   = max(1, (int)($asig['cantidad'] ?? 1));
                    } else {
                        $inv_id = (int)$asig;
                        $cant   = 1;
                    }
                    if ($inv_id > 0) {
                        $stmtA->execute([$id, $inv_id, $cant]);
                    }
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

    $pdo->prepare('DELETE FROM consumos WHERE id = ?')->execute([$id]);
    responder(['mensaje' => 'Consumo eliminado.']);
}

responder(['error' => 'Método no soportado.'], 405);
