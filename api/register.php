<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name) || !isset($data->whatsapp) || !isset($data->appliedPositionId)) {
        http_response_code(400);
        echo json_encode(["error" => "Data tidak lengkap"]);
        exit();
    }

    try {
        $token = bin2hex(random_bytes(32));
        
        $stmt = $conn->prepare("INSERT INTO participants (name, whatsapp, address, job_position_id, session_token, test_status) VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS')");
        $stmt->execute([
            $data->name,
            $data->whatsapp,
            $data->address ?? '',
            $data->appliedPositionId,
            $token
        ]);

        $id = $conn->lastInsertId();

        echo json_encode([
            "id" => $id,
            "token" => $token,
            "message" => "Registrasi berhasil"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>