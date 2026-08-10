<?php
/* ============================================================
   SESIÓN, LOGIN Y PROTECCIÓN CSRF
   ============================================================ */

require_once __DIR__ . '/db.php';

function iniciar_sesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $seguro = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $seguro,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('quinteros_panel');
    session_start();

    /* Cierre por inactividad */
    $limite = SESION_MINUTOS * 60;
    if (isset($_SESSION['visto']) && (time() - $_SESSION['visto']) > $limite) {
        cerrar_sesion();
        return;
    }
    $_SESSION['visto'] = time();
}

function esta_logueado(): bool
{
    iniciar_sesion();
    return !empty($_SESSION['autenticado']);
}

/** Corta la ejecución si no hay sesión. Para páginas HTML. */
function exigir_login(): void
{
    if (!esta_logueado()) {
        header('Location: login.php');
        exit;
    }
}

/** Corta la ejecución si no hay sesión. Para endpoints JSON. */
function exigir_login_api(): void
{
    if (!esta_logueado()) {
        responder_json(['ok' => false, 'error' => 'Tu sesión venció. Volvé a entrar al panel.'], 401);
    }
}

/** Email de la cuenta de administración (null si todavía no se instaló). */
function usuario_admin(): ?string
{
    return ajuste('admin_email');
}

function intentar_login(string $usuario, string $clave): bool
{
    iniciar_sesion();

    $emailGuardado = ajuste('admin_email');
    $hash = ajuste('password_hash');

    $usuarioOk = $emailGuardado !== null
        && hash_equals(mb_strtolower($emailGuardado), mb_strtolower(trim($usuario)));

    /* Verificamos la contraseña SIEMPRE, incluso si el usuario no coincide.
       Si cortáramos antes, la respuesta sería notablemente más rápida con un
       usuario inexistente y eso permitiría adivinar cuál es el correcto. */
    $hashComparacion = $hash ?: '$2y$10$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalid';
    $claveOk = password_verify($clave, $hashComparacion) && $hash !== null;

    if (!$usuarioOk || !$claveOk) {
        /* Pequeña demora para desalentar la prueba de claves por fuerza bruta */
        usleep(400000);
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['autenticado'] = true;
    $_SESSION['usuario'] = $emailGuardado;
    $_SESSION['visto'] = time();
    return true;
}

function cerrar_sesion(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/* ---------- CSRF ---------- */

function token_csrf(): string
{
    iniciar_sesion();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function verificar_csrf(): void
{
    iniciar_sesion();
    $enviado = $_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string) $enviado)) {
        responder_json(['ok' => false, 'error' => 'Token de seguridad inválido. Recargá la página e intentá de nuevo.'], 403);
    }
}

/* ---------- Respuestas JSON ---------- */

function responder_json(array $datos, int $codigo = 200): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
