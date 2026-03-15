<?php
/**
 * eventos.php — CRUD de eventos
 *
 * GET    /api/eventos.php?codigo=CC-XXXX   → obtener evento por código
 * POST   /api/eventos.php                  → crear nuevo evento
 * PUT    /api/eventos.php                  → actualizar evento (nombre, estado)
 * DELETE /api/eventos.php?id=1             → eliminar evento
 *
 * Tabla esperada:
 *   CREATE TABLE eventos (
 *     id          INT AUTO_INCREMENT PRIMARY KEY,
 *     nombre      VARCHAR(120) NOT NULL,
 *     tipo        ENUM('restaurante','reunion','viaje','roomies') NOT NULL,
 *     fecha       DATE,
 *     hora        TIME,
 *     lugar       VARCHAR(200),
 *     codigo      VARCHAR(10) UNIQUE NOT NULL,
 *     estado      ENUM('activo','cerrado') DEFAULT 'activo',
 *     creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
 *   );
 */

require_once __DIR__ . '/conexion.php';
headers_api();

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo    = conectar();

// ─── GET: obtener evento por código ──────────────────────────────────────────
if ($metodo === 'GET') {
    $codigo = $_GET['codigo'] ?? null;
    $id     = $_GET['id']     ?? null;

    if ($codigo) {
        $stmt = $pdo->prepare('SELECT * FROM eventos WHERE codigo = ?');
        $stmt->execute([$codigo]);
        $evento = $stmt->fetch();

        if (!$evento) {
            responder(['error' => 'Evento no encontrado.'], 404);
        }
        responder($evento);
    }

    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM eventos WHERE id = ?');
        $stmt->execute([$id]);
        $evento = $stmt->fetch();

        if (!$evento) {
            responder(['error' => 'Evento no encontrado.'], 404);
        }
        responder($evento);
    }

    // Sin parámetros: listar todos (solo para admin/debug)
    $stmt = $pdo->query('SELECT id, nombre, tipo, codigo, estado, creado_en FROM eventos ORDER BY creado_en DESC LIMIT 50');
    responder($stmt->fetchAll());
}

// ─── POST: crear evento ───────────────────────────────────────────────────────
if ($metodo === 'POST') {
    $datos = body();

    $nombre = trim($datos['nombre'] ?? '');
    $tipo   = $datos['tipo']  ?? 'restaurante';
    $fecha  = $datos['fecha'] ?? null;
    $hora   = $datos['hora']  ?? null;
    $lugar  = trim($datos['lugar'] ?? '');

    if (!$nombre) {
        responder(['error' => 'El nombre del evento es obligatorio.'], 422);
    }

    $tipos_validos = ['restaurante', 'reunion', 'viaje', 'roomies'];
    if (!in_array($tipo, $tipos_validos, true)) {
        responder(['error' => 'Tipo de evento inválido.'], 422);
    }

    // Generar código único
    $intentos = 0;
    do {
        $codigo = generar_codigo();
        $stmt   = $pdo->prepare('SELECT id FROM eventos WHERE codigo = ?');
        $stmt->execute([$codigo]);
        $intentos++;
    } while ($stmt->fetch() && $intentos < 10);

    $stmt = $pdo->prepare('
        INSERT INTO eventos (nombre, tipo, fecha, hora, lugar, codigo)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$nombre, $tipo, $fecha, $hora, $lugar ?: null, $codigo]);

    $id = $pdo->lastInsertId();
    responder(['id' => $id, 'codigo' => $codigo, 'mensaje' => 'Evento creado.'], 201);
}

// ─── PUT: actualizar evento ───────────────────────────────────────────────────
if ($metodo === 'PUT') {
    $datos = body();
    $id    = $datos['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del evento.'], 422);
    }

    $campos  = [];
    $valores = [];

    if (isset($datos['nombre']))  { $campos[] = 'nombre = ?';  $valores[] = trim($datos['nombre']); }
    if (isset($datos['estado']))  { $campos[] = 'estado = ?';  $valores[] = $datos['estado']; }
    if (isset($datos['lugar']))   { $campos[] = 'lugar = ?';   $valores[] = trim($datos['lugar']); }

    if (!$campos) {
        responder(['error' => 'No hay campos para actualizar.'], 422);
    }

    $valores[] = $id;
    $sql = 'UPDATE eventos SET ' . implode(', ', $campos) . ' WHERE id = ?';
    $pdo->prepare($sql)->execute($valores);

    responder(['mensaje' => 'Evento actualizado.']);
}

// ─── DELETE: eliminar evento ──────────────────────────────────────────────────
if ($metodo === 'DELETE') {
    $id = $_GET['id'] ?? body()['id'] ?? null;

    if (!$id) {
        responder(['error' => 'Se requiere el id del evento.'], 422);
    }

    $pdo->prepare('DELETE FROM eventos WHERE id = ?')->execute([$id]);
    responder(['mensaje' => 'Evento eliminado.']);
}

responder(['error' => 'Método no soportado.'], 405);
