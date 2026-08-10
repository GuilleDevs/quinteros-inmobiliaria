# Quinteros Grupo Inmobiliario — sitio web

Sitio con **panel de carga propio**: la inmobiliaria entra, sube las fotos desde su computadora,
toca Guardar y el sitio se actualiza solo. Sin FTP, sin archivos, sin depender de nadie.

Pensado para **hosting compartido de Hostinger** (PHP 8 + MySQL, incluidos en el plan).
No usa Node, npm, ni ningún paso de compilación.

---

## Cómo funciona por dentro

```
        Panel (admin.php)                    Sitio público
                │                                  ▲
                │ guarda                           │ lee
                ▼                                  │
         MySQL  ──────► genera ──────► data/propiedades.js
    (fuente de verdad)   automático     (archivo estático)
```

La base de datos manda. Cada vez que se guarda algo, el servidor **regenera solo** el archivo
`data/propiedades.js`, que es lo único que consume el sitio público.

La ventaja: el visitante nunca toca la base. Ve un sitio estático, instantáneo, y si la base
llegara a caerse el sitio sigue funcionando igual con el último catálogo publicado.

---

## Puesta en marcha (una sola vez)

### 1. Crear la base de datos

En el panel de Hostinger → **Bases de datos → Administración de bases de datos MySQL**.
Crear una base y un usuario. Hostinger muestra cuatro datos: host, nombre de base, usuario y contraseña.

### 2. Completar `lib/config.php`

```php
const DB_HOST    = 'localhost';
const DB_NOMBRE  = 'uXXXXXXXX_quinteros';   // ← el que dio Hostinger
const DB_USUARIO = 'uXXXXXXXX_quinteros';   // ←
const DB_CLAVE   = 'la-clave-de-la-base';   // ←
```

Es el **único archivo** que hay que tocar.

### 3. Subir todo por FTP o por el administrador de archivos

Todo el contenido de la carpeta va a `public_html`.

### 4. Permisos de escritura

Estas dos rutas tienen que ser escribibles por PHP (permisos **755**):

- `assets/img/propiedades/` — donde se guardan las fotos
- `data/` — donde se escribe el catálogo

En Hostinger normalmente ya vienen así. Si al subir una foto aparece un error de permisos,
se corrige con clic derecho sobre la carpeta → Permisos.

### 5. Abrir `tudominio.com/instalar.php`

Crea las tablas, **importa las 33 propiedades** que ya venían cargadas y pide la contraseña
del panel.

### 6. Borrar `instalar.php`

**Este paso no es opcional.** Mientras el archivo siga en el servidor es una puerta abierta.
El instalador se autobloquea después de la primera corrida, pero igual hay que borrarlo.

### 7. Activar SSL y forzar HTTPS

Con el certificado ya activo en Hostinger, descomentar el bloque `RewriteEngine` del final
de `.htaccess`. **Recién después de activar el SSL**, si no el sitio queda inaccesible.

---

## El día a día: cómo carga propiedades la inmobiliaria

1. Entrar a `tudominio.com/admin.php` y poner la contraseña.
2. **+ Nueva propiedad** (nace oculta, para poder trabajarla tranquilo).
3. Arrastrar las fotos a la zona punteada, o elegirlas desde la computadora.
4. Completar los datos.
5. Marcar **Publicada** y tocar **Guardar cambios**.

Listo. La propiedad ya está en el sitio.

### Sobre las fotos

Se pueden sacar con el celular y subir tal cual. El servidor, solo:

- verifica que sea realmente una imagen,
- la endereza si venía rotada (las fotos de celular traen una marca de orientación),
- genera dos versiones: **1600 px** para la ficha y **640 px** para las tarjetas del catálogo,
- las comprime a ~200 KB.

Una foto de 6 MB del celular termina pesando 200 KB sin que nadie haga nada.

La **primera foto es la portada**: es la que se ve en el catálogo. Se cambia el orden con las
flechas ← → que aparecen al pasar el mouse por encima.

> **Una excepción:** las fotos en formato **HEIC** (iPhone con ajustes por defecto) no se pueden
> procesar. Se arregla una vez en el teléfono: *Ajustes → Cámara → Formatos → "Más compatible"*.
> A partir de ahí el iPhone saca las fotos en JPG. El panel avisa con ese mismo mensaje si
> alguien sube una HEIC.

### Detalles útiles

- **Publicada** desmarcado → desaparece del sitio pero no se pierde.
- **Destacada** → aparece en la portada.
- **Precio vacío** → se publica como “Consultar”.
- La **dirección web** es lo que va en el link de la propiedad. Si se cambia, los enlaces que ya
  se compartieron por WhatsApp dejan de funcionar.
- **Eliminar** borra también las fotos del servidor. No se puede deshacer.

---

## Todavía falta: teléfono y WhatsApp reales

En `assets/js/config.js` hay valores de ejemplo que hay que reemplazar:

```js
whatsapp: "5492302000000",          // ← número real, solo dígitos
whatsappVisible: "+54 9 2302 00-0000",
telefono: "+54 2302 00-0000",
telefonoLink: "+542302000000",
email: "info@quinterosinmobiliaria.com.ar",
```

Formato de `whatsapp`: código de país + **9** + característica sin el 0 + número sin el 15.
General Pico es 2302 → si el número es `2302 15-123456`, va `5492302123456`.

Con eso quedan actualizados de una vez el botón flotante, el del header, el de cada propiedad,
los del footer y el formulario de contacto.

