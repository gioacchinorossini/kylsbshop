<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pCode = $_POST['pCode'];
    $pName = $_POST['pName'];
    $pCategory = $_POST['pCategory'];
    $pSP = $_POST['pSP'];
    $qty = $_POST['quantity'];

    $stmt = $conn->prepare("INSERT INTO stockin (Product_code, P_name, P_Category, P_S_P, Quantity) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssii", $pCode, $pName, $pCategory, $pSP, $qty);

    if ($stmt->execute()) {
        $response['success'] = true;
    } else {
        $response['message'] = "Database error: " . $conn->error;
    }
    $stmt->close();
}

$conn->close();
echo json_encode($response);
?>