<?php
require_once 'db.php';
require_once 'auth.php';

// Protect all admin routes
$user = protect();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests (Fetch Modules)
if ($method === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM test_modules ORDER BY created_at DESC");
        $stmt->execute();
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parse JSON fields
        foreach ($modules as &$module) {
            $module['config'] = json_decode($module['config_json']);
            $module['questions'] = json_decode($module['questions_json']);
            $module['isActive'] = (bool) $module['is_active'];
            $module['questionCount'] = (int) $module['question_count'];
            unset($module['config_json']);
            unset($module['questions_json']);
            unset($module['is_active']);
            unset($module['question_count']);
        }

        echo json_encode($modules);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

// Handle POST requests (Create/Update Module)
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->title) || !isset($data->type)) {
        http_response_code(400);
        echo json_encode(["error" => "Incomplete data"]);
        exit();
    }

    try {
        $configJson = json_encode($data->config ?? new stdClass());
        $questionsJson = json_encode($data->questions ?? []);
        $isActive = $data->isActive ? 1 : 0;
        $questionCount = count($data->questions ?? []);

        // Check if module exists (update) or new (insert)
        // We use the ID from frontend if it exists and matches DB format, otherwise create new
        // Since frontend generates random IDs like 'tm-xyz', we need to check if we should INSERT or UPDATE

        // Strategy: Try to SELECT first. If exists, UPDATE. Else INSERT.
        // However, standard is: If new, ID might be temporary. Ideally backend assigns IDs.
        // But for this syncing, let's treat ID as primary key.

        $check = $conn->prepare("SELECT id FROM test_modules WHERE id = ?");
        $check->execute([$data->id]);
        $exists = $check->fetch();

        if ($exists) {
            $stmt = $conn->prepare("UPDATE test_modules SET title = ?, type = ?, config_json = ?, questions_json = ?, is_active = ?, question_count = ? WHERE id = ?");
            $stmt->execute([
                $data->title,
                $data->type,
                $configJson,
                $questionsJson,
                $isActive,
                $questionCount,
                $data->id
            ]);
        } else {
            $stmt = $conn->prepare("INSERT INTO test_modules (id, title, type, config_json, questions_json, is_active, question_count) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data->id,
                $data->title,
                $data->type,
                $configJson,
                $questionsJson,
                $isActive,
                $questionCount
            ]);
        }

        echo json_encode(["message" => "Module saved successfully", "id" => $data->id]);

    } catch (Exception $e) {
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
        $stmt = $conn->prepare("DELETE FROM test_modules WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Module deleted"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>