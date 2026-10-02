<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $start = $_GET['startDate'] ?? '';
    $end = $_GET['endDate'] ?? '';

    $query = "SELECT Order_No, Date_Time, SUM(Quantity) as Total_Qty, SUM(SubTotal) as Total_Amount, Order_Type, Payment_Method 
              FROM ORTB";

    $conditions = [];
    if (!empty($start)) {
        $conditions[] = "Date_Time >= '$start 00:00:00'";
    }
    if (!empty($end)) {
        $conditions[] = "Date_Time <= '$end 23:59:59'";
    }

    if (count($conditions) > 0) {
        $query .= " WHERE " . implode(' AND ', $conditions);
    }

    $query .= " GROUP BY Order_No ORDER BY Date_Time DESC";

    $result = $conn->query($query);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $row['Total_Qty'] = (int)$row['Total_Qty'];
        $row['Total_Amount'] = (float)$row['Total_Amount'];
        $data[] = $row;
    }
    echo json_encode($data);

} elseif ($action === 'details') {
    $orderNo = $_GET['orderNo'] ?? '';
    $stmt = $conn->prepare("SELECT * FROM ORTB WHERE Order_No = ?");
    $stmt->bind_param("s", $orderNo);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['Price'] = (float)$row['Price'];
        $row['SubTotal'] = (float)$row['SubTotal'];
        $row['Cash'] = (float)($row['Cash'] ?? 0);
        $row['Change'] = (float)($row['Change'] ?? 0);
        $items[] = $row;
    }
    echo json_encode($items);
}

$conn->close();
?>