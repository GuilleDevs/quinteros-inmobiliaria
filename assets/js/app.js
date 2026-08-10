/* ============================================================
   APP — comportamiento común a todo el sitio
   ============================================================ */
(function () {
  "use strict";

  var S = window.SITE || {};

  /* ---------- Iconos SVG reutilizables ---------- */
  var ICONS = {
    wsp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2.02c-5.5 0-9.97 4.47-9.97 9.97 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35a9.93 9.93 0 0 0 4.88 1.27h.01c5.5 0 9.97-4.47 9.97-9.97 0-2.66-1.04-5.17-2.92-7.05a9.9 9.9 0 0 0-7.06-2.88zm0 18.13h-.01a8.28 8.28 0 0 1-4.21-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.25 8.25 0 0 1-1.27-4.4c0-4.57 3.72-8.29 8.29-8.29 2.21 0 4.29.86 5.86 2.43a8.24 8.24 0 0 1 2.42 5.87c0 4.57-3.72 8.28-8.29 8.28z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 2.16c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07zm0 3.67a6.01 6.01 0 1 1 0 12.02 6.01 6.01 0 0 1 0-12.02zm0 9.91a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8zm7.65-10.15a1.4 1.4 0 1 1-2.81 0 1.4 1.4 0 0 1 2.81 0z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 17V7a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3"/><path d="M2 13h20a1 1 0 0 1 1 1v3"/><path d="M23 17v3"/><path d="M2 17v3"/><path d="M6 10h5a2 2 0 0 1 2 2v1H6z"/></svg>',
    bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12V6a2 2 0 0 1 3.4-1.4"/><path d="M7 6h1"/><path d="M2 12h20v2a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5z"/><path d="M6 19l-1 2"/><path d="M18 19l1 2"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14"/><path d="M4 17v2"/><path d="M20 17v2"/><path d="M3 13l1.8-4.6A2 2 0 0 1 6.7 7h10.6a2 2 0 0 1 1.9 1.4L21 13v4H3z"/><circle cx="7" cy="14.5" r="1"/><circle cx="17" cy="14.5" r="1"/></svg>',
    area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M8 3v3M3 8h3M16 21v-3M21 16h-3"/></svg>',
    rooms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V6l9-3 9 3v15"/><path d="M3 21h18"/><path d="M12 21V11"/><path d="M12 11H3"/><path d="M21 11h-9"/></svg>',
    land: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20l6-14 6 8 3-4 5 10z"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2l-2 4 2 1-3 3-2-1-2 2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M9 20v-5h5v5"/></svg>'
  };
  window.ICONS = ICONS;

  /* ---------- Utilidades ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function labelTipo(slug) {
    var t = (window.TIPOS || []).filter(function (x) { return x.slug === slug; })[0];
    return t ? t.label : slug;
  }
  function labelZona(slug) {
    var z = (window.ZONAS || []).filter(function (x) { return x.slug === slug; })[0];
    return z ? z.label : slug;
  }

  function formatPrecio(p) {
    if (p == null || p === "" || isNaN(p)) return { valor: "Consultar", nota: "Precio a convenir" };
    var moneda = p.moneda === "USD" ? "USD" : "$";
    var n = Number(p.precio).toLocaleString("es-AR");
    return { valor: moneda + " " + n, nota: null };
  }

  function precioTexto(prop) {
    if (prop.precio == null || prop.precio === "" || isNaN(Number(prop.precio))) return "Consultar";
    var simbolo = prop.moneda === "USD" ? "USD " : "$ ";
    return simbolo + Number(prop.precio).toLocaleString("es-AR");
  }

  function wspURL(mensaje) {
    var num = (S.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(mensaje || S.mensajeGeneral || "Hola");
  }

  function wspPropiedad(prop) {
    var msg =
      "¡Hola Quinteros! Me interesa esta propiedad de la web:\n\n" +
      "• " + prop.titulo + "\n" +
      "• " + prop.direccion + "\n" +
      "• Operación: " + (prop.operacion === "venta" ? "Venta" : "Alquiler") + "\n" +
      "• Referencia: " + prop.id + "\n\n" +
      "¿Me pasan más información?";
    return wspURL(msg);
  }

  function placeholderHTML(prop) {
    var icon = prop && (prop.tipo === "terreno" || prop.tipo === "campo") ? ICONS.land
      : prop && (prop.tipo === "local" || prop.tipo === "oficina") ? ICONS.store
        : ICONS.home;
    return '<div class="ph">' + icon + '<span class="ph__label">Quinteros Grupo Inmobiliario</span></div>';
  }

  function imagenHTML(prop, index, clase) {
    var imgs = prop.imagenes || [];
    if (!imgs.length) return placeholderHTML(prop);
    var src = imgs[index || 0];
    return '<img src="' + esc(src) + '" alt="' + esc(prop.titulo + " — " + prop.direccion) +
      '" loading="lazy" decoding="async" class="' + (clase || "") + '">';
  }

  /* Igual que imagenHTML pero usando la versión chica (640 px) que genera
     el panel al subir la foto. Es la que va en las tarjetas del catálogo:
     ahí la imagen se ve a ~310 px, así que bajar la de 1600 sería tirar
     ancho de banda a la basura. */
  function miniaturaHTML(prop, index, clase) {
    var minis = prop.miniaturas || [];
    var imgs = prop.imagenes || [];
    var src = minis[index || 0] || imgs[index || 0];
    if (!src) return placeholderHTML(prop);
    return '<img src="' + esc(src) + '" alt="' + esc(prop.titulo + " — " + prop.direccion) +
      '" loading="lazy" decoding="async" class="' + (clase || "") + '">';
  }

  window.QU = {
    esc: esc,
    labelTipo: labelTipo,
    labelZona: labelZona,
    precioTexto: precioTexto,
    formatPrecio: formatPrecio,
    wspURL: wspURL,
    wspPropiedad: wspPropiedad,
    placeholderHTML: placeholderHTML,
    imagenHTML: imagenHTML,
    miniaturaHTML: miniaturaHTML
  };

  /* ---------- Datos de contacto dinámicos ---------- */
  function hidratarDatos() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      var val = S[key];
      if (val == null) return;
      if (el.tagName === "A") {
        if (key === "whatsapp") { el.href = wspURL(); el.rel = "noopener"; el.target = "_blank"; }
        else if (key === "telefonoLink") { el.href = "tel:" + val; }
        else if (key === "email") { el.href = "mailto:" + val; el.textContent = val; }
        else if (key === "instagram") { el.href = val; el.rel = "noopener"; el.target = "_blank"; }
        else { el.textContent = val; }
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-site-text]").forEach(function (el) {
      var key = el.getAttribute("data-site-text");
      if (S[key] != null) el.textContent = S[key];
    });
    document.querySelectorAll("[data-wsp]").forEach(function (el) {
      el.href = wspURL(el.getAttribute("data-wsp") || undefined);
      el.target = "_blank";
      el.rel = "noopener";
    });
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Header ---------- */
  function initHeader() {
    var header = document.querySelector(".header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");

    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-stuck", window.scrollY > 8);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        document.body.classList.toggle("nav-open", !open);
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
          document.body.classList.remove("nav-open");
        });
      });
    }

    /* Marcar el link activo */
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav__link").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      if (href && href === path) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Buscador del hero ---------- */
  function initBuscador() {
    var form = document.querySelector("[data-buscador]");
    if (!form) return;

    var tabs = form.querySelectorAll(".tab");
    var opInput = form.querySelector('input[name="operacion"]');
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("is-active"); });
        t.classList.add("is-active");
        if (opInput) opInput.value = t.getAttribute("data-op") || "";
      });
    });

    /* Poblar selects desde config */
    var selTipo = form.querySelector('select[name="tipo"]');
    if (selTipo && selTipo.options.length <= 1) {
      (window.TIPOS || []).forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.slug; o.textContent = t.label;
        selTipo.appendChild(o);
      });
    }
    var selZona = form.querySelector('select[name="zona"]');
    if (selZona && selZona.options.length <= 1) {
      (window.ZONAS || []).forEach(function (z) {
        var o = document.createElement("option");
        o.value = z.slug; o.textContent = z.label;
        selZona.appendChild(o);
      });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = new FormData(form);
      var params = new URLSearchParams();
      data.forEach(function (v, k) { if (v) params.set(k, v); });
      location.href = "propiedades.html" + (params.toString() ? "?" + params.toString() : "");
    });
  }

  /* ---------- Formularios de contacto ---------- */
  function initForms() {
    document.querySelectorAll("[data-form]").forEach(function (form) {
      var status = form.querySelector(".form-status");

      form.addEventListener("submit", function (ev) {
        ev.preventDefault();

        /* Validación mínima */
        var ok = true;
        form.querySelectorAll("[required]").forEach(function (input) {
          var field = input.closest(".field");
          var valido = input.value.trim() !== "" &&
            (input.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
          if (field) field.classList.toggle("has-error", !valido);
          if (!valido) ok = false;
        });
        if (!ok) {
          if (status) { status.className = "form-status is-error"; status.textContent = "Revisá los campos marcados, por favor."; }
          return;
        }

        var d = new FormData(form);
        var mensaje =
          "¡Hola Quinteros! Consulta desde la web:\n\n" +
          "• Nombre: " + (d.get("nombre") || "") + "\n" +
          "• Teléfono: " + (d.get("telefono") || "-") + "\n" +
          "• Email: " + (d.get("email") || "-") + "\n" +
          (d.get("interes") ? "• Interés: " + d.get("interes") + "\n" : "") +
          (d.get("propiedad") ? "• Propiedad: " + d.get("propiedad") + "\n" : "") +
          "\n" + (d.get("mensaje") || "");

        if (S.formEndpoint) {
          var btn = form.querySelector('button[type="submit"]');
          if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Enviando..."; }
          fetch(S.formEndpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: d
          }).then(function (r) {
            if (!r.ok) throw new Error("bad response");
            form.reset();
            if (status) { status.className = "form-status is-ok"; status.textContent = "¡Listo! Recibimos tu consulta. Te respondemos a la brevedad."; }
          }).catch(function () {
            if (status) {
              status.className = "form-status is-error";
              status.innerHTML = 'No pudimos enviar el formulario. Escribinos por <a href="' + wspURL(mensaje) + '" target="_blank" rel="noopener">WhatsApp</a>.';
            }
          }).then(function () {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Enviar consulta"; }
          });
        } else {
          window.open(wspURL(mensaje), "_blank", "noopener");
          if (status) { status.className = "form-status is-ok"; status.textContent = "Abrimos WhatsApp con tu consulta lista para enviar."; }
        }
      });

      form.querySelectorAll("input, textarea, select").forEach(function (input) {
        input.addEventListener("input", function () {
          var f = input.closest(".field");
          if (f) f.classList.remove("has-error");
        });
      });
    });
  }

  /* ---------- Init ---------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    hidratarDatos();
    initHeader();
    initReveal();
    initBuscador();
    initForms();
  });
})();
