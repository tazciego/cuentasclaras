<?php
/**
 * invitados.php — Gestión de invitados / participantes
 *
 * GET    /api/invitados.php?evento_id=1          → listar invitados del evento
 * POST   /api/invitados.php                      → unirse a evento (registro)
 * PUT    /api/invitados.php                      → actualizar nombre/color
 * DELETE /api/invitados.php?id=1                 → eliminar invitado
 *
 * Tabla esperada:
 *   CREATE TABLE invitados (
 *     id          INT AUTO_INCREMENT PRIMARY KEY,
 *     evento_id   INT NOT NULL,
 *     nombre      VARCHAR(80) NOT NULL,
 *     color_index TINYINT DEFAULT 0,
 *     es_anfitrion TINYINT(1) DEFAULT 0,
 *     token       VARCHAR(64) UNIQUE,          -- token de sesión del invitado
 *     unido_en    DATETIME DEFAULT CURRENT_TIMESTAMP,
 *     FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
 *   );
 */

require_once __DIR__ . '/conexion.php';
headers_api();

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo    = conectar();

// ─── GET: listar invitados de un evento ──────────────────────────────────────
if ($metodo === 'GET') {
    $evento_id = $_GET['evento_id'] ?? null;
    $id        = $_GET['id']        ?? null;

    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM invitados WHERE id = ?');
        $stmt->execute([$id]);
        $invitado = $stmt->fetch();
        $invitado
            ? responder($invitado)
            : responder(['error' => 'Invitado no encontrado.'], 404);
    }

    if (!$evento_id) {
        responder(['error' => 'Se requiere evento_id.'], 422);
    }

    $stmt = $pdo->prepare('
        SELECT id, nombre, color_index, es_anfitrion, unido_en
        FROM invitados
        WHERE evento_id = ?
        ORDER BY unido_en ASC
    ');
    $stmt->execute([$evento_id]);
    responder($stmt->fetchAll());
}

// ─── POST: unirse a evento ────────────────────────────────────────────────────
if ($metodo === 'POST') {
    $datos = body();

    $codigo      = trim($datos['codigo']      ?? '');
    $nombre      = trim($datos['nombre']      ?? '');
    $color_index = (int)($datos['color_index'] ?? 0);
    $es_anfitrion = (int)($datos['es_anfitrion'] ?? 0);

    if (!$codigo || !$nombre) {
        responder(['error' => 'Se requieren codigo y nombre.'], 422);
    }

    // Verificar que el evento exista y esté activo
    $stmt = $pdo->prepare("SELECT id, estado FROM eventos WHERE codigo = ?");
    $stmt->execute([$codigo]);
    $evento = $stmt->fetch();

    if (!$evento) {
        responder(['error' => 'Código de evento inválido.'], 404);
    }
    if ($evento['estado'] !== 'activo') {
        responder(['error' => 'Este evento ya fue cerrado.'], 409);
    }

    // Generar token de sesión único para este invitado
    $token = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare('
        INSERT INTO invitados (evento_id, nombre, color_index, es_anfitrion, token)
        VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([$evento['id'], $nombre, $color_index, $es_anfitrion, $token]);

    $id = $pdo->lastInsertId();
    responder([
        'id'        => $id,
        'evento_id' => $evento['id'],
        'nombre'    => $nombre,
        'token'     => $token,
        'mensaje'   => 'Te uniste al evento.',
    ], 201);
}

// ─── PUT: actualizar invitado ─────────────────────────────────────────────────
if ($metodo === 'PUT') {
    $datos = body();
    $id    = $datos['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del invitado.'], 422);
    }

    $campos  = [];
    $valores = [];

    if (isset($datos['nombre']))      { $campos[] = 'nombre = ?';      $valores[] = trim($datos['nombre']); }
    if (isset($datos['color_index'])) { $campos[] = 'color_index = ?'; $valores[] = (int)$datos['color_index']; }

    if (!$campos) {
        responder(['error' => 'No hay campos para actualizar.'], 422);
    }

    $valores[] = $id;
    $pdo->prepare('UPDATE invitados SET ' . implode(', ', $campos) . ' WHERE id = ?')
        ->execute($valores);

    responder(['mensaje' => 'Invitado actualizado.']);
}

// ─── DELETE: eliminar invitado ────────────────────────────────────────────────
if ($metodo === 'DELETE') {
    $id = $_GET['id'] ?? body()['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del invitado.'], 422);
    }

    $pdo->prepare('DELETE FROM invitados WHERE id = ?')->execute([$id]);
    responder(['mensaje' => 'Invitado eliminado.']);
}

responder(['error' => 'Método no soportado.'], 405);
