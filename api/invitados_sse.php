<?php
/**
 * invitados_sse.php — Server-Sent Events para invitados en tiempo real
 *
 * GET /api/invitados_sse.php?evento_id=1
 *
 * El servidor mantiene la conexión abierta y empuja un evento cada vez
 * que detecta un cambio en la lista de invitados.
 * El cliente reconecta automáticamente si se cae la conexión.
 */

require_once __DIR__ . '/conexion.php';

// Sin límite de tiempo de ejecución para mantener la conexión abierta
@set_time_limit(0);

// Deshabilitar todo buffer de salida para que los eventos lleguen de inmediato
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
while (ob_get_level()) ob_end_flush();
ob_implicit_flush(true);

// Headers SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache, no-store');
header('X-Accel-Buffering: no');       // deshabilita buffer en nginx
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$evento_id = (int)($_GET['evento_id'] ?? 0);

if (!$evento_id) {
    echo "data: " . json_encode(['error' => 'Se requiere evento_id']) . "\n\n";
    flush();
    exit;
}

$pdo = conectar();

$stmt = $pdo->prepare('
    SELECT id, nombre, color_index, es_anfitrion, unido_en
    FROM invitados
    WHERE evento_id = ?
    ORDER BY es_anfitrion DESC, unido_en ASC
');

$ultimo_hash = '';

while (true) {
    // Cortar si el cliente cerró la conexión
    if (connection_aborted()) break;

    $stmt->execute([$evento_id]);
    $invitados = $stmt->fetchAll();

    $hash = md5(json_encode(array_column($invitados, 'id')));

    // Solo emitir evento si la lista cambió
    if ($hash !== $ultimo_hash) {
        $ultimo_hash = $hash;
        echo "data: " . json_encode($invitados, JSON_UNESCAPED_UNICODE) . "\n\n";
        flush();
    }

    sleep(1);
}
