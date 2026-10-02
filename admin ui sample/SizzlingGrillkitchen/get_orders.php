<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db_connection.php';

// Fetch all orders from the database, oldest first so kitchen prioritizes them
$sql = "SELECT Order_no, table_number, name_of_order, ITEM, order_status, date_and_time 
        FROM Orders 
        ORDER BY date_and_time ASC, OID_no ASC";

$result = $conn->query($sql);

$ordersGrouped = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $orderNo = $row['Order_no'];
        if (!isset($ordersGrouped[$orderNo])) {
            $ordersGrouped[$orderNo] = [
                'order_no' => $orderNo,
                'table_number' => $row['table_number'],
                'status' => $row['order_status'] ? $row['order_status'] : 'Pending',
                'date_and_time' => $row['date_and_time'],
                'items' => []
            ];
        }
        $ordersGrouped[$orderNo]['items'][] = [
            'name' => $row['name_of_order'],
            'qty' => (int)$row['ITEM']
        ];
    }
}

echo json_encode(array_values($ordersGrouped));
$conn->close();
?>
