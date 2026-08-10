<?php
/* ============================================================
   CONEXIÓN A LA BASE DE DATOS
   ============================================================ */

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NOMBRE . ';charset=utf8mb4';

    try {
        $pdo = new PDO($dsn, DB_USUARIO, DB_CLAVE, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        error_log('Quinteros — error de conexión: ' . $e->getMessage());
        http_response_code(500);
        if (MODO_DEBUG) {
            exit('Error de conexión: ' . $e->getMessage());
        }
        exit('No se pudo conectar con la base de datos. Revisá los datos en lib/config.php.');
    }

    return $pdo;
}

/** Escapa texto para insertarlo en HTML. */
function e(?string $texto): string
{
    return htmlspecialchars((string) $texto, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** ¿Ya se corrió el instalador? */
function tablas_creadas(): bool
{
    try {
        db()->query('SELECT 1 FROM propiedades LIMIT 1');
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

/** Lee un valor de la tabla de ajustes. */
function ajuste(string $clave, ?string $porDefecto = null): ?string
{
    $st = db()->prepare('SELECT valor FROM ajustes WHERE clave = ?');
    $st->execute([$clave]);
    $fila = $st->fetch();
    return $fila ? $fila['valor'] : $porDefecto;
}

/** Guarda (o actualiza) un valor en la tabla de ajustes. */
function guardar_ajuste(string $clave, string $valor): void
{
    $st = db()->prepare(
        'INSERT INTO ajustes (clave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)'
    );
    $st->execute([$clave, $valor]);
}
