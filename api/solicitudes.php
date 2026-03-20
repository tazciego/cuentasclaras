<?php
/**
 * solicitudes.php — Solicitudes de items que el invitado pide al anfitrión
 *
 * GET  ?evento_id=X                     → todas las solicitudes del evento
 * GET  ?evento_id=X&invitado_id=Y       → solicitudes de un invitado
 * POST {evento_id, invitado_id, nombre_item, cantidad, precio_unitario} → crear
 * PUT  {id, estado}                     → actualizar estado (autorizado|rechazado)
 */

require_once __DIR__ . '/conexion.php';
headers_api();

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo    = conectar();

// ─── GET ─────────────────────────────────────────────────────────────────────
if ($metodo === 'GET') {
    $evento_id   = isset($_GET['evento_id'])   ? (int)$_GET['evento_id']   : 0;
    $invitado_id = isset($_GET['invitado_id']) ? (int)$_GET['invitado_id'] : 0;

    if (!$evento_id) {
        responder(['error' => 'Se requiere evento_id.'], 422);
    }

    if ($invitado_id > 0) {
        $stmt = $pdo->prepare('
            SELECT s.id, s.evento_id, s.invitado_id, i.nombre AS invitado_nombre,
                   s.nombre_item, s.cantidad, s.precio_unitario, s.estado, s.creado_en
            FROM solicitudes_items s
            JOIN invitados i ON i.id = s.invitado_id
            WHERE s.evento_id = ? AND s.invitado_id = ?
            ORDER BY s.creado_en DESC
        ');
        $stmt->execute([$evento_id, $invitado_id]);
    } else {
        $stmt = $pdo->prepare('
            SELECT s.id, s.evento_id, s.invitado_id, i.nombre AS invitado_nombre,
                   s.nombre_item, s.cantidad, s.precio_unitario, s.estado, s.creado_en
            FROM solicitudes_items s
            JOIN invitados i ON i.id = s.invitado_id
            WHERE s.evento_id = ?
            ORDER BY s.creado_en DESC
        ');
        $stmt->execute([$evento_id]);
    }

    responder($stmt->fetchAll());
}

// ─── POST ────────────────────────────────────────────────────────────────────
if ($metodo === 'POST') {
    $data            = body();
    $evento_id       = (int)($data['evento_id']       ?? 0);
    $invitado_id     = (int)($data['invitado_id']     ?? 0);
    $nombre_item     = trim($data['nombre_item']      ?? '');
    $cantidad        = max(1, (int)($data['cantidad'] ?? 1));
    $precio_unitario = (float)($data['precio_unitario'] ?? 0);

    if (!$evento_id || !$invitado_id || $nombre_item === '') {
        responder(['error' => 'Faltan campos requeridos.'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO solicitudes_items (evento_id, invitado_id, nombre_item, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$evento_id, $invitado_id, $nombre_item, $cantidad, $precio_unitario]);
    $id = (int)$pdo->lastInsertId();

    responder(['id' => $id, 'mensaje' => 'Solicitud enviada.'], 201);
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
if ($metodo === 'PUT') {
    $data   = body();
    $id     = (int)($data['id']     ?? 0);
    $estado = $data['estado'] ?? '';

    if (!$id || !in_array($estado, ['autorizado', 'rechazado'])) {
        responder(['error' => 'Datos inválidos.'], 422);
    }

    $stmt = $pdo->prepare('UPDATE solicitudes_items SET estado = ? WHERE id = ?');
    $stmt->execute([$estado, $id]);

    responder(['mensaje' => 'Solicitud actualizada.']);
}

responder(['error' => 'Método no permitido.'], 405);
