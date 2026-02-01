<?php

declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required.']);
    exit;
}

if (strlen($username) > 50) {
    http_response_code(400);
    echo json_encode(['error' => 'Username is too long.']);
    exit;
}

require __DIR__ . '/db.php';

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');

try {
    $stmt->execute([$username, $hash]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'Username already exists.']);
        exit;
    }

    http_response_code(500);
    echo json_encode(['error' => 'Signup failed.']);
    exit;
}

echo json_encode(['ok' => true]);
