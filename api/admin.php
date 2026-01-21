<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] == 'stats') {
        $total = $conn->query("SELECT COUNT(*) FROM participants")->fetchColumn();
        $completed = $conn->query("SELECT COUNT(*) FROM participants WHERE test_status = 'COMPLETED'")->fetchColumn();
        $activePos = $conn->query("SELECT COUNT(*) FROM job_positions WHERE is_active = 1")->fetchColumn();
        
        echo json_encode([
            "total" => $total,
            "completed" => $completed,
            "activePositions" => $activePos,
            "avgScore" => 78 // Mock score for now
        ]);
    } else {
        // List Candidates
        $stmt = $conn->prepare("SELECT p.*, j.title as appliedPosition FROM participants p LEFT JOIN job_positions j ON p.job_position_id = j.id ORDER BY p.created_at DESC");
        $stmt->execute();
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch results summary for each candidate
        foreach ($candidates as &$c) {
            $rStmt = $conn->prepare("SELECT test_type FROM test_results WHERE participant_id = ?");
            $rStmt->execute([$c['id']]);
            $c['completedTests'] = $rStmt->fetchAll(PDO::FETCH_COLUMN);
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