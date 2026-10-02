<?php
session_start();
require_once 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        header("Location: login.html?error=missing_fields");
        exit();
    }

    try {
        // Query the account table using User_ID
        // We use $conn from db_connection.php (MySQL)
        $stmt = $conn->prepare("SELECT Pass_Word, Role FROM account WHERE User_ID = ? LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        // Verify password using password_verify to match account.php hashing
        if ($user && password_verify($password, $user['Pass_Word'])) {
            $role = $user['Role'];
            $_SESSION['User_ID'] = $username;
            $_SESSION['role'] = $role;

            // Redirect based on Role
            if ($role === 'Admin') {
                header("Location: Masterlist.html");
            } elseif ($role === 'Cashier') {
                header("Location: order.html");
            } elseif ($role === 'Manager') {
                header("Location: ORTransactions.html");
            } else {
                header("Location: login.html?error=unknown_role");
            }
            exit();
        } else {
            // No match found
            header("Location: login.html?error=invalid_credentials");
            exit();
        }
    } catch (Exception $e) {
        header("Location: login.html?error=db_error");
        exit();
    }
} else {
    header("Location: login.html");
    exit();
}
?>