/* ============================================================
   PANEL DE CARGA — versión Firebase
   ------------------------------------------------------------
   Guardar publica al instante: se escribe en Firestore y se
   regenera el catálogo que consume el sitio público.
   ============================================================ */

import * as fb from "./fb.js";
import { procesarFoto, nombreUnico } from "./imagen-cliente.js";

const $ = s => document.querySelector(s);

let lista = [];        // todas las propiedades, en memoria
let actual = null;     // la que se está editando
let sucio = false;     // hay cambios sin guardar

/* ============================================================
   Utilidades
   ============================================================ */

function toast(msg, tipo) {
  const t = $("#toast");
  t.textContent = msg;
  t.style.background = tipo === "error" ? "#9E2A1F" : "var(--navy-800)";
  t.classList.add("is-visible");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("is-visible"), tipo === "error" ? 6000 : 2800);
}

function escapar(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function marcarSucio(v) {
  sucio = v;
  $("#btn-guardar").classList.toggle("btn--turq", v);
  $("#btn-guardar").textContent = v ? "Guardar cambios *" : "Guardar cambios";
  $("#estado-cambios").textContent = v
    ? "Hay cambios sin guardar"
    : lista.length + (lista.length === 1 ? " propiedad" : " propiedades") + " en el catálogo";
}

function generarSlug(txt) {
  return String(txt || "")
    .toLowerCase()
    .normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[°º]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "propiedad";
}

function slugUnico(txt, ignorarId) {
  const base = generarSlug(txt);
  let slug = base, n = 2;
  while (lista.some(p => p.slug === slug && p.id !== ignorarId)) {
    slug = base + "-" + (n++);
  }
  return slug;
}

function numeroONulo(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/* ============================================================
   Listado
   ============================================================ */

function pintarLista() {
  const filtro = ($("#buscar-admin").value || "").toLowerCase();
  const cont = $("#lista-admin");

  const visibles = lista.filter(p => !filtro ||
    ((p.titulo || "") + " " + (p.direccion || "") + " " + (p.slug || "")).toLowerCase().includes(filtro));

  if (!visibles.length) {
    cont.innerHTML = '<p class="muted" style="font-size:.86rem;padding:.5rem">Sin resultados.</p>';
    return;
  }

  cont.innerHTML = visibles.map(p => {
    const color = p.operacion === "venta" ? "var(--navy-800)" : "var(--turq-500)";
    const fotos = (p.imagenes || []).length;
    const notas = [];
    if (p.publicada === false) notas.push("oculta");
    if (!fotos) notas.push("sin fotos");

    return `<button type="button" class="admin-item${actual && actual.id === p.id ? " is-active" : ""}"
              data-id="${escapar(p.id)}" aria-label="Editar ${escapar(p.titulo)}">
        <span class="admin-item__dot" style="background:${color}"></span>
        <span class="admin-item__body">
          <span class="admin-item__title">${escapar(p.titulo || "(sin título)")}</span>
          <span class="admin-item__meta">${p.operacion === "venta" ? "Venta" : "Alquiler"} · ${escapar(p.tipo || "")} · ${fotos} foto${fotos === 1 ? "" : "s"}${notas.length ? " · " + notas.join(" · ") : ""}</span>
        </span>
      </button>`;
  }).join("");
}

/* ============================================================
   Formulario
   ============================================================ */

function poblarSelects() {
  $("#f-tipo").innerHTML = (window.TIPOS || [])
    .map(t => `<option value="${t.slug}">${t.label}</option>`).join("");
  $("#f-zona").innerHTML = (window.ZONAS || [])
    .map(z => `<option value="${z.slug}">${z.label}</option>`).join("");
}

function cargarFormulario(p) {
  actual = p;
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
  $("#f-publicada").checked = p.publicada !== false;
  $("#f-destacada").checked = !!p.destacada;
  $("#f-dormitorios").value = p.dormitorios ?? "";
  $("#f-banos").value = p.banos ?? "";
  $("#f-ambientes").value = p.ambientes ?? "";
  $("#f-cocheras").value = p.cocheras ?? "";
  $("#f-m2cub").value = p.m2Cubiertos ?? "";
  $("#f-m2ter").value = p.m2Terreno ?? "";
  $("#f-precio").value = p.precio ?? "";
  $("#f-moneda").value = p.moneda || "USD";
  $("#f-expensas").value = p.expensas ?? "";
  $("#f-descripcion").value = p.descripcion || "";
  $("#f-caracteristicas").value = (p.caracteristicas || []).join("\n");
  $("#f-mapa").value = p.mapaQuery || "";
  $("#btn-ver").href = "propiedad.html?id=" + encodeURIComponent(p.slug || "");

  pintarFotos();
  pintarLista();
  vistaPrevia();
  marcarSucio(false);
}

function leerFormulario() {
  const titulo = $("#f-titulo").value.trim();
  return {
    titulo,
    slug: slugUnico($("#f-slug").value.trim() || titulo, actual ? actual.id : null),
    direccion: $("#f-direccion").value.trim(),
    operacion: $("#f-operacion").value,
    tipo: $("#f-tipo").value,
    zona: $("#f-zona").value,
    estado: $("#f-estado").value,
    fecha: $("#f-fecha").value || new Date().toISOString().slice(0, 10),
    publicada: $("#f-publicada").checked,
    destacada: $("#f-destacada").checked,
    dormitorios: numeroONulo($("#f-dormitorios").value),
    banos: numeroONulo($("#f-banos").value),
    ambientes: numeroONulo($("#f-ambientes").value),
    cocheras: numeroONulo($("#f-cocheras").value),
    m2Cubiertos: numeroONulo($("#f-m2cub").value),
    m2Terreno: numeroONulo($("#f-m2ter").value),
    precio: numeroONulo($("#f-precio").value),
    moneda: $("#f-moneda").value,
    expensas: numeroONulo($("#f-expensas").value),
    descripcion: $("#f-descripcion").value.trim(),
    caracteristicas: $("#f-caracteristicas").value.split("\n").map(s => s.trim()).filter(Boolean),
    mapaQuery: $("#f-mapa").value.trim()
  };
}

function vistaPrevia() {
  if (!actual || typeof window.cardHTML !== "function") return;
  const d = leerFormulario();
  const imgs = actual.imagenes || [];
  $("#vista-previa").innerHTML = window.cardHTML({
    ...d,
    id: d.slug,
    titulo: d.titulo || "(sin título)",
    imagenes: imgs.map(i => i.url),
    miniaturas: imgs.map(i => i.urlChica || i.url)
  });
  $("#vista-previa").querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-visible"));
}

/* ============================================================
   Fotos
   ============================================================ */

function pintarFotos() {
  const imgs = (actual && actual.imagenes) || [];
  $("#fotos-vacio").classList.toggle("hide", imgs.length > 0);

  $("#fotos-grid").innerHTML = imgs.map((img, i) => `
    <figure class="foto-item" data-i="${i}">
      <img src="${escapar(img.urlChica || img.url)}" alt="" loading="lazy">
      ${i === 0 ? '<span class="foto-item__portada">Portada</span>' : ""}
      <div class="foto-item__acciones">
        <button type="button" class="foto-btn" data-mover="-1" title="Mover antes"${i === 0 ? " disabled" : ""}>&#8592;</button>
        <button type="button" class="foto-btn" data-mover="1" title="Mover después"${i === imgs.length - 1 ? " disabled" : ""}>&#8594;</button>
        <button type="button" class="foto-btn foto-btn--borrar" data-borrar title="Eliminar foto">&#10005;</button>
      </div>
    </figure>`).join("");
}

async function subirFotos(archivos) {
  if (!actual || !archivos || !archivos.length) return;

  const total = archivos.length;
  $("#subiendo").classList.remove("hide");
  $("#subiendo-progreso").style.width = "3%";

  const fallidas = [];
  let subidas = 0;

  for (let i = 0; i < total; i++) {
    const archivo = archivos[i];
    $("#subiendo-texto").textContent = `Achicando ${i + 1} de ${total}: ${archivo.name}`;

    const proc = await procesarFoto(archivo);
    if (!proc.ok) {
      fallidas.push({ nombre: archivo.name, error: proc.error });
      continue;
    }

    $("#subiendo-texto").textContent = `Subiendo ${i + 1} de ${total}...`;
    try {
      const base = nombreUnico(actual.slug || actual.titulo);
      const foto = await fb.subirFoto(base, proc.grande, proc.chica);
      actual.imagenes = (actual.imagenes || []).concat([foto]);
      subidas++;
    } catch (e) {
      fallidas.push({ nombre: archivo.name, error: traducirError(e) });
    }

    $("#subiendo-progreso").style.width = Math.round(((i + 1) / total) * 100) + "%";
    pintarFotos();
  }

  if (subidas) {
    try {
      await fb.actualizarPropiedad(actual.id, { imagenes: actual.imagenes });
      sincronizarEnLista();
      await republicar();
      toast(subidas + (subidas === 1 ? " foto subida y publicada" : " fotos subidas y publicadas"));
    } catch (e) {
      toast("Las fotos se subieron pero no se pudieron guardar: " + traducirError(e), "error");
    }
  }

  if (fallidas.length) {
    alert("Algunas fotos no se pudieron subir:\n\n" +
      fallidas.map(f => "• " + f.nombre + ": " + f.error).join("\n"));
  }

  $("#subiendo").classList.add("hide");
  $("#subiendo-progreso").style.width = "0%";
  $("#f-fotos").value = "";
  vistaPrevia();
}

/* ============================================================
   Acciones
   ============================================================ */

function seleccionar(id) {
  if (sucio && !confirm("Tenés cambios sin guardar en esta propiedad. Si seguís, se pierden. ¿Continuar?")) return;
  const p = lista.find(x => x.id === id);
  if (p) cargarFormulario(p);
}

/** Copia lo que está en `actual` de vuelta a la lista en memoria. */
function sincronizarEnLista() {
  const i = lista.findIndex(p => p.id === actual.id);
  if (i >= 0) lista[i] = actual; else lista.unshift(actual);
}

async function republicar() {
  const r = await fb.publicarCatalogo(lista);
  return r;
}

async function guardar() {
  if (!actual) return;
  const datos = leerFormulario();

  if (!datos.titulo) { toast("Poné un título antes de guardar.", "error"); $("#f-titulo").focus(); return; }
  if (!datos.direccion) { toast("Falta la dirección.", "error"); $("#f-direccion").focus(); return; }

  const btn = $("#btn-guardar");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    await fb.actualizarPropiedad(actual.id, datos);
    actual = { ...actual, ...datos };
    sincronizarEnLista();
    await republicar();
    cargarFormulario(actual);
    toast("Guardado y publicado en el sitio.");
  } catch (e) {
    toast(traducirError(e), "error");
  } finally {
    btn.disabled = false;
    marcarSucio(false);
  }
}

async function nueva() {
  if (sucio && !confirm("Tenés cambios sin guardar. Si seguís, se pierden. ¿Continuar?")) return;

  const base = {
    titulo: "Nueva propiedad",
    slug: slugUnico("nueva-propiedad"),
    direccion: "",
    operacion: "venta",
    tipo: "casa",
    zona: "centro",
    estado: "disponible",
    publicada: false,
    destacada: false,
    moneda: "USD",
    fecha: new Date().toISOString().slice(0, 10),
    caracteristicas: [],
    imagenes: [],
    orden: -1,
    dormitorios: null, banos: null, ambientes: null, cocheras: null,
    m2Cubiertos: null, m2Terreno: null, precio: null, expensas: null,
    descripcion: "", mapaQuery: ""
  };

  try {
    const id = await fb.crearPropiedad(base);
    actual = { id, ...base };
    lista.unshift(actual);
    await republicar();
    cargarFormulario(actual);
    toast("Propiedad creada. Está oculta hasta que la marques como publicada.");
    $("#f-titulo").focus();
    $("#f-titulo").select();
  } catch (e) {
    toast(traducirError(e), "error");
  }
}

async function eliminar() {
  if (!actual) return;
  if (!confirm(`¿Eliminar "${actual.titulo || "esta propiedad"}" definitivamente?\n\nSe borran también sus fotos. Esta acción no se puede deshacer.`)) return;

  try {
    await fb.borrarPropiedad(actual.id);
    lista = lista.filter(p => p.id !== actual.id);
    actual = null;
    await republicar();
    cargarFormulario(null);
    marcarSucio(false);
    toast("Propiedad eliminada.");
  } catch (e) {
    toast(traducirError(e), "error");
  }
}

function traducirError(e) {
  const c = (e && e.code) || "";
  if (c.includes("permission-denied") || c.includes("unauthorized")) {
    return "Firebase rechazó la operación por permisos. Revisá que las Security Rules estén publicadas.";
  }
  if (c.includes("unauthenticated")) return "Tu sesión venció. Volvé a entrar.";
  if (c.includes("retry-limit") || c.includes("unavailable")) return "Sin conexión con Firebase. Revisá internet e intentá de nuevo.";
  if (c.includes("quota")) return "Se superó la cuota del plan de Firebase.";
  return (e && e.message) || "No se pudo completar la operación.";
}

/* ============================================================
   Arranque
   ============================================================ */

if (!window.firebaseConfigurado()) {
  $("#cargando").innerHTML =
    '<div class="notice" style="max-width:640px;margin:0 auto;text-align:left">' +
    '<strong>Falta configurar Firebase.</strong><br>Completá <code>assets/js/firebase-config.js</code> ' +
    'con los datos de tu proyecto. Está explicado en el README.</div>';
} else {
  fb.alCambiarSesion(async (usuario) => {
    if (!usuario) { location.replace("login.html"); return; }

    $("#cuenta").textContent = usuario.email || "";

    try {
      lista = await fb.listarPropiedades();
    } catch (e) {
      $("#cargando").innerHTML =
        '<div class="notice" style="max-width:640px;margin:0 auto;text-align:left"><strong>No se pudo leer el catálogo.</strong><br>' +
        escapar(traducirError(e)) + "</div>";
      return;
    }

    $("#cargando").classList.add("hide");
    $("#app").classList.remove("hide");

    poblarSelects();
    pintarLista();
    marcarSucio(false);
    conectarEventos();
  });
}

function conectarEventos() {
  /* --- Selección tolerante ---
     El navegador dispara "click" sobre el ancestro común de donde se apretó
     y donde se soltó. Si la mano se mueve unos píxeles y el puntero cruza al
     espacio entre dos filas, ese ancestro pasa a ser la lista entera y el
     clic se perdería. Por eso recordamos sobre qué fila se apretó. */
  let filaPresionada = null;

  $("#lista-admin").addEventListener("pointerdown", ev => {
    filaPresionada = ev.target.closest(".admin-item");
  });

  $("#lista-admin").addEventListener("click", ev => {
    const btn = ev.target.closest(".admin-item") || filaPresionada;
    filaPresionada = null;
    if (btn && btn.dataset.id) seleccionar(btn.dataset.id);
  });

  $("#buscar-admin").addEventListener("input", pintarLista);
  $("#btn-nueva").addEventListener("click", nueva);
  $("#btn-eliminar").addEventListener("click", eliminar);

  $("#form-propiedad").addEventListener("submit", e => { e.preventDefault(); guardar(); });
  $("#form-propiedad").addEventListener("input", () => { marcarSucio(true); vistaPrevia(); });
  $("#form-propiedad").addEventListener("change", () => { marcarSucio(true); vistaPrevia(); });

  /* --- Fotos --- */
  $("#btn-elegir").addEventListener("click", () => $("#f-fotos").click());
  $("#f-fotos").addEventListener("change", function () { subirFotos(this.files); });

  const dz = $("#dropzone");
  ["dragenter", "dragover"].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("is-over"); }));
  dz.addEventListener("drop", e => {
    if (e.dataTransfer && e.dataTransfer.files) subirFotos(e.dataTransfer.files);
  });
  /* Que soltar una foto fuera de la zona no la abra en el navegador */
  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => e.preventDefault());

  $("#fotos-grid").addEventListener("click", async ev => {
    const fig = ev.target.closest(".foto-item");
    if (!fig || !actual) return;
    const i = Number(fig.dataset.i);
    const imgs = actual.imagenes || [];

    if (ev.target.closest("[data-borrar]")) {
      if (!confirm("¿Eliminar esta foto?")) return;
      const foto = imgs[i];
      try {
        actual.imagenes = imgs.filter((_, k) => k !== i);
        await fb.actualizarPropiedad(actual.id, { imagenes: actual.imagenes });
        await fb.borrarFoto(foto.ruta);
        sincronizarEnLista();
        await republicar();
        pintarFotos(); pintarLista(); vistaPrevia();
        toast("Foto eliminada.");
      } catch (e) { toast(traducirError(e), "error"); }
      return;
    }

    const mover = ev.target.closest("[data-mover]");
    if (mover) {
      const j = i + Number(mover.dataset.mover);
      if (j < 0 || j >= imgs.length) return;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      pintarFotos(); vistaPrevia();
      try {
        await fb.actualizarPropiedad(actual.id, { imagenes: imgs });
        sincronizarEnLista();
        await republicar();
      } catch (e) { toast(traducirError(e), "error"); }
    }
  });

  /* --- Salir --- */
  $("#btn-salir").addEventListener("click", async () => {
    if (sucio && !confirm("Tenés cambios sin guardar. ¿Salir igual?")) return;
    sucio = false;
    await fb.salir();
    location.replace("login.html");
  });

  /* --- Cambio de contraseña --- */
  const modal = $("#modal-clave");
  $("#btn-clave").addEventListener("click", () => { modal.hidden = false; $("#k-actual").focus(); });
  $("#k-cerrar").addEventListener("click", () => { modal.hidden = true; $("#k-estado").className = "form-status"; });
  modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });

  $("#k-guardar").addEventListener("click", async () => {
    const est = $("#k-estado");
    const nueva1 = $("#k-nueva").value, nueva2 = $("#k-nueva2").value;

    if (nueva1.length < 6) {
      est.className = "form-status is-error";
      est.textContent = "La contraseña nueva tiene que tener al menos 6 caracteres.";
      return;
    }
    if (nueva1 !== nueva2) {
      est.className = "form-status is-error";
      est.textContent = "Las dos contraseñas nuevas no coinciden.";
      return;
    }

    const r = await fb.cambiarClave($("#k-actual").value, nueva1);
    if (r.ok) {
      est.className = "form-status is-ok";
      est.textContent = "Contraseña actualizada.";
      $("#k-actual").value = $("#k-nueva").value = $("#k-nueva2").value = "";
      setTimeout(() => { modal.hidden = true; est.className = "form-status"; }, 1800);
    } else {
      est.className = "form-status is-error";
      est.textContent = r.error;
    }
  });

  window.addEventListener("beforeunload", e => {
    if (!sucio) return;
    e.preventDefault();
    e.returnValue = "";
  });
}
