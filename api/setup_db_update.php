<?php
require_once 'db.php';

try {
    $conn->exec("ALTER TABLE participants ADD COLUMN ai_report TEXT");
    echo "Column ai_report added successfully.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Column ai_report already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>