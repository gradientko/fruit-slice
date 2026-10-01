<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    respond(['error' => 'Invalid JSON'], 400);
}

$score = $input['score'] ?? null;
$combo = $input['combo'] ?? null;

if (!is_int($score) || !is_int($combo)) {
    respond(['error' => 'Invalid result'], 422);
}

if ($score < 0 || $score > 100000000 || $combo < 0 || $combo > 10000) {
    respond(['error' => 'Result out of range'], 422);
}

if (!isset($_SESSION['fruit_slice'])) {
    $_SESSION['fruit_slice'] = [
        'high_score' => 0,
        'best_combo' => 0,
        'games_played' => 0
    ];
}

$_SESSION['fruit_slice']['high_score'] = max($_SESSION['fruit_slice']['high_score'], $score);
$_SESSION['fruit_slice']['best_combo'] = max($_SESSION['fruit_slice']['best_combo'], $combo);
$_SESSION['fruit_slice']['games_played']++;

respond([
    'ok' => true,
    'highScore' => $_SESSION['fruit_slice']['high_score'],
    'bestCombo' => $_SESSION['fruit_slice']['best_combo'],
    'gamesPlayed' => $_SESSION['fruit_slice']['games_played']
]);
