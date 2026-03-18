<?php
// ─── SEGURIDAD: elimina este archivo del servidor después de diagnosticar ─────
// define('DEBUG_TOKEN', 'mi_clave_secreta');
// if (($_GET['token'] ?? '') !== DEBUG_TOKEN) { http_response_code(403); die('Acceso denegado.'); }

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '1');
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debug — CuentasClaras API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; color: #1a1a1a; }
    h1   { font-size: 1.4rem; margin-bottom: 4px; }
    h2   { font-size: 1rem; margin: 28px 0 8px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .ok  { background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; padding: 10px 14px; margin: 6px 0; font-size: .9rem; }
    .err { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 10px 14px; margin: 6px 0; font-size: .9rem; }
    .warn{ background: #fefce8; border: 1px solid #fde047; color: #713f12; border-radius: 8px; padding: 10px 14px; margin: 6px 0; font-size: .9rem; }
    pre  { background: #1e1e1e; color: #d4d4d4; border-radius: 8px; padding: 14px; font-size: .8rem; overflow-x: auto; margin: 8px 0; }
    table{ width: 100%; border-collapse: collapse; font-size: .85rem; margin: 8px 0; }
    th   { background: #f0f0f0; text-align: left; padding: 7px 10px; border: 1px solid #ddd; }
    td   { padding: 7px 10px; border: 1px solid #ddd; vertical-align: top; }
    .aviso { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 8px; padding: 12px 16px; margin-top: 32px; font-size: .85rem; }
  </style>
</head>
<body>

<h1>CuentasClaras — Diagnóstico de API</h1>
<p style="color:#888; font-size:.85rem; margin-top:2px;">
  <?= date('Y-m-d H:i:s') ?> · PHP <?= PHP_VERSION ?> · <?= PHP_OS ?>
</p>

<?php

// ══════════════════════════════════════════════════════════════════════════════
// 1. ENTORNO PHP
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>1. Entorno PHP</h2>';

$checks = [
  'PDO disponible'        => extension_loaded('pdo'),
  'PDO MySQL disponible'  => extension_loaded('pdo_mysql'),
  'JSON disponible'       => extension_loaded('json'),
  'mbstring disponible'   => extension_loaded('mbstring'),
  'allow_url_fopen'       => (bool) ini_get('allow_url_fopen'),
];

foreach ($checks as $label => $ok) {
  echo $ok
    ? "<div class='ok'>✅ $label</div>"
    : "<div class='err'>❌ $label — extensión faltante</div>";
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. ARCHIVO conexion.php
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>2. Archivo conexion.php</h2>';

$ruta_conexion = __DIR__ . '/conexion.php';
if (!file_exists($ruta_conexion)) {
  echo "<div class='err'>❌ No se encontró conexion.php en: $ruta_conexion</div>";
} else {
  echo "<div class='ok'>✅ conexion.php existe</div>";

  // Capturar errores al incluir
  ob_start();
  $error_include = null;
  try {
    require_once $ruta_conexion;
  } catch (Throwable $e) {
    $error_include = $e->getMessage();
  }
  $salida = ob_get_clean();

  if ($error_include) {
    echo "<div class='err'>❌ Error al cargar conexion.php: " . htmlspecialchars($error_include) . "</div>";
  } else {
    echo "<div class='ok'>✅ conexion.php cargado sin errores</div>";
  }

  if ($salida) {
    echo "<div class='warn'>⚠️ Salida inesperada al incluir conexion.php:</div><pre>" . htmlspecialchars($salida) . "</pre>";
  }

  // Mostrar valores de las constantes (ocultando la contraseña)
  if (defined('DB_HOST')) {
    echo '<table>';
    echo '<tr><th>Constante</th><th>Valor</th></tr>';
    echo '<tr><td>DB_HOST</td><td>' . htmlspecialchars(DB_HOST) . '</td></tr>';
    echo '<tr><td>DB_PORT</td><td>' . htmlspecialchars(DB_PORT) . '</td></tr>';
    echo '<tr><td>DB_NAME</td><td>' . htmlspecialchars(DB_NAME) . '</td></tr>';
    echo '<tr><td>DB_USER</td><td>' . htmlspecialchars(DB_USER) . '</td></tr>';
    echo '<tr><td>DB_PASSWORD</td><td>' . (DB_PASSWORD ? '••••••••' . ' (' . strlen(DB_PASSWORD) . ' caracteres)' : '<em style="color:#aaa">vacío</em>') . '</td></tr>';
    echo '</table>';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. CONEXIÓN A LA BASE DE DATOS
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>3. Conexión a la base de datos</h2>';

$pdo = null;
if (defined('DB_HOST') && function_exists('conectar')) {
  try {
    $pdo = conectar();
    echo "<div class='ok'>✅ Conexión PDO exitosa a <strong>" . htmlspecialchars(DB_NAME) . "</strong></div>";

    // Versión del servidor
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    echo "<div class='ok'>✅ Versión MySQL/MariaDB: <strong>$version</strong></div>";

    // Charset
    $charset = $pdo->query("SHOW VARIABLES LIKE 'character_set_connection'")->fetch();
    echo "<div class='ok'>✅ Charset conexión: <strong>{$charset['Value']}</strong></div>";

  } catch (Throwable $e) {
    echo "<div class='err'>❌ Error de conexión: " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "<div class='warn'>💡 Posibles causas:<br>
      &nbsp;• Usuario o contraseña incorrectos<br>
      &nbsp;• El nombre de la base de datos no existe<br>
      &nbsp;• El host no permite conexiones desde este servidor<br>
      &nbsp;• Puerto incorrecto (actual: " . (defined('DB_PORT') ? DB_PORT : '?') . ")</div>";
  }
} else {
  echo "<div class='err'>❌ No se pueden verificar las credenciales (conexion.php no se cargó correctamente)</div>";
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. TABLAS
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>4. Tablas en la base de datos</h2>';

$tablas_requeridas = ['eventos', 'invitados', 'consumos', 'consumos_invitados', 'pagos'];

if ($pdo) {
  try {
    $tablas_existentes = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tablas_requeridas as $tabla) {
      if (in_array($tabla, $tablas_existentes)) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$tabla`")->fetchColumn();
        echo "<div class='ok'>✅ Tabla <strong>$tabla</strong> — $count registro(s)</div>";
      } else {
        echo "<div class='err'>❌ Tabla <strong>$tabla</strong> — NO EXISTE (ejecuta schema.sql)</div>";
      }
    }

    $extras = array_diff($tablas_existentes, $tablas_requeridas);
    if ($extras) {
      echo "<div class='warn'>ℹ️ Otras tablas en la BD: " . implode(', ', $extras) . "</div>";
    }

  } catch (Throwable $e) {
    echo "<div class='err'>❌ Error al consultar tablas: " . htmlspecialchars($e->getMessage()) . "</div>";
  }
} else {
  echo "<div class='warn'>⚠️ Omitido — sin conexión a la BD</div>";
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SIMULACIÓN DE POST a eventos.php
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>5. Simulación: crear evento (POST)</h2>';

if ($pdo && in_array('eventos', $tablas_existentes ?? [])) {
  try {
    // Simular exactamente lo que hace el frontend
    $nombre = 'Evento de prueba debug';
    $tipo   = 'restaurante';
    $fecha  = date('Y-m-d');
    $hora   = null;
    $lugar  = null;

    // Generar código único
    $intentos = 0;
    do {
      $codigo = 'CC-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 4));
      $stmt   = $pdo->prepare('SELECT id FROM eventos WHERE codigo = ?');
      $stmt->execute([$codigo]);
      $intentos++;
    } while ($stmt->fetch() && $intentos < 10);

    $stmt = $pdo->prepare('INSERT INTO eventos (nombre, tipo, fecha, hora, lugar, codigo) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$nombre, $tipo, $fecha, $hora, $lugar, $codigo]);
    $id = $pdo->lastInsertId();

    echo "<div class='ok'>✅ INSERT en <strong>eventos</strong> exitoso — id=$id, codigo=$codigo</div>";

    // Limpiar el registro de prueba
    $pdo->prepare('DELETE FROM eventos WHERE id = ?')->execute([$id]);
    echo "<div class='ok'>✅ Registro de prueba eliminado correctamente</div>";

  } catch (Throwable $e) {
    echo "<div class='err'>❌ Error al insertar en eventos: " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
  }
} else {
  echo "<div class='warn'>⚠️ Omitido — sin conexión o tabla eventos inexistente</div>";
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. HEADERS Y CORS
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>6. Headers del servidor</h2>';

$headers_relevantes = [
  'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'desconocido',
  'HTTP_ORIGIN'     => $_SERVER['HTTP_ORIGIN']     ?? '(sin Origin)',
  'REQUEST_METHOD'  => $_SERVER['REQUEST_METHOD']  ?? 'desconocido',
  'HTTPS'           => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'sí' : 'no',
];

echo '<table><tr><th>Variable</th><th>Valor</th></tr>';
foreach ($headers_relevantes as $k => $v) {
  echo "<tr><td>$k</td><td>" . htmlspecialchars($v) . "</td></tr>";
}
echo '</table>';

// ══════════════════════════════════════════════════════════════════════════════
// 7. PERMISOS DE ARCHIVOS
// ══════════════════════════════════════════════════════════════════════════════
echo '<h2>7. Archivos de la API</h2>';

$archivos = ['conexion.php', 'eventos.php', 'invitados.php', 'consumos.php', 'pagos.php', 'schema.sql'];
echo '<table><tr><th>Archivo</th><th>Existe</th><th>Legible</th><th>Tamaño</th></tr>';
foreach ($archivos as $archivo) {
  $ruta   = __DIR__ . '/' . $archivo;
  $existe = file_exists($ruta);
  $legible= $existe && is_readable($ruta);
  $tam    = $existe ? number_format(filesize($ruta)) . ' B' : '—';
  echo "<tr>
    <td>$archivo</td>
    <td>" . ($existe  ? '✅' : '❌') . "</td>
    <td>" . ($legible ? '✅' : '❌') . "</td>
    <td>$tam</td>
  </tr>";
}
echo '</table>';

?>

<div class="aviso">
  <strong>⚠️ Seguridad:</strong> Este archivo expone información sensible del servidor.
  Elimínalo del servidor en cuanto termines de diagnosticar.
</div>

</body>
</html>
