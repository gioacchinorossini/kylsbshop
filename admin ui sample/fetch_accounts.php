<?php
header('Content-Type: application/json');

// Database configuration
$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "sizgrillpos";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$result = $conn->query("SELECT ACC_ID, Acc_Name, User_ID, Role, Date_Time FROM account ORDER BY Date_Time DESC");
$accounts = [];

while($row = $result->fetch_assoc()) {
    $accounts[] = $row;
}

echo json_encode($accounts);
$conn->close();
?>