<?php
require_once 'db.php';
require_once 'auth.php';

// Protect all admin routes
$user = protect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] == 'stats') {
        $total = $conn->query("SELECT COUNT(*) FROM participants")->fetchColumn();
        $completed = $conn->query("SELECT COUNT(*) FROM participants WHERE test_status = 'COMPLETED'")->fetchColumn();
        $activePos = $conn->query("SELECT COUNT(*) FROM job_positions WHERE is_active = 1")->fetchColumn();

        // Monthly Trends (Last 6 Months)
        // Get raw counts grouped by YYYY-MM
        $trendQuery = $conn->query("
            SELECT DATE_FORMAT(created_at, '%Y-%m') as m, COUNT(*) as c 
            FROM participants 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY m
        ")->fetchAll(PDO::FETCH_KEY_PAIR);

        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            // Generate keys like '2025-10', '2025-11'
            $key = date('Y-m', strtotime("-$i months"));
            // Generate display names like 'Oct', 'Nov'
            $name = date('M', strtotime("-$i months")); // 'M' gives short month name (Jan, Feb)

            // Map count or default to 0
            $trends[] = [
                "name" => $name,
                "count" => isset($trendQuery[$key]) ? (int) $trendQuery[$key] : 0
            ];
        }

        // Quality Distribution (Based on AI Recommendation)
        $quality = [
            ["name" => "Highly Recommended", "value" => (int) $conn->query("SELECT COUNT(*) FROM participants WHERE ai_recommendation = 'Highly Recommended'")->fetchColumn()],
            ["name" => "Recommended", "value" => (int) $conn->query("SELECT COUNT(*) FROM participants WHERE ai_recommendation = 'Recommended'")->fetchColumn()],
            ["name" => "Consider", "value" => (int) $conn->query("SELECT COUNT(*) FROM participants WHERE ai_recommendation LIKE 'Consider%'")->fetchColumn()],
            ["name" => "Not Recommended", "value" => (int) $conn->query("SELECT COUNT(*) FROM participants WHERE ai_recommendation = 'Not Recommended'")->fetchColumn()],
        ];

        echo json_encode([
            "total" => (int) $total,
            "completed" => (int) $completed,
            "activePositions" => (int) $activePos,
            "avgScore" => 78,
            "monthlyTrends" => $trends,
            "qualityDistribution" => $quality
        ]);
    } else {
        // List Candidates with Joins
        $stmt = $conn->prepare("
            SELECT p.*, j.title as appliedPosition 
            FROM participants p 
            LEFT JOIN job_positions j ON p.job_position_id = j.id 
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ambil hasil tes detail untuk setiap kandidat
        foreach ($candidates as &$c) {
            $rStmt = $conn->prepare("SELECT test_type, raw_results FROM test_results WHERE participant_id = ?");
            $rStmt->execute([$c['id']]);
            $resultsData = $rStmt->fetchAll(PDO::FETCH_ASSOC);

            $c['results'] = [];
            foreach ($resultsData as $row) {
                $type = strtolower($row['test_type']);
                $c['results'][$type] = json_decode($row['raw_results']);
            }

            // Map DB fields to Frontend expected fields
            $c['status'] = $c['test_status'];
            $c['education'] = $c['education_level'];
            $c['dob'] = $c['birth_date'];
            $c['recommendation'] = $c['ai_recommendation'];
            if (isset($c['ai_report'])) {
                $c['results']['aiReport'] = json_decode($c['ai_report']);
                $c['results']['recommendation'] = $c['ai_recommendation'];
            }
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