<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');

// 1. GET: Ambil Semua Modul Tes
if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM test_modules ORDER BY title ASC");
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON string dari database kembali ke Object asli
        foreach ($modules as &$m) {
            $m['config'] = json_decode($m['config'] ?? '{}');
            $m['questions'] = json_decode($m['questions'] ?? '[]');
            $m['isActive'] = (bool)($m['is_active'] ?? true); // Convert 1/0 to true/false
            $m['questionCount'] = (int)($m['question_count'] ?? 0);
            unset($m['is_active']); // Bersihkan output
            unset($m['question_count']);
        }
        
        echo json_encode($modules);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

// 2. POST: Update / Simpan Konfigurasi Modul
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input['id']) || !isset($input['type'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID Modul tidak valid"]);
        exit();
    }

    try {
        // Cek apakah modul sudah ada?
        $check = $conn->prepare("SELECT id FROM test_modules WHERE id = ?");
        $check->execute([$input['id']]);
        
        $title = $input['title'] ?? 'Untitled Module';
        $type = $input['type'];
        $isActive = ($input['isActive'] ?? true) ? 1 : 0;
        $questionsArr = $input['questions'] ?? [];
        $qCount = $input['questionCount'] ?? count($questionsArr);
        $config = json_encode($input['config'] ?? (object)[]);
        $questions = json_encode($questionsArr);

        if ($check->rowCount() > 0) {
            // UPDATE Existing
            $sql = "UPDATE test_modules SET title=?, type=?, is_active=?, question_count=?, config=?, questions=?, updated_at=NOW() WHERE id=?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$title, $type, $isActive, $qCount, $config, $questions, $input['id']]);
        } else {
            // INSERT New (Custom Module)
            $sql = "INSERT INTO test_modules (id, title, type, is_active, question_count, config, questions, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$input['id'], $title, $type, $isActive, $qCount, $config, $questions]);
        }

        echo json_encode(["message" => "Modul berhasil disimpan", "id" => $input['id']]);

    } catch (Exception $e) {
        error_log("Module Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Gagal menyimpan modul ke database."]);
    }
}
?>