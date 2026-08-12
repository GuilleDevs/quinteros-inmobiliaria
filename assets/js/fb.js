/* ============================================================
   CAPA DE ACCESO A FIREBASE
   ------------------------------------------------------------
   Todo lo que habla con Firebase pasa por acá: autenticación,
   base de datos (Firestore), fotos (Cloud Storage) y publicación
   del catálogo.

   El resto del panel no sabe que Firebase existe: le pide datos
   a este módulo. Si mañana hay que cambiar de proveedor, se
   reescribe este archivo y nada más.
   ============================================================ */

const V = window.FIREBASE_VERSION || "11.0.0";
const BASE = `https://www.gstatic.com/firebasejs/${V}`;

const { initializeApp } = await import(`${BASE}/firebase-app.js`);

const {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updatePassword, EmailAuthProvider,
  reauthenticateWithCredential, setPersistence, browserLocalPersistence
} = await import(`${BASE}/firebase-auth.js`);

const {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp, writeBatch
} = await import(`${BASE}/firebase-firestore.js`);

const {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadString
} = await import(`${BASE}/firebase-storage.js`);

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* Que la sesión sobreviva al cierre del navegador: la inmobiliaria
   no debería tener que loguearse cada vez que abre la computadora. */
try { await setPersistence(auth, browserLocalPersistence); } catch (e) { /* no crítico */ }

const COL = "propiedades";

/* ============================================================
   AUTENTICACIÓN
   ============================================================ */

export function alCambiarSesion(fn) {
  return onAuthStateChanged(auth, fn);
}

export function usuarioActual() {
  return auth.currentUser;
}

export async function entrar(email, clave) {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), clave);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeAuth(e) };
  }
}

export async function salir() {
  await signOut(auth);
}

export async function recuperarClave(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeAuth(e) };
  }
}

export async function cambiarClave(actual, nueva) {
  const u = auth.currentUser;
  if (!u) return { ok: false, error: "No hay una sesión abierta." };
  try {
    /* Firebase exige haberse autenticado hace poco para cambiar la
       contraseña. Reautenticamos con la actual antes de cambiarla. */
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, actual));
    await updatePassword(u, nueva);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeAuth(e) };
  }
}

/** Traduce los códigos de Firebase a algo que se entienda. */
function mensajeAuth(e) {
  const c = (e && e.code) || "";
  const mapa = {
    "auth/invalid-email": "El email no tiene un formato válido.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/user-not-found": "Usuario o contraseña incorrectos.",
    "auth/wrong-password": "Usuario o contraseña incorrectos.",
    "auth/invalid-credential": "Usuario o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos fallidos. Esperá unos minutos.",
    "auth/network-request-failed": "Sin conexión con Firebase. Revisá internet.",
    "auth/weak-password": "La contraseña nueva es demasiado débil. Usá al menos 6 caracteres.",
    "auth/requires-recent-login": "Por seguridad, volvé a entrar y cambiá la contraseña de nuevo.",
    "auth/missing-password": "Escribí la contraseña."
  };
  return mapa[c] || ("No se pudo completar la operación." + (c ? " (" + c + ")" : ""));
}

/* ============================================================
   PROPIEDADES
   ============================================================ */

export async function listarPropiedades() {
  const snap = await getDocs(query(collection(db, COL), orderBy("orden", "asc")));
  const lista = [];
  snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
  /* Desempate por fecha, de más nueva a más vieja. */
  lista.sort((a, b) =>
    (a.orden ?? 0) - (b.orden ?? 0) || String(b.fecha || "").localeCompare(String(a.fecha || ""))
  );
  return lista;
}

