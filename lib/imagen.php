<?php
/* ============================================================
   PROCESAMIENTO DE FOTOS
   ------------------------------------------------------------
   Todo lo que sube el cliente pasa por acá. La foto se valida,
   se rota según la orientación de la cámara, se achica y se
   vuelve a codificar como JPEG.

   Volver a codificarla no es solo por peso: destruye cualquier
   contenido escondido dentro del archivo, así que un archivo
   malicioso disfrazado de imagen no sobrevive al proceso.
   ============================================================ */

require_once __DIR__ . '/config.php';

/**
 * Procesa un archivo recién subido y genera las dos versiones.
 *
 * @param array  $archivo  un elemento de $_FILES
 * @param string $base     nombre base sugerido (se le agrega un sufijo único)
 * @return array{ok:bool, archivo?:string, error?:string}
 */
function procesar_foto(array $archivo, string $base): array
{
    /* --- 1. Errores de subida --------------------------------------- */
    if (!isset($archivo['error']) || is_array($archivo['error'])) {
        return ['ok' => false, 'error' => 'Subida inválida.'];
    }

    switch ($archivo['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return ['ok' => false, 'error' => 'La foto es demasiado pesada para el servidor. Probá con una más chica.'];
        case UPLOAD_ERR_NO_FILE:
            return ['ok' => false, 'error' => 'No llegó ningún archivo.'];
        case UPLOAD_ERR_PARTIAL:
            return ['ok' => false, 'error' => 'La subida se cortó por la mitad. Intentá de nuevo.'];
        default:
            return ['ok' => false, 'error' => 'No se pudo subir la foto (código ' . $archivo['error'] . ').'];
    }

    if (!is_uploaded_file($archivo['tmp_name'])) {
        return ['ok' => false, 'error' => 'Archivo no válido.'];
    }

    if ($archivo['size'] > FOTO_PESO_MAXIMO) {
        return ['ok' => false, 'error' => 'La foto supera los 25 MB.'];
    }

    /* --- 2. ¿Es realmente una imagen? ------------------------------- */
    $info = @getimagesize($archivo['tmp_name']);
    if ($info === false) {
        return ['ok' => false, 'error' => 'El archivo no es una imagen válida.'];
    }

    [$ancho, $alto] = $info;
    $tipo = $info[2];

    $soportados = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP];
    if (!in_array($tipo, $soportados, true)) {
        $nombre = strtolower(pathinfo($archivo['name'] ?? '', PATHINFO_EXTENSION));
        if ($nombre === 'heic' || $nombre === 'heif') {
            return ['ok' => false, 'error' => 'Las fotos en formato HEIC (iPhone) no se pueden procesar. En el iPhone: Ajustes → Cámara → Formatos → "Más compatible", y las fotos nuevas salen en JPG.'];
        }
        return ['ok' => false, 'error' => 'Formato no soportado. Usá JPG, PNG o WEBP.'];
    }

    if ($ancho < 200 || $alto < 200) {
        return ['ok' => false, 'error' => 'La foto es muy chica (mínimo 200 x 200 píxeles).'];
    }

    /* --- 3. Memoria suficiente -------------------------------------- */
    /* GD descomprime la imagen entera en RAM: 4 bytes por píxel, más
       margen. Sin este chequeo, una foto muy grande tumba el proceso
       con un error en blanco. */
    $necesaria = (int) ($ancho * $alto * 4 * 2.1) + 33554432;
    $actual = memoria_en_bytes(ini_get('memory_limit'));
    if ($actual !== -1 && $actual < $necesaria) {
        @ini_set('memory_limit', (string) $necesaria);
        $actual = memoria_en_bytes(ini_get('memory_limit'));
        if ($actual !== -1 && $actual < $necesaria) {
            return ['ok' => false, 'error' => 'La foto tiene una resolución demasiado alta para el servidor. Achicala un poco antes de subirla.'];
        }
    }

    /* --- 4. Abrir --------------------------------------------------- */
    $img = match ($tipo) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($archivo['tmp_name']),
        IMAGETYPE_PNG  => @imagecreatefrompng($archivo['tmp_name']),
        IMAGETYPE_WEBP => @imagecreatefromwebp($archivo['tmp_name']),
        default        => false,
    };

    if (!$img) {
        return ['ok' => false, 'error' => 'No se pudo leer la imagen. Puede estar dañada.'];
    }

    /* --- 5. Orientación de la cámara -------------------------------- */
    /* Las fotos de celular vienen "acostadas" con una marca EXIF que dice
       cómo rotarlas. Si no la aplicamos, quedan de costado en la web. */
    if ($tipo === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($archivo['tmp_name']);
        $o = $exif['Orientation'] ?? 1;
        if ($o === 3) {
            $img = imagerotate($img, 180, 0);
        } elseif ($o === 6) {
            $img = imagerotate($img, -90, 0);
        } elseif ($o === 8) {
            $img = imagerotate($img, 90, 0);
        }
    }

    /* --- 6. Guardar las dos versiones ------------------------------- */
    if (!is_dir(DIR_FOTOS) && !@mkdir(DIR_FOTOS, 0755, true) && !is_dir(DIR_FOTOS)) {
        imagedestroy($img);
        return ['ok' => false, 'error' => 'No existe la carpeta ' . URL_FOTOS . ' y no se pudo crear.'];
    }
    if (!is_writable(DIR_FOTOS)) {
        imagedestroy($img);
        return ['ok' => false, 'error' => 'La carpeta ' . URL_FOTOS . ' no tiene permisos de escritura. Ponela en 755 desde el administrador de archivos.'];
    }

    $nombre = nombre_unico($base);

    $ok = redimensionar_y_guardar($img, FOTO_ANCHO_GRANDE, DIR_FOTOS . '/' . $nombre . '-m.jpg')
       && redimensionar_y_guardar($img, FOTO_ANCHO_CHICA,  DIR_FOTOS . '/' . $nombre . '-s.jpg');

    imagedestroy($img);

    if (!$ok) {
        @unlink(DIR_FOTOS . '/' . $nombre . '-m.jpg');
        @unlink(DIR_FOTOS . '/' . $nombre . '-s.jpg');
        return ['ok' => false, 'error' => 'No se pudo guardar la foto procesada.'];
    }

    return ['ok' => true, 'archivo' => $nombre];
}

