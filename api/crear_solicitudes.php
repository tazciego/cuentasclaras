<?php
/**
 * crear_solicitudes.php
 * Abre este archivo en el navegador UNA VEZ para crear la tabla solicitudes_items.
 * Bórralo del servidor después de usarlo.
 */

require_once __DIR__ . '/conexion.php';
$pdo = conectar();

$sql = "
CREATE TABLE IF NOT EXISTS solicitudes_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    evento_id    INT          NOT NULL,
    invitado_id  INT          NOT NULL,
    nombre_item  VARCHAR(150) NOT NULL,
    estado       ENUM('pendiente','autorizado','rechazado') NOT NULL DEFAULT 'pendiente',
    creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id)   REFERENCES eventos(id)   ON DELETE CASCADE,
    FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
) ENGINE=InnoDB;
";

try {
    $pdo->exec($sql);
    echo "<p style='font-family:sans-serif;color:green;font-size:18px'>
        ✅ Tabla <strong>solicitudes_items</strong> creada correctamente.<br>
        <small style='color:#555'>Ya puedes borrar este archivo del servidor.</small>
    </p>";
} catch (PDOException $e) {
    echo "<p style='font-family:sans-serif;color:red;font-size:18px'>
        ❌ Error: " . htmlspecialchars($e->getMessage()) . "
    </p>";
}
