<?php
require 'conexion.php';
$pdo = conectar();
$pdo->exec("ALTER TABLE pagos MODIFY COLUMN estado ENUM('pendiente','confirmado','rechazado','solicitando_pago','revisar') NOT NULL DEFAULT 'pendiente'");
echo "OK: columna estado actualizada en pagos";
