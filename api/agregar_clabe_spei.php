<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = conectar();

try {
    $res = $pdo->query("SHOW COLUMNS FROM eventos LIKE 'clabe_spei'");
    if ($res->fetch()) {
        echo "OK — columna clabe_spei ya existe, no se hizo nada.";
    } else {
        $pdo->query("ALTER TABLE eventos ADD COLUMN clabe_spei CHAR(18) NULL DEFAULT NULL");
        echo "OK — columna clabe_spei agregada correctamente.";
    }
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage();
}
