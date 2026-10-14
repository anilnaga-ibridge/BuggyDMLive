<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// This file allows us to emulate Apache's "mod_rewrite" functionality from the
// built-in PHP web server. This provides a convenient way to test a Laravel
// application without having installed a "real" web server software here.
if (
    $uri !== '/'
    && (
        (file_exists(__DIR__.$uri) && ! is_dir(__DIR__.$uri))
        || (file_exists(__DIR__.'/public'.$uri) && ! is_dir(__DIR__.'/public'.$uri))
    )
) {
    $filePath = file_exists(__DIR__.$uri) && !is_dir(__DIR__.$uri) ? __DIR__.$uri : __DIR__.'/public'.$uri;
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'css'   => 'text/css; charset=UTF-8',
        'js'    => 'application/javascript; charset=UTF-8',
        'json'  => 'application/json; charset=UTF-8',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'webp'  => 'image/webp',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'eot'   => 'application/vnd.ms-fontobject',
        'otf'   => 'font/otf',
    ];
    $mime = $mimeTypes[$ext] ?? mime_content_type($filePath);
    if ($mime) {
        header("Content-Type: " . $mime);
    }
    header("Content-Length: " . filesize($filePath));
    readfile($filePath);
    exit;
}

require_once __DIR__.'/public/index.php';
