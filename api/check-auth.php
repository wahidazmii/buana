<?php
require_once 'auth.php';

// If this reaches here without exiting, it means the token is valid
$user = protect();

echo json_encode([
    "valid" => true,
    "user" => [
        "id" => $user->id,
        "username" => $user->username,
        "name" => $user->name
    ]
]);
?>