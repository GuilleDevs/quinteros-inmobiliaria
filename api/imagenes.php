<?php
/* Borra una foto o cambia el orden de las fotos de una propiedad.
   accion = "eliminar" | "ordenar" */

require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/catalogo.php';

exigir_login_api();
verificar_csrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$entrada = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$accion = (string) ($entrada['accion'] ?? '');
$propiedadId = (int) ($entrada['propiedad_id'] ?? 0);

if ($propiedadId <= 0 || !obtener_propiedad($propiedadId)) {
    responder_json(['ok' => false, 'error' => 'Esa propiedad ya no existe.'], 404);
}

if ($accion === 'eliminar') {
    $imagenId = (int) ($entrada['imagen_id'] ?? 0);

    $st = db()->prepare('SELECT archivo FROM imagenes WHERE id = ? AND propiedad_id = ?');
    $st->execute([$imagenId, $propiedadId]);
    $img = $st->fetch();

    if (!$img) {
        responder_json(['ok' => false, 'error' => 'Esa foto ya no está.'], 404);
    }

    db()->prepare('DELETE FROM imagenes WHERE id = ?')->execute([$imagenId]);
    borrar_foto($img['archivo']);

} elseif ($accion === 'ordenar') {
    $ids = $entrada['orden'] ?? [];
    if (!is_array($ids)) {
        responder_json(['ok' => false, 'error' => 'Orden inválido.'], 400);
    }

    /* Solo reordenamos ids que pertenezcan realmente a esta propiedad. */
    $propias = array_column(imagenes_de($propiedadId), 'id');
    $st = db()->prepare('UPDATE imagenes SET orden = ? WHERE id = ? AND propiedad_id = ?');

    $pos = 0;
    foreach ($ids as $id) {
        $id = (int) $id;
        if (in_array($id, $propias, true)) {
            $st->execute([$pos++, $id, $propiedadId]);
        }
    }

} else {
    responder_json(['ok' => false, 'error' => 'Acción desconocida.'], 400);
}

responder_json([
    'ok'        => true,
    'imagenes'  => imagenes_de($propiedadId),
    'publicado' => generar_catalogo(),
]);
