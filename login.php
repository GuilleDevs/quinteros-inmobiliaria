<?php
require_once __DIR__ . '/lib/auth.php';

iniciar_sesion();

if (esta_logueado()) {
    header('Location: admin.php');
    exit;
}

/* Si todavía no se corrió el instalador, mandamos para allá. */
try {
    if (!tablas_creadas() || ajuste('password_hash') === null) {
        header('Location: instalar.php');
        exit;
    }
} catch (Throwable $e) {
    // seguimos: el formulario mostrará el error de conexión al intentar entrar
}

$error = '';
$bloqueado = false;

/* Freno simple contra prueba de contraseñas a repetición. */
$intentos = $_SESSION['intentos'] ?? 0;
$ultimo   = $_SESSION['ultimo_intento'] ?? 0;
if ($intentos >= 8 && (time() - $ultimo) < 300) {
    $bloqueado = true;
    $error = 'Demasiados intentos fallidos. Esperá 5 minutos y volvé a probar.';
} elseif ($intentos >= 8) {
    $_SESSION['intentos'] = 0;
    $intentos = 0;
}

if (!$bloqueado && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $enviado = $_POST['csrf'] ?? '';
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string) $enviado)) {
        $error = 'La página estuvo abierta demasiado tiempo. Recargá e intentá de nuevo.';
    } elseif (intentar_login((string) ($_POST['clave'] ?? ''))) {
        unset($_SESSION['intentos'], $_SESSION['ultimo_intento']);
        header('Location: admin.php');
        exit;
    } else {
        $_SESSION['intentos'] = $intentos + 1;
        $_SESSION['ultimo_intento'] = time();
        $error = 'Contraseña incorrecta.';
    }
}

$csrf = token_csrf();
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Entrar al panel | Quinteros Grupo Inmobiliario</title>
<link rel="icon" href="assets/img/favicon.png" type="image/png">
<meta name="theme-color" content="#0A2540">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>

<section class="hero" style="min-height:100vh;display:flex;align-items:center">
  <div class="hero__grid" aria-hidden="true"></div>
  <div class="wrap hero__inner" style="max-width:460px">

    <a class="brand brand--light" href="index.html" style="margin-bottom:2.25rem">
      <img class="brand__mark" src="assets/img/logo-quinteros-claro.png" width="183" height="200" alt="" aria-hidden="true">
      <span class="brand__text">
        <span class="brand__name" style="color:#fff">Quinteros</span>
        <span class="brand__tag">Grupo Inmobiliario</span>
      </span>
    </a>

    <p class="hero__eyebrow">Panel de carga</p>
    <h1 class="hero__title" style="font-size:var(--step-3)">Entrar</h1>

    <form method="post" class="mt-4" autocomplete="on">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">

      <div class="field">
        <label class="field__label" for="clave" style="color:#8FB3CB">Contraseña</label>
        <input class="input" id="clave" name="clave" type="password" required autofocus
               autocomplete="current-password" <?= $bloqueado ? 'disabled' : '' ?>>
      </div>

      <?php if ($error): ?>
        <p class="form-status is-error" style="display:block"><?= e($error) ?></p>
      <?php endif; ?>

      <button class="btn btn--turq btn--lg btn--block mt-3" type="submit" <?= $bloqueado ? 'disabled' : '' ?>>
        Entrar al panel
      </button>
    </form>

    <p class="mt-3" style="font-size:.84rem;color:#7897AE">
      ¿Olvidaste la contraseña? Se puede reponer desde la base de datos.
      Está explicado en el README del proyecto.
    </p>

  </div>
</section>

</body>
</html>
