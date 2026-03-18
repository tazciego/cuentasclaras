<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/conexion.php';

echo "CuentasClaras - Instalacion\n";
echo "============================\n\n";
echo "PHP version: " . PHP_VERSION . "\n";
echo "Base de datos: " . DB_NAME . "\n\n";

// --- Conexion ---
echo "Conectando a la base de datos...\n";
try {
    $pdo = conectar();
    echo "OK: Conexion exitosa\n\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit;
}

$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

// --- Tablas ---

$tablas = array();

$tablas['eventos'] =
    "CREATE TABLE IF NOT EXISTS eventos (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        nombre    VARCHAR(120) NOT NULL,
        tipo      VARCHAR(20) NOT NULL DEFAULT 'restaurante',
        fecha     DATE,
        hora      TIME,
        lugar     VARCHAR(200),
        codigo    VARCHAR(10) UNIQUE NOT NULL,
        estado    VARCHAR(10) NOT NULL DEFAULT 'activo',
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$tablas['invitados'] =
    "CREATE TABLE IF NOT EXISTS invitados (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        evento_id    INT NOT NULL,
        nombre       VARCHAR(80) NOT NULL,
        color_index  TINYINT NOT NULL DEFAULT 0,
        es_anfitrion TINYINT NOT NULL DEFAULT 0,
        token        VARCHAR(64) UNIQUE,
        unido_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$tablas['consumos'] =
    "CREATE TABLE IF NOT EXISTS consumos (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        evento_id   INT NOT NULL,
        descripcion VARCHAR(150) NOT NULL,
        precio      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        cantidad    INT NOT NULL DEFAULT 1,
        creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$tablas['consumos_invitados'] =
    "CREATE TABLE IF NOT EXISTS consumos_invitados (
        consumo_id  INT NOT NULL,
        invitado_id INT NOT NULL,
        cantidad    INT NOT NULL DEFAULT 1,
        PRIMARY KEY (consumo_id, invitado_id),
        FOREIGN KEY (consumo_id)  REFERENCES consumos(id)  ON DELETE CASCADE,
        FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$tablas['pagos'] =
    "CREATE TABLE IF NOT EXISTS pagos (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        evento_id     INT NOT NULL,
        invitado_id   INT NOT NULL,
        monto         DECIMAL(10,2) NOT NULL,
        metodo        VARCHAR(20) NOT NULL DEFAULT 'otro',
        estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        referencia    VARCHAR(100),
        nota          VARCHAR(255),
        creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        confirmado_en DATETIME,
        FOREIGN KEY (evento_id)   REFERENCES eventos(id)   ON DELETE CASCADE,
        FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

echo "Creando tablas...\n";
echo "------------------\n";

$errores = 0;

foreach ($tablas as $nombre => $sql) {
    try {
        $pdo->exec($sql);
        echo "OK: " . $nombre . "\n";
    } catch (Exception $e) {
        echo "ERROR: " . $nombre . " -> " . $e->getMessage() . "\n";
        $errores++;
    }
}

$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

echo "\n";
if ($errores === 0) {
    echo "============================\n";
    echo "INSTALACION COMPLETADA\n";
    echo "Todas las tablas fueron creadas.\n";
    echo "Elimina este archivo del servidor.\n";
} else {
    echo "============================\n";
    echo "INSTALACION CON ERRORES: " . $errores . " tabla(s) fallaron.\n";
}
