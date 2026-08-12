/* ============================================================
   FICHA DE PROPIEDAD — propiedad.html?id=...
   ============================================================ */
(function () {
  "use strict";

  var Q = window.QU;
  var ICONS = window.ICONS;
  var S = window.SITE || {};

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* Arranca cuando el catálogo terminó de cargarse (ver catalogo-datos.js). */
  function alEstarListo(fn) {
    var arranque = window.QUINTEROS_CATALOGO;
    if (arranque && typeof arranque.then === "function") arranque.then(fn);
    else ready(fn);
  }

  alEstarListo(function () {
    var root = document.querySelector("[data-propiedad]");
    if (!root) return;

    var id = new URLSearchParams(location.search).get("id");
    var lista = (window.PROPIEDADES || []).filter(function (p) { return p.publicada !== false; });
    var p = lista.filter(function (x) { return x.id === id; })[0];

    if (!p) {
      root.innerHTML =
        '<div class="wrap section"><div class="empty-state">' + ICONS.search +
        "<h1 class='h2'>No encontramos esa propiedad</h1>" +
        '<p class="muted mt-1">Puede que ya se haya vendido o alquilado, o que el enlace esté incompleto.</p>' +
        '<div class="flex-row mt-3" style="justify-content:center">' +
        '<a class="btn btn--primary" href="propiedades.html">Ver todas las propiedades</a>' +
        '<a class="btn btn--ghost" href="contacto.html">Contactarnos</a>' +
        "</div></div></div>";
      return;
    }

    var op = p.operacion === "venta" ? "venta" : "alquiler";
    var opLabel = op === "venta" ? "En venta" : "En alquiler";
    var imgs = p.imagenes || [];

    /* ---------- SEO dinámico ---------- */
    var titulo = p.titulo + " — " + (op === "venta" ? "en venta" : "en alquiler") + " en General Pico | Quinteros";
    document.title = titulo;
    setMeta("description", (p.descripcion || "").slice(0, 155));
    setMeta("og:title", titulo, true);
    setMeta("og:description", (p.descripcion || "").slice(0, 200), true);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = location.origin + location.pathname + "?id=" + encodeURIComponent(p.id);

    injectJsonLd(p);

    /* ---------- Galería ---------- */
    var galeria;
    if (!imgs.length) {
      galeria =
        '<div class="gallery"><div class="gallery__main">' + Q.placeholderHTML(p) + "</div>" +
        '<div class="gallery__side"><figure>' + Q.placeholderHTML(p) + "</figure><figure>" + Q.placeholderHTML(p) + "</figure></div></div>";
    } else {
      var side = "";
      for (var i = 1; i <= 2; i++) {
        if (imgs[i]) {
          var extra = (i === 2 && imgs.length > 3)
            ? '<figcaption class="gallery__more">+' + (imgs.length - 3) + " fotos</figcaption>" : "";
          side += '<figure data-lightbox="' + i + '"><img src="' + Q.esc(imgs[i]) + '" alt="' + Q.esc(p.titulo) +
            '" loading="lazy" decoding="async">' + extra + "</figure>";
        } else {
          side += "<figure>" + Q.placeholderHTML(p) + "</figure>";
        }
      }
      galeria =
        '<div class="gallery"><div class="gallery__main" data-lightbox="0">' +
        '<img src="' + Q.esc(imgs[0]) + '" alt="' + Q.esc(p.titulo + " — " + p.direccion) + '" decoding="async">' +
        "</div>" + '<div class="gallery__side">' + side + "</div></div>";
    }

    /* ---------- Specs ---------- */
    var celdas = [
      [ICONS.bed, p.dormitorios, p.dormitorios === 1 ? "Dormitorio" : "Dormitorios"],
      [ICONS.bath, p.banos, p.banos === 1 ? "Baño" : "Baños"],
      [ICONS.rooms, p.ambientes, "Ambientes"],
      [ICONS.car, p.cocheras, p.cocheras === 1 ? "Cochera" : "Cocheras"],
      [ICONS.area, p.m2Cubiertos, "m² cubiertos"],
      [ICONS.land, p.m2Terreno, "m² de terreno"]
    ].filter(function (c) { return c[1] != null && c[1] !== "" && c[1] !== 0; });

    var specs = celdas.length
      ? '<div class="specs-grid">' + celdas.map(function (c) {
        return '<div class="spec-cell">' + c[0] +
          '<div class="spec-cell__value">' + c[1] + "</div>" +
          '<div class="spec-cell__label">' + c[2] + "</div></div>";
      }).join("") + "</div>"
      : "";

    /* ---------- Características ---------- */
    var caract = (p.caracteristicas || []).length
      ? "<h3>Características</h3><ul class=\"feature-list\">" +
      p.caracteristicas.map(function (c) { return "<li>" + Q.esc(c) + "</li>"; }).join("") + "</ul>"
      : "";

    /* ---------- Mapa ---------- */
    var mapQuery = p.mapaQuery || (p.direccion + ", General Pico, La Pampa, Argentina");
    var mapa =
      '<div class="aside-card"><h3>Ubicación aproximada</h3>' +
      '<iframe class="map-embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
      'title="Mapa de ' + Q.esc(p.direccion) + '" ' +
      'src="https://www.google.com/maps?q=' + encodeURIComponent(mapQuery) + '&z=15&output=embed"></iframe>' +
      '<p class="field__hint mt-2">La ubicación en el mapa es referencial. Coordinamos la visita con un asesor.</p></div>';

    /* ---------- Precio ---------- */
    var precio = Q.precioTexto(p);
    var nota = precio === "Consultar"
      ? "Escribinos y te pasamos el valor actualizado."
      : (op === "venta" ? "Valor de venta" : "Valor mensual" + (p.expensas ? " + $" + Number(p.expensas).toLocaleString("es-AR") + " de expensas" : ""));

    /* ---------- Render ---------- */
    root.innerHTML =
      '<div class="wrap pdp">' +
      '<nav class="breadcrumb" aria-label="Miga de pan">' +
      '<a href="index.html">Inicio</a><span aria-hidden="true">/</span>' +
      '<a href="' + (op === "venta" ? "comprar.html" : "alquilar.html") + '">' + opLabel + "</a>" +
      '<span aria-hidden="true">/</span>' +
      '<a href="propiedades.html?tipo=' + p.tipo + '">' + Q.esc(Q.labelTipo(p.tipo)) + "</a>" +
      '<span aria-hidden="true">/</span><span class="muted">' + Q.esc(p.direccion) + "</span>" +
      "</nav>" +

      galeria +

      '<div class="pdp__layout">' +
      "<div>" +
      '<header class="pdp__header">' +
      '<div class="pdp__badges">' +
      '<span class="badge badge--' + op + '">' + opLabel + "</span>" +
      '<span class="badge badge--soft">' + Q.esc(Q.labelTipo(p.tipo)) + "</span>" +
      '<span class="badge badge--soft">' + Q.esc(Q.labelZona(p.zona)) + "</span>" +
      (p.estado === "reservada" ? '<span class="badge badge--reservada">Reservada</span>' : "") +
      "</div>" +
      '<h1 class="pdp__title">' + Q.esc(p.titulo) + "</h1>" +
      '<p class="pdp__address">' + ICONS.pin + Q.esc(p.direccion) + " · General Pico, La Pampa</p>" +
      "</header>" +
      specs +
      '<div class="prose"><h3>Sobre la propiedad</h3><p>' + Q.esc(p.descripcion || "Consultanos por los detalles de esta propiedad.") + "</p>" +
      caract + "</div>" +
      '<p class="field__hint mt-4">Medidas y superficies orientativas, sujetas a verificación. Referencia interna: <strong>' + Q.esc(p.id) + "</strong>.</p>" +
      "</div>" +

      '<aside class="pdp__aside">' +
      '<div class="price-card">' +
      '<span class="price-card__op">' + (op === "venta" ? "Precio de venta" : "Alquiler mensual") + "</span>" +
      '<p class="price-card__value">' + Q.esc(precio) + "</p>" +
      '<p class="price-card__note">' + Q.esc(nota) + "</p>" +
      '<div class="price-card__actions">' +
      '<a class="btn btn--wsp btn--block" href="' + Q.wspPropiedad(p) + '" target="_blank" rel="noopener">' + ICONS.wsp + "Consultar por WhatsApp</a>" +
      '<a class="btn btn--ghost-light btn--block" href="contacto.html?propiedad=' + encodeURIComponent(p.id) + '">Pedir una visita</a>' +
      "</div>" +
      '<div class="price-card__ref"><span>Ref. ' + Q.esc(p.id) + "</span><span>" + Q.esc(S.horarioCorto || "") + "</span></div>" +
      "</div>" +
      mapa +
      '<div class="aside-card"><h3>¿Preferís hablar por teléfono?</h3>' +
      '<p class="muted" style="font-size:.9rem">' + Q.esc(S.direccion || "") + " · " + Q.esc(S.horario || "") + "</p>" +
      '<a class="btn btn--ghost btn--block mt-2" href="tel:' + Q.esc(S.telefonoLink || "") + '">' + ICONS.phone + Q.esc(S.telefono || "") + "</a>" +
      "</div>" +
      "</aside>" +
      "</div></div>";

    /* ---------- Similares ---------- */
    var simGrid = document.querySelector("[data-similares]");
    if (simGrid) {
      var similares = lista.filter(function (x) {
        return x.id !== p.id && x.operacion === p.operacion &&
          (x.tipo === p.tipo || x.zona === p.zona);
      }).slice(0, 3);
      if (!similares.length) {
        similares = lista.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
      }
      simGrid.innerHTML = similares.map(window.cardHTML).join("");
      simGrid.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
    }

    initLightbox(p, imgs);

    /* ---------- Helpers ---------- */
    function setMeta(name, content, isProperty) {
      var sel = isProperty ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
      var el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(isProperty ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function injectJsonLd(prop) {
      var data = {
        "@context": "https://schema.org",
        "@type": prop.operacion === "venta" ? "SingleFamilyResidence" : "Apartment",
        name: prop.titulo,
        description: prop.descripcion,
        address: {
          "@type": "PostalAddress",
          streetAddress: prop.direccion,
          addressLocality: "General Pico",
          addressRegion: "La Pampa",
          postalCode: S.codigoPostal || "6360",
          addressCountry: "AR"
        },
        numberOfRooms: prop.ambientes || undefined,
        numberOfBedrooms: prop.dormitorios || undefined,
        numberOfBathroomsTotal: prop.banos || undefined,
        floorSize: prop.m2Cubiertos ? { "@type": "QuantitativeValue", value: prop.m2Cubiertos, unitCode: "MTK" } : undefined
      };
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    }
  });

  /* ---------- Lightbox ---------- */
  function initLightbox(prop, imgs) {
    if (!imgs.length) return;
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Galería de fotos");
    box.innerHTML =
      '<button class="lightbox__close" aria-label="Cerrar galería">' + ICONS.close + "</button>" +
      '<button class="lightbox__nav lightbox__nav--prev" aria-label="Foto anterior">' + ICONS.arrowL + "</button>" +
      '<img alt="' + Q.esc(prop.titulo) + '">' +
      '<button class="lightbox__nav lightbox__nav--next" aria-label="Foto siguiente">' + ICONS.arrowR + "</button>" +
      '<span class="lightbox__counter"></span>';
    document.body.appendChild(box);

    var img = box.querySelector("img");
    var counter = box.querySelector(".lightbox__counter");
    var idx = 0;

    function mostrar(i) {
      idx = (i + imgs.length) % imgs.length;
      img.src = imgs[idx];
      counter.textContent = (idx + 1) + " / " + imgs.length;
    }
    function abrir(i) { mostrar(i); box.classList.add("is-open"); document.body.style.overflow = "hidden"; }
    function cerrar() { box.classList.remove("is-open"); document.body.style.overflow = ""; }

    document.querySelectorAll("[data-lightbox]").forEach(function (el) {
      el.style.cursor = "zoom-in";
      el.addEventListener("click", function () { abrir(parseInt(el.getAttribute("data-lightbox"), 10) || 0); });
    });

    box.querySelector(".lightbox__close").addEventListener("click", cerrar);
    box.querySelector(".lightbox__nav--prev").addEventListener("click", function () { mostrar(idx - 1); });
    box.querySelector(".lightbox__nav--next").addEventListener("click", function () { mostrar(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") mostrar(idx - 1);
      if (e.key === "ArrowRight") mostrar(idx + 1);
    });
  }
})();
