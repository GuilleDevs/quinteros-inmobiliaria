<?php
require_once __DIR__ . '/lib/auth.php';

iniciar_sesion();
cerrar_sesion();

header('Location: login.php');
exit;
