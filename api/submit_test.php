<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); exit();
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized: Token sesi tidak ditemukan."]);
    exit();
}

$stmtAuth = $conn->prepare("SELECT id FROM participants WHERE session_token = ?");
$stmtAuth->execute([$token]);
$user = $stmtAuth->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "Sesi tidak valid atau kadaluarsa."]);
    exit();
}

$participantId = $user['id'];
$input = json_decode(file_get_contents("php://input"), true);
$testType = strtoupper($input['testType'] ?? '');
$rawResults = $input['results'] ?? [];

if (empty($testType)) {
    http_response_code(400);
    echo json_encode(["error" => "Data modul tes kosong."]);
    exit();
}

$calculatedScore = [];

// Advanced Backend Verification Scoring
switch ($testType) {
    case 'ISHIHARA':
        $calculatedScore = calculateIshihara($rawResults);
        break;
    case 'KRAEPELIN':
        // Expecting an array of correct counts per column from frontend
        $calculatedScore = calculateKraepelin($rawResults);
        break;
    case 'DISC':
        $calculatedScore = calculateDISC($rawResults);
        break;
    default:
        $calculatedScore = ["info" => "Manual Review Needed"];
}

try {
    $checkStmt = $conn->prepare("SELECT id FROM test_results WHERE participant_id = ? AND test_type = ?");
    $checkStmt->execute([$participantId, $testType]);
    
    if ($checkStmt->rowCount() > 0) {
        $stmt = $conn->prepare("UPDATE test_results SET raw_results = ?, score_result = ?, updated_at = NOW() WHERE participant_id = ? AND test_type = ?");
        $stmt->execute([
            json_encode($rawResults),
            json_encode($calculatedScore),
            $participantId,
            $testType
        ]);
    } else {
        $stmt = $conn->prepare("INSERT INTO test_results (participant_id, test_type, raw_results, score_result, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $participantId,
            $testType,
            json_encode($rawResults),
            json_encode($calculatedScore)
        ]);
    }

    if (isset($input['isLast']) && $input['isLast'] === true) {
        $uStmt = $conn->prepare("UPDATE participants SET status = 'COMPLETED' WHERE id = ?");
        $uStmt->execute([$participantId]);
    }

    echo json_encode([
        "message" => "Jawaban berhasil disimpan", 
        "debug_score" => $calculatedScore 
    ]);

} catch (Exception $e) {
    error_log("Submit Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Gagal menyimpan hasil tes ke database."]);
}

function calculateIshihara($answers) {
    $key = [1 => '12', 2 => '8', 3 => '74', 4 => '5', 5 => '6', 6 => '42', 7 => '16', 8 => '26', 9 => '6', 10 => '15', 11 => '97', 12 => '29', 13 => '35', 14 => '45']; 
    
    $correct = 0;
    if (!is_array($answers)) return ["error" => "Invalid data format"];
    
    foreach ($answers as $ans) {
        $plateNum = (int)($ans['plate'] ?? 0);
        $userAns = $ans['answer'] ?? '';
        if (isset($key[$plateNum]) && $key[$plateNum] == $userAns) {
            $correct++;
        }
    }

    $total = count($key);
    return [
        "score" => $correct,
        "total" => $total,
        "status" => ($correct >= 11) ? "NORMAL" : (($correct >= 7) ? "PARTIAL_COLOR_BLIND" : "TOTAL_COLOR_BLIND")
    ];
}

function calculateKraepelin($columnScores) {
    if (empty($columnScores) || !is_array($columnScores)) return ["error" => "No performance data"];

    $count = count($columnScores);
    $sum = array_sum($columnScores);
    $avgSpeed = $sum / $count;

    $variance = 0.0;
    foreach ($columnScores as $val) {
        $variance += pow($val - $avgSpeed, 2);
    }
    $stdDev = (float)sqrt($variance / $count);
    
    $firstHalf = array_slice($columnScores, 0, floor($count/2));
    $lastHalf = array_slice($columnScores, floor($count/2));
    $trend = (array_sum($lastHalf) / (count($lastHalf) ?: 1)) - (array_sum($firstHalf) / (count($firstHalf) ?: 1));

    return [
        "avg_speed" => round($avgSpeed, 2),
        "accuracy_deviation" => round($stdDev, 2),
        "endurance_trend" => round($trend, 2),
        "recommendation" => ($avgSpeed > 10 && $stdDev < 6) ? "RECOMMENDED" : "REVIEW"
    ];
}

function calculateDISC($answers) {
    $most = ['D' => 0, 'I' => 0, 'S' => 0, 'C' => 0, 'Star' => 0];
    $least = ['D' => 0, 'I' => 0, 'S' => 0, 'C' => 0, 'Star' => 0];
    $mirror = ['D' => 0, 'I' => 0, 'S' => 0, 'C' => 0, 'Star' => 0];

    if (!is_array($answers)) return ["error" => "Invalid data format"];

    foreach ($answers as $ans) {
        if(isset($most[$ans['m']])) $most[$ans['m']]++;
        if(isset($least[$ans['l']])) $least[$ans['l']]++;
    }

    foreach (['D', 'I', 'S', 'C', 'Star'] as $key) {
        $mirror[$key] = $most[$key] - $least[$key];
    }

    return [
        "graph_1_mask" => $most,
        "graph_2_core" => $least,
        "graph_3_mirror" => $mirror
    ];
}
?>