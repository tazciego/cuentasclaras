<?php
require_once __DIR__ . '/conexion.php';
headers_api();

$pdo = conectar();
$resultados = [];

$migraciones = [
    'eventos_fecha_fin'               => "ALTER TABLE eventos ADD COLUMN fecha_fin DATE NULL AFTER fecha",
    'consumos_pagado_por_invitado_id' => "ALTER TABLE consumos ADD COLUMN pagado_por_invitado_id INT NULL AFTER evento_id",
    'consumos_categoria'              => "ALTER TABLE consumos ADD COLUMN categoria ENUM('renta','servicios','despensa','suscripciones','otros') NULL AFTER descripcion",
    'consumos_recurrente'             => "ALTER TABLE consumos ADD COLUMN recurrente TINYINT(1) NOT NULL DEFAULT 0 AFTER categoria",
    'consumos_mes'                    => "ALTER TABLE consumos ADD COLUMN mes VARCHAR(7) NULL AFTER recurrente",
    'consumos_invitados_monto'        => "ALTER TABLE consumos_invitados ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER cantidad",
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
