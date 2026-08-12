# Quinteros Grupo Inmobiliario — sitio web

Sitio con **panel de carga propio**: la inmobiliaria entra, sube las fotos desde su
computadora, toca Guardar y el sitio se actualiza solo.

Backend en **Firebase** (Firestore + Auth + Cloud Storage). Sin servidor propio, sin PHP,
sin paso de compilación: son archivos estáticos y el SDK de Firebase se carga desde el CDN
de Google.

**Demo:** https://guilledevs.github.io/quinteros-inmobiliaria/

> La demo muestra el catálogo semilla incluido en el repositorio. El panel necesita un
> proyecto de Firebase configurado.

---

## Cómo funciona por dentro

```
     Panel (admin.html)                      Sitio público
            │                                      ▲
            │ guarda                               │ una sola petición
            ▼                                      │
      Firestore  ──── publica ────►  catalogo/propiedades.json
   (fuente de verdad)                  (en Cloud Storage)
```

El sitio público **no consulta Firestore**. Lee un único archivo JSON que el panel
republica cada vez que se guarda algo.

Eso trae tres ventajas concretas: una sola petición en vez de treinta y tres, no se carga
el SDK de Firebase en páginas que no lo necesitan, y no se gastan lecturas de la base con
cada visita. Además, si Firestore tuviera un problema, el sitio sigue en pie.

Y si ese archivo no está disponible, el sitio usa el catálogo incluido en
`data/propiedades.js`, así que nunca aparece vacío.

---

## Puesta en marcha

### 1. Crear el proyecto

En https://console.firebase.google.com → **Agregar proyecto**. Podés desactivar Google
Analytics, no hace falta.

### 2. Pasar al plan Blaze

Abajo a la izquierda, **Actualizar** → **Blaze**. Requiere tarjeta de crédito.

Es obligatorio: **Cloud Storage no funciona en el plan gratuito Spark**. La franja gratuita
de Blaze es amplia y para una inmobiliaria la factura debería ser cero o centavos, pero
**no hay tope de gasto duro**. Configurá una alerta de presupuesto en
*Facturación → Presupuestos y alertas* apenas puedas.

### 3. Registrar la app web y copiar las claves

**Configuración del proyecto** (el engranaje) → **Tus apps** → icono `</>` → registrás la
app. Firebase muestra un bloque `firebaseConfig`. Copiá esos valores a
`assets/js/firebase-config.js`.

Esas claves **no son secretas**: viajan al navegador de cualquier visitante, Google las
considera públicas y está bien que estén en el repositorio. Lo que protege los datos son
las reglas del punto 6.

### 4. Activar Authentication y crear la cuenta

**Authentication** → **Comenzar** → pestaña *Sign-in method* → habilitar
**Correo electrónico/contraseña**.

Después, pestaña *Users* → **Agregar usuario**:

- Email: `admin@inmobiliariaquinteros.com`
- Contraseña: la que elijas

Esa es la cuenta con la que entra la inmobiliaria. No se crean cuentas desde el sitio: si
alguna vez hace falta otra persona, se agrega desde acá.

### 5. Crear la base y el bucket

- **Firestore Database** → *Crear base de datos* → **modo de producción** → región
  `southamerica-east1` (São Paulo, la más cercana).
- **Storage** → *Comenzar* → misma región.

### 6. Publicar las reglas de seguridad

Este paso **no es opcional**: sin él, cualquiera podría escribir en la base.

En la consola, **Firestore Database → Reglas**: pegá el contenido de `firestore.rules` y
publicá. En **Storage → Reglas**: pegá `storage.rules` y publicá.

### 7. Configurar CORS en el bucket ← fácil de olvidar

**Sin este paso el sitio nunca muestra las propiedades nuevas.** El navegador exige permiso
CORS para que el JavaScript de un dominio pueda leer datos de otro, y los buckets de Firebase
vienen sin CORS configurado. Como el catálogo vive en `firebasestorage.googleapis.com` y el
sitio en otro dominio, el navegador descarga la respuesta pero se niega a entregársela al
código.

Lo desagradable es que **falla en silencio**: el sitio sigue mostrando el catálogo incluido en
`data/propiedades.js` y todo parece normal, salvo que los cambios nunca aparecen.

No se puede hacer desde la consola web: es por línea de comandos. La forma más simple, sin
instalar nada, es **Cloud Shell** (el ícono `>_` arriba a la derecha en Google Cloud), que ya
viene autenticado. Ahí se sube o se pega el contenido de `cors.json` y se aplica con:

    gcloud storage buckets update gs://TU-BUCKET.firebasestorage.app --cors-file=cors.json

