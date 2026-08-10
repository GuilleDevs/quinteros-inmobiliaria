<?php
/* Crea o actualiza una propiedad y republica el catálogo. */

require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/catalogo.php';

exigir_login_api();
verificar_csrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$entrada = json_decode(file_get_contents('php://input'), true);
if (!is_array($entrada)) {
    $entrada = $_POST;
}

$id = isset($entrada['id']) && $entrada['id'] !== '' ? (int) $entrada['id'] : null;

if ($id !== null && !obtener_propiedad($id)) {
    responder_json(['ok' => false, 'error' => 'Esa propiedad ya no existe. Puede que la haya borrado otra persona.'], 404);
}

try {
    $id = guardar_propiedad($entrada, $id);
} catch (Throwable $ex) {
    error_log('Quinteros — guardar: ' . $ex->getMessage());
    responder_json(['ok' => false, 'error' => 'No se pudo guardar la propiedad.'], 500);
}

$pub = generar_catalogo();

responder_json([
    'ok'        => true,
    'id'        => $id,
    'propiedad' => obtener_propiedad($id),
    'publicado' => $pub,
]);
