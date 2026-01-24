<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed"]);
    exit();
}

$input = file_get_contents("php://input");
$data = json_decode($input);

if (empty($data->name) || empty($data->whatsapp) || empty($data->appliedPositionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Mohon lengkapi Nama, WhatsApp, dan Posisi."]);
    exit();
}

$name = trim(strip_tags($data->name));
$whatsapp = preg_replace('/[^0-9]/', '', $data->whatsapp);
$address = trim(strip_tags($data->address ?? '-'));
$positionId = (int)$data->appliedPositionId;

try {
    $stmtPos = $conn->prepare("SELECT title, is_active FROM job_positions WHERE id = ?");
    $stmtPos->execute([$positionId]);
    $job = $stmtPos->fetch(PDO::FETCH_ASSOC);

    if (!$job) {
        http_response_code(404);
        echo json_encode(["error" => "Posisi tidak ditemukan."]);
        exit();
    }

    if ($job['is_active'] == 0) {
        http_response_code(403);
        echo json_encode(["error" => "Mohon maaf, lowongan untuk posisi ini sudah DITUTUP."]);
        exit();
    }

    $stmtCek = $conn->prepare("SELECT id FROM participants WHERE whatsapp = ? AND job_position_id = ? AND status != 'COMPLETED'");
    $stmtCek->execute([$whatsapp, $positionId]);
    if ($stmtCek->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["error" => "Nomor WhatsApp ini sudah terdaftar dan sedang dalam proses seleksi."]);
        exit();
    }

    $token = bin2hex(random_bytes(32));
    
    $sql = "INSERT INTO participants (name, whatsapp, address, job_position_id, session_token, status, created_at) VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $whatsapp, $address, $positionId, $token]);
    
    $newId = $conn->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "message" => "Registrasi berhasil",
        "id" => (string)$newId,
        "token" => $token,
        "status" => "IN_PROGRESS"
    ]);

} catch (Exception $e) {
    error_log("Register Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Terjadi kesalahan sistem saat mendaftar."]);
}
?>