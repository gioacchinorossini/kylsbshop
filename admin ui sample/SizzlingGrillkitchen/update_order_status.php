<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);

$orderNo = isset($data['order_no']) ? $data['order_no'] : (isset($_POST['order_no']) ? $_POST['order_no'] : '');
$status = isset($data['status']) ? $data['status'] : (isset($_POST['status']) ? $_POST['status'] : '');

if (empty($orderNo) || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Missing order_no or status']);
    exit;
}

$conn->begin_transaction();

try {
    if (strcasecmp($status, 'Archive') === 0) {
        // Check if already inserted to avoid duplicate entries
        $checkStmt = $conn->prepare("SELECT COUNT(*) FROM complitorder WHERE Order_no = ?");
        if (!$checkStmt) {
            throw new Exception('Prepare check failed: ' . $conn->error);
        }
        $checkStmt->bind_param("s", $orderNo);
        $checkStmt->execute();
        $checkStmt->bind_result($count);
        $checkStmt->fetch();
        $checkStmt->close();

        if ($count == 0) {
            $insertStmt = $conn->prepare("INSERT INTO complitorder (Order_no, table_number, name_of_order, ITEM) 
                                          SELECT Order_no, table_number, name_of_order, ITEM 
                                          FROM Orders WHERE Order_no = ?");
            if (!$insertStmt) {
                throw new Exception('Prepare insert failed: ' . $conn->error);
            }
            $insertStmt->bind_param("s", $orderNo);
            if (!$insertStmt->execute()) {
                throw new Exception('Execute insert failed: ' . $insertStmt->error);
            }
            $insertStmt->close();
        }

        // Delete from active Orders table
        $deleteStmt = $conn->prepare("DELETE FROM Orders WHERE Order_no = ?");
        if (!$deleteStmt) {
            throw new Exception('Prepare delete failed: ' . $conn->error);
        }
        $deleteStmt->bind_param("s", $orderNo);
        if (!$deleteStmt->execute()) {
            throw new Exception('Execute delete failed: ' . $deleteStmt->error);
        }
        $deleteStmt->close();
    } else {
        $stmt = $conn->prepare("UPDATE Orders SET order_status = ? WHERE Order_no = ?");
        if (!$stmt) {
            throw new Exception('Prepare update failed: ' . $conn->error);
        }
        
        $stmt->bind_param("ss", $status, $orderNo);
        if (!$stmt->execute()) {
            throw new Exception('Execute update failed: ' . $stmt->error);
        }
        $stmt->close();
    }

    $conn->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
