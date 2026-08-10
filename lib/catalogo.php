<?php
/* ============================================================
   CATÁLOGO: lectura, escritura y publicación
   ------------------------------------------------------------
   La base de datos es la fuente de verdad. Cada vez que se
   guarda algo, se regenera data/propiedades.js, que es el
   archivo que consume el sitio público.

   Así el visitante nunca toca la base: ve un sitio estático,
   instantáneo, y aunque la base se caiga el sitio sigue en pie.
   ============================================================ */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/imagen.php';

/* ---------- Lectura ---------- */

/** Versión liviana para el listado del panel: solo lo que se ve en la lista. */
function listar_propiedades(): array
{
    return db()->query(
        'SELECT p.id, p.slug, p.titulo, p.direccion, p.operacion, p.tipo,
                p.publicada, p.destacada, p.fecha,
                (SELECT COUNT(*) FROM imagenes i WHERE i.propiedad_id = p.id) AS fotos
         FROM propiedades p
         ORDER BY p.orden ASC, p.fecha DESC, p.id DESC'
    )->fetchAll();
}

function obtener_propiedad(int $id): ?array
{
    $st = db()->prepare('SELECT * FROM propiedades WHERE id = ?');
    $st->execute([$id]);
    $p = $st->fetch();
    if (!$p) {
        return null;
    }
    $p['imagenes'] = imagenes_de($id);
    return $p;
}

function imagenes_de(int $propiedadId): array
{
    $st = db()->prepare('SELECT id, archivo, orden FROM imagenes WHERE propiedad_id = ? ORDER BY orden ASC, id ASC');
    $st->execute([$propiedadId]);
    return $st->fetchAll();
}

/* ---------- Slug ---------- */

function generar_slug(string $texto): string
{
    $s = strtolower(trim($texto));
    $s = strtr($s, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
        'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
        'ñ' => 'n', 'ç' => 'c', '°' => '', 'º' => '',
    ]);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim((string) $s, '-');
    $s = substr($s, 0, 90);
    return $s !== '' ? $s : 'propiedad';
}

function slug_unico(string $texto, ?int $ignorarId = null): string
{
    $base = generar_slug($texto);
    $slug = $base;
    $n = 2;

    while (true) {
        $sql = 'SELECT id FROM propiedades WHERE slug = ?' . ($ignorarId ? ' AND id <> ?' : '');
        $st = db()->prepare($sql);
        $st->execute($ignorarId ? [$slug, $ignorarId] : [$slug]);
        if (!$st->fetch()) {
            return $slug;
        }
        $slug = $base . '-' . $n++;
    }
}

/* ---------- Escritura ---------- */

/**
 * Crea o actualiza una propiedad.
 * @return int el id de la propiedad
 */
function guardar_propiedad(array $d, ?int $id = null): int
{
    $titulo = trim((string) ($d['titulo'] ?? ''));
    if ($titulo === '') {
        $titulo = 'Propiedad sin título';
    }

    $campos = [
        'titulo'          => $titulo,
        'operacion'       => in_array($d['operacion'] ?? '', ['venta', 'alquiler'], true) ? $d['operacion'] : 'venta',
        'tipo'            => limpiar_lista((string) ($d['tipo'] ?? 'casa'), 30),
        'estado'          => in_array($d['estado'] ?? '', ['disponible', 'reservada', 'no-disponible'], true) ? $d['estado'] : 'disponible',
        'zona'            => limpiar_lista((string) ($d['zona'] ?? 'centro'), 40),
        'direccion'       => trim((string) ($d['direccion'] ?? '')),
        'destacada'       => !empty($d['destacada']) ? 1 : 0,
        'publicada'       => !empty($d['publicada']) ? 1 : 0,
        'dormitorios'     => numero_o_null($d['dormitorios'] ?? null),
        'banos'           => numero_o_null($d['banos'] ?? null),
        'ambientes'       => numero_o_null($d['ambientes'] ?? null),
        'cocheras'        => numero_o_null($d['cocheras'] ?? null),
        'm2_cubiertos'    => numero_o_null($d['m2Cubiertos'] ?? null),
        'm2_terreno'      => numero_o_null($d['m2Terreno'] ?? null),
        'precio'          => numero_o_null($d['precio'] ?? null),
        'moneda'          => in_array($d['moneda'] ?? '', ['USD', 'ARS'], true) ? $d['moneda'] : 'USD',
        'expensas'        => numero_o_null($d['expensas'] ?? null),
        'descripcion'     => trim((string) ($d['descripcion'] ?? '')),
        'caracteristicas' => trim((string) ($d['caracteristicas'] ?? '')),
        'mapa_query'      => trim((string) ($d['mapaQuery'] ?? '')),
        'fecha'           => fecha_valida($d['fecha'] ?? null),
    ];

    if ($id === null) {
        $campos['slug'] = slug_unico($d['slug'] ?? $titulo);
        $campos['orden'] = 0;

        $cols = implode(', ', array_keys($campos));
        $marc = implode(', ', array_fill(0, count($campos), '?'));
        $st = db()->prepare("INSERT INTO propiedades ($cols) VALUES ($marc)");
        $st->execute(array_values($campos));

        return (int) db()->lastInsertId();
    }

    $campos['slug'] = slug_unico($d['slug'] ?? $titulo, $id);

    $sets = implode(', ', array_map(fn($c) => "$c = ?", array_keys($campos)));
    $st = db()->prepare("UPDATE propiedades SET $sets WHERE id = ?");
    $st->execute([...array_values($campos), $id]);

    return $id;
}

