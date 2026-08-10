<?php
/* Recibe una foto, la procesa y la asocia a una propiedad.
   Acepta varios archivos en la misma llamada (campo "fotos[]"). */

require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/catalogo.php';

exigir_login_api();
verificar_csrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$propiedadId = (int) ($_POST['propiedad_id'] ?? 0);
$propiedad = $propiedadId > 0 ? obtener_propiedad($propiedadId) : null;

if (!$propiedad) {
    responder_json(['ok' => false, 'error' => 'Guardá la propiedad antes de subir fotos.'], 404);
}

if (empty($_FILES['fotos']) || !is_array($_FILES['fotos']['name'])) {
    /* Si $_FILES viene vacío en un POST con archivos, casi siempre es
       post_max_size del servidor, que corta la petición entera. */
    if (empty($_FILES) && ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        responder_json(['ok' => false, 'error' => 'Las fotos superan el límite de subida del servidor. Probá subiéndolas de a una.'], 413);
    }
    responder_json(['ok' => false, 'error' => 'No llegó ninguna foto.'], 400);
}

/* Orden inicial: se agregan al final de las que ya existen. */
$st = db()->prepare('SELECT COALESCE(MAX(orden), -1) AS m FROM imagenes WHERE propiedad_id = ?');
$st->execute([$propiedadId]);
$orden = (int) $st->fetch()['m'] + 1;

$subidas = [];
$fallidas = [];
$cantidad = count($_FILES['fotos']['name']);

for ($i = 0; $i < $cantidad; $i++) {
    $archivo = [
        'name'     => $_FILES['fotos']['name'][$i],
        'type'     => $_FILES['fotos']['type'][$i],
        'tmp_name' => $_FILES['fotos']['tmp_name'][$i],
        'error'    => $_FILES['fotos']['error'][$i],
        'size'     => $_FILES['fotos']['size'][$i],
    ];

    $res = procesar_foto($archivo, $propiedad['slug']);

    if (!$res['ok']) {
        $fallidas[] = ['nombre' => $archivo['name'], 'error' => $res['error']];
        continue;
    }

    $ins = db()->prepare('INSERT INTO imagenes (propiedad_id, archivo, orden) VALUES (?, ?, ?)');
    $ins->execute([$propiedadId, $res['archivo'], $orden++]);

    $subidas[] = [
        'id'      => (int) db()->lastInsertId(),
        'archivo' => $res['archivo'],
        'chica'   => URL_FOTOS . '/' . $res['archivo'] . '-s.jpg',
        'grande'  => URL_FOTOS . '/' . $res['archivo'] . '-m.jpg',
    ];
}

$pub = $subidas ? generar_catalogo() : ['ok' => true];

responder_json([
    'ok'        => count($subidas) > 0,
    'subidas'   => $subidas,
    'fallidas'  => $fallidas,
    'imagenes'  => imagenes_de($propiedadId),
    'publicado' => $pub,
    'error'     => $subidas ? null : ($fallidas[0]['error'] ?? 'No se pudo subir ninguna foto.'),
]);
