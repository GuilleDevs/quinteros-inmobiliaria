<?php
/* Devuelve una propiedad con sus fotos. */

require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/catalogo.php';

exigir_login_api();

$id = (int) ($_GET['id'] ?? 0);
$p = $id > 0 ? obtener_propiedad($id) : null;

if (!$p) {
    responder_json(['ok' => false, 'error' => 'Esa propiedad ya no existe.'], 404);
}

responder_json(['ok' => true, 'propiedad' => $p, 'urlFotos' => URL_FOTOS]);
