<?php
// Ustaw nagłówek odpowiedzi na text/plain
header('Content-Type: text/plain; charset=utf-8');

// Twój sekret i algorytm podpisu
$secret = 'Tp5Ji6Sw3Md8Yh3P@9I@9Rz2Mo8Fk5Of';
$algo = 'sha256';

// Plik logu do debugowania
$logFile = __DIR__ . '/debug_notify.log';

// Połączenie z bazą danych
$conn = new mysqli("localhost", "root", "Lenovo1nur", "wfo");

if ($conn->connect_error) {
    logDebug("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo "Database error";
    exit;
}

// Funkcja do logowania
function logDebug($msg) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}

// 1. Odbierz surowe dane z wejścia
$raw = file_get_contents('php://input');
logDebug("Webhook called");
logDebug("Raw POST: " . $raw);

// 2. Dekoduj JSON
$data = json_decode($raw, true);
if (!$data) {
    logDebug("Błędne dane JSON");
    http_response_code(400);
    echo "Błędne dane";
    exit;
}
logDebug("Decoded JSON: " . print_r($data, true));

// 3. Formatuj kwotę z dwoma miejscami po przecinku
$amountPaidFormatted = number_format((float)$data['amountPaid'], 2, '.', '');

// 4. Buduj string do podpisu
$signString = sprintf(
    "%s|%s|%s|%s|%s|%d|%s|%d",
    $secret,
    $data['transactionId'],
    $data['control'],
    $data['email'],
    $amountPaidFormatted,
    $data['notificationAttempt'],
    $data['paymentType'],
    $data['apiVersion']
);
logDebug("Sign string: " . $signString);

// 5. Oblicz podpis
$signatureCalc = hash($algo, $signString);
logDebug("Calculated signature: " . $signatureCalc);
logDebug("Received signature: " . $data['signature']);

// 6. Sprawdź podpis
if (!hash_equals($signatureCalc, $data['signature'])) {
    logDebug("Nieprawidłowy podpis!");
    http_response_code(403);
    echo "Nieprawidłowy podpis";
    exit;
}

// 7. Przetwórz dane kontrolne (format: user_id-movie_id)
$controlParts = explode('-', $data['control']);
if (count($controlParts) !== 2) {
    logDebug("Nieprawidłowy format danych kontrolnych");
    http_response_code(400);
    echo "Invalid control data";
    exit;
}

$userId = intval($controlParts[0]);
$movieId = intval($controlParts[1]);

// 8. Sprawdź czy tabela licencji istnieje, jeśli nie - utwórz ją
$createTableSQL = "CREATE TABLE IF NOT EXISTS movie_licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_movie (user_id, movie_id)
)";

if (!$conn->query($createTableSQL)) {
    logDebug("Error creating table: " . $conn->error);
    http_response_code(500);
    echo "Database error";
    exit;
}

// 9. Dodaj licencję do bazy danych
$stmt = $conn->prepare("INSERT INTO movie_licenses (user_id, movie_id, transaction_id) VALUES (?, ?, ?)");
if (!$stmt) {
    logDebug("Prepare failed: " . $conn->error);
    http_response_code(500);
    echo "Database error";
    exit;
}

$stmt->bind_param("iis", $userId, $movieId, $data['transactionId']);

try {
    $stmt->execute();
    logDebug("License added successfully for user $userId, movie $movieId");
} catch (Exception $e) {
    if ($conn->errno === 1062) { // Duplicate entry error
        logDebug("License already exists for user $userId, movie $movieId");
    } else {
        logDebug("Error adding license: " . $e->getMessage());
        http_response_code(500);
        echo "Database error";
        exit;
    }
}

// 10. Odpowiedz bramce sukcesem
http_response_code(200);
echo "OK";
logDebug("Response OK sent");
?>