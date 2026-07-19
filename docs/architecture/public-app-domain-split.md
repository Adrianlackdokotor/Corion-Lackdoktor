# Corion three-domain web strategy

## Decizia fixă

- `corion.app` este front door-ul modern: landing, intake, SEO și campanii.
- `corion-lackdoktor.de` este site-ul business complet și identitatea Lackdoktor consacrată.
- `app.corion.app` este aplicația Corion și API-ul canonic, rulate pe Mac mini.
- IONOS nu rulează Express, baza de date, autentificarea sau workflow-urile Corion.
- Orice intake public este trimis către `app.corion.app` și intră prin `executeIntake()`.

Aceasta este o strategie de cooperare între domenii, nu o înlocuire a site-ului
`corion-lackdoktor.de` cu `corion.app`.

## Modern front door — corion.app

### Pachetul de lansare imediată

Director canonic pentru publicare: `public-landing/`.

Conține:
- landing simplu și rapid pentru trafic direct, SEO și ads
- promisiunea Corion pe scurt
- formular de cerere ofertă
- text, contact, vehicul opțional și upload foto/documente
- SEO public minim (`robots.txt`, `sitemap.xml`)
- link către site-ul Lackdoktor pentru servicii, locații și încredere extinsă
- link către `app.corion.app` pentru login

Nu conține și nu trebuie să primească:
- login sau session cookies
- dashboard-uri admin/partner/client
- API Express
- PostgreSQL sau Drizzle
- Google OAuth/token storage
- Telegram webhook
- Drive, calendar, finance sau task bus
- `send_form.php` ca intake alternativ

## Business and trust website — corion-lackdoktor.de

Site-ul business complet rămâne casa potrivită pentru:

- `/kontakt`, `/contact`
- `/uber-uns`
- `/standorte`
- `/faq`
- `/galerie`
- `/bewertungen`
- `/gutachter`
- `/academy` și cursurile publice
- `/franchise`, `/partner-flyer`
- `/blog` și articolele
- `/leistungen/*`
- `/partner/:slug` profil public
- `/impressum`, `/datenschutz`, `/cookies`
- contactul business clasic
- paginile juridice: Impressum, Datenschutz și Cookies
- conținut local și reputațional deja indexat

Componentele React asociate acestor suprafețe rămân sursă pentru site-ul business:

- `Header`, `Footer`, `MobileStickyFooter`
- `Hero`, `ServiceCard`, `LocationCard`, `ContactForm`
- `FeaturedTestimonials`, `GoogleReviews`, `Gallery` components
- `SEO`, `CookieConsent`, `FloatingWhatsApp`

Aceste pagini nu trebuie mutate automat pe `corion.app`. Front door-ul poate trimite
utilizatorul către site-ul business când are nevoie de dovezi, servicii, locații sau
detalii, fără să dubleze întregul conținut.

## Real app layer — app.corion.app / Mac mini

### Identitate și acces

- `/`, `/login`, `/forgot-password`, `/reset-password`
- `/onboarding`
- `/privacy-admin`

### Auftrag și atelier

- `/admin`, `/admin/*`
- `/auftraege`
- `/workshop`, `/workshop/auftrag/:id`
- `/repair-order`, `/reception`
- `/hub/intake`, `/hub/auftrag`

### Partner/client operations

- `/partner`, `/partner/dashboard`, `/partner/onboarding`
- `/partner/workshop-orders`, `/partner/legacy`, `/partner-hub`
- `/client`, `/client/new-request`

`/client/new-request` rămâne legacy deoarece folosește `repair_requests`; nu este
traseul public canonic nou.

### Finance, calendar, tasks și agenți

- `/admin/calendar`, `/hub/scheduler`
- `/finanzen`, `/finanzen/detail`, `/hub/finance`, `/cfo-inbox`, `/contabil-ai`
- `/tasks`, `/admin/agent-tasks`, `/admin/agents`, `/admin/comms`, `/agent-hub`
- `/wallet`

### Hub+1 și zone mixte

- `/portal`, `/hub/*`, `/hub`
- `/gutachter-funnel`

Acestea rămân pe Mac mini până când rolul lor public versus autentificat este decis.
Nu blochează lansarea landing-ului minimal.

### Runtime obligatoriu pe Mac mini

- toate rutele `/api/*`
- Passport/session și autorizarea
- PostgreSQL și `shared/schema.ts`
- `executeIntake()` și `workshop_orders`
- `processAttachments()` și `file_attachments`
- Drive/Calendar OAuth și tokenurile locale
- Telegram webhook
- task bus, notificări, finance și schedulers
- uploads și directoarele operaționale locale

## Contractul dintre domenii

Landing-ul poate apela numai endpoint-ul public:

`POST https://app.corion.app/api/client/submit-request`

CORS este permis numai pentru `https://corion.app` și `https://www.corion.app` pe
acest endpoint. Nu se activează CORS pentru dashboard-uri sau restul API-ului.

Răspunsul este considerat succes numai dacă include `referenceNumber` provenit din
Auftrag-ul creat. Programarea rămâne `pendingSteps: scheduling` până la un slot real.

Legături recomandate:

- `corion.app` → `corion-lackdoktor.de` pentru servicii, locații, reputație și legal
- `corion.app` → `app.corion.app/login` pentru utilizatori existenți
- `corion-lackdoktor.de` → `corion.app` pentru CTA-ul modern de foto-intake
- ambele suprafețe publice → același endpoint canonic de pe `app.corion.app`

## Ordinea implementării

1. Build și pornire production pe Mac mini.
2. Reverse proxy/TLS/DNS pentru `app.corion.app`.
3. Test login, health și intake direct pe `app.corion.app`.
4. Configurare Google callback și Telegram webhook live.
5. Upload `public-landing/` pe IONOS și DNS/TLS pentru `corion.app`.
6. Test cross-origin complet cu Auftrag și atașamente reale.
7. Adăugare CTA de intake pe `corion-lackdoktor.de`, fără duplicarea backend-ului.
8. Extinderea `corion.app` numai cu pagini de campanie care au un scop clar.
