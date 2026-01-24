<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] == 'stats') {
        $total = $conn->query("SELECT COUNT(*) FROM participants")->fetchColumn();
        $completed = $conn->query("SELECT COUNT(*) FROM participants WHERE status = 'COMPLETED'")->fetchColumn();
        $activePos = $conn->query("SELECT COUNT(*) FROM job_positions WHERE is_active = 1")->fetchColumn();
        
        echo json_encode([
            "total" => (int)$total,
            "completed" => (int)$completed,
            "activePositions" => (int)$activePos,
            "avgScore" => 78 
        ]);
    } else {
        $stmt = $conn->prepare("
            SELECT p.*, j.title as appliedPosition 
            FROM participants p 
            LEFT JOIN job_positions j ON p.job_position_id = j.id 
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($candidates as &$c) {
            $rStmt = $conn->prepare("SELECT test_type, raw_results FROM test_results WHERE participant_id = ?");
            $rStmt->execute([$c['id']]);
            $resultsData = $rStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $c['results'] = [];
            foreach ($resultsData as $row) {
                $type = strtolower($row['test_type']);
                $c['results'][$type] = json_decode($row['raw_results']);
            }
            
            $c['education'] = $c['education_level'];
            $c['dob'] = $c['birth_date'];
            $c['recommendation'] = $c['ai_recommendation'];
        }
        
        echo json_encode($candidates);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM participants WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Data dihapus"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>