/* ============================================================
   PROCESAMIENTO DE FOTOS EN EL NAVEGADOR
   ------------------------------------------------------------
   Antes esto lo hacía el servidor con GD. Ahora lo hace la
   computadora de quien carga la propiedad, y sale ganando:
   en vez de subir 6 MB y que el servidor los achique, se suben
   200 KB ya procesados. La carga es mucho más rápida y no se
   gasta ancho de banda ni cuota de Firebase en vano.
   ============================================================ */

export const ANCHO_GRANDE = 1600;   // para la ficha y la galería
export const ANCHO_CHICA = 640;     // para las tarjetas del catálogo
export const CALIDAD = 0.82;

/**
 * Convierte una foto elegida por el usuario en las dos versiones.
 * @param {File} archivo
 * @returns {Promise<{ok:boolean, grande?:Blob, chica?:Blob, error?:string}>}
 */
export async function procesarFoto(archivo) {
  if (!archivo || !archivo.type || archivo.type.indexOf("image/") !== 0) {
    const ext = (archivo && archivo.name || "").split(".").pop().toLowerCase();
    if (ext === "heic" || ext === "heif") {
      return { ok: false, error: heicMensaje() };
    }
    return { ok: false, error: "El archivo no es una imagen." };
  }

  if (archivo.type === "image/heic" || archivo.type === "image/heif") {
    return { ok: false, error: heicMensaje() };
  }

  let bitmap;
  try {
    bitmap = await decodificar(archivo);
  } catch (e) {
    return {
      ok: false,
      error: "No se pudo abrir la imagen. Puede estar dañada o en un formato que el navegador no entiende."
    };
  }

  if (bitmap.width < 200 || bitmap.height < 200) {
    cerrar(bitmap);
    return { ok: false, error: "La foto es muy chica (mínimo 200 x 200 píxeles)." };
  }

  try {
    const grande = await redimensionar(bitmap, ANCHO_GRANDE);
    const chica = await redimensionar(bitmap, ANCHO_CHICA);
    return { ok: true, grande, chica, ancho: bitmap.width, alto: bitmap.height };
  } catch (e) {
    return { ok: false, error: "No se pudo procesar la imagen: " + e.message };
  } finally {
    cerrar(bitmap);
  }
}

function heicMensaje() {
  return 'Las fotos en formato HEIC (iPhone) no se pueden procesar. ' +
    'Se arregla una vez en el teléfono: Ajustes → Cámara → Formatos → "Más compatible". ' +
    'Desde ahí las fotos nuevas salen en JPG.';
}

/**
 * Decodifica el archivo respetando la orientación de la cámara.
 * Las fotos de celular vienen "acostadas" con una marca EXIF que indica
 * cómo rotarlas; sin aplicarla quedarían de costado en la web.
 */
async function decodificar(archivo) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(archivo, { imageOrientation: "from-image" });
    } catch (e) {
      /* Algunos navegadores no admiten la opción: seguimos con el método
         de abajo, que también aplica la orientación. */
    }
  }

  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("no se pudo decodificar")); };
    img.src = url;
  });
}

function cerrar(bitmap) {
  if (bitmap && typeof bitmap.close === "function") bitmap.close();
}

/** Reduce a un ancho máximo y devuelve un JPEG. */
async function redimensionar(origen, anchoMax) {
  const anchoOrig = origen.width || origen.naturalWidth;
  const altoOrig = origen.height || origen.naturalHeight;

  const ancho = Math.min(anchoOrig, anchoMax);
  const alto = Math.round(altoOrig * (ancho / anchoOrig));

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const ctx = lienzo.getContext("2d");
  /* Fondo blanco: si el original era un PNG con transparencia, al pasar
     a JPEG las zonas transparentes quedarían negras. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(origen, 0, 0, ancho, alto);

  return await new Promise((resolve, reject) => {
    lienzo.toBlob(
      b => b ? resolve(b) : reject(new Error("el navegador no pudo generar el JPEG")),
      "image/jpeg",
      CALIDAD
    );
  });
}

/** Nombre de archivo web-seguro y sin colisiones. */
export function nombreUnico(base) {
  let limpio = String(base || "")
    .toLowerCase()
    .normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!limpio) limpio = "foto";

  const azar = Math.random().toString(36).slice(2, 10);
  return `${limpio}-${azar}`;
}
