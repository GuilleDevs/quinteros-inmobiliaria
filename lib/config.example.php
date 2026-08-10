<?php
/* ============================================================
   CONFIGURACIÓN DEL SERVIDOR — PLANTILLA
   ------------------------------------------------------------
   ESTE ARCHIVO ES UN MODELO. Para que el sitio funcione:

       1. copiarlo como  lib/config.php
       2. completar los cuatro datos de la base
       3. NO subir config.php al repositorio (ya está en .gitignore)

   El motivo de la separación: config.php lleva la contraseña real
   de MySQL. Si entrara al repositorio quedaría publicada, y en un
   repositorio público la vería cualquiera.
   ------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR AL SUBIR EL SITIO.

   Los datos de la base se sacan del panel de Hostinger, en
   "Bases de datos" → "Administración de bases de datos MySQL".
   Ahí se crea la base y el usuario, y Hostinger muestra estos
   cuatro valores.
   ============================================================ */

/* --- Base de datos ------------------------------------------------ */
const DB_HOST    = 'localhost';               // en Hostinger casi siempre es 'localhost'
const DB_NOMBRE  = 'uXXXXXXXX_quinteros';     // ← reemplazar
const DB_USUARIO = 'uXXXXXXXX_quinteros';     // ← reemplazar
const DB_CLAVE   = 'LA_CLAVE_DE_LA_BASE';     // ← reemplazar

/* --- Rutas -------------------------------------------------------- */
/* Carpeta física donde se guardan las fotos subidas. */
const DIR_FOTOS = __DIR__ . '/../assets/img/propiedades';
/* La misma carpeta, pero como ruta web (la que va escrita en el HTML). */
const URL_FOTOS = 'assets/img/propiedades';
/* Archivo de catálogo que consume el sitio público. */
const ARCHIVO_CATALOGO = __DIR__ . '/../data/propiedades.js';

/* --- Imágenes ----------------------------------------------------- */
/* Las fotos se redimensionan solas al subirlas: el cliente puede mandar
   una foto de 6 MB del celular y el servidor la deja liviana. */
const FOTO_ANCHO_GRANDE = 1600;   // la que se ve en la ficha y la galería
const FOTO_ANCHO_CHICA  = 640;    // la miniatura de las tarjetas del catálogo
const FOTO_CALIDAD      = 82;     // 0-100. 82 es un buen equilibrio
const FOTO_PESO_MAXIMO  = 26214400;  // 25 MB por archivo, antes de comprimir

/* --- Seguridad ---------------------------------------------------- */
/* Minutos de inactividad antes de cerrar la sesión del panel. */
const SESION_MINUTOS = 240;

/* En producción los errores no se muestran en pantalla: quedan en el
   log de errores de Hostinger. Poner true solo para diagnosticar. */
const MODO_DEBUG = false;

/* ------------------------------------------------------------------
   A partir de acá no hace falta tocar nada.
   ------------------------------------------------------------------ */

date_default_timezone_set('America/Argentina/Buenos_Aires');
mb_internal_encoding('UTF-8');

error_reporting(E_ALL);
ini_set('display_errors', MODO_DEBUG ? '1' : '0');
ini_set('log_errors', '1');
