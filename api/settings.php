<?php
require_once 'db.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // If public access to some settings is needed, we could filter here.
    // However, API Key should ONLY be accessible via admin token for safety.
    $user = protect();

    try {
        $stmt = $conn->query("SELECT setting_key, setting_value FROM settings");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        echo json_encode($settings);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method === 'POST') {
    $user = protect();
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid data"]);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        foreach ($data as $key => $value) {
            $stmt->execute([$key, $value, $value]);
        }
        echo json_encode(["message" => "Settings updated"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>