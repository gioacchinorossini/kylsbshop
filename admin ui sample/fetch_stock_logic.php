<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$action = $_GET['action'] ?? '';

if ($action === 'get_categories') {
    $sql = "SELECT DISTINCT P_Category FROM Masterlist ORDER BY P_Category ASC";
    $result = $conn->query($sql);
    $categories = [];
    while($row = $result->fetch_assoc()) {
        $categories[] = $row['P_Category'];
    }
    echo json_encode($categories);
} 
elseif ($action === 'get_products' && isset($_GET['category'])) {
    $category = $_GET['category'];
    $stmt = $conn->prepare("SELECT Product_code, P_name, P_S_P FROM Masterlist WHERE P_Category = ? ORDER BY P_name ASC");
    $stmt->bind_param("s", $category);
    $stmt->execute();
    $result = $stmt->get_result();
    $products = [];
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode($products);
}
elseif ($action === 'get_history') {
    $sql = "SELECT Sin_ID, DATE_FORMAT(Date_time, '%M %d, %Y %h:%i %p') AS Date_time, Product_code, P_name, Quantity FROM stockin ORDER BY Sin_ID DESC";
    $result = $conn->query($sql);
    $history = [];
    while($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
    echo json_encode($history);
}
$conn->close();
?>