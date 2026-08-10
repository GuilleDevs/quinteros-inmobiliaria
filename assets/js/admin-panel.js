/* ============================================================
   PANEL DE CARGA — versión con base de datos
   ------------------------------------------------------------
   Habla con los endpoints de /api. Guardar publica al instante:
   el servidor regenera data/propiedades.js solo.
   ============================================================ */
(function () {
  "use strict";

  var PANEL = window.PANEL || {};
  var CSRF = PANEL.csrf || "";
  var lista = (PANEL.propiedades || []).slice();
  var URL_FOTOS = PANEL.urlFotos || "assets/img/propiedades";

  var actual = null;      // propiedad seleccionada (objeto de la base)
  var imagenes = [];      // fotos de la propiedad seleccionada
  var sucio = false;      // hay cambios sin guardar

  var $ = function (s) { return document.querySelector(s); };

  /* ---------- Utilidades ---------- */

  function toast(msg, tipo) {
    var t = $("#toast");
    t.textContent = msg;
    t.style.background = tipo === "error" ? "#9E2A1F" : "var(--navy-800)";
    t.classList.add("is-visible");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("is-visible"); }, tipo === "error" ? 5200 : 2800);
  }

  function estado(txt) { $("#estado-cambios").textContent = txt; }

  function marcarSucio(v) {
    sucio = v;
    $("#btn-guardar").classList.toggle("btn--turq", v);
    $("#btn-guardar").textContent = v ? "Guardar cambios *" : "Guardar cambios";
    estado(v ? "Hay cambios sin guardar" : lista.length + (lista.length === 1 ? " propiedad" : " propiedades") + " en el catálogo");
  }

  async function pedir(url, datos, metodo) {
    var opciones = {
      method: metodo || "POST",
      headers: { "X-CSRF-Token": CSRF },
      credentials: "same-origin"
    };
    if (datos instanceof FormData) {
      datos.append("csrf", CSRF);
      opciones.body = datos;
    } else if (datos) {
      opciones.headers["Content-Type"] = "application/json";
      opciones.body = JSON.stringify(datos);
    }

    var r = await fetch(url, opciones);

    if (r.status === 401) {
      alert("Tu sesión venció. Te vamos a llevar de nuevo a la pantalla de acceso.");
      location.href = "login.php";
      throw new Error("sesion");
    }

    var texto = await r.text();
    var json;
    try {
      json = JSON.parse(texto);
    } catch (e) {
      console.error("Respuesta del servidor:", texto);
      throw new Error("El servidor respondió algo inesperado. Revisá el log de errores del hosting.");
    }
    if (!json.ok && json.error) throw new Error(json.error);
    return json;
  }

  /* ---------- Listado ---------- */

  function pintarLista() {
    var filtro = ($("#buscar-admin").value || "").toLowerCase();
    var cont = $("#lista-admin");

    var visibles = lista.filter(function (p) {
      if (!filtro) return true;
      return (p.titulo + " " + p.direccion + " " + p.slug).toLowerCase().indexOf(filtro) !== -1;
    });

    if (!visibles.length) {
      cont.innerHTML = '<p class="muted" style="font-size:.86rem;padding:.5rem">Sin resultados.</p>';
      return;
    }

    cont.innerHTML = visibles.map(function (p) {
      var color = p.operacion === "venta" ? "var(--navy-800)" : "var(--turq-500)";
      var notas = [];
      if (Number(p.publicada) !== 1) notas.push("oculta");
      if (!Number(p.fotos)) notas.push("sin fotos");
      var extra = notas.length ? " · " + notas.join(" · ") : "";

      return '<button type="button" class="admin-item' + (actual && actual.id == p.id ? " is-active" : "") +
        '" data-id="' + p.id + '" aria-label="Editar ' + escapar(p.titulo) + '">' +
        '<span class="admin-item__dot" style="background:' + color + '"></span>' +
        '<span class="admin-item__body">' +
        '<span class="admin-item__title">' + escapar(p.titulo) + "</span>" +
        '<span class="admin-item__meta">' + (p.operacion === "venta" ? "Venta" : "Alquiler") +
        " · " + escapar(p.tipo) + " · " + Number(p.fotos) + " foto" + (Number(p.fotos) === 1 ? "" : "s") + extra + "</span>" +
        "</span></button>";
    }).join("");
  }

  function escapar(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- Formulario ---------- */

  function poblarSelects() {
    $("#f-tipo").innerHTML = (window.TIPOS || []).map(function (t) {
      return '<option value="' + t.slug + '">' + t.label + "</option>";
    }).join("");
    $("#f-zona").innerHTML = (window.ZONAS || []).map(function (z) {
      return '<option value="' + z.slug + '">' + z.label + "</option>";
    }).join("");
  }

  function v(id) { return $(id).value.trim(); }

  function cargarFormulario(p, imgs) {
    actual = p;
    imagenes = imgs || [];

    $("#form-vacio").classList.toggle("hide", !p);
    $("#form-propiedad").classList.toggle("hide", !p);
    if (!p) { pintarLista(); return; }

    $("#f-id").value = p.id;
    $("#f-titulo").value = p.titulo || "";
    $("#f-slug").value = p.slug || "";
    $("#f-direccion").value = p.direccion || "";
    $("#f-operacion").value = p.operacion || "venta";
    $("#f-tipo").value = p.tipo || "casa";
    $("#f-zona").value = p.zona || "centro";
    $("#f-estado").value = p.estado || "disponible";
    $("#f-fecha").value = p.fecha || "";
    $("#f-publicada").checked = Number(p.publicada) === 1;
    $("#f-destacada").checked = Number(p.destacada) === 1;
    $("#f-dormitorios").value = p.dormitorios == null ? "" : p.dormitorios;
    $("#f-banos").value = p.banos == null ? "" : p.banos;
    $("#f-ambientes").value = p.ambientes == null ? "" : p.ambientes;
    $("#f-cocheras").value = p.cocheras == null ? "" : p.cocheras;
    $("#f-m2cub").value = p.m2_cubiertos == null ? "" : p.m2_cubiertos;
    $("#f-m2ter").value = p.m2_terreno == null ? "" : p.m2_terreno;
    $("#f-precio").value = p.precio == null ? "" : Number(p.precio);
    $("#f-moneda").value = p.moneda || "USD";
    $("#f-expensas").value = p.expensas == null ? "" : Number(p.expensas);
    $("#f-descripcion").value = p.descripcion || "";
    $("#f-caracteristicas").value = p.caracteristicas || "";
    $("#f-mapa").value = p.mapa_query || "";
    $("#btn-ver").href = "propiedad.html?id=" + encodeURIComponent(p.slug || "");

    pintarFotos();
    pintarLista();
    vistaPrevia();
    marcarSucio(false);
  }

  function leerFormulario() {
    return {
      id: $("#f-id").value || null,
      titulo: v("#f-titulo"),
      slug: v("#f-slug") || v("#f-titulo"),
      direccion: v("#f-direccion"),
      operacion: v("#f-operacion"),
      tipo: v("#f-tipo"),
      zona: v("#f-zona"),
      estado: v("#f-estado"),
      fecha: v("#f-fecha"),
      publicada: $("#f-publicada").checked,
      destacada: $("#f-destacada").checked,
      dormitorios: v("#f-dormitorios"),
      banos: v("#f-banos"),
      ambientes: v("#f-ambientes"),
      cocheras: v("#f-cocheras"),
      m2Cubiertos: v("#f-m2cub"),
      m2Terreno: v("#f-m2ter"),
      precio: v("#f-precio"),
      moneda: v("#f-moneda"),
      expensas: v("#f-expensas"),
      descripcion: v("#f-descripcion"),
      caracteristicas: $("#f-caracteristicas").value.trim(),
      mapaQuery: v("#f-mapa")
    };
  }

  /* ---------- Vista previa ---------- */

  function vistaPrevia() {
    if (!actual || typeof window.cardHTML !== "function") return;
    var d = leerFormulario();
    var falsa = {
      id: d.slug,
      titulo: d.titulo || "(sin título)",
      operacion: d.operacion,
      tipo: d.tipo,
      zona: d.zona,
      estado: d.estado,
      destacada: d.destacada,
      direccion: d.direccion,
      dormitorios: d.dormitorios ? Number(d.dormitorios) : null,
      banos: d.banos ? Number(d.banos) : null,
      cocheras: d.cocheras ? Number(d.cocheras) : null,
      m2Cubiertos: d.m2Cubiertos ? Number(d.m2Cubiertos) : null,
      m2Terreno: d.m2Terreno ? Number(d.m2Terreno) : null,
      precio: d.precio ? Number(d.precio) : null,
      moneda: d.moneda,
      imagenes: imagenes.map(function (i) { return URL_FOTOS + "/" + i.archivo + "-m.jpg"; }),
      miniaturas: imagenes.map(function (i) { return URL_FOTOS + "/" + i.archivo + "-s.jpg"; })
    };
    $("#vista-previa").innerHTML = window.cardHTML(falsa);
    $("#vista-previa").querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Fotos ---------- */

  function pintarFotos() {
    var grid = $("#fotos-grid");
    $("#fotos-vacio").classList.toggle("hide", imagenes.length > 0);

    grid.innerHTML = imagenes.map(function (img, i) {
      return '<figure class="foto-item" data-id="' + img.id + '">' +
        '<img src="' + URL_FOTOS + "/" + escapar(img.archivo) + '-s.jpg" alt="" loading="lazy">' +
        (i === 0 ? '<span class="foto-item__portada">Portada</span>' : "") +
        '<div class="foto-item__acciones">' +
        '<button type="button" class="foto-btn" data-mover="-1" title="Mover antes"' + (i === 0 ? " disabled" : "") + '>&#8592;</button>' +
        '<button type="button" class="foto-btn" data-mover="1" title="Mover después"' + (i === imagenes.length - 1 ? " disabled" : "") + '>&#8594;</button>' +
        '<button type="button" class="foto-btn foto-btn--borrar" data-borrar title="Eliminar foto">&#10005;</button>' +
        "</div></figure>";
    }).join("");
  }

  async function subirFotos(archivos) {
    if (!actual) return;
    if (!archivos || !archivos.length) return;

    var fd = new FormData();
    fd.append("propiedad_id", actual.id);
    for (var i = 0; i < archivos.length; i++) fd.append("fotos[]", archivos[i]);

    $("#subiendo").classList.remove("hide");
    $("#subiendo-texto").textContent = "Subiendo " + archivos.length + (archivos.length === 1 ? " foto..." : " fotos...");
    $("#subiendo-progreso").style.width = "8%";

    try {
      var json = await subirConProgreso("api/subir-imagen.php", fd);

      imagenes = json.imagenes || imagenes;
      pintarFotos();
      vistaPrevia();
      refrescarContadorFotos();

      if (json.fallidas && json.fallidas.length) {
        var det = json.fallidas.map(function (f) { return "• " + f.nombre + ": " + f.error; }).join("\n");
        alert("Algunas fotos no se pudieron subir:\n\n" + det);
      }
      if (json.subidas && json.subidas.length) {
        toast(json.subidas.length + (json.subidas.length === 1 ? " foto subida y publicada" : " fotos subidas y publicadas"));
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      $("#subiendo").classList.add("hide");
      $("#subiendo-progreso").style.width = "0%";
      $("#f-fotos").value = "";
    }
  }

  /* XHR en vez de fetch: necesitamos la barra de progreso real. */
  function subirConProgreso(url, formData) {
    return new Promise(function (resolve, reject) {
      formData.append("csrf", CSRF);
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("X-CSRF-Token", CSRF);
      xhr.withCredentials = true;

      xhr.upload.onprogress = function (ev) {
        if (!ev.lengthComputable) return;
        var pct = Math.round((ev.loaded / ev.total) * 90) + 5;
        $("#subiendo-progreso").style.width = pct + "%";
        if (ev.loaded === ev.total) $("#subiendo-texto").textContent = "Procesando y achicando las fotos...";
      };

      xhr.onload = function () {
        $("#subiendo-progreso").style.width = "100%";
        if (xhr.status === 401) {
          alert("Tu sesión venció. Volvé a entrar.");
          location.href = "login.php";
          return;
        }
        var json;
        try {
          json = JSON.parse(xhr.responseText);
        } catch (e) {
          console.error("Respuesta:", xhr.responseText);
          return reject(new Error(
            xhr.status === 413
              ? "Las fotos son demasiado pesadas para el servidor. Subilas de a una."
              : "El servidor respondió algo inesperado (código " + xhr.status + ")."
          ));
        }
        if (!json.ok && json.error && (!json.subidas || !json.subidas.length)) {
          return reject(new Error(json.error));
        }
        resolve(json);
      };

      xhr.onerror = function () { reject(new Error("Se cortó la conexión durante la subida.")); };
      xhr.send(formData);
    });
  }

  function refrescarContadorFotos() {
    var f = lista.filter(function (p) { return p.id == actual.id; })[0];
    if (f) { f.fotos = imagenes.length; pintarLista(); }
  }

  /* ---------- Acciones ---------- */

  async function seleccionar(id) {
    if (sucio && !confirm("Tenés cambios sin guardar en esta propiedad. Si seguís, se pierden. ¿Continuar?")) return;
    try {
      var json = await pedir("api/obtener.php?id=" + encodeURIComponent(id), null, "GET");
      cargarFormulario(json.propiedad, json.propiedad.imagenes);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function guardar() {
    if (!actual) return;
    var datos = leerFormulario();

    if (!datos.titulo) { toast("Poné un título antes de guardar.", "error"); $("#f-titulo").focus(); return; }
    if (!datos.direccion) { toast("Falta la dirección.", "error"); $("#f-direccion").focus(); return; }

    var btn = $("#btn-guardar");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      var json = await pedir("api/guardar.php", datos);

      var i = lista.findIndex(function (p) { return p.id == json.id; });
      var resumen = Object.assign({}, json.propiedad, { fotos: (json.propiedad.imagenes || []).length });
      delete resumen.imagenes;
      if (i >= 0) lista[i] = resumen; else lista.unshift(resumen);

      cargarFormulario(json.propiedad, json.propiedad.imagenes);
      toast("Guardado y publicado en el sitio.");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      btn.disabled = false;
      marcarSucio(false);
    }
  }

  async function nueva() {
    if (sucio && !confirm("Tenés cambios sin guardar. Si seguís, se pierden. ¿Continuar?")) return;
    try {
      var json = await pedir("api/guardar.php", {
        titulo: "Nueva propiedad",
        direccion: "",
        operacion: "venta",
        tipo: "casa",
        zona: "centro",
        estado: "disponible",
        publicada: false,
        destacada: false,
        moneda: "USD",
        fecha: new Date().toISOString().slice(0, 10)
      });

      var resumen = Object.assign({}, json.propiedad, { fotos: 0 });
      delete resumen.imagenes;
      lista.unshift(resumen);

      cargarFormulario(json.propiedad, []);
      toast("Propiedad creada. Está oculta hasta que la marques como publicada.");
      $("#f-titulo").focus();
      $("#f-titulo").select();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function eliminar() {
    if (!actual) return;
    if (!confirm('¿Eliminar "' + (actual.titulo || "esta propiedad") + '" definitivamente?\n\nSe borran también sus fotos del servidor. Esta acción no se puede deshacer.')) return;

    try {
      await pedir("api/eliminar.php", { id: actual.id });
      lista = lista.filter(function (p) { return p.id != actual.id; });
      cargarFormulario(null, []);
      marcarSucio(false);
      toast("Propiedad eliminada.");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  /* ---------- Init ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    poblarSelects();
    pintarLista();
    marcarSucio(false);

    /* Selección tolerante.
       El navegador solo dispara "click" sobre el ancestro común de donde se
       apretó y donde se soltó el botón. Si la mano se mueve unos píxeles y
       el mouse cruza al espacio entre dos filas, ese ancestro pasa a ser la
       lista entera y closest() no encuentra ninguna fila: el clic se pierde
       y aparenta que la propiedad no responde.
       Por eso recordamos sobre qué fila se apretó y la usamos de respaldo. */
    var filaPresionada = null;

    $("#lista-admin").addEventListener("pointerdown", function (ev) {
      filaPresionada = ev.target.closest(".admin-item");
    });

    $("#lista-admin").addEventListener("click", function (ev) {
      var btn = ev.target.closest(".admin-item") || filaPresionada;
      filaPresionada = null;
      if (btn && btn.getAttribute("data-id")) {
        seleccionar(btn.getAttribute("data-id"));
      }
    });

    $("#buscar-admin").addEventListener("input", pintarLista);
    $("#btn-nueva").addEventListener("click", nueva);
    $("#btn-eliminar").addEventListener("click", eliminar);

    $("#form-propiedad").addEventListener("submit", function (e) { e.preventDefault(); guardar(); });

    $("#form-propiedad").addEventListener("input", function () { marcarSucio(true); vistaPrevia(); });
    $("#form-propiedad").addEventListener("change", function () { marcarSucio(true); vistaPrevia(); });

    /* ----- Fotos: elegir, arrastrar, ordenar, borrar ----- */
    $("#btn-elegir").addEventListener("click", function () { $("#f-fotos").click(); });
    $("#f-fotos").addEventListener("change", function () { subirFotos(this.files); });

    var dz = $("#dropzone");
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-over"); });
    });
    dz.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) subirFotos(e.dataTransfer.files);
    });
    /* Evita que soltar una foto fuera de la zona abra el archivo en el navegador */
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("drop", function (e) { e.preventDefault(); });

    $("#fotos-grid").addEventListener("click", async function (ev) {
      var fig = ev.target.closest(".foto-item");
      if (!fig || !actual) return;
      var id = Number(fig.getAttribute("data-id"));

      if (ev.target.closest("[data-borrar]")) {
        if (!confirm("¿Eliminar esta foto?")) return;
        try {
          var r = await pedir("api/imagenes.php", { accion: "eliminar", propiedad_id: actual.id, imagen_id: id });
          imagenes = r.imagenes;
          pintarFotos(); vistaPrevia(); refrescarContadorFotos();
          toast("Foto eliminada.");
        } catch (err) { toast(err.message, "error"); }
        return;
      }

      var mover = ev.target.closest("[data-mover]");
      if (mover) {
        var paso = Number(mover.getAttribute("data-mover"));
        var i = imagenes.findIndex(function (x) { return x.id === id; });
        var j = i + paso;
        if (i < 0 || j < 0 || j >= imagenes.length) return;

        var tmp = imagenes[i]; imagenes[i] = imagenes[j]; imagenes[j] = tmp;
        pintarFotos(); vistaPrevia();

        try {
          await pedir("api/imagenes.php", {
            accion: "ordenar",
            propiedad_id: actual.id,
            orden: imagenes.map(function (x) { return x.id; })
          });
        } catch (err) { toast(err.message, "error"); }
      }
    });

    /* ----- Cambio de contraseña ----- */
    var modal = $("#modal-clave");
    $("#btn-clave").addEventListener("click", function () { modal.hidden = false; $("#k-actual").focus(); });
    $("#k-cerrar").addEventListener("click", function () { modal.hidden = true; $("#k-estado").className = "form-status"; });
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.hidden = true; });

    $("#k-guardar").addEventListener("click", async function () {
      var est = $("#k-estado");
      try {
        await pedir("api/cambiar-clave.php", {
          actual: $("#k-actual").value,
          nueva: $("#k-nueva").value,
          nueva2: $("#k-nueva2").value
        });
        est.className = "form-status is-ok";
        est.textContent = "Contraseña actualizada.";
        $("#k-actual").value = $("#k-nueva").value = $("#k-nueva2").value = "";
        setTimeout(function () { modal.hidden = true; est.className = "form-status"; }, 1800);
      } catch (err) {
        est.className = "form-status is-error";
        est.textContent = err.message;
      }
    });

    window.addEventListener("beforeunload", function (e) {
      if (!sucio) return;
      e.preventDefault();
      e.returnValue = "";
    });
  });
})();