export async function obtenerPropiedad(id) {
  const d = await getDoc(doc(db, COL, id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function crearPropiedad(datos) {
  const ref_ = await addDoc(collection(db, COL), {
    ...datos,
    creada: serverTimestamp(),
    actualizada: serverTimestamp()
  });
  return ref_.id;
}

export async function actualizarPropiedad(id, datos) {
  await updateDoc(doc(db, COL, id), { ...datos, actualizada: serverTimestamp() });
}

export async function borrarPropiedad(id) {
  const p = await obtenerPropiedad(id);
  if (p && Array.isArray(p.imagenes)) {
    /* Las fotos no se borran solas: hay que sacarlas de Storage. */
    for (const img of p.imagenes) {
      await borrarFoto(img.ruta).catch(() => {});
    }
  }
  await deleteDoc(doc(db, COL, id));
}

/** Guarda el orden de toda la lista de una sola vez. */
export async function guardarOrden(ids) {
  const lote = writeBatch(db);
  ids.forEach((id, i) => lote.update(doc(db, COL, id), { orden: i }));
  await lote.commit();
}

/* ============================================================
   FOTOS
   ============================================================ */

/**
 * Sube las dos versiones ya redimensionadas de una foto.
 * @param {string} base  nombre base, sin extensión
 * @param {Blob} grande  1600 px
 * @param {Blob} chica   640 px
 */
export async function subirFoto(base, grande, chica) {
  const rutaG = `propiedades/${base}-m.jpg`;
  const rutaC = `propiedades/${base}-s.jpg`;

  const meta = { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" };

  const [snapG, snapC] = await Promise.all([
    uploadBytes(ref(storage, rutaG), grande, meta),
    uploadBytes(ref(storage, rutaC), chica, meta)
  ]);

  const [url, urlChica] = await Promise.all([
    getDownloadURL(snapG.ref),
    getDownloadURL(snapC.ref)
  ]);

  return { ruta: base, url, urlChica };
}

export async function borrarFoto(base) {
  if (!base) return;
  await Promise.all([
    deleteObject(ref(storage, `propiedades/${base}-m.jpg`)).catch(() => {}),
    deleteObject(ref(storage, `propiedades/${base}-s.jpg`)).catch(() => {})
  ]);
}

/* ============================================================
   PUBLICACIÓN DEL CATÁLOGO
   ------------------------------------------------------------
   El sitio público no consulta Firestore: lee un único archivo
   JSON. Es más rápido para el visitante, no gasta lecturas de
   la base y hace que el sitio siga en pie aunque Firestore falle.
   Este archivo se regenera cada vez que el panel guarda algo.
   ============================================================ */

export async function publicarCatalogo(lista) {
  const salida = lista.map(p => ({
    id: p.slug,
    titulo: p.titulo || "",
    operacion: p.operacion || "venta",
    tipo: p.tipo || "casa",
    estado: p.estado || "disponible",
    destacada: !!p.destacada,
    publicada: p.publicada !== false,
    direccion: p.direccion || "",
    zona: p.zona || "centro",
    dormitorios: numeroONulo(p.dormitorios),
    banos: numeroONulo(p.banos),
    ambientes: numeroONulo(p.ambientes),
    cocheras: numeroONulo(p.cocheras),
    m2Cubiertos: numeroONulo(p.m2Cubiertos),
    m2Terreno: numeroONulo(p.m2Terreno),
    precio: numeroONulo(p.precio),
    moneda: p.moneda || "USD",
    expensas: numeroONulo(p.expensas),
    descripcion: p.descripcion || "",
    caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas : [],
    imagenes: (p.imagenes || []).map(i => i.url),
    miniaturas: (p.imagenes || []).map(i => i.urlChica || i.url),
    mapaQuery: p.mapaQuery || "",
    fecha: p.fecha || ""
  }));

  await uploadString(
    ref(storage, window.CATALOGO_RUTA),
    JSON.stringify(salida),
    "raw",
    { contentType: "application/json; charset=utf-8", cacheControl: "public, max-age=60" }
  );

  return { total: salida.length, publicadas: salida.filter(p => p.publicada).length };
}

function numeroONulo(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export { auth, db, storage };
