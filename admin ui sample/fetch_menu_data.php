<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

// Fetch products with their current stock levels
// stock = (total stock in) - (total sold)
$query = "
    SELECT 
        m.Product_code, 
        m.P_name, 
        m.P_Category, 
        m.P_S_P, 
        m.P_image,
        (IFNULL((SELECT SUM(s.Quantity) FROM stockin s WHERE s.Product_code = m.Product_code), 0) - 
         IFNULL((SELECT SUM(o.Quantity) FROM ortb o WHERE o.P_Code = m.Product_code), 0)) AS current_stock
    FROM masterlist m
";

$result = $conn->query($query);
$products = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $category = strtolower($row['P_Category']);
        if (!isset($products[$category])) {
            $products[$category] = [
                'label' => ucfirst($row['P_Category']),
                'icon' => getCategoryIcon($category),
                'sections' => [
                    'All ' . ucfirst($row['P_Category']) => []
                ]
            ];
        }
        
        $products[$category]['sections']['All ' . ucfirst($row['P_Category'])][] = [
            'id' => $row['Product_code'],
            'name' => $row['P_name'],
            'price' => (float)$row['P_S_P'],
            'status' => $row['current_stock'] > 0 ? 'available' : 'unavailable',
            'stock' => (int)$row['current_stock'],
            'image' => $row['P_image'] ? 'uploads/' . $row['P_image'] : null,
            'emoji' => getCategoryIcon($category)
        ];
    }
}

function getCategoryIcon($cat) {
    switch ($cat) {
        case 'coffee': return '☕';
        case 'others': return '❓';
        case 'bread': return '🥐';
        case 'pastries': return '🍰';
        case 'sandwich': return '🥪';
        case 'inasal': return '🍗';
        case 'drinks': return '🥤';
        case 'sizzling': return '🍳';
        case 'seafood': return '🐟';
        case 'shakes': return '🍹';
        case 'liquor': return '🍺';
        case 'appetizers': return '🍟';
        default: return '🍽️';
    }
}

echo json_encode($products);
$conn->close();
?>