<?php
/* Cambia la contraseña del panel. Pide la actual para evitar que alguien
   que encuentre una sesión abierta se apodere del acceso. */

require_once __DIR__ . '/../lib/auth.php';

exigir_login_api();
verificar_csrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$entrada = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$actual = (string) ($entrada['actual'] ?? '');
$nueva  = (string) ($entrada['nueva'] ?? '');
$nueva2 = (string) ($entrada['nueva2'] ?? '');

$hash = ajuste('password_hash');
if (!$hash || !password_verify($actual, $hash)) {
    usleep(400000);
    responder_json(['ok' => false, 'error' => 'La contraseña actual no es correcta.'], 403);
}

if (mb_strlen($nueva) < 8) {
    responder_json(['ok' => false, 'error' => 'La contraseña nueva tiene que tener al menos 8 caracteres.'], 400);
}
if ($nueva !== $nueva2) {
    responder_json(['ok' => false, 'error' => 'Las dos contraseñas nuevas no coinciden.'], 400);
}

guardar_ajuste('password_hash', password_hash($nueva, PASSWORD_DEFAULT));

responder_json(['ok' => true, 'mensaje' => 'Contraseña actualizada.']);