function eliminar_propiedad(int $id): void
{
    foreach (imagenes_de($id) as $img) {
        borrar_foto($img['archivo']);
    }
    $st = db()->prepare('DELETE FROM propiedades WHERE id = ?');
    $st->execute([$id]);
}

/* ---------- Helpers ---------- */

function numero_o_null($v): ?string
{
    if ($v === null || $v === '' || $v === false) {
        return null;
    }
    $v = str_replace(',', '.', (string) $v);
    if (!is_numeric($v)) {
        return null;
    }
    return (string) (0 + $v);
}

function fecha_valida($v): string
{
    $v = trim((string) $v);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
        return $v;
    }
    return date('Y-m-d');
}

function limpiar_lista(string $v, int $max): string
{
    $v = preg_replace('/[^a-z0-9\-]/', '', strtolower(trim($v)));
    return substr((string) $v, 0, $max);
}

/* ============================================================
   PUBLICACIÓN — genera data/propiedades.js desde la base
   ============================================================ */

function generar_catalogo(): array
{
    $filas = db()->query('SELECT * FROM propiedades ORDER BY orden ASC, fecha DESC, id DESC')->fetchAll();

    $st = db()->query('SELECT propiedad_id, archivo FROM imagenes ORDER BY orden ASC, id ASC');
    $porPropiedad = [];
    foreach ($st->fetchAll() as $img) {
        $porPropiedad[$img['propiedad_id']][] = $img['archivo'];
    }

    $salida = [];
    foreach ($filas as $p) {
        $fotos = $porPropiedad[$p['id']] ?? [];

        $salida[] = [
            'id'              => $p['slug'],
            'titulo'          => $p['titulo'],
            'operacion'       => $p['operacion'],
            'tipo'            => $p['tipo'],
            'estado'          => $p['estado'],
            'destacada'       => (bool) $p['destacada'],
            'publicada'       => (bool) $p['publicada'],
            'direccion'       => $p['direccion'],
            'zona'            => $p['zona'],
            'dormitorios'     => entero_o_null($p['dormitorios']),
            'banos'           => entero_o_null($p['banos']),
            'ambientes'       => entero_o_null($p['ambientes']),
            'cocheras'        => entero_o_null($p['cocheras']),
            'm2Cubiertos'     => entero_o_null($p['m2_cubiertos']),
            'm2Terreno'       => entero_o_null($p['m2_terreno']),
            'precio'          => $p['precio'] === null ? null : (float) $p['precio'],
            'moneda'          => $p['moneda'],
            'expensas'        => $p['expensas'] === null ? null : (float) $p['expensas'],
            'descripcion'     => $p['descripcion'],
            'caracteristicas' => lineas($p['caracteristicas']),
            'imagenes'        => array_map(fn($f) => URL_FOTOS . '/' . $f . '-m.jpg', $fotos),
            'miniaturas'      => array_map(fn($f) => URL_FOTOS . '/' . $f . '-s.jpg', $fotos),
            'mapaQuery'       => $p['mapa_query'],
            'fecha'           => $p['fecha'],
        ];
    }

    $json = json_encode($salida, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return ['ok' => false, 'error' => 'No se pudo generar el catálogo: ' . json_last_error_msg()];
    }

    $contenido = "/* ============================================================\n"
        . "   CATÁLOGO DE PROPIEDADES — Quinteros Grupo Inmobiliario\n"
        . "   ARCHIVO GENERADO AUTOMÁTICAMENTE. No editar a mano:\n"
        . "   cualquier cambio se pierde al guardar desde el panel.\n"
        . "   Última actualización: " . date('d/m/Y H:i') . "\n"
        . "   ============================================================ */\n\n"
        . "window.PROPIEDADES = " . $json . ";\n";

    $dir = dirname(ARCHIVO_CATALOGO);
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
        return ['ok' => false, 'error' => 'No existe la carpeta data/ y no se pudo crear.'];
    }

    /* Escritura atómica: primero a un temporal, después se renombra.
       Si el servidor se corta a mitad de camino, el archivo viejo queda
       intacto en vez de quedar por la mitad. */
    $temporal = ARCHIVO_CATALOGO . '.tmp';
    if (@file_put_contents($temporal, $contenido, LOCK_EX) === false) {
        return ['ok' => false, 'error' => 'No se pudo escribir en data/. Revisá que la carpeta tenga permisos 755.'];
    }
    if (!@rename($temporal, ARCHIVO_CATALOGO)) {
        @unlink($temporal);
        return ['ok' => false, 'error' => 'No se pudo reemplazar data/propiedades.js.'];
    }
    @chmod(ARCHIVO_CATALOGO, 0644);

    $publicadas = count(array_filter($salida, fn($p) => $p['publicada']));
    return ['ok' => true, 'total' => count($salida), 'publicadas' => $publicadas];
}

function entero_o_null($v): ?int
{
    return $v === null || $v === '' ? null : (int) $v;
}

function lineas(?string $texto): array
{
    if (!$texto) {
        return [];
    }
    $partes = preg_split('/\r\n|\r|\n/', $texto) ?: [];
    return array_values(array_filter(array_map('trim', $partes), fn($l) => $l !== ''));
}
