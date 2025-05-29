<?php
$conn = new mysqli("localhost", "root", "Lenovo1nur", "wfo");

if ($conn->connect_error) {
    die("Błąd połączenia z bazą danych: " . $conn->connect_error);
}
?>