Para confirmar que quedó:

    gcloud storage buckets describe gs://TU-BUCKET.firebasestorage.app --format="default(cors_config)"

`origin: ["*"]` no abre ningún agujero: el catálogo y las fotos ya son de lectura pública, y
CORS **no otorga permisos** — solo autoriza al navegador a mostrar lo que de todos modos podía
descargar. Quién puede escribir lo siguen decidiendo las Security Rules.

### 8. Publicar el sitio


Dos caminos, elegí uno:

**a) Seguir en GitHub Pages** (ya está andando, no requiere instalar nada)

Solo hay que autorizar el dominio en Firebase: **Authentication → Settings → Dominios
autorizados** → agregar `guilledevs.github.io`.

**b) Firebase Hosting** (dominio propio, CDN de Google)

Requiere Node.js instalado:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy
```

El archivo `firebase.json` ya está configurado con cabeceras de caché y seguridad.

### 9. Importar el catálogo inicial

Entrá a `/login.html`, iniciá sesión, y después abrí **`/migrar.html`**. Copia las 33
propiedades a Firestore y publica el catálogo. Si Firestore ya tiene datos, no hace nada.

### 10. Borrar `migrar.html`

Ya cumplió su función y no conviene dejarla accesible.

---

## El día a día

1. Entrar a `/admin.html` (o por el enlace **Panel de carga** del pie del sitio).
2. **+ Nueva propiedad** — nace oculta, para poder trabajarla tranquilo.
3. Arrastrar las fotos, o elegirlas desde la computadora.
4. Completar los datos.
5. Marcar **Publicada** y tocar **Guardar cambios**.

Listo, ya está en el sitio.

### Sobre las fotos

Se pueden sacar con el celular y subir tal cual. **El navegador las procesa antes de
subirlas**: las endereza si venían rotadas, genera una versión de 1600 px para la ficha y
otra de 640 px para las tarjetas, y las comprime. Una foto de 6 MB termina subiendo unos
200 KB.

Hacerlo en el navegador y no en el servidor es a propósito: la subida es mucho más rápida
y no se gasta cuota de Firebase moviendo megas al pedo.

La **primera foto es la portada**. El orden se cambia con las flechas ← → que aparecen al
pasar el mouse por encima.

> **Fotos HEIC (iPhone):** no se pueden procesar. Se arregla una vez en el teléfono:
> *Ajustes → Cámara → Formatos → "Más compatible"*. El panel avisa con ese mismo mensaje
> si alguien sube una.

### Detalles útiles

- **Publicada** desmarcado → desaparece del sitio pero no se pierde.
- **Destacada** → aparece en la portada.
- **Precio vacío** → se publica como “Consultar”.
- La **dirección web** es lo que va en el link de la propiedad. Si se cambia, los enlaces
  que ya se compartieron por WhatsApp dejan de funcionar.
- **Eliminar** borra también las fotos de Storage. No se puede deshacer.
- **¿Olvidaste la contraseña?** En la pantalla de login hay un enlace que manda un email
  para restablecerla. Ya no hace falta tocar la base.

---

## Todavía falta: teléfono y WhatsApp reales

En `assets/js/config.js` hay valores de ejemplo:

```js
whatsapp: "5492302000000",          // ← número real, solo dígitos
whatsappVisible: "+54 9 2302 00-0000",
telefono: "+54 2302 00-0000",
telefonoLink: "+542302000000",
email: "info@quinterosinmobiliaria.com.ar",
```

Formato de `whatsapp`: código de país + **9** + característica sin el 0 + número sin el 15.
General Pico es 2302 → si el número es `2302 15-123456`, va `5492302123456`.

También conviene reemplazar `https://www.quinterosinmobiliaria.com.ar` por el dominio real
en `sitemap.xml`, `robots.txt` y los `canonical` / `og:url` de cada página.

### Fotos del sitio (no de las propiedades)

Dos imágenes siguen siendo placeholder de marca:

- **Hero de la portada** → en `index.html`, buscar `<!-- Para usar una foto real ... -->`
- **Foto del equipo** → en `index.html` y `nosotros.html`, buscar `Reemplazar por la foto del equipo`

---

## Estructura

