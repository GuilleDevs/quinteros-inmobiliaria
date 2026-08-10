<?php
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/catalogo.php';

exigir_login();

$propiedades = listar_propiedades();
$csrf = token_csrf();
$totalPublicadas = count(array_filter($propiedades, fn($p) => $p['publicada']));
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="csrf-token" content="<?= e($csrf) ?>">
<title>Panel de carga de propiedades | Quinteros</title>
<link rel="icon" href="assets/img/favicon.png" type="image/png">
<meta name="theme-color" content="#0A2540">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body class="admin">

<div class="admin__bar">
  <div class="wrap">
    <img class="brand__mark" src="assets/img/logo-quinteros-claro.png" width="183" height="200" alt="" aria-hidden="true">
    <h1>Panel de carga de propiedades</h1>
    <span id="estado-cambios" style="font-size:.8rem;color:#9FC0D6"></span>
    <a class="btn btn--ghost-light btn--sm" href="index.html" target="_blank" rel="noopener">Ver el sitio</a>
    <button class="btn btn--ghost-light btn--sm" type="button" id="btn-clave">Contraseña</button>
    <a class="btn btn--ghost-light btn--sm" href="logout.php">Salir</a>
  </div>
</div>

<div class="wrap admin__layout">

  <!-- ============ COLUMNA IZQUIERDA ============ -->
  <div class="stack" style="--stack:1rem">

    <div class="panel">
      <div class="toolbar" style="margin-bottom:1rem">
        <button class="btn btn--turq btn--sm" id="btn-nueva" type="button">+ Nueva propiedad</button>
      </div>
      <div class="field" style="margin-bottom:.85rem">
        <input class="input" id="buscar-admin" type="search" placeholder="Buscar en el catálogo...">
      </div>
      <div class="admin-list" id="lista-admin"></div>
    </div>

    <div class="panel">
      <p class="panel__title">Cómo funciona</p>
      <ol class="svc__steps" style="font-size:.85rem">
        <li>Cargá o editá la propiedad y subí las fotos.</li>
        <li>Tocá <strong>Guardar cambios</strong>.</li>
        <li>Listo: el sitio ya muestra la propiedad. No hay que subir ningún archivo.</li>
      </ol>
    </div>

    <div class="panel">
      <p class="panel__title">Vista previa</p>
      <div id="vista-previa"></div>
      <p class="field__hint mt-2">Así se ve la tarjeta en el catálogo del sitio.</p>
    </div>
  </div>

  <!-- ============ COLUMNA DERECHA ============ -->
  <div class="panel">
    <div id="form-vacio">
      <div class="empty-state" style="border:0;background:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>
        <h3>Elegí una propiedad de la lista</h3>
        <p class="muted mt-1">O creá una nueva con el botón “+ Nueva propiedad”.</p>
      </div>
    </div>

    <form id="form-propiedad" class="hide" autocomplete="off">
      <input type="hidden" id="f-id">

      <!-- ---------- FOTOS ---------- -->
      <fieldset class="admin-fieldset">
        <legend>Fotos</legend>

        <div class="dropzone" id="dropzone">
          <input type="file" id="f-fotos" accept="image/jpeg,image/png,image/webp" multiple hidden>
          <svg class="dropzone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 16V4"/><path d="M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>
          </svg>
          <p class="dropzone__titulo">Arrastrá las fotos acá</p>
          <p class="dropzone__sub">o <button type="button" class="dropzone__boton" id="btn-elegir">elegilas desde tu computadora</button></p>
          <p class="dropzone__hint">JPG, PNG o WEBP. Se achican solas, no hace falta prepararlas. La primera foto es la portada.</p>
        </div>

        <div class="subiendo hide" id="subiendo">
          <div class="subiendo__barra"><span id="subiendo-progreso"></span></div>
          <p class="subiendo__texto" id="subiendo-texto">Subiendo fotos...</p>
        </div>

        <div class="fotos-grid" id="fotos-grid"></div>
        <p class="field__hint" id="fotos-vacio">Todavía no hay fotos. Mientras tanto, el sitio muestra un placeholder con los colores de la marca.</p>
      </fieldset>

      <!-- ---------- DATOS ---------- -->
      <fieldset class="admin-fieldset">
        <legend>Datos principales</legend>
        <div class="admin-grid">
          <div class="field field--full">
            <label class="field__label" for="f-titulo">Título público *</label>
            <input class="input" id="f-titulo" type="text" placeholder="Ej.: Casa en Calle 22 Norte N° 375">
          </div>
          <div class="field field--full">
            <label class="field__label" for="f-direccion">Dirección *</label>
            <input class="input" id="f-direccion" type="text" placeholder="Ej.: Calle 22 Norte N° 375">
          </div>
          <div class="field">
            <label class="field__label" for="f-operacion">Operación</label>
            <select class="select" id="f-operacion">
              <option value="venta">En venta</option>
              <option value="alquiler">En alquiler</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="f-tipo">Tipo de propiedad</label>
            <select class="select" id="f-tipo"></select>
          </div>
          <div class="field">
            <label class="field__label" for="f-zona">Barrio o zona</label>
            <select class="select" id="f-zona"></select>
          </div>
          <div class="field">
            <label class="field__label" for="f-estado">Estado</label>
            <select class="select" id="f-estado">
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="no-disponible">No disponible</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="f-fecha">Fecha de publicación</label>
            <input class="input" id="f-fecha" type="date">
            <span class="field__hint">Ordena el catálogo: las más nuevas primero.</span>
          </div>
          <div class="field">
            <label class="field__label" for="f-slug">Dirección web</label>
            <input class="input" id="f-slug" type="text" placeholder="Se genera sola">
            <span class="field__hint">Si la cambiás, los enlaces que ya se compartieron dejan de funcionar.</span>
          </div>
          <div class="field field--full">
            <label class="checkline"><input type="checkbox" id="f-publicada"> <span><strong>Publicada</strong> — si la desmarcás, desaparece del sitio pero queda guardada acá.</span></label>
            <label class="checkline mt-1"><input type="checkbox" id="f-destacada"> <span><strong>Destacada</strong> — aparece en la página de inicio.</span></label>
          </div>
        </div>
      </fieldset>

      <fieldset class="admin-fieldset">
        <legend>Características</legend>
        <div class="admin-grid">
          <div class="field">
            <label class="field__label" for="f-dormitorios">Dormitorios</label>
            <input class="input" id="f-dormitorios" type="number" min="0" placeholder="—">
          </div>
          <div class="field">
            <label class="field__label" for="f-banos">Baños</label>
            <input class="input" id="f-banos" type="number" min="0" placeholder="—">
          </div>
          <div class="field">
            <label class="field__label" for="f-ambientes">Ambientes</label>
            <input class="input" id="f-ambientes" type="number" min="0" placeholder="—">
          </div>
          <div class="field">
            <label class="field__label" for="f-cocheras">Cocheras</label>
            <input class="input" id="f-cocheras" type="number" min="0" placeholder="—">
          </div>
          <div class="field">
            <label class="field__label" for="f-m2cub">m² cubiertos</label>
            <input class="input" id="f-m2cub" type="number" min="0" placeholder="—">
          </div>
          <div class="field">
            <label class="field__label" for="f-m2ter">m² de terreno</label>
            <input class="input" id="f-m2ter" type="number" min="0" placeholder="—">
          </div>
          <div class="field field--full">
            <label class="field__label" for="f-caracteristicas">Lista de características</label>
            <textarea class="textarea" id="f-caracteristicas" placeholder="Una por línea:&#10;Patio con parrilla&#10;Cochera cubierta&#10;Aire acondicionado"></textarea>
            <span class="field__hint">Una por línea. Aparecen como lista en la ficha.</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="admin-fieldset">
        <legend>Precio</legend>
        <div class="admin-grid">
          <div class="field">
            <label class="field__label" for="f-precio">Precio</label>
            <input class="input" id="f-precio" type="number" min="0" step="0.01" placeholder="Vacío = “Consultar”">
          </div>
          <div class="field">
            <label class="field__label" for="f-moneda">Moneda</label>
            <select class="select" id="f-moneda">
              <option value="USD">Dólares (USD)</option>
              <option value="ARS">Pesos ($)</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="f-expensas">Expensas mensuales</label>
            <input class="input" id="f-expensas" type="number" min="0" step="0.01" placeholder="Opcional">
          </div>
        </div>
      </fieldset>

      <fieldset class="admin-fieldset">
        <legend>Descripción y mapa</legend>
        <div class="admin-grid">
          <div class="field field--full">
            <label class="field__label" for="f-descripcion">Descripción</label>
            <textarea class="textarea" id="f-descripcion" style="min-height:170px" placeholder="Contá la propiedad como se la describirías a un cliente en la oficina."></textarea>
          </div>
          <div class="field field--full">
            <label class="field__label" for="f-mapa">Dirección para el mapa</label>
            <input class="input" id="f-mapa" type="text" placeholder="Calle 22 Norte 375, General Pico, La Pampa">
            <span class="field__hint">Se busca en Google Maps. Si lo dejás vacío se usa la dirección de arriba.</span>
          </div>
        </div>
      </fieldset>

      <div class="barra-guardar">
        <button class="btn btn--primary" id="btn-guardar" type="submit">Guardar cambios</button>
        <a class="btn btn--ghost btn--sm" id="btn-ver" href="#" target="_blank" rel="noopener">Ver en el sitio</a>
        <button class="btn btn--ghost btn--sm" id="btn-eliminar" type="button" style="color:#C0392B;border-color:#F0C6C0;margin-left:auto">Eliminar</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal de cambio de contraseña -->
