<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$orderNo     = $data['orderNo'];
$tableNumber = $data['tableNumber'] ?? '';

if (empty($tableNumber)) {
    if (preg_match('/^T(\d+)-/', $orderNo, $matches)) {
        $tableNumber = $matches[1];
    } else {
        $tableNumber = 'N/A';
    }
}

$items = $data['items'];

$success = true;
$errorMsg = "";

// Prepare the statement for Orders table
$stmt = $conn->prepare("INSERT INTO Orders (Order_no, table_number, name_of_order, ITEM, price, subtotal, date_and_time) VALUES (?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("sssidds", $orderNo, $tableNumber, $pName, $qty, $price, $subtotal, $dateTime);

$dateTime = date('Y-m-d H:i:s');

foreach ($items as $item) {
    $qty      = (int)$item['qty'];
    $price    = (double)$item['price'];
    $subtotal = $qty * $price;
    $pName    = $item['name'];

    if (!$stmt->execute()) {
        $success = false;
        $errorMsg = $stmt->error;
        break; // Stop loop on first error
    }
}

if ($success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $errorMsg]);
}

$stmt->close();
$conn->close();
?>
