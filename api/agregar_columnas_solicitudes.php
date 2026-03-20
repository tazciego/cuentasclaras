<?php
require 'conexion.php';
$pdo = conectar();

$stmt = $pdo->query("SHOW COLUMNS FROM solicitudes_items LIKE 'cantidad'");
if ($stmt->rowCount() === 0) {
    $pdo->exec("ALTER TABLE solicitudes_items ADD COLUMN cantidad INT NOT NULL DEFAULT 1");
    echo "OK: columna cantidad agregada\n";
} else {
    echo "OK: columna cantidad ya existia\n";
}

$stmt = $pdo->query("SHOW COLUMNS FROM solicitudes_items LIKE 'precio_unitario'");
if ($stmt->rowCount() === 0) {
    $pdo->exec("ALTER TABLE solicitudes_items ADD COLUMN precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    echo "OK: columna precio_unitario agregada\n";
} else {
    echo "OK: columna precio_unitario ya existia\n";
}
