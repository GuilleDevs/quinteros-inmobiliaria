/* ============================================================
   CARGA DEL CATÁLOGO EN EL SITIO PÚBLICO
   ------------------------------------------------------------
   El sitio público NO consulta Firebase. Lee un único archivo
   JSON que el panel republica cada vez que se guarda algo.

   Ventajas: una sola petición, sin cargar el SDK de Firebase en
   páginas que no lo necesitan, sin gastar lecturas de la base, y
   el sitio sigue funcionando aunque Firestore tenga problemas.

   Si ese archivo todavía no existe (proyecto sin configurar, o
   demo en GitHub Pages), se usa el catálogo incluido en
   data/propiedades.js. Así el sitio nunca aparece vacío.
   ============================================================ */

window.QUINTEROS_CATALOGO = (function () {
  "use strict";

  function domListo() {
    return new Promise(function (res) {
      if (document.readyState !== "loading") res();
      else document.addEventListener("DOMContentLoaded", res);
    });
  }

  var incluido = Array.isArray(window.PROPIEDADES) ? window.PROPIEDADES : [];
  var url = typeof window.urlCatalogoPublicado === "function"
    ? window.urlCatalogoPublicado()
    : null;

  var datos;

  if (!url) {
    datos = Promise.resolve(incluido);
  } else {
    datos = fetch(url, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (lista) {
        if (!Array.isArray(lista)) throw new Error("formato inesperado");
        /* Un catálogo vacío casi siempre significa que algo salió mal.
           Ante la duda mostramos el incluido en vez de un sitio en blanco. */
        return lista.length ? lista : incluido;
      })
      .catch(function (e) {
        console.warn("No se pudo leer el catálogo publicado, se usa el incluido:", e.message);
        return incluido;
      });
  }

  return Promise.all([domListo(), datos]).then(function (r) {
    window.PROPIEDADES = r[1];
    return window.PROPIEDADES;
  });
})();
