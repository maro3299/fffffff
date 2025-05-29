<?php
// Disable error output to response
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
session_start();
require_once('db.php');

$login = $_POST['login'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$login || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Brakuje danych']);
    exit;
}

// Validate password
if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Hasło musi zawierać minimum 8 znaków, w tym jedną dużą literę, jedną małą literę oraz jedną cyfrę']);
    exit;
}

try {
    // Sprawdź, czy użytkownik już istnieje
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    if (!$stmt) {
        throw new Exception('Błąd SQL przy SELECT: ' . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'E-mail już istnieje']);
        exit;
    }

    // Dodaj nowego użytkownika
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (login, email, password) VALUES (?, ?, ?)");
    if (!$stmt) {
        throw new Exception('Błąd SQL przy INSERT: ' . $conn->error);
    }
    
    $stmt->bind_param("sss", $login, $email, $hashed);

    if ($stmt->execute()) {
        $_SESSION['email'] = $email;
        echo json_encode([
            'user' => ['login' => $login, 'email' => $email],
            'token' => session_id()
        ]);
    } else {
        throw new Exception('Nie udało się dodać użytkownika');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>