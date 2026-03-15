<?php
/**
 * pagos.php — Gestión de pagos entre invitados
 *
 * GET    /api/pagos.php?evento_id=1              → listar pagos del evento
 * GET    /api/pagos.php?invitado_id=5            → pagos de un invitado
 * POST   /api/pagos.php                          → registrar pago
 * PUT    /api/pagos.php                          → confirmar / actualizar pago
 * DELETE /api/pagos.php?id=1                     → eliminar pago
 *
 * Tabla esperada:
 *   CREATE TABLE pagos (
 *     id            INT AUTO_INCREMENT PRIMARY KEY,
 *     evento_id     INT NOT NULL,
 *     invitado_id   INT NOT NULL,              -- quién paga
 *     monto         DECIMAL(10,2) NOT NULL,
 *     metodo        ENUM('spei','tarjeta','efectivo','otro') DEFAULT 'otro',
 *     estado        ENUM('pendiente','confirmado','rechazado') DEFAULT 'pendiente',
 *     referencia    VARCHAR(100),              -- clave de rastreo SPEI, últimos 4 dígitos, etc.
 *     nota          VARCHAR(255),
 *     creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
 *     confirmado_en DATETIME,
 *     FOREIGN KEY (evento_id)   REFERENCES eventos(id)   ON DELETE CASCADE,
 *     FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
 *   );
 */

require_once __DIR__ . '/conexion.php';
headers_api();

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo    = conectar();

// ─── GET: listar pagos ────────────────────────────────────────────────────────
if ($metodo === 'GET') {
    $evento_id   = $_GET['evento_id']   ?? null;
    $invitado_id = $_GET['invitado_id'] ?? null;
    $id          = $_GET['id']          ?? null;

    if ($id) {
        $stmt = $pdo->prepare('
            SELECT p.*, i.nombre AS invitado_nombre
            FROM pagos p
            JOIN invitados i ON i.id = p.invitado_id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $pago = $stmt->fetch();
        $pago
            ? responder($pago)
            : responder(['error' => 'Pago no encontrado.'], 404);
    }

    if ($evento_id) {
        $stmt = $pdo->prepare('
            SELECT p.id, p.monto, p.metodo, p.estado, p.referencia, p.nota,
                   p.creado_en, p.confirmado_en,
                   i.nombre AS invitado_nombre, i.id AS invitado_id
            FROM pagos p
            JOIN invitados i ON i.id = p.invitado_id
            WHERE p.evento_id = ?
            ORDER BY p.creado_en DESC
        ');
        $stmt->execute([$evento_id]);
        responder($stmt->fetchAll());
    }

    if ($invitado_id) {
        $stmt = $pdo->prepare('
            SELECT p.id, p.monto, p.metodo, p.estado, p.referencia,
                   p.creado_en, p.confirmado_en,
                   e.nombre AS evento_nombre, e.codigo AS evento_codigo
            FROM pagos p
            JOIN eventos e ON e.id = p.evento_id
            WHERE p.invitado_id = ?
            ORDER BY p.creado_en DESC
        ');
        $stmt->execute([$invitado_id]);
        responder($stmt->fetchAll());
    }

    responder(['error' => 'Se requiere evento_id o invitado_id.'], 422);
}

// ─── POST: registrar pago ─────────────────────────────────────────────────────
if ($metodo === 'POST') {
    $datos = body();

    $evento_id   = $datos['evento_id']   ?? null;
    $invitado_id = $datos['invitado_id'] ?? null;
    $monto       = (float)($datos['monto']  ?? 0);
    $metodo_pago = $datos['metodo']      ?? 'otro';
    $referencia  = trim($datos['referencia'] ?? '');
    $nota        = trim($datos['nota']       ?? '');

    if (!$evento_id || !$invitado_id) {
        responder(['error' => 'Se requieren evento_id e invitado_id.'], 422);
    }
    if ($monto <= 0) {
        responder(['error' => 'El monto debe ser mayor a 0.'], 422);
    }

    $metodos_validos = ['spei', 'tarjeta', 'efectivo', 'otro'];
    if (!in_array($metodo_pago, $metodos_validos, true)) {
        responder(['error' => 'Método de pago inválido.'], 422);
    }

    $stmt = $pdo->prepare('
        INSERT INTO pagos (evento_id, invitado_id, monto, metodo, referencia, nota)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $evento_id, $invitado_id, $monto,
        $metodo_pago,
        $referencia ?: null,
        $nota       ?: null,
    ]);

    $id = $pdo->lastInsertId();
    responder(['id' => $id, 'mensaje' => 'Pago registrado.'], 201);
}

// ─── PUT: confirmar o actualizar pago ─────────────────────────────────────────
if ($metodo === 'PUT') {
    $datos = body();
    $id    = $datos['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del pago.'], 422);
    }

    $campos  = [];
    $valores = [];

    if (isset($datos['estado'])) {
        $estados_validos = ['pendiente', 'confirmado', 'rechazado'];
        if (!in_array($datos['estado'], $estados_validos, true)) {
            responder(['error' => 'Estado inválido.'], 422);
        }
        $campos[] = 'estado = ?';
        $valores[] = $datos['estado'];

        // Registrar timestamp de confirmación
        if ($datos['estado'] === 'confirmado') {
            $campos[]  = 'confirmado_en = NOW()';
        }
    }

    if (isset($datos['referencia'])) { $campos[] = 'referencia = ?'; $valores[] = trim($datos['referencia']); }
    if (isset($datos['nota']))       { $campos[] = 'nota = ?';       $valores[] = trim($datos['nota']); }
    if (isset($datos['monto']))      { $campos[] = 'monto = ?';      $valores[] = (float)$datos['monto']; }

    if (!$campos) {
        responder(['error' => 'No hay campos para actualizar.'], 422);
    }

    $valores[] = $id;
    $pdo->prepare('UPDATE pagos SET ' . implode(', ', $campos) . ' WHERE id = ?')
        ->execute($valores);

    responder(['mensaje' => 'Pago actualizado.']);
}

// ─── DELETE: eliminar pago ────────────────────────────────────────────────────
if ($metodo === 'DELETE') {
    $id = $_GET['id'] ?? body()['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del pago.'], 422);
    }

    $pdo->prepare('DELETE FROM pagos WHERE id = ?')->execute([$id]);
    responder(['mensaje' => 'Pago eliminado.']);
}

responder(['error' => 'Método no soportado.'], 405);
