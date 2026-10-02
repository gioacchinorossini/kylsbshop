<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pCode = $_POST['pCode'];
    $pName = $_POST['pName'];
    $pCategory = $_POST['pCategory'];
    $pSP = $_POST['sellingPrice'];
    $pPP = $_POST['purchasePrice'];
    
    $imageName = null;
    if (isset($_FILES['pImage']) && $_FILES['pImage']['error'] === 0) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $extension = pathinfo($_FILES['pImage']['name'], PATHINFO_EXTENSION);
        // Combine Product Code and Name, then sanitize to remove special characters/spaces
        $sanitizedBaseName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $pCode . '_' . $pName);
        $imageName = $sanitizedBaseName . '.' . $extension;
        move_uploaded_file($_FILES['pImage']['tmp_name'], $uploadDir . $imageName);
    }

    $stmt = $conn->prepare("INSERT INTO Masterlist (Product_code, P_name, P_Category, P_S_P, P_P_P, P_image) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssiis", $pCode, $pName, $pCategory, $pSP, $pPP, $imageName);

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