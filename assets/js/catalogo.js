/* ============================================================
   CATÁLOGO — grilla, filtros y buscador de propiedades
   ============================================================ */
(function () {
  "use strict";

  var Q = window.QU;
  var ICONS = window.ICONS;

  function propiedades() {
    return (window.PROPIEDADES || []).filter(function (p) { return p.publicada !== false; });
  }

  /* ---------- Tarjeta ---------- */
  function specChip(icon, valor, sufijo) {
    if (valor == null || valor === "" || valor === 0) return "";
    return '<span class="card__spec">' + icon + "<span>" + valor + (sufijo || "") + "</span></span>";
  }

  function cardHTML(p) {
    var op = p.operacion === "venta" ? "venta" : "alquiler";
    var badges =
      '<span class="badge badge--' + op + '">' + (op === "venta" ? "En venta" : "En alquiler") + "</span>" +
      (p.estado === "reservada" ? '<span class="badge badge--reservada">Reservada</span>' : "") +
      (p.destacada ? '<span class="badge badge--destacada">Destacada</span>' : "");

    var specs =
      specChip(ICONS.bed, p.dormitorios, p.dormitorios === 1 ? " dorm." : " dorm.") +
      specChip(ICONS.bath, p.banos, p.banos === 1 ? " baño" : " baños") +
      specChip(ICONS.car, p.cocheras, p.cocheras === 1 ? " cochera" : " cocheras") +
      specChip(ICONS.area, p.m2Cubiertos, " m² cub.") +
      specChip(ICONS.land, p.m2Terreno, " m² terr.");

    var fotos = (p.imagenes || []).length;

    return '' +
      '<article class="card" data-reveal>' +
      '<div class="card__media">' +
      '<div class="card__badges">' + badges + "</div>" +
      Q.miniaturaHTML(p, 0) +
      (fotos > 1 ? '<span class="card__count">' + ICONS.photo + fotos + "</span>" : "") +
      "</div>" +
      '<div class="card__body">' +
      '<span class="card__type">' + Q.esc(Q.labelTipo(p.tipo)) + " · " + Q.esc(Q.labelZona(p.zona)) + "</span>" +
      '<h3 class="card__title"><a class="card__link" href="propiedad.html?id=' + encodeURIComponent(p.id) + '">' + Q.esc(p.titulo) + "</a></h3>" +
      '<p class="card__zone">' + ICONS.pin + "<span>" + Q.esc(p.direccion) + "</span></p>" +
      (specs ? '<div class="card__specs">' + specs + "</div>" : "") +
      '<div class="card__foot">' +
      '<p class="card__price">' + Q.esc(Q.precioTexto(p)) +
      (Q.precioTexto(p) === "Consultar" ? "<small>Precio a convenir</small>" : "<small>" + (op === "venta" ? "Venta" : "Por mes") + "</small>") +
      "</p>" +
      '<a class="card__wsp" href="' + Q.wspPropiedad(p) + '" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp sobre ' + Q.esc(p.titulo) + '">' + ICONS.wsp + "</a>" +
      "</div></div></article>";
  }

  window.cardHTML = cardHTML;

  /* ---------- Destacadas (home) ---------- */
  function initDestacadas() {
    var cont = document.querySelector("[data-destacadas]");
    if (!cont) return;
    var limite = parseInt(cont.getAttribute("data-destacadas"), 10) || 6;
    var lista = propiedades().filter(function (p) { return p.destacada; });
    if (lista.length < limite) {
      var resto = propiedades().filter(function (p) { return !p.destacada; });
      lista = lista.concat(resto);
    }
    cont.innerHTML = lista.slice(0, limite).map(cardHTML).join("");
    revelar(cont);
  }

  /* ---------- Contadores por zona (home) ---------- */
  function initZonas() {
    var cont = document.querySelector("[data-zonas]");
    if (!cont) return;
    var lista = propiedades();
    cont.innerHTML = (window.ZONAS || []).map(function (z) {
      var n = lista.filter(function (p) { return p.zona === z.slug; }).length;
      return '<a class="zona" href="propiedades.html?zona=' + z.slug + '">' +
        "<span>" + Q.esc(z.label) + "</span>" +
        '<span class="tabular">' + n + "</span></a>";
    }).join("");
  }

  function revelar(scope) {
    var items = (scope || document).querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    items.forEach(function (el, i) {
      el.style.setProperty("--d", Math.min(i, 6) * 60 + "ms");
      io.observe(el);
    });
  }

  /* ============================================================
     CATÁLOGO COMPLETO
     ============================================================ */
  function initCatalogo() {
    var root = document.querySelector("[data-catalogo]");
    if (!root) return;

    var grid = root.querySelector("[data-grid]");
    var countEl = root.querySelector("[data-count]");
    var activeEl = root.querySelector("[data-active-filters]");
    var filtersEl = root.querySelector(".filters");
    var ordenSel = root.querySelector("[data-orden]");

    /* Filtros fijos de la página (comprar.html, alquilar.html, terrenos.html) */
    var fijos = {};
    try { fijos = JSON.parse(root.getAttribute("data-fijos") || "{}"); } catch (e) { fijos = {}; }

    var estado = {
      operacion: "", tipo: "", zona: "", dormitorios: "",
      precioMin: "", precioMax: "", orden: "recientes", q: ""
    };

    /* 1. Leer parámetros de la URL */
    var params = new URLSearchParams(location.search);
    Object.keys(estado).forEach(function (k) {
      if (params.get(k)) estado[k] = params.get(k);
    });
    Object.keys(fijos).forEach(function (k) { estado[k] = fijos[k]; });

    /* 2. Construir los controles de filtro */
    construirFiltros();

    function construirFiltros() {
      var opWrap = root.querySelector("[data-filtro-operacion]");
      if (opWrap && !fijos.operacion) {
        opWrap.innerHTML = chips("operacion", [
          { v: "", l: "Todas" },
          { v: "venta", l: "Venta" },
          { v: "alquiler", l: "Alquiler" }
        ]);
      } else if (opWrap) {
        opWrap.closest(".filters__group").remove();
      }

      var tipoWrap = root.querySelector("[data-filtro-tipo]");
      if (tipoWrap && !fijos.tipo) {
        var tipos = [{ v: "", l: "Todos" }].concat((window.TIPOS || []).map(function (t) {
          return { v: t.slug, l: t.label };
        }));
        tipoWrap.innerHTML = chips("tipo", tipos);
      } else if (tipoWrap) {
        tipoWrap.closest(".filters__group").remove();
      }

      var zonaSel = root.querySelector('select[name="zona"]');
      if (zonaSel) {
        zonaSel.innerHTML = '<option value="">Todas las zonas</option>' +
          (window.ZONAS || []).map(function (z) {
            return '<option value="' + z.slug + '"' + (estado.zona === z.slug ? " selected" : "") + ">" + Q.esc(z.label) + "</option>";
          }).join("");
      }

      var dormWrap = root.querySelector("[data-filtro-dormitorios]");
      if (dormWrap) {
        dormWrap.innerHTML = chips("dormitorios", [
          { v: "", l: "Cualquiera" }, { v: "1", l: "1+" }, { v: "2", l: "2+" },
          { v: "3", l: "3+" }, { v: "4", l: "4+" }
        ], true);
      }

      var min = root.querySelector('input[name="precioMin"]');
      var max = root.querySelector('input[name="precioMax"]');
      if (min) min.value = estado.precioMin;
      if (max) max.value = estado.precioMax;
      if (ordenSel) ordenSel.value = estado.orden;

      var q = root.querySelector('input[name="q"]');
      if (q) q.value = estado.q;
    }

    function chips(campo, opciones, turq) {
      return opciones.map(function (o) {
        var activo = String(estado[campo] || "") === String(o.v);
        return '<button type="button" class="chip' + (turq ? " chip--turq" : "") + (activo ? " is-active" : "") +
          '" data-campo="' + campo + '" data-valor="' + o.v + '">' + Q.esc(o.l) + "</button>";
      }).join("");
    }

    /* 3. Eventos */
    root.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (chip && root.contains(chip)) {
        estado[chip.getAttribute("data-campo")] = chip.getAttribute("data-valor");
        construirFiltros();
        aplicar();
      }
      var quitar = ev.target.closest("[data-quitar]");
      if (quitar) {
        estado[quitar.getAttribute("data-quitar")] = "";
        construirFiltros();
        aplicar();
      }
    });

    root.querySelectorAll('input[name="precioMin"], input[name="precioMax"], input[name="q"]').forEach(function (el) {
      var t;
      el.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          estado[el.name] = el.value.trim();
          aplicar();
        }, 320);
      });
    });

    var zonaSel = root.querySelector('select[name="zona"]');
    if (zonaSel) zonaSel.addEventListener("change", function () { estado.zona = zonaSel.value; aplicar(); });
    if (ordenSel) ordenSel.addEventListener("change", function () { estado.orden = ordenSel.value; aplicar(); });

    var limpiar = root.querySelector("[data-limpiar]");
    if (limpiar) limpiar.addEventListener("click", function () {
      Object.keys(estado).forEach(function (k) { if (k !== "orden") estado[k] = ""; });
      Object.keys(fijos).forEach(function (k) { estado[k] = fijos[k]; });
      construirFiltros();
      aplicar();
    });

    /* Filtros en mobile */
    var abrir = root.querySelector("[data-abrir-filtros]");
    var cerrar = root.querySelector("[data-cerrar-filtros]");
    if (abrir && filtersEl) abrir.addEventListener("click", function () {
      filtersEl.classList.add("is-open"); document.body.style.overflow = "hidden";
    });
    if (cerrar && filtersEl) cerrar.addEventListener("click", function () {
      filtersEl.classList.remove("is-open"); document.body.style.overflow = "";
    });

    /* 4. Filtrado + render */
    function filtrar() {
      var texto = (estado.q || "").toLowerCase();
      return propiedades().filter(function (p) {
        if (estado.operacion && p.operacion !== estado.operacion) return false;
        if (estado.tipo && p.tipo !== estado.tipo) return false;
        if (estado.zona && p.zona !== estado.zona) return false;
        if (estado.dormitorios && Number(p.dormitorios || 0) < Number(estado.dormitorios)) return false;
        if (estado.precioMin && (p.precio == null || Number(p.precio) < Number(estado.precioMin))) return false;
        if (estado.precioMax && (p.precio == null || Number(p.precio) > Number(estado.precioMax))) return false;
        if (texto) {
          var blob = [p.titulo, p.direccion, p.descripcion, Q.labelZona(p.zona), Q.labelTipo(p.tipo), p.id]
            .join(" ").toLowerCase();
          if (blob.indexOf(texto) === -1) return false;
        }
        return true;
      });
    }

    function ordenar(lista) {
      var l = lista.slice();
      switch (estado.orden) {
        case "precio-asc":
          return l.sort(function (a, b) { return (a.precio == null ? Infinity : a.precio) - (b.precio == null ? Infinity : b.precio); });
        case "precio-desc":
          return l.sort(function (a, b) { return (b.precio == null ? -Infinity : b.precio) - (a.precio == null ? -Infinity : a.precio); });
        case "superficie":
          return l.sort(function (a, b) { return (b.m2Cubiertos || b.m2Terreno || 0) - (a.m2Cubiertos || a.m2Terreno || 0); });
        default:
          return l.sort(function (a, b) {
            if (!!b.destacada !== !!a.destacada) return b.destacada ? 1 : -1;
            return String(b.fecha || "").localeCompare(String(a.fecha || ""));
          });
      }
    }

    function tagsActivos() {
      if (!activeEl) return;
      var tags = [];
      if (estado.operacion && !fijos.operacion) tags.push(["operacion", estado.operacion === "venta" ? "En venta" : "En alquiler"]);
      if (estado.tipo && !fijos.tipo) tags.push(["tipo", Q.labelTipo(estado.tipo)]);
      if (estado.zona && !fijos.zona) tags.push(["zona", Q.labelZona(estado.zona)]);
      if (estado.dormitorios) tags.push(["dormitorios", estado.dormitorios + "+ dormitorios"]);
      if (estado.precioMin) tags.push(["precioMin", "Desde $" + Number(estado.precioMin).toLocaleString("es-AR")]);
      if (estado.precioMax) tags.push(["precioMax", "Hasta $" + Number(estado.precioMax).toLocaleString("es-AR")]);
      if (estado.q) tags.push(["q", '"' + estado.q + '"']);

      activeEl.innerHTML = tags.map(function (t) {
        return '<span class="tag-remove">' + Q.esc(t[1]) +
          '<button type="button" data-quitar="' + t[0] + '" aria-label="Quitar filtro">' + ICONS.close + "</button></span>";
      }).join("");
    }

    function sincronizarURL() {
      var params = new URLSearchParams();
      Object.keys(estado).forEach(function (k) {
        if (estado[k] && !fijos[k] && !(k === "orden" && estado[k] === "recientes")) params.set(k, estado[k]);
      });
      var url = location.pathname + (params.toString() ? "?" + params.toString() : "");
      history.replaceState(null, "", url);
    }

    function aplicar() {
      var lista = ordenar(filtrar());
      if (countEl) {
        countEl.innerHTML = "<strong>" + lista.length + "</strong> " +
          (lista.length === 1 ? "propiedad encontrada" : "propiedades encontradas");
      }
      tagsActivos();
      sincronizarURL();

      if (!lista.length) {
        grid.classList.remove("cards");
        grid.innerHTML =
          '<div class="empty-state">' + ICONS.search +
          "<h3>No encontramos propiedades con esos filtros</h3>" +
          '<p class="muted mt-1">Probá ampliar la búsqueda o escribinos: muchas veces tenemos opciones que todavía no publicamos.</p>' +
          '<div class="flex-row mt-3" style="justify-content:center">' +
          '<button type="button" class="btn btn--ghost" data-limpiar>Limpiar filtros</button>' +
          '<a class="btn btn--wsp" data-wsp="¡Hola Quinteros! Busco una propiedad en General Pico y no la encontré en la web. ¿Me ayudan?">Consultar por WhatsApp</a>' +
          "</div></div>";
        grid.querySelectorAll("[data-wsp]").forEach(function (el) {
          el.href = Q.wspURL(el.getAttribute("data-wsp"));
          el.target = "_blank"; el.rel = "noopener";
        });
        return;
      }

      grid.classList.add("cards");
      grid.innerHTML = lista.map(cardHTML).join("");
      revelar(grid);
    }

    aplicar();
  }

  /* ---------- Init ---------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    initDestacadas();
    initZonas();
    initCatalogo();
  });
})();