También conviene reemplazar `https://www.quinterosinmobiliaria.com.ar` por el dominio real en
`sitemap.xml`, `robots.txt` y las etiquetas `canonical` / `og:url` de cada página.

### Fotos del sitio (no de las propiedades)

Dos imágenes siguen siendo placeholder de marca, porque no tengo los archivos:

- **Hero de la portada** → en `index.html`, buscar `<!-- Para usar una foto real ... -->`
- **Foto del equipo** → en `index.html` y `nosotros.html`, buscar `Reemplazar por la foto del equipo`

Sirve la del destacado "Quiénes somos" de Instagram.

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

── Panel (PHP) ───────────────────────────────────────
admin.php             El panel de carga
login.php · logout.php
instalar.php          Se corre una vez y se borra
api/                  Endpoints que usa el panel
  guardar.php · eliminar.php · obtener.php
  subir-imagen.php · imagenes.php · cambiar-clave.php
lib/
  config.php          ← EL ÚNICO ARCHIVO A EDITAR (datos de la base)
  db.php              Conexión
  auth.php            Sesión, login, CSRF
  imagen.php          Validación, rotación, redimensionado
  catalogo.php        Lectura/escritura + generación del archivo público

── Datos ─────────────────────────────────────────────
data/propiedades.js       GENERADO. No editar a mano: se pisa al guardar.
assets/img/propiedades/   Fotos subidas desde el panel
assets/js/config.js       Teléfonos, horarios, redes, tipologías y zonas
assets/css/styles.css     Todo el diseño, un solo archivo
```

---

## Seguridad

Lo que está implementado:

- Contraseña guardada como **hash bcrypt**, nunca en texto plano.
- **Token CSRF** en toda operación que modifica datos.
- Sesión con cookie `HttpOnly` + `SameSite=Lax`, y cierre por inactividad a las 4 horas.
- Freno tras 8 intentos fallidos de login, más una demora en cada intento.
- **Subida de fotos:** se valida que el archivo sea realmente una imagen, se re-codifica entera
  y se le asigna un nombre generado por el servidor. Re-codificarla destruye cualquier contenido
  escondido dentro del archivo, así que un archivo malicioso disfrazado de imagen no sobrevive.
- `.htaccess` en la carpeta de fotos que impide ejecutar cualquier cosa que no sea una imagen.
- `.htaccess` en `lib/` que bloquea el acceso web a las credenciales.
- Consultas siempre con sentencias preparadas (sin concatenar datos en el SQL).
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

Limitaciones que conviene conocer:

- El freno de login es **por sesión**, no por IP. Frena el caso normal, no a alguien decidido con
  herramientas. Si en algún momento preocupa, la solución sencilla es agregar una protección con
  contraseña a nivel de directorio desde el panel de Hostinger.
- Es **una sola contraseña compartida** para la oficina: no queda registro de quién hizo qué.
  Pasar a usuarios individuales es un cambio acotado si más adelante hace falta.

### Si se pierde la contraseña

No se puede recuperar, pero sí reponer. En **phpMyAdmin** (panel de Hostinger), sobre la base
del sitio, ejecutar en la pestaña SQL:

```sql
DELETE FROM ajustes WHERE clave = 'password_hash';
```

Después volver a subir `instalar.php` y abrirlo: como ya no hay contraseña, deja definir una
nueva. Las propiedades y las fotos no se tocan. Al terminar, **borrar `instalar.php` otra vez**.

---

## SEO

Ya implementado: títulos y descripciones únicos por página orientados a búsqueda local, páginas
separadas por operación y tipología, datos estructurados `RealEstateAgent` en la portada y por
propiedad en cada ficha, `sitemap.xml`, `robots.txt` (que bloquea el panel), canonicals,
Open Graph, `lang="es-AR"`, imágenes con `loading="lazy"` y compresión activada por `.htaccess`.

Lo que falta hacer del lado del cliente, que es lo que más mueve la aguja en SEO local:

1. Crear o reclamar el **perfil de Google Business Profile** con la dirección de Calle 15 N° 1124,
   el horario y fotos. Es lo que hace aparecer en el mapa.
2. Dar de alta el sitio en **Google Search Console** y enviar el `sitemap.xml`.
3. Poner el link de la web en la bio de Instagram (hoy está el `wa.link`).
4. Cargar fotos reales: sin contenido visual propio, Google no prioriza.

---

## Requisitos técnicos

- **PHP 8.0 o superior** con las extensiones **PDO MySQL**, **GD** y **EXIF**.
  En Hostinger vienen activadas por defecto; se verifica en *Avanzado → Configuración de PHP*.
- **MySQL 5.7+ / MariaDB 10.3+**
- Navegadores actuales (Chrome, Edge, Firefox, Safari). Diseño responsive, probado a 375 px y en escritorio.

---

## Estado de las pruebas

Lo verificado en el navegador: el sitio público completo (catálogo, filtros, buscador, fichas,
formularios, responsive), y el panel a nivel maquetado y comportamiento del front-end contra
datos de prueba.

**Lo que no pude probar acá:** el código PHP, porque esta máquina no tiene PHP ni MySQL
instalados. Está revisado a mano y con verificación de balanceo de bloques, pero la primera
corrida real es `instalar.php` en el hosting. Si algo falla ahí, poner en `lib/config.php`:

```php
const MODO_DEBUG = true;
```

y el error aparece en pantalla en vez de quedar solo en el log. **Volver a `false` después.**