```
── Sitio público (estático) ──────────────────────────
index.html            Portada: hero, buscador, destacadas, servicios, zonas, contacto
comprar.html          Catálogo de venta       (SEO: "casas en venta General Pico")
alquilar.html         Catálogo de alquiler    (SEO: "alquileres General Pico")
terrenos.html         Catálogo de terrenos    (SEO: "terrenos General Pico")
propiedades.html      Catálogo completo con todos los filtros
propiedad.html        Ficha de una propiedad (?id=...)
nosotros.html · servicios.html · tasaciones.html · contacto.html · 404.html

── Panel ─────────────────────────────────────────────
login.html            Acceso, con recuperación de contraseña por email
admin.html            El panel de carga
migrar.html           Carga inicial. Se corre una vez y se borra.

── Código ────────────────────────────────────────────
assets/js/
  firebase-config.js  ← EL ÚNICO ARCHIVO A COMPLETAR (claves del proyecto)
  fb.js               Toda la conversación con Firebase. Si algún día hay que
                      cambiar de proveedor, se reescribe esto y nada más.
  imagen-cliente.js   Rotación, redimensionado y compresión en el navegador
  admin-panel.js      La lógica del panel
  catalogo-datos.js   Carga del catálogo en el sitio público, con respaldo
  config.js           Teléfonos, horarios, redes, tipologías y zonas
  app.js              Header, menú, formularios, WhatsApp, animaciones
  catalogo.js         Grilla, filtros y buscador
  propiedad.js        Ficha, galería, lightbox, mapa
assets/css/styles.css Todo el diseño, un solo archivo

── Firebase ──────────────────────────────────────────
firestore.rules       Quién puede leer y escribir la base
storage.rules         Quién puede subir y leer las fotos
firebase.json         Hosting: caché y cabeceras de seguridad
.firebaserc           Id del proyecto

── Datos ─────────────────────────────────────────────
data/propiedades.js   Catálogo semilla: respaldo del sitio y fuente de migrar.html
```

---

## Seguridad

- **Autenticación** gestionada por Firebase: contraseñas hasheadas del lado de Google,
  bloqueo automático por intentos repetidos y recuperación por email.
- **Security Rules**: la base y el bucket son privados para escritura. Solo una sesión
  autenticada puede modificar propiedades o subir fotos. El catálogo publicado y las fotos
  son de lectura libre, porque tienen que verse en el sitio.
- **Límite de subida**: Storage rechaza cualquier archivo que no sea imagen o que supere
  los 3 MB.
- Las claves de `firebase-config.js` son públicas por diseño; la seguridad está en las
  reglas, no en esconderlas.

Conviene saber: es **una sola cuenta compartida** por la oficina, así que no queda registro
de quién hizo qué. Pasar a cuentas individuales es agregar usuarios en la consola de
Authentication, sin tocar código.

---

## Costos

Con el plan Blaze y el volumen de una inmobiliaria local, esto entra cómodo en la franja
gratuita:

| | Gratis por mes | Uso esperado |
|---|---|---|
| Firestore lecturas | 50.000 por día | El sitio público no lee la base |
| Firestore escrituras | 20.000 por día | Unas pocas por semana |
| Storage almacenado | 5 GB | ~200 KB por foto |
| Storage descargas | 1 GB por día | Las fotos del catálogo |
| Hosting | 10 GB | El sitio pesa menos de 1 MB |

Los números pueden cambiar: verificá las condiciones vigentes al contratar. Y configurá la
alerta de presupuesto.

---

## Volver a la versión PHP

Existe una versión anterior completa con backend PHP + MySQL, pensada para hosting
compartido tipo Hostinger, probada de punta a punta. Está en la etiqueta **`v1-php`**:

```bash
git checkout v1-php
```

---

## Estado de las pruebas

Verificado en el navegador sobre esta versión:

- Sitio público completo: catálogo, filtros, buscador con parámetros en la URL, fichas,
  formularios y responsive.
- La carga asíncrona del catálogo y su respaldo cuando el publicado no está disponible.
- `login.html`, `admin.html` y `migrar.html` cargan sin errores y avisan de forma clara
  cuando falta configurar Firebase.

**Lo que no pude probar:** el camino contra Firebase real (login, guardado, subida de
fotos, publicación del catálogo), porque el proyecto todavía no existe. La lógica está
escrita y revisada, pero la primera corrida real va a ser la tuya. Si algo falla, la
consola del navegador (F12) va a mostrar el error de Firebase, que suele ser explícito.

La versión PHP sí quedó probada de punta a punta, y está en la etiqueta `v1-php`.
