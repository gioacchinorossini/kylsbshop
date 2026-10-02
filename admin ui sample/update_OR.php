<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$action = $_GET['action'] ?? '';

if ($action === 'update_metadata') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }

    $orderNo = $data['orderNo'];
    $type = $data['orderType'];
    $payment = $data['paymentMethod'];

    $stmt = $conn->prepare("UPDATE ORTB SET Order_Type = ?, Payment_Method = ? WHERE Order_No = ?");
    $stmt->bind_param("sss", $type, $payment, $orderNo);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();

} elseif ($action === 'delete_item') {
    $id = $_GET['id'] ?? '';
    $stmt = $conn->prepare("DELETE FROM ORTB WHERE OR_ID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();

} elseif ($action === 'delete_order') {
    $orderNo = $_GET['orderNo'] ?? '';
    $stmt = $conn->prepare("DELETE FROM ORTB WHERE Order_No = ?");
    $stmt->bind_param("s", $orderNo);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();
}

$conn->close();
?>