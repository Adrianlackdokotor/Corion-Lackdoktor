<?php
// === CONFIGURATION ===
$to = "coriongmbh@gmail.com";
$subject = "Neue Anfrage über das Kontaktformular – Corion GmbH";

// === INPUT SANITIZATION ===
$name = htmlspecialchars(trim($_POST['name'] ?? ''));
$email = htmlspecialchars(trim($_POST['email'] ?? ''));
$phone = htmlspecialchars(trim($_POST['telefon'] ?? ''));
$message = htmlspecialchars(trim($_POST['nachricht'] ?? ''));

if (empty($name) || empty($email) || empty($message)) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Bitte alle Pflichtfelder ausfüllen."]);
  exit;
}

// === EMAIL BODY (to Corion) ===
$body = "
Neue Nachricht über das Kontaktformular:

👤 Name: $name
📧 E-Mail: $email
📞 Telefon: $phone

📝 Nachricht:
$message
";

$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

// === SEND MAIN EMAIL ===
$success_main = mail($to, $subject, $body, $headers);

// === CONFIRMATION EMAIL TO CLIENT ===
$confirm_subject = "Bestätigung Ihrer Anfrage – Corion GmbH";
$confirm_message = "
Hallo $name,

vielen Dank für Ihre Nachricht an Corion GmbH!
Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.

📍 Standort Hofheim-Wallau  
📞 +49 176 83458274  
🌐 www.corion-gmbh.de  
✉️ E-Mail: coriongmbh@gmail.com  

Mit freundlichen Grüßen,  
Ihr Corion-Team
";

$confirm_headers = "From: Corion GmbH <coriongmbh@gmail.com>\r\n";
$confirm_headers .= "Reply-To: coriongmbh@gmail.com\r\n";
$confirm_headers .= "Content-Type: text/plain; charset=utf-8\r\n";

$success_client = mail($email, $confirm_subject, $confirm_message, $confirm_headers);

// === RESPONSE ===
if ($success_main && $success_client) {
  http_response_code(200);
  echo json_encode(["status" => "success", "message" => "Nachricht erfolgreich gesendet."]);
} else {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "Fehler beim Senden. Bitte versuchen Sie es erneut."]);
}
?>
