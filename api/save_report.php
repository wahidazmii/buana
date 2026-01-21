<?php
require_once 'db.php';
require_once 'auth.php';

// Protect route
$user = protect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->participantId) || !isset($data->aiReport) || !isset($data->recommendation)) {
        http_response_code(400);
        echo json_encode(["error" => "Incomplete data"]);
        exit();
    }

    try {
        // Update participants table with ai_report and ai_recommendation
        // Using `ai_report` column which we added in schema
        $stmt = $conn->prepare("UPDATE participants SET ai_report = ?, ai_recommendation = ? WHERE id = ?");
        // Encode report as JSON string
        $reportJson = json_encode($data->aiReport);

        $stmt->execute([
            $reportJson,
            $data->recommendation,
            $data->participantId
        ]);

        echo json_encode(["message" => "Report saved successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    // If we wanted to Fetch specifically just the report, we could do GET here,
    // but typically we fetch the full candidate list which includes it.
    http_response_code(405);
}
?>