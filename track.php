<?php

declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$event = trim((string)($input['event'] ?? ''));
$userId = $input['userId'] ?? null;
$payload = $input['payload'] ?? null;

if ($event === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Event is required.']);
    exit;
}

if (strlen($event) > 64) {
    http_response_code(400);
    echo json_encode(['error' => 'Event is too long.']);
    exit;
}

if ($userId !== null && !is_numeric($userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user id.']);
    exit;
}

$payloadJson = null;
if ($payload !== null) {
    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($payloadJson === false) {
        $payloadJson = null;
    }
}

require __DIR__ . '/db.php';

$stmt = $pdo->prepare('INSERT INTO events (user_id, event, payload) VALUES (?, ?, ?)');
$stmt->execute([
    $userId !== null ? (int)$userId : null,
    $event,
    $payloadJson
]);

echo json_encode(['ok' => true]);