<div class="modal" id="modal-clave" hidden>
  <div class="modal__caja">
    <p class="panel__title">Cambiar contraseña</p>
    <div class="field mt-2">
      <label class="field__label" for="k-actual">Contraseña actual</label>
      <input class="input" id="k-actual" type="password" autocomplete="current-password">
    </div>
    <div class="field mt-2">
      <label class="field__label" for="k-nueva">Contraseña nueva</label>
      <input class="input" id="k-nueva" type="password" autocomplete="new-password">
    </div>
    <div class="field mt-2">
      <label class="field__label" for="k-nueva2">Repetir la nueva</label>
      <input class="input" id="k-nueva2" type="password" autocomplete="new-password">
    </div>
    <p class="form-status" id="k-estado"></p>
    <div class="toolbar mt-3">
      <button class="btn btn--primary btn--sm" id="k-guardar" type="button">Cambiar</button>
      <button class="btn btn--ghost btn--sm" id="k-cerrar" type="button">Cancelar</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  /* JSON_HEX_TAG escapa los signos < y > de los textos: sin eso, una
     descripcion que contuviera una etiqueta de cierre de script cortaria
     este bloque y rompería la página. */
  window.PANEL = {
    csrf: <?= json_encode($csrf, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>,
    propiedades: <?= json_encode($propiedades, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>,
    urlFotos: <?= json_encode(URL_FOTOS, JSON_HEX_TAG) ?>,
    publicadas: <?= (int) $totalPublicadas ?>
  };
</script>
<script src="assets/js/config.js"></script>
<!-- El panel lee de la base (window.PANEL), no del catálogo generado:
     por eso acá NO se carga data/propiedades.js. -->
<script src="assets/js/app.js"></script>
<script src="assets/js/catalogo.js"></script>
<script src="assets/js/admin-panel.js"></script>
</body>
</html>
