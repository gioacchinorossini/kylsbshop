<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$sql = "SELECT 
            P_code, 
            Product_code, 
            P_name, 
            P_Category, 
            P_S_P, 
            P_P_P, 
            P_image, 
            DATE_FORMAT(Date_time, '%M %d, %Y %h:%i %p') AS Date_time 
        FROM Masterlist 
        ORDER BY Date_time DESC";

$result = $conn->query($sql);

$products = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}
echo json_encode($products);
?>