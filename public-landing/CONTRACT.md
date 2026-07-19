# Public intake contract

## Endpoint

`POST https://app.corion.app/api/client/submit-request`

`Content-Type: application/json`

CORS este permis numai pentru `https://corion.app` și `https://www.corion.app`.

## Request

Obligatoriu:

- `damageDescription`: string, 5–2000 caractere
- cel puțin unul dintre:
  - `customerEmail`: adresă validă, maximum 254 caractere
  - `customerPhone`: string, 3–50 caractere

Opțional:

- `customerName`: string, 1–200; implicit `Unbekannt`
- `vehicleMake`: maximum 100
- `vehicleModel`: maximum 100
- `vehiclePlate`: maximum 20
- `vehicleColor`: maximum 50
- `journeyType`: maximum 50
- `customerPriority`: maximum 50
- `preferredContact`: `whatsapp`, `phone` sau `email`
- `desiredTiming`: maximum 200
- `conversationTranscript`: maximum 24 mesaje `{ role: "assistant" | "user", content }`; fiecare mesaj are maximum 1000 caractere
- `files`: maximum 10 fișiere

Fiecare fișier este transmis ca:

```json
{
  "name": "schaden.png",
  "type": "image/png",
  "size": 12345,
  "data": "BASE64_FARA_PREFIX_DATA_URL"
}
```

Limite aplicate de backend pe conținutul base64 decodat:

- 10 MB/fișier
- 50 MB total
- extensii permise: jpg, jpeg, png, webp, heic, gif, bmp, tiff, tif, pdf,
  doc, docx, xls, xlsx, csv, txt, zip, rar și 7z

## Canonical behavior

Ruta apelează `executeIntake()` cu `intakeSource: client_submission`.

Rezultatul creează:

- un rând real în `workshop_orders`
- câte un rând în `file_attachments` pentru fișierele procesate
- folderul local canonic
- folderul și fișierele Drive când OAuth este disponibil
- transcriptul conversației de landing în `workshop_orders.repair_protocol_json.intakeConversation`

Nu creează programare fără slot; `intakeResult.pendingSteps` conține `scheduling`.
Nu creează automat cont client.

## Success response

HTTP `201` cu:

- `order.id`
- `order.referenceNumber`
- `intakeResult.orderId`
- `intakeResult.referenceNumber`
- `intakeResult.attachmentsCreated`
- `intakeResult.pendingSteps`
- `message`

Landing-ul afișează succes numai dacă primește `order.referenceNumber` sau
`intakeResult.referenceNumber`.
