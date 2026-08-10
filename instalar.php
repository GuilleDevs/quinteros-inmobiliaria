<?php
/* ============================================================
   INSTALADOR — se corre UNA sola vez
   ------------------------------------------------------------
   Crea las tablas, importa el catálogo que ya venía cargado y
   define la contraseña del panel.

   Cuando termina, hay que BORRAR este archivo del servidor.
   ============================================================ */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/catalogo.php';

/* Usuario sugerido para la cuenta de administración. Se puede cambiar en
   el formulario; lo que se guarda es lo que quede escrito ahí. */
const EMAIL_SUGERIDO = 'admin@inmobiliariaquinteros.com';

$paso = 'formulario';
$errores = [];
$resumen = [];
$email = EMAIL_SUGERIDO;

/* Si ya hay contraseña definida, el instalador no se puede volver a correr:
   si no, cualquiera que llegue a esta URL podría cambiarla. */
$yaInstalado = false;
try {
    $yaInstalado = tablas_creadas()
        && ajuste('password_hash') !== null
        && ajuste('admin_email') !== null;
} catch (Throwable $e) {
    $yaInstalado = false;
}

if ($yaInstalado) {
    $paso = 'bloqueado';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email  = trim((string) ($_POST['email'] ?? ''));
    $clave  = (string) ($_POST['clave'] ?? '');
    $clave2 = (string) ($_POST['clave2'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'El usuario tiene que ser una dirección de email válida.';
    }
    if (mb_strlen($clave) < 8) {
        $errores[] = 'La contraseña tiene que tener al menos 8 caracteres.';
    }
    if ($clave !== $clave2) {
        $errores[] = 'Las dos contraseñas no coinciden.';
    }

    if (!$errores) {
        try {
            crear_tablas();
            $resumen['importadas'] = importar_catalogo_inicial();
            guardar_ajuste('admin_email', mb_strtolower($email));
            guardar_ajuste('password_hash', password_hash($clave, PASSWORD_DEFAULT));
            $pub = generar_catalogo();
            $resumen['catalogo'] = $pub['ok'] ? $pub : null;
            if (!$pub['ok']) {
                $errores[] = 'Las tablas se crearon, pero no se pudo escribir data/propiedades.js: ' . $pub['error'];
            }
            $paso = 'listo';
        } catch (Throwable $e) {
            $errores[] = 'Error durante la instalación: ' . $e->getMessage();
        }
    }
}

/* ------------------------------------------------------------------ */

function crear_tablas(): void
{
    $pdo = db();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ajustes (
            clave VARCHAR(50) NOT NULL PRIMARY KEY,
            valor TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS propiedades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(120) NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            operacion ENUM('venta','alquiler') NOT NULL DEFAULT 'venta',
            tipo VARCHAR(30) NOT NULL DEFAULT 'casa',
            estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
            destacada TINYINT(1) NOT NULL DEFAULT 0,
            publicada TINYINT(1) NOT NULL DEFAULT 1,
            direccion VARCHAR(200) NOT NULL DEFAULT '',
            zona VARCHAR(40) NOT NULL DEFAULT 'centro',
            dormitorios SMALLINT NULL,
            banos SMALLINT NULL,
            ambientes SMALLINT NULL,
            cocheras SMALLINT NULL,
            m2_cubiertos INT NULL,
            m2_terreno INT NULL,
            precio DECIMAL(14,2) NULL,
            moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
            expensas DECIMAL(12,2) NULL,
            descripcion TEXT NULL,
            caracteristicas TEXT NULL,
            mapa_query VARCHAR(255) NULL,
            fecha DATE NULL,
            orden INT NOT NULL DEFAULT 0,
            creada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            actualizada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_slug (slug),
            KEY idx_listado (orden, fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS imagenes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            propiedad_id INT NOT NULL,
            archivo VARCHAR(120) NOT NULL,
            orden INT NOT NULL DEFAULT 0,
            KEY idx_prop (propiedad_id, orden),
            CONSTRAINT fk_img_prop FOREIGN KEY (propiedad_id)
                REFERENCES propiedades(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

/** Importa el catálogo que ya estaba en data/propiedades.js. */
function importar_catalogo_inicial(): int
{
    $ya = db()->query('SELECT COUNT(*) AS n FROM propiedades')->fetch();
    if ((int) $ya['n'] > 0) {
        return 0;   // ya hay datos: no tocamos nada
    }

    if (!is_readable(ARCHIVO_CATALOGO)) {
        return 0;
    }

    $texto = (string) file_get_contents(ARCHIVO_CATALOGO);
    $ini = strpos($texto, '[');
    $fin = strrpos($texto, ']');
    if ($ini === false || $fin === false || $fin <= $ini) {
        return 0;
    }

    $lista = json_decode(substr($texto, $ini, $fin - $ini + 1), true);
    if (!is_array($lista)) {
        return 0;
    }

    $n = 0;
    foreach ($lista as $i => $p) {
        if (!is_array($p)) {
            continue;
        }
        $datos = $p;
        $datos['caracteristicas'] = implode("\n", $p['caracteristicas'] ?? []);
        $datos['slug'] = $p['id'] ?? ($p['titulo'] ?? 'propiedad');
        $datos['publicada'] = $p['publicada'] ?? true;

        $id = guardar_propiedad($datos, null);

        $st = db()->prepare('UPDATE propiedades SET orden = ? WHERE id = ?');
        $st->execute([$i, $id]);
        $n++;
    }

    return $n;
}
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Instalación — Quinteros Grupo Inmobiliario</title>
<link rel="icon" href="assets/img/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body class="admin">

<div class="admin__bar">
  <div class="wrap">
    <img class="brand__mark" src="assets/img/logo-quinteros-claro.png" width="183" height="200" alt="" aria-hidden="true">
    <h1>Instalación del panel</h1>
  </div>
</div>

<div class="wrap" style="max-width:720px;padding-block:2.5rem 5rem">

<?php if ($paso === 'bloqueado'): ?>

  <div class="panel">
    <p class="panel__title">Ya está instalado</p>
    <p>El panel ya fue configurado, así que el instalador queda bloqueado. Esto es a propósito: si siguiera activo, cualquiera que entrara a esta dirección podría cambiar la contraseña.</p>
    <div class="notice mt-2">
      <strong>Falta un paso:</strong> borrá el archivo <code>instalar.php</code> del servidor.
    </div>
    <div class="toolbar mt-3">
      <a class="btn btn--primary btn--sm" href="admin.php">Ir al panel</a>
      <a class="btn btn--ghost btn--sm" href="index.html">Ver el sitio</a>
    </div>
  </div>

<?php elseif ($paso === 'listo'): ?>

  <div class="panel">
    <p class="panel__title">Instalación terminada</p>
    <ul class="feature-list">
      <li>Tablas creadas en la base de datos.</li>
      <li><?= (int) ($resumen['importadas'] ?? 0) ?> propiedades importadas del catálogo que ya venía cargado.</li>
      <?php if (!empty($resumen['catalogo'])): ?>
        <li>Catálogo publicado: <?= (int) $resumen['catalogo']['publicadas'] ?> propiedades visibles en el sitio.</li>
      <?php endif; ?>
      <li>Cuenta creada: <strong><?= e($email) ?></strong></li>
    </ul>

    <div class="notice mt-3">
      <strong>Importante — hacé esto ahora:</strong><br>
      Entrá al administrador de archivos de Hostinger y <strong>borrá <code>instalar.php</code></strong>.
      Mientras siga en el servidor es una puerta abierta.
    </div>

    <div class="toolbar mt-3">
      <a class="btn btn--primary" href="admin.php">Entrar al panel</a>
      <a class="btn btn--ghost" href="index.html">Ver el sitio</a>
    </div>
  </div>

<?php else: ?>

  <div class="panel">
    <p class="panel__title">Paso 1 de 1 — cuenta de administración</p>

    <?php if ($errores): ?>
      <div class="form-status is-error" style="display:block">
        <?php foreach ($errores as $err): ?>
          <div><?= e($err) ?></div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <p class="muted" style="font-size:.92rem">
      Con estos datos la inmobiliaria va a entrar a cargar propiedades. Es una única cuenta,
      compartida por la oficina. Anotalos en un lugar seguro: la contraseña no se puede
      recuperar, solo cambiar desde adentro del panel.
    </p>

    <form method="post" class="mt-3">
      <div class="admin-grid">
        <div class="field field--full">
          <label class="field__label" for="email">Usuario (email)</label>
          <input class="input" id="email" name="email" type="email" required
                 autocomplete="username" autocapitalize="off" spellcheck="false"
                 value="<?= e($email) ?>">
        </div>
        <div class="field">
          <label class="field__label" for="clave">Contraseña</label>
          <input class="input" id="clave" name="clave" type="password" minlength="8" required autocomplete="new-password">
          <span class="field__hint">Mínimo 8 caracteres.</span>
        </div>
        <div class="field">
          <label class="field__label" for="clave2">Repetir contraseña</label>
          <input class="input" id="clave2" name="clave2" type="password" minlength="8" required autocomplete="new-password">
        </div>
      </div>
      <div class="toolbar mt-3">
        <button class="btn btn--primary" type="submit">Instalar</button>
      </div>
    </form>

    <p class="field__hint mt-3">
      Si esto falla con un error de conexión, revisá los cuatro datos de la base en
      <code>lib/config.php</code>.
    </p>
  </div>

<?php endif; ?>

</div>
</body>
</html>
