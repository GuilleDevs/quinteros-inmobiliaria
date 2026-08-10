/* ============================================================
   CONFIGURACIÓN DEL SITIO — Quinteros Grupo Inmobiliario
   ------------------------------------------------------------
   Este es el único archivo que hay que tocar para cambiar
   teléfonos, horarios, redes o textos de contacto.
   ============================================================ */

window.SITE = {
  nombre: "Quinteros Grupo Inmobiliario",
  nombreCorto: "Quinteros",
  ciudad: "General Pico",
  provincia: "La Pampa",

  /* --- IMPORTANTE ---------------------------------------------
     Reemplazar por el número real de la inmobiliaria.
     Formato para WhatsApp: código de país + 9 + área sin 0 +
     número sin 15. General Pico = área 2302.
     Ejemplo: 5492302123456
     ------------------------------------------------------------ */
  whatsapp: "5492302000000",
  whatsappVisible: "+54 9 2302 00-0000",
  telefono: "+54 2302 00-0000",
  telefonoLink: "+542302000000",
  email: "info@quinterosinmobiliaria.com.ar",

  direccion: "Calle 15 N° 1124",
  codigoPostal: "6360",
  horario: "Lunes a viernes de 8:30 a 14:00 h",
  horarioCorto: "Lun a Vie · 8:30 a 14 h",

  instagram: "https://www.instagram.com/quinteros.inmobiliaria/",
  instagramUser: "@quinteros.inmobiliaria",

  aniosTrayectoria: 33,

  /* Coordenadas aproximadas de la oficina (ajustar si hace falta) */
  mapaQuery: "Calle 15 1124, General Pico, La Pampa, Argentina",

  /* Endpoint del formulario de contacto.
     Dejar vacío ("") para que el formulario abra WhatsApp con el
     mensaje armado. Si más adelante contratan un servicio tipo
     Formspree / Web3Forms, pegar acá la URL del endpoint. */
  formEndpoint: "",

  /* Mensaje base de WhatsApp */
  mensajeGeneral: "¡Hola Quinteros! Estoy consultando desde la web y quisiera más información."
};

/* Tipologías disponibles (afectan filtros, buscador y panel admin) */
window.TIPOS = [
  { slug: "casa", label: "Casa", plural: "Casas" },
  { slug: "departamento", label: "Departamento", plural: "Departamentos" },
  { slug: "duplex", label: "Dúplex", plural: "Dúplex" },
  { slug: "terreno", label: "Terreno", plural: "Terrenos" },
  { slug: "local", label: "Local comercial", plural: "Locales comerciales" },
  { slug: "oficina", label: "Oficina", plural: "Oficinas" },
  { slug: "galpon", label: "Galpón", plural: "Galpones" },
  { slug: "campo", label: "Campo", plural: "Campos" }
];

/* Zonas y barrios de General Pico donde opera la inmobiliaria.
   Editables: se usan en el buscador, filtros, panel admin y en la
   sección "Zona de cobertura". */
window.ZONAS = [
  { slug: "centro", label: "Centro" },
  { slug: "zona-norte", label: "Zona Norte" },
  { slug: "zona-sur", label: "Zona Sur" },
  { slug: "zona-este", label: "Zona Este" },
  { slug: "zona-oeste", label: "Zona Oeste" },
  { slug: "peatonales", label: "Peatonales / Tiras" },
  { slug: "barrio-ferro", label: "Barrio Ferro" },
  { slug: "barrio-aeropuerto", label: "Barrio Aeropuerto" },
  { slug: "barrio-talleres", label: "Barrio Talleres" },
  { slug: "barrio-progreso", label: "Barrio Progreso" },
  { slug: "barrio-malvinas", label: "Barrio Malvinas Argentinas" },
  { slug: "chacras", label: "Chacras y quintas" },
  { slug: "dorila", label: "Dorila y zona rural" }
];
