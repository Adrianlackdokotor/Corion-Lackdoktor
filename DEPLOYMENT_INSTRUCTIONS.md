# Deployment Instructions für IONOS

## Übersicht
Diese Anleitung beschreibt, wie Sie die Corion Lackdoktor Website mit funktionierendem Kontaktformular auf IONOS deployen.

## Voraussetzungen
- IONOS Hosting-Paket mit PHP-Unterstützung
- FTP/SFTP-Zugang zu Ihrem IONOS-Server
- Domain: www.corion-lackdoktor.de (bereits konfiguriert)

## Deployment-Schritte

### 1. Build der React-Anwendung erstellen
```bash
npm run build
```
Dies erstellt einen `dist/` Ordner mit allen optimierten Dateien.

### 2. Dateien auf IONOS hochladen

**Wichtig**: Die folgenden Dateien müssen in das Root-Verzeichnis Ihrer Domain hochgeladen werden:

#### Aus dem `dist/` Ordner:
- Alle Dateien aus `dist/client/` → Hochladen ins Web-Root (z.B. `/html/` oder `/public_html/`)
- `index.html`
- `assets/` Ordner (mit allen JavaScript, CSS und Bildern)
- `sitemap.xml`
- `robots.txt`
- `llm.txt`

#### Aus dem Projekt-Root:
- **`send_form.php`** → Hochladen ins Web-Root (gleiche Ebene wie index.html)

### 3. Verzeichnisstruktur auf IONOS
Nach dem Upload sollte die Struktur so aussehen:

```
/public_html/  (oder /html/)
├── index.html
├── send_form.php  ← WICHTIG!
├── sitemap.xml
├── robots.txt
├── llm.txt
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [weitere Assets]
└── [weitere Dateien]
```

### 4. PHP-Konfiguration prüfen

Stellen Sie sicher, dass:
- PHP auf dem IONOS-Server aktiviert ist
- Die `mail()` Funktion verfügbar ist (standardmäßig bei IONOS aktiviert)
- Dateirechte für `send_form.php` korrekt sind (644 oder 755)

### 5. Kontaktformular testen

Nach dem Deployment:
1. Besuchen Sie `https://www.corion-lackdoktor.de/kontakt`
2. Füllen Sie das Formular aus
3. Senden Sie eine Test-Nachricht
4. Prüfen Sie:
   - E-Mail an `coriongmbh@gmail.com` erhalten? ✅
   - Bestätigungs-E-Mail an Ihre Test-Adresse erhalten? ✅

## Funktionsweise des Kontaktformulars

### Frontend (React)
- **Datei**: `client/src/components/ContactForm.tsx`
- Validierung mit Zod
- Erstellt FormData mit PHP-kompatiblen Feldnamen
- Sendet POST-Request an `/send_form.php`

### Backend (PHP)
- **Datei**: `send_form.php`
- Empfängt: name, email, telefon, nachricht
- Sendet zwei E-Mails:
  1. Benachrichtigung an `coriongmbh@gmail.com`
  2. Bestätigung an Kunden
- Gibt JSON-Response zurück

### Feldmapping
| React Feld | PHP Parameter | Beschreibung |
|------------|---------------|--------------|
| name       | name          | Kundenname   |
| email      | email         | E-Mail       |
| phone      | telefon       | Telefonnummer|
| message    | nachricht     | Nachricht    |

## Wichtige Hinweise

### ⚠️ Development vs. Production
- **Replit (Development)**: Keine PHP-Unterstützung → Formular zeigt Fehler
- **IONOS (Production)**: PHP aktiviert → Formular funktioniert vollständig

### 📧 E-Mail-Empfänger
Aktuell konfiguriert:
- **Hauptempfänger**: coriongmbh@gmail.com
- **Absender (Bestätigung)**: Corion GmbH <coriongmbh@gmail.com>

Um die E-Mail-Adresse zu ändern, bearbeiten Sie in `send_form.php`:
```php
$to = "ihre-neue-email@domain.de";
```

### 🔒 Sicherheit
Das Formular enthält bereits:
- ✅ Input-Sanitization mit `htmlspecialchars()`
- ✅ E-Mail-Validierung
- ✅ Pflichtfeld-Prüfung
- ✅ Content-Type Header für UTF-8

### 🐛 Troubleshooting

**Problem**: Keine E-Mails werden empfangen
- Prüfen Sie Spam-Ordner
- Prüfen Sie IONOS PHP-Logs
- Kontaktieren Sie IONOS Support für mail() Funktion

**Problem**: "Fehler beim Senden" Meldung
- Prüfen Sie Dateirechte von `send_form.php` (sollte ausführbar sein)
- Prüfen Sie PHP-Fehlerlog auf dem Server
- Stellen Sie sicher, dass `send_form.php` im richtigen Verzeichnis liegt

**Problem**: 404 Fehler bei /send_form.php
- Stellen Sie sicher, dass die Datei im Web-Root liegt
- Prüfen Sie .htaccess Regeln (falls vorhanden)

## Weitere Features

### SEO & AI-Optimierung
Die Website enthält bereits:
- ✅ Sitemap.xml für Google
- ✅ robots.txt für Crawler
- ✅ llm.txt für AI-Systeme (ChatGPT, etc.)
- ✅ JSON-LD Schema Markup
- ✅ Meta Tags auf allen Seiten

### Dark Mode
- Automatische Erkennung der System-Präferenz
- Toggle in der Navigation
- Speicherung im localStorage

### AI Chat Widget
- Funktioniert ohne Backend
- Gespeichert im Browser localStorage
- Optional: OpenAI API Integration möglich

## Support

Bei Fragen oder Problemen:
- 📞 Telefon: 0176 834 582 74
- ✉️ E-Mail: coriongmbh@gmail.com

## Checkliste vor Go-Live

- [ ] Build erstellt (`npm run build`)
- [ ] Alle Dateien hochgeladen
- [ ] `send_form.php` im Root-Verzeichnis
- [ ] Domain korrekt konfiguriert
- [ ] SSL-Zertifikat aktiviert (https://)
- [ ] Kontaktformular getestet
- [ ] E-Mail-Empfang verifiziert
- [ ] Alle Seiten auf Funktionalität geprüft
- [ ] Mobile Ansicht getestet
- [ ] Google Analytics / Tracking konfiguriert (optional)

Viel Erfolg mit Ihrer neuen Website! 🚀
