<?php
/* Elimina una propiedad, sus fotos del disco, y republica el catálogo. */

require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/catalogo.php';

exigir_login_api();
verificar_csrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$entrada = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$id = (int) ($entrada['id'] ?? 0);

if ($id <= 0 || !obtener_propiedad($id)) {
    responder_json(['ok' => false, 'error' => 'Esa propiedad ya no existe.'], 404);
}

try {
    eliminar_propiedad($id);
} catch (Throwable $ex) {
    error_log('Quinteros — eliminar: ' . $ex->getMessage());
    responder_json(['ok' => false, 'error' => 'No se pudo eliminar la propiedad.'], 500);
}

responder_json(['ok' => true, 'publicado' => generar_catalogo()]);
