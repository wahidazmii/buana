<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->participantId) || !isset($data->testType) || !isset($data->results)) {
        http_response_code(400);
        echo json_encode(["error" => "Payload tidak valid"]);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO test_results (participant_id, test_type, raw_results) VALUES (?, ?, ?)");
        $stmt->execute([
            $data->participantId,
            $data->testType,
            json_encode($data->results)
        ]);

        // If it's the last test, update status
        if (isset($data->isLast) && $data->isLast) {
            $uStmt = $conn->prepare("UPDATE participants SET test_status = 'COMPLETED' WHERE id = ?");
            $uStmt->execute([$data->participantId]);
        }

        echo json_encode(["message" => "Hasil tes disimpan"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>