/** Reduce la imagen a un ancho máximo y la guarda como JPEG. */
function redimensionar_y_guardar($origen, int $anchoMax, string $destino): bool
{
    $ancho = imagesx($origen);
    $alto  = imagesy($origen);

    if ($ancho <= $anchoMax) {
        $nuevoAncho = $ancho;
        $nuevoAlto  = $alto;
    } else {
        $nuevoAncho = $anchoMax;
        $nuevoAlto  = (int) round($alto * ($anchoMax / $ancho));
    }

    $lienzo = imagecreatetruecolor($nuevoAncho, $nuevoAlto);
    if (!$lienzo) {
        return false;
    }

    /* Fondo blanco: si el original era un PNG con transparencia, al pasar
       a JPEG las zonas transparentes quedarían negras. */
    $blanco = imagecolorallocate($lienzo, 255, 255, 255);
    imagefilledrectangle($lienzo, 0, 0, $nuevoAncho, $nuevoAlto, $blanco);

    imagecopyresampled($lienzo, $origen, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $ancho, $alto);

    $ok = imagejpeg($lienzo, $destino, FOTO_CALIDAD);
    imagedestroy($lienzo);

    if ($ok) {
        @chmod($destino, 0644);
    }
    return $ok;
}

/** Nombre de archivo web-seguro y sin colisiones. */
function nombre_unico(string $base): string
{
    $limpio = strtolower(trim($base));
    $limpio = strtr($limpio, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
        'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
        'ñ' => 'n', 'ç' => 'c',
    ]);
    $limpio = preg_replace('/[^a-z0-9]+/', '-', $limpio);
    $limpio = trim((string) $limpio, '-');
    $limpio = substr($limpio, 0, 48);
    if ($limpio === '') {
        $limpio = 'foto';
    }

    do {
        $nombre = $limpio . '-' . bin2hex(random_bytes(4));
    } while (file_exists(DIR_FOTOS . '/' . $nombre . '-m.jpg'));

    return $nombre;
}

/** Borra del disco las dos versiones de una foto. */
function borrar_foto(string $nombre): void
{
    /* Defensa contra rutas manipuladas: solo aceptamos el patrón que
       genera nombre_unico(). */
    if (!preg_match('/^[a-z0-9\-]{1,60}$/', $nombre)) {
        return;
    }
    @unlink(DIR_FOTOS . '/' . $nombre . '-m.jpg');
    @unlink(DIR_FOTOS . '/' . $nombre . '-s.jpg');
}

/** Convierte "256M", "1G", "134217728" a bytes. Devuelve -1 si es ilimitado. */
function memoria_en_bytes(string $valor): int
{
    $valor = trim($valor);
    if ($valor === '' || $valor === '-1') {
        return -1;
    }

    $unidad = strtolower(substr($valor, -1));
    $numero = (int) $valor;

    return match ($unidad) {
        'g'     => $numero * 1024 * 1024 * 1024,
        'm'     => $numero * 1024 * 1024,
        'k'     => $numero * 1024,
        default => $numero,
    };
}
