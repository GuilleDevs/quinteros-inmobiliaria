/* ============================================================
   CONFIGURACIÓN DE FIREBASE
   ------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE COMPLETAR.

   Los valores salen de la consola de Firebase:
     Configuración del proyecto  →  Tus apps  →  App web  →  SDK

   Sobre la seguridad: estas claves NO son secretas. Van dentro
   del navegador de cualquier visitante, así que Google las
   considera públicas por diseño y está bien que estén acá y en
   el repositorio. Lo que realmente protege los datos son las
   Security Rules (firestore.rules y storage.rules).
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "PEGAR_AQUI",
  authDomain: "PROYECTO.firebaseapp.com",
  projectId: "PROYECTO",
  storageBucket: "PROYECTO.firebasestorage.app",
  messagingSenderId: "PEGAR_AQUI",
  appId: "PEGAR_AQUI"
};

/* Versión del SDK de Firebase que se carga desde el CDN de Google.
   Si alguna vez hay que actualizarla, se cambia solo acá. */
window.FIREBASE_VERSION = "11.0.0";

/* Ruta dentro de Cloud Storage donde el panel publica el catálogo
   que consume el sitio público. No hace falta cambiarla. */
window.CATALOGO_RUTA = "catalogo/propiedades.json";

/* ------------------------------------------------------------------
   Devuelve la URL pública del catálogo, o null si todavía no se
   completó la configuración. En ese caso el sitio usa el catálogo
   incluido en data/propiedades.js, así que nunca se ve vacío.
   ------------------------------------------------------------------ */
window.urlCatalogoPublicado = function () {
  var bucket = (window.FIREBASE_CONFIG || {}).storageBucket || "";
  if (!bucket || bucket.indexOf("PROYECTO") === 0 || bucket.indexOf("PEGAR") !== -1) {
    return null;
  }
  return "https://firebasestorage.googleapis.com/v0/b/" + bucket +
    "/o/" + encodeURIComponent(window.CATALOGO_RUTA) + "?alt=media";
};

/* ¿Está configurado el proyecto? Lo usan el panel y el instalador
   para avisar con un mensaje claro en vez de fallar de forma rara. */
window.firebaseConfigurado = function () {
  var c = window.FIREBASE_CONFIG || {};
  return !!c.apiKey && c.apiKey.indexOf("PEGAR") === -1
      && !!c.projectId && c.projectId.indexOf("PROYECTO") !== 0;
};
