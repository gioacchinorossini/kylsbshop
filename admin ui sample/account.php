<?php
header('Content-Type: application/json');

// Database configuration
$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "sizgrillpos"; // Ensure this matches your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Set time zone as requested
$conn->query("SET time_zone = '+08:00'");

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($data)) {
    $action = $data['action'] ?? 'insert'; // Default to insert if action is not specified
    $accName = $data['accountName'] ?? '';
    $userId = $data['userName'] ?? '';
    $role = $data['role'] ?? '';
    $passWord = $data['password'] ?? ''; // Password might be empty for updates

    if ($action === 'insert') {
        if (empty($passWord)) {
            echo json_encode(["success" => false, "message" => "Password cannot be empty for new accounts."]);
            $conn->close();
            exit();
        }
        $hashedPassword = password_hash($passWord, PASSWORD_DEFAULT); // Secure hashing
        $stmt = $conn->prepare("INSERT INTO account (Acc_Name, User_ID, Pass_Word, Role) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $accName, $userId, $hashedPassword, $role);
    } elseif ($action === 'update') {
        $accId = $data['accId'] ?? null;
        if (empty($accId)) {
            echo json_encode(["success" => false, "message" => "Account ID is required for updating."]);
            $conn->close();
            exit();
        }

        $queryParts = ["Acc_Name = ?", "User_ID = ?", "Role = ?"];
        $params = [$accName, $userId, $role];
        $types = "sss";

        if (!empty($passWord)) {
            $hashedPassword = password_hash($passWord, PASSWORD_DEFAULT);
            $queryParts[] = "Pass_Word = ?";
            $params[] = $hashedPassword;
            $types .= "s";
        }

        $query = "UPDATE account SET " . implode(", ", $queryParts) . " WHERE ACC_ID = ?";
        $params[] = $accId;
        $types .= "i"; // ACC_ID is INT

        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        $conn->close();
        exit();
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Account " . ($action === 'insert' ? "created" : "updated") . " successfully!"]);
    } else {
        if ($conn->errno === 1062) {
            echo json_encode(["success" => false, "message" => "Error: User ID already exists."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error: " . $stmt->error]);
        }
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method or data."]);
}

$conn->close();
?>