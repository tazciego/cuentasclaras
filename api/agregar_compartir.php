<?php
require 'conexion.php';
$pdo = conectar();

// Columna estado en consumos_invitados
$stmt = $pdo->query("SHOW COLUMNS FROM consumos_invitados LIKE 'estado'");
if ($stmt->rowCount() === 0) {
    $pdo->exec("ALTER TABLE consumos_invitados ADD COLUMN estado ENUM('aceptado','pendiente','rechazado') NOT NULL DEFAULT 'aceptado'");
    echo "OK: columna estado agregada en consumos_invitados\n";
} else {
    echo "OK: columna estado ya existia\n";
}

// Columna solicitado_por en consumos_invitados
$stmt = $pdo->query("SHOW COLUMNS FROM consumos_invitados LIKE 'solicitado_por'");
if ($stmt->rowCount() === 0) {
    $pdo->exec("ALTER TABLE consumos_invitados ADD COLUMN solicitado_por INT NULL");
    echo "OK: columna solicitado_por agregada en consumos_invitados\n";
} else {
    echo "OK: columna solicitado_por ya existia\n";
}
