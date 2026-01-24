
<?php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $sql = "
            SELECT 
                j.id, 
                j.title, 
                j.department, 
                j.is_active,
                GROUP_CONCAT(m.test_type ORDER BY m.sequence ASC SEPARATOR ',') as raw_test_types
            FROM job_positions j
            LEFT JOIN position_test_mappings m ON j.id = m.job_position_id
            GROUP BY j.id, j.title, j.department, j.is_active
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $frontendMap = [
            'ISHIHARA'  => 'tm_ishihara',
            'DISC'      => 'tm_disc',
            'KRAEPELIN' => 'tm_kraepelin',
            'PAPI'      => 'tm_papi',
            'K3'        => 'tm_k3'
        ];

        foreach ($positions as &$pos) {
            $finalTestIds = [];
            if (!empty($pos['raw_test_types'])) {
                $types = explode(',', $pos['raw_test_types']);
                foreach ($types as $t) {
                    $finalTestIds[] = $frontendMap[$t] ?? 'tm_' . strtolower($t);
                }
            }
            $pos['testIds'] = $finalTestIds;
            $pos['isActive'] = (bool)$pos['is_active'];
            $pos['applicantCount'] = 0; // Bisa dihitung dengan COUNT(participants)
            unset($pos['raw_test_types'], $pos['is_active']);
        }
        echo json_encode($positions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['title'])) {
        http_response_code(400);
        echo json_encode(["error" => "Judul jabatan wajib diisi"]);
        exit();
    }

    try {
        $conn->beginTransaction();

        if (!empty($data['id']) && is_numeric($data['id'])) {
            // Update Existing
            $stmt = $conn->prepare("UPDATE job_positions SET title = ?, department = ?, is_active = ? WHERE id = ?");
            $stmt->execute([$data['title'], $data['department'], $data['isActive'] ? 1 : 0, $data['id']]);
            $positionId = $data['id'];
        } else {
            // Create New
            $stmt = $conn->prepare("INSERT INTO job_positions (title, department, is_active) VALUES (?, ?, ?)");
            $stmt->execute([$data['title'], $data['department'], $data['isActive'] ? 1 : 0]);
            $positionId = $conn->lastInsertId();
        }

        // Update Mappings
        $conn->prepare("DELETE FROM position_test_mappings WHERE job_position_id = ?")->execute([$positionId]);
        
        if (!empty($data['testIds'])) {
            $stmtMap = $conn->prepare("INSERT INTO position_test_mappings (job_position_id, test_type, sequence) VALUES (?, ?, ?)");
            $seq = 1;
            foreach ($data['testIds'] as $tid) {
                $type = strtoupper(str_replace('tm_', '', $tid));
                $stmtMap->execute([$positionId, $type, $seq++]);
            }
        }

        $conn->commit();
        echo json_encode(["message" => "Posisi berhasil disimpan", "id" => $positionId]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
