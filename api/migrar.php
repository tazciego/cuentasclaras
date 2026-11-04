<?php
require_once __DIR__ . '/conexion.php';
headers_api();

$pdo = conectar();
$resultados = [];

$migraciones = [
    'eventos_fecha_fin' => "ALTER TABLE eventos ADD COLUMN fecha_fin DATE NULL AFTER fecha",
    'consumos_pagado_por_invitado_id' => "ALTER TABLE consumos ADD COLUMN pagado_por_invitado_id INT NULL AFTER evento_id",
];

foreach ($migraciones as $nombre => $sql) {
    try {
        $pdo->exec($sql);
        $resultados[$nombre] = 'OK — columna agregada';
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        // Duplicate column = ya existía, está bien
        if (str_contains($msg, 'Duplicate column') || str_contains($msg, 'already exists')) {
            $resultados[$nombre] = 'YA EXISTÍA — sin cambios';
        } else {
            $resultados[$nombre] = 'ERROR: ' . $msg;
        }
    }
}

responder(['migraciones' => $resultados, 'estado' => 'listo']);
