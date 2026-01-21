<?php
require_once 'db.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->prepare("
            SELECT 
                jp.id, 
                jp.title, 
                jp.department, 
                jp.is_active as isActive,
                (SELECT COUNT(*) FROM participants p WHERE p.job_position_id = jp.id) as applicantCount
            FROM job_positions jp 
            ORDER BY jp.created_at DESC
        ");
        $stmt->execute();
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch mappings for each position
        foreach ($positions as &$pos) {
            // Cast types to match frontend interface and ensure strict equality works
            $pos['id'] = (string) $pos['id'];
            $pos['isActive'] = (bool) $pos['isActive'];
            $pos['applicantCount'] = (int) $pos['applicantCount'];

            $mStmt = $conn->prepare("SELECT test_type FROM position_test_mappings WHERE job_position_id = ? ORDER BY sequence ASC");
            $mStmt->execute([$pos['id']]);
            $testTypes = $mStmt->fetchAll(PDO::FETCH_COLUMN);

            // Map to frontend IDs
            $pos['testIds'] = array_map(function ($t) {
                if ($t == 'ISHIHARA')
                    return 'tm_ishihara';
                if ($t == 'DISC')
                    return 'tm_disc';
                if ($t == 'KRAEPELIN')
                    return 'tm_kraepelin';
                if ($t == 'MCQ')
                    return 'tm_k3';
                return $t;
            }, $testTypes);
        }

        echo json_encode($positions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    // PROTECT ALL NON-GET METHODS
    $user = protect();

    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));

        try {
            $conn->beginTransaction();

            // Determine if we are inserting a new record or updating an existing one
            // If ID is not set or is empty/null, it's a new position
            if (!isset($data->id) || empty($data->id)) {
                // INSERT new position
                $stmt = $conn->prepare("INSERT INTO job_positions (title, department, is_active) VALUES (?, ?, ?)");
                $stmt->execute([$data->title, $data->department, isset($data->isActive) && $data->isActive ? 1 : 0]);
                $posId = $conn->lastInsertId();
            } else {
                // UPDATE existing position
                $stmt = $conn->prepare("UPDATE job_positions SET title = ?, department = ?, is_active = ? WHERE id = ?");
                $stmt->execute([$data->title, $data->department, isset($data->isActive) && $data->isActive ? 1 : 0, $data->id]);
                $posId = $data->id;

                // Clear existing mappings to re-insert them
                $conn->prepare("DELETE FROM position_test_mappings WHERE job_position_id = ?")->execute([$posId]);
            }

            // Insert mappings
            if (isset($data->testIds) && is_array($data->testIds)) {
                $mStmt = $conn->prepare("INSERT INTO position_test_mappings (job_position_id, test_type, sequence) VALUES (?, ?, ?)");
                foreach ($data->testIds as $index => $tid) {
                    $type = strtoupper(str_replace('tm_', '', $tid));
                    if ($type === 'K3')
                        $type = 'MCQ';
                    $mStmt->execute([$posId, $type, $index + 1]);
                }
            }

            $conn->commit();
            echo json_encode(["message" => "Posisi berhasil disimpan", "id" => $posId]);
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            exit();
        }

        try {
            $stmt = $conn->prepare("DELETE FROM job_positions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Posisi dihapus"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>