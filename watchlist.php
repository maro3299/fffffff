<?php
session_start();
header('Content-Type: application/json');

require_once('db.php');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// Create watchlist table if it doesn't exist
$createTableSQL = "CREATE TABLE IF NOT EXISTS watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_movie (user_id, movie_title)
)";

if (!$conn->query($createTableSQL)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create table']);
    exit;
}

switch ($action) {
    case 'get':
        $stmt = $conn->prepare("SELECT movie_title, added_at FROM watchlist WHERE user_id = ? ORDER BY added_at DESC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $watchlist = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['watchlist' => $watchlist]);
        break;

    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        $movieTitle = $data['movieTitle'] ?? '';

        if (!$movieTitle) {
            http_response_code(400);
            echo json_encode(['error' => 'Movie title is required']);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO watchlist (user_id, movie_title) VALUES (?, ?)");
        $stmt->bind_param("is", $userId, $movieTitle);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            if ($conn->errno === 1062) { // Duplicate entry
                http_response_code(409);
                echo json_encode(['error' => 'Movie already in watchlist']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add movie to watchlist']);
            }
        }
        break;

    case 'remove':
        $data = json_decode(file_get_contents('php://input'), true);
        $movieTitle = $data['movieTitle'] ?? '';

        if (!$movieTitle) {
            http_response_code(400);
            echo json_encode(['error' => 'Movie title is required']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM watchlist WHERE user_id = ? AND movie_title = ?");
        $stmt->bind_param("is", $userId, $movieTitle);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove movie from watchlist']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}