<?php
// ─── Configuración de base de datos ──────────────────────────────────────────
// Rellena estas variables antes de desplegar en el servidor

define('DB_HOST',     '');   // Ej: localhost  o  127.0.0.1
define('DB_PORT',     '3306');
define('DB_NAME',     '');   // Nombre de la base de datos
define('DB_USER',     '');   // Usuario de MySQL
define('DB_PASSWORD', '');   // Contraseña

// ─── Constantes de la aplicación ─────────────────────────────────────────────
define('APP_NAME',    'CuentasClaras');
define('APP_VERSION', '1.0.0');

// ─── Conexión PDO ─────────────────────────────────────────────────────────────

function conectar(): PDO {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST, DB_PORT, DB_NAME
    );

    $opciones = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASSWORD, $opciones);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión a la base de datos.']);
        exit;
    }
}

// ─── Headers CORS y JSON ──────────────────────────────────────────────────────

function headers_api(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Pre-flight CORS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lee y decodifica el cuerpo JSON de la petición. */
function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/** Responde con JSON y código HTTP. */
function responder(array $data, int $codigo = 200): void {
    http_response_code($codigo);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Genera un código de invitación único (formato CC-XXXX). */
function generar_codigo(): string {
    return 'CC-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
}
