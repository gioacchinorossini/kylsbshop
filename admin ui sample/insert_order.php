<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$orderNo       = $data['orderNo'];
$orderType     = $data['orderType'];
$paymentMethod = $data['paymentMethod'];
$refCode       = $data['refCode'] ?? null;
$cash          = (double)($data['cash'] ?? 0);
$change        = (double)($data['change'] ?? 0);
$items         = $data['items'];

$success = true;
$errorMsg = "";

// Prepare the statement once outside the loop
$stmt = $conn->prepare("INSERT INTO ORTB (Order_No, P_Code, Product_Name, Quantity, Price, SubTotal, Order_Type, Payment_Method, Ref_Code, Cash, `Change`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

// Bind variables by reference
// Types: s(Order_No), s(P_Code), s(Product_Name), i(Quantity), d(Price), d(SubTotal), s(Order_Type), s(Payment_Method), s(Ref_Code), d(Cash), d(Change)
$stmt->bind_param("sssiddsssdd", $orderNo, $pCode, $pName, $qty, $price, $subtotal, $orderType, $paymentMethod, $refCode, $cash, $change);

foreach ($items as $item) {
    $pCode    = $item['id'];
    $pName    = $item['name'];
    $qty      = (int)$item['qty'];
    $price    = (double)$item['price'];
    $subtotal = $qty * $price;

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