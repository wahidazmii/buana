<?php
require_once 'db.php';

// Simple JWT-like token implementation (for demonstration, in production use a library)
function generateToken($payload)
{
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    // In a real app, use a secure secret from .env
    $secret = "BUANA_SECRET_KEY_2026";
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken($token)
{
    $parts = explode('.', $token);
    if (count($parts) !== 3)
        return false;

    list($header, $payload, $signature) = $parts;
    $secret = "BUANA_SECRET_KEY_2026";

    $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $header . "." . $payload, $secret, true)));

    if ($signature !== $validSignature)
        return false;

    return json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (isset($data->action) && $data->action === 'login') {
        if (!isset($data->username) || !isset($data->password)) {
            http_response_code(400);
            echo json_encode(["error" => "Username and password required"]);
            exit();
        }

        $stmt = $conn->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$data->username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($data->password, $admin['password'])) {
            $token = generateToken([
                "id" => $admin['id'],
                "username" => $admin['username'],
                "name" => $admin['name'],
                "exp" => time() + (24 * 60 * 60) // 24 hours
            ]);

            echo json_encode([
                "token" => $token,
                "user" => [
                    "id" => $admin['id'],
                    "username" => $admin['username'],
                    "name" => $admin['name']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid credentials"]);
        }
        exit();
    }
}

// Middleware to protect routes
function protect()
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $userData = verifyToken($token);

        if ($userData && $userData->exp > time()) {
            return $userData;
        }
    }

    http_response_code(401);
    echo json_encode(["error" => "Unauthorized access"]);
    exit();
}
?>