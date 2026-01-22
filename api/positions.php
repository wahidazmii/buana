<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, title, department, is_active FROM job_positions WHERE is_active = 1");
        $stmt->execute();
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch mappings for each position
        foreach ($positions as &$pos) {
            $mStmt = $conn->prepare("SELECT test_type FROM position_test_mappings WHERE job_position_id = ? ORDER BY sequence ASC");
            $mStmt->execute([$pos['id']]);
            $pos['testIds'] = $mStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Map to frontend IDs
            $pos['testIds'] = array_map(function($t) {
                if ($t == 'ISHIHARA') return 'tm_ishihara';
                if ($t == 'DISC') return 'tm_disc';
                if ($t == 'KRAEPELIN') return 'tm_kraepelin';
                return $t;
            }, $pos['testIds']);
        }

        echo json_encode($positions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>