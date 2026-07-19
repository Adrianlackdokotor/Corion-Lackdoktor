import { jsPDF } from "jspdf";

export type ContractLanguage = "de" | "en" | "ro" | "es";
export type FranchiseModel = "B" | "C";

export interface ContractFields {
  partnerCompany: string;
  partnerRepresentative: string;
  partnerAddress: string;
  partnerTaxNumber: string;
  partnerEmail: string;
  partnerPhone: string;
  contractDate: string;
  startDate: string;
  model: FranchiseModel;
  onboardingFeeEur: number;
  materialDeductionPct: number;
  paymentDays: number;
}

export const DEFAULT_CONTRACT_FIELDS: ContractFields = {
  partnerCompany: "",
  partnerRepresentative: "",
  partnerAddress: "",
  partnerTaxNumber: "",
  partnerEmail: "",
  partnerPhone: "",
  contractDate: new Date().toISOString().slice(0, 10),
  startDate: new Date().toISOString().slice(0, 10),
  model: "B",
  onboardingFeeEur: 300,
  materialDeductionPct: 20,
  paymentDays: 5,
};

const CORION = {
  name: "Corion GmbH",
  brand: "+1 Corion Lackdoktor",
  rep: "Adrian Apostol",
  address: "Nassaustr. 41, 65719 Hofheim am Taunus, Deutschland",
  email: "kontakt@corion-lackdoktor.de",
};

function transliterate(s: string): string {
  return (s || "")
    .replace(/ă/g, "a").replace(/Ă/g, "A")
    .replace(/â/g, "a").replace(/Â/g, "A")
    .replace(/î/g, "i").replace(/Î/g, "I")
    .replace(/ș/g, "s").replace(/Ș/g, "S").replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ț/g, "t").replace(/Ț/g, "T").replace(/ţ/g, "t").replace(/Ţ/g, "T");
}

interface I18n {
  title: string;
  subtitle: string;
  parties: string;
  franchisor: string;
  franchisee: string;
  represented: string;
  email: string;
  phone: string;
  taxNumber: string;
  address: string;
  sections: { h: string; body: string[] }[];
  signatures: string;
  forFranchisor: string;
  forFranchisee: string;
  date: string;
  generatedOn: string;
  place: string;
}

function buildI18n(f: ContractFields): Record<ContractLanguage, I18n> {
  const fee = f.onboardingFeeEur;
  const bde = f.materialDeductionPct;
  const pdays = f.paymentDays;

  // ============================================================
  // ROMÂNĂ — TEXT INTEGRAL ORIGINAL (Model B + Model C)
  // ============================================================
  const ro: I18n = {
    title: "CONTRACT DE COOPERARE ȘI FRANCIZĂ",
    subtitle: "Modele de operare: Modelul C (40/60) și Modelul B (60/40)",
    parties: "Părțile contractante",
    franchisor: "Comitent / Francizor",
    franchisee: "Partener / Francizat",
    represented: "reprezentat prin",
    email: "Email",
    phone: "Telefon",
    taxNumber: "Cod fiscal / USt-ID",
    address: "Adresă",
    place: "Locul, Data",
    sections: [
      { h: "§ 1 Obiectul Contractului și Autonomia Partenerului", body: [
        `1. Partenerul prestează, în calitate de antreprenor independent (selbstständiger Unternehmer), servicii de meșteșugărie în domeniul vopsitoriei auto, smart-repair și reparații pentru clienții intermediati de Corion GmbH, precum și pentru propriii săi clienți.`,
        `2. Corion GmbH pune la dispoziția Partenerului spațiul de lucru (atelierul), precum și sculele și utilajele necesare pentru executarea lucrărilor.`,
        `3. Autonomie și independență: Partenerul acționează în nume propriu și pe cont propriu, purtând riscul antreprenorial integral pentru serviciile prestate. Partenerul este liber să își stabilească programul de lucru (cu respectarea termenelor de predare convenite cu clienții) și să își organizeze activitatea. Partenerul are dreptul să utilizeze propriii angajați sau subcontractori, pe propria răspundere, cu respectarea normelor de acces și securitate în atelierul Corion GmbH. Exclusivitatea se referă strict la concentrarea pe calitatea execuției în timpul prezenței în atelier, nu la o dependență economică exclusivă față de Corion GmbH.`,
      ]},
      { h: "§ 2 Onboarding, Autorizații (Handwerksrecht) și Capital de Start", body: [
        `1. Taxa de onboarding: La încheierea contractului, se va achita o taxă unică de onboarding în valoare de ${fee},00 EUR (net), scadentă la emiterea facturii.`,
        `2. Servicii administrative: La cererea Partenerului, Corion GmbH poate facilita asistența administrativă. Taxa de onboarding acoperă costurile de procesare pentru: înregistrarea domiciliului (Anmeldung), înregistrarea activității comerciale (Gewerbeanmeldung), asistență pentru deschiderea unui cont bancar, înregistrarea la casa de asigurări de sănătate (Krankenkasse), precum și configurarea profilului în CorionOS. Aceste servicii reprezintă exclusiv suport administrativ și nu constituie consultanță fiscală sau juridică.`,
        `3. Calificări și Handwerksrecht: Partenerul garantează că deține calificările necesare și se obligă să îndeplinească toate cerințele legale pentru exercitarea meseriei (de exemplu, înscrierea în Handwerksrolle sau obținerea unei Ausnahmebewilligung de la HWK, dacă este cazul). Corion GmbH nu răspunde pentru lipsa autorizațiilor Partenerului.`,
      ]},
      { h: "§ 3 Modele de Remunerație (Modelul C și Modelul B), Decontare și Costuri Materiale", body: [
        `1. Definirea Modelelor de Colaborare: În cadrul acestui contract se aplică două modele de distribuție a veniturilor, în funcție de proveniența clientului, astfel:`,
        `Modelul C (Full-Service / Comenzi Corion): Se aplică clienților aduși, programați și administrați de Corion GmbH. Distribuția procentuală din manopera netă este 40% pentru Partener (pentru execuția meșteșugărească) și 60% pentru Corion GmbH (pentru management, infrastructură, marketing și atragere clienți).`,
        `Modelul B (Clienți Proprii): Se aplică clienților aduși direct de către Partener, care nu provin din canalele Corion GmbH. Distribuția procentuală din manopera netă este 60% pentru Partener (pentru execuție și atragerea clientului) și 40% pentru Corion GmbH (pentru utilizarea locației, sculelor, utilităților și infrastructurii).`,
        `2. Cotele pentru Modelul C (Comenzi Corion): Pentru comenzile încadrate la Modelul C, Partenerul primește 40 % din valoarea netă a manoperei (timpul de lucru efectiv / execuția brută, exclusiv piese și materiale care se facturează separat) facturată clientului final. Restul de 60 % revine companiei Corion GmbH (acoperind utilizarea spațiului, sculelor, marketingul, utilizarea CorionOS, facturarea și recuperarea creanțelor).`,
        `3. Costurile materialelor (Deducerea Paușală / BDE): Indiferent de modelul aplicat (B sau C), în cazul în care materialele nu sunt facturate direct și separat către client, ci la un preț paușal (global), un procent aferent materialelor consumate va fi dedus din valoarea totală a manoperei, înainte de a se aplica împărțirea procentuală. În prezent, acest procent de deducere pentru materiale este stabilit la ${bde}%. Această deducere automată se bazează pe sistemul intern de normare (cunoscut ca BDE - Betriebsdatenerfassung) și va fi actualizată la fiecare 6 luni pentru a reflecta consumul real. Partenerul are posibilitatea de a opta pentru utilizarea propriilor materiale (situație în care deducerea procentuală nu se mai aplică), cu condiția obligatorie a respectării stricte a standardelor de calitate Corion GmbH și a asumării integrale a garanției oferite clienților. Partenerul are dreptul la o raportare transparentă a acestor deduceri (detalii specifice pentru Modelul B se regăsesc la § 5).`,
        `4. Decontare: Decontarea și plata cotelor se vor face periodic (de exemplu, lunar), în baza rapoartelor generate de CorionOS și a facturilor emise de Partener.`,
      ]},
      { h: "§ 4 Categorii de clienți, Reprezentant Corion, Walk-in și Decontare pentru Clienți Proprii (Modelul B)", body: [
        `(1) Definiții: a) „Comenzi Corion” = comenzi/lucrări pentru care clientul a fost achiziționat, ofertat, programat, administrat sau facturat de Corion GmbH (inclusiv prin marketing Corion, parteneriate, platforme, telefon/email Corion, sistemele digitale Corion/CorionOS sau alte canale gestionate de Corion GmbH). b) „Clienți proprii ai Partenerului” = clienți aduși de Partener, care nu provin din canalele Corion GmbH și care sunt notificați în Textform (ex. email/WhatsApp) către Corion GmbH înainte de începerea lucrării, cu minimum următoarele date: nume client, date de contact, nr. înmatriculare (dacă există), descriere lucrare, data/ora programării. c) „Walk-in / Locație” = client care se prezintă la locația Corion GmbH fără dovadă de lead anterior, fără programare/înregistrare în sistemele Corion GmbH și fără notificare prealabilă conform lit. b). d) „Textform” = comunicare în formă text (ex. email, WhatsApp, SMS) care permite identificarea expeditorului și păstrarea mesajului.`,
        `(2) Reprezentant Corion (Corion-Vertreter): a) „Reprezentant Corion” este orice persoană (sau sistem) desemnată în mod expres de Corion GmbH pentru gestionarea interacțiunii cu clientul (în special: recepție, constatare, ofertare, programare, primire/predare, facturare/încasare), inclusiv: Administratorul (Geschäftsführer), asociați (Gesellschafter), angajați ai Corion GmbH; și/sau persoane terțe (inclusiv subcontractori / prestatori externi) și sisteme automatizate (inclusiv agenți AI) care acționează în numele Corion GmbH pe baza unui mandat/contract sau a unei implementări tehnice (Beauftragte/Erfüllungsgehilfe). b) Desemnarea / actualizarea Reprezentanților Corion se poate face și prin notificare în Textform către Partener (ex. listă de persoane + date de contact).`,
        `(3) Disponibilitatea Reprezentantului Corion: Un Reprezentant Corion este considerat „disponibil” dacă sunt îndeplinite cumulativ următoarele condiții: este prezent fizic la locație sau poate prelua clientul imediat prin telefon/video; și poate începe gestionarea walk-in în maximum 10 minute de la solicitarea Partenerului; și Partenerul a solicitat preluarea printr-un canal verificabil (apel telefonic sau mesaj în Textform). Dacă aceste condiții nu sunt îndeplinite, Reprezentantul Corion este considerat „nedisponibil” în sensul prezentului § 4.`,
        `(4) Reguli de alocare (Lead-Regelung): a) Comenzile Corion se decontează conform § 3 al contractului pe baza Modelului C (40% Partener / 60% Corion GmbH). b) Clienții proprii ai Partenerului pot fi executați în locația Corion GmbH cu respectarea alin. (1) lit. b) și a regulilor operaționale (capacitate atelier, programare, securitate și sănătate în muncă). Decontarea se face conform alin. (6) pe baza Modelului B (60% Partener / 40% Corion GmbH). c) Walk-in / Locație: dacă există un Reprezentant Corion disponibil (alin. 3) → walk-in se tratează ca Comandă Corion (decontare § 3 – Modelul C); dacă nu există un Reprezentant Corion disponibil → se aplică alin. (5) (Excepția walk-in procesat de Partener în nume propriu). d) Sarcina probei: dovada că un client este „client propriu” revine Partenerului (prin notificarea prealabilă în Textform conform alin. (1) lit. b) sau prin procedura alin. (5)).`,
        `(5) Excepție Walk-in — Partenerul preia complet în nume propriu (primire/predare + facturare + încasare): Dacă la momentul prezentării unui walk-in nu există un Reprezentant Corion disponibil (alin. 3), Partenerul poate prelua walk-in ca client propriu, cu condiția să gestioneze integral în nume propriu: primirea, comunicarea, predarea, facturarea și încasarea. Condiții cumulative: a) Partenerul transmite către Corion GmbH în aceeași zi (cel târziu până la ora 20:00) o notificare în Textform cu: nume client, contact, data/ora sosirii, descriere lucrare, valoare estimată. b) Partenerul emite factura către client și încasează în nume propriu. c) Partenerul decontează către Corion GmbH cota de 40% aferentă Modelului B conform alin. (6) și (7) și § 5. d) În lipsa notificării de la lit. a), cazul se consideră Comandă Corion și se va deconta conform Modelului C.`,
        `(6) Decontarea pentru Clienți Proprii (Modelul B): a) Pentru clienții proprii ai Partenerului (alin. 1 lit. b și alin. 5), se aplică Modelul B, distribuția manoperei nete fiind: 60% Partener / 40% Corion GmbH. b) Baza de calcul este valoarea netă a manoperei (fără TVA). Tratamentul materialelor înainte de aplicarea cotei se face conform mecanismului detaliat la § 5. c) Ce acoperă cota Corion GmbH (40%) din Modelul B: utilizarea locației/atelierului, scule/utilaje, utilități, uzură standard, infrastructură și acces la procesele interne necesare operării în locație.`,
        `(7) Termene, raportare și plată către Corion GmbH pentru clienți proprii (Modelul B): a) Partenerul ține o evidență minimă (listă) a clienților proprii procesați în locație (nume, dată, lucrare, valoare, status plată) și o pune la dispoziția Corion GmbH la cerere. b) Partenerul plătește către Corion GmbH cota de 40% din manopera netă pentru clienții proprii în termen de ${pdays} zile lucrătoare de la încasarea efectivă de la client, în contul bancar indicat de Corion GmbH. c) În cazul încasărilor parțiale, decontarea către Corion GmbH se face proporțional cu încasarea.`,
        `(8) Limitări operaționale (capacitate atelier / reguli interne): Partenerul poate accepta clienți proprii și walk-in doar dacă acest lucru nu afectează în mod semnificativ comenzile deja programate și dacă sunt respectate regulile interne ale locației (ordine, securitatea și sănătatea în muncă, protecția mediului, utilizarea sculelor).`,
      ]},
      { h: "§ 5 Materiale / Consumabile (Materialkosten) – Modelul B (60/40)", body: [
        `(1) Principiu general – separarea „manoperă” vs. „materiale”: Părțile convin că distribuția 60% Partener / 40% Corion GmbH se aplică exclusiv manoperei nete („Arbeitsleistung / Lohnleistung", fără TVA), după tratamentul materialelor conform alin. (2)–(5). „Materiale” includ, fără limitare: vopsele, lacuri, diluanți, chituri, abrazive, consumabile smart-repair, piese mici, materiale auxiliare și alte consumabile utilizate pentru executarea lucrării.`,
        `(2) Materiale din gestiunea Corion GmbH (Material aus Corion-Bestand): Dacă la o lucrare pentru un client propriu (Modelul B) se utilizează materiale din gestiunea Corion GmbH, se aplică una dintre următoarele metode (în funcție de modul de facturare către client): a) Materiale facturate separat (separat ausgewiesen): Dacă materialele sunt evidențiate separat pe factură (linie separată), atunci valoarea netă a materialelor se scade integral din încasare înainte de calculul manoperei nete. Distribuția 60/40 se aplică apoi doar manoperei nete rămase. b) Materiale incluse paușal în preț (pauschal kalkuliert / nicht separat): Dacă materialele nu sunt facturate separat, ci sunt incluse în prețul total, atunci din suma netă facturată se deduce un procent de materiale determinat conform sistemului de normare a materialelor (BDE - Betriebsdatenerfassung). Deducerea procentuală se aplică înainte de împărțirea 60/40, iar distribuția 60/40 se aplică doar părții de manoperă netă rezultată după deducere. c) Actualizarea procentului BDE: Procentul BDE pentru materiale se stabilește și se actualizează periodic (de regulă la fiecare 6 luni) pentru a reflecta consumul real.`,
        `(3) Materiale din gestiunea Partenerului (Material aus Partner-Bestand): Dacă materialele utilizate pentru lucrare provin din gestiunea Partenerului (achiziționate și plătite de acesta), atunci: a) Materiale facturate separat: Partenerul are dreptul să factureze și să încaseze integral valoarea netă a materialelor (linie separată pe factură), fără aplicarea distribuției 60/40 asupra acestor materiale. Distribuția 60/40 se aplică doar manoperei nete. b) Materiale incluse paușal: Dacă materialele din gestiunea Partenerului sunt incluse paușal în prețul total (nu sunt evidențiate separat), părțile convin că partea aferentă materialelor (determinată fie printr-o cotă/rată convenită în prealabil, fie printr-o evidență de costuri a Partenerului) revine 100% Partenerului, iar distribuția 60/40 se aplică doar părții de manoperă netă. Recomandare practică (pentru a evita dispute): pentru materialele din gestiunea Partenerului, se va folosi cu prioritate facturarea separată, sau se va introduce o anexă cu un procent/rată standard.`,
        `(4) Ordinea de calcul (Reihenfolge der Berechnung) – obligatorie: Pentru orice lucrare în Modelul B (60/40), calculul se face în această ordine: 1. Se stabilește suma netă facturată clientului (fără TVA). 2. Se determină și se separă componenta „materiale” conform alin. (2) sau (3) – fie prin linie separată pe factură, fie prin deducere procentuală fixă (dacă materialele nu sunt separate). 3. Rezultă manopera netă. 4. Manopera netă se împarte: 60% Partener / 40% Corion GmbH.`,
        `(5) Clarificare: interdicția dublei remunerări: Nu este permis ca aceeași componentă de materiale să fie remunerată de două ori (de ex. și ca linie separată pe factură, și ca deducere paușală). Dacă materialele sunt evidențiate separat, nu se mai aplică deducerea procentuală (BDE) pentru acea parte.`,
        `(6) Dovada provenienței materialelor (Nachweis): La cerere, Partenerul va indica pentru lucrare dacă materialele au provenit din gestiunea Corion GmbH sau a Partenerului. Pentru materialele Partenerului, acesta poate prezenta documente justificative (ex. facturi furnizori) în măsura rezonabilă, în special în caz de dispută.`,
      ]},
      { h: "§ 6 Fondul de Garanție (Sicherheitseinbehalt / Garantiefonds)", body: [
        `(1) Constituirea fondului: Pentru a garanta acoperirea eventualelor reclamații, pretenții de garanție ale clienților (Gewährleistungsansprüche) sau daune rezultate din activitatea Partenerului, se va constitui un fond de garanție cumulativ în valoare maximă de 3.000,00 EUR.`,
        `(2) Mecanismul de reținere: Fondul de garanție se va constitui treptat. Corion GmbH va reține lunar o cotă de 5% din valoarea netă cuvenită Partenerului (din decontările periodice pentru manoperă), până când soldul fondului atinge plafonul de 3.000,00 EUR. Partenerul poate opta, de asemenea, să depună această sumă integral în avans.`,
        `(3) Scopul și utilizarea: Fondul va fi utilizat exclusiv pentru a acoperi costurile reparațiilor, refacerilor (Nachbesserungen) sau despăgubirilor, în situația în care: a) Partenerul nu își îndeplinește obligația de a remedia o lucrare defectuoasă din culpa sa, într-un termen rezonabil stabilit de Corion GmbH; b) Reclamațiile sau cererile de reparație intervin după încetarea prezentului contract, iar Partenerul nu mai este disponibil sau refuză să efectueze reparația.`,
        `(4) Restituirea fondului: La încetarea contractului, fondul de garanție (sau suma rămasă neutilizată în urma eventualelor deduceri justificate) va fi reținut de Corion GmbH pentru o perioadă de 12 luni calendaristice de la data ultimei lucrări executate de Partener, pentru a asigura acoperirea reclamațiilor tardive. După expirarea acestei perioade de grație, soldul rămas va fi virat integral în contul bancar al Partenerului.`,
      ]},
      { h: "§ 7 Obligațiile, Serviciile și Tarifele Corion GmbH", body: [
        `1. Infrastructură și Management standard: Corion GmbH asigură infrastructura (atelier, scule) și managementul standard (obținerea comenzilor, comunicarea cu clienții, facturarea). Clientul final intră în relație contractuală cu Corion GmbH, care subcontractează execuția către Partener.`,
        `2. Achiziții: Corion GmbH gestionează comanda pieselor de schimb și a materialelor necesare.`,
        `3. Management suplimentar: Pentru activități administrative suplimentare (ex. comunicare extinsă cu autoritățile, procesarea manuală a documentelor specifice Partenerului), Corion GmbH facturează un tarif de 75,00 EUR net pe oră. Prin semnarea prezentului contract, Partenerul acceptă prestarea acestor servicii de management suplimentar și tariful aferent. În cazul în care Partenerul nu dorește să beneficieze de acest serviciu, acesta are obligația de a înștiința Corion GmbH în prealabil, în formă scrisă (ex. e-mail / Textform).`,
      ]},
      { h: "§ 8 Scule, utilaje și echipamente (Werkzeuge/Maschinen) – utilizare, întreținere, înlocuire, custodie", body: [
        `(1) Punerea la dispoziție (Zurverfügungstellung): Corion GmbH pune la dispoziția Partenerului, pentru executarea lucrărilor în cadrul prezentului contract, scule, utilaje și echipamente (în continuare „Echipamente"), inclusiv accesoriile aferente, în măsura necesară activității (ex. compresor, pistol de vopsit, aparatură smart-repair etc.).`,
        `(2) Proprietate și custodie (Eigentum/Obhut): a) Toate Echipamentele puse la dispoziție de Corion GmbH rămân în proprietatea Corion GmbH. b) Partenerul primește Echipamentele în custodie (Obhut) și le utilizează exclusiv pentru lucrările efectuate în locația Corion GmbH, cu respectarea regulilor interne. c) La încetarea contractului, toate Echipamentele rămân în custodia și posesia Corion GmbH; Partenerul nu are drept de retenție (Zurückbehaltungsrecht) asupra acestora.`,
        `(3) Obligația de utilizare corespunzătoare și întreținere (Sorgfalt/Wartung): a) Partenerul este obligat să folosească Echipamentele în mod corespunzător, conform instrucțiunilor producătorului și standardelor de siguranță (Herstellervorgaben/Arbeitsschutz). b) Partenerul asigură întreținerea curentă și măsurile de îngrijire zilnică (ex. curățare, depozitare corectă, consumabile de întreținere), astfel încât Echipamentele să fie menținute în stare de funcționare. c) Defecțiunile, uzura excesivă, pierderea sau deteriorarea Echipamentelor trebuie raportate către Corion GmbH imediat în Textform (ex. WhatsApp/email), cel târziu în 24 de ore de la constatare.`,
        `(4) Uzură normală vs. deteriorare culpabilă (Normale Abnutzung / schuldhafte Beschädigung): a) Uzura normală rezultată din utilizarea conformă (normale Abnutzung) este suportată conform regulilor de înlocuire din alin. (5). b) În caz de deteriorare/pierdere cauzată de utilizare necorespunzătoare, neglijență sau intenție (schuldhafte Beschädigung/Verlust), Partenerul suportă costurile de reparare sau înlocuire integral, indiferent de procentele de distribuție prevăzute la alin. (5). c) În caz de dispută privind cauza, părțile vor documenta situația (foto/raport scurt) și vor încerca soluționarea amiabilă; dacă este necesar, se poate solicita constatare tehnică (Kostenvoranschlag/Prüfbericht).`,
        `(5) Înlocuire / reinvestiții (Ersatzbeschaffung / Reinvestitionen) – după procente: a) Înlocuirea Echipamentelor care devin inutilizabile din cauza uzurii normale sau a defectării neimputabile Partenerului se face pe baza unui principiu de co-participare la costuri. Indiferent de proveniența clientului sau de tipul de lucrare (Modelul C sau Modelul B), costul de înlocuire se suportă în proporții de 60% Corion GmbH / 40% Partener. b) Compensare prin decont (Abrechnung): partea Partenerului se reține din decontările periodice, sau facturare separată: Corion GmbH facturează partea Partenerului, scadentă în 14 zile. c) Corion GmbH decide furnizorul și specificațiile tehnice ale Echipamentelor de înlocuire, ținând cont în mod rezonabil de necesitățile operaționale și de raportul calitate/preț.`,
        `(6) Interdicția de înstrăinare și utilizare externă: Partenerul nu are dreptul să înstrăineze, gajeze, împrumute sau să scoată din locația Corion GmbH Echipamentele fără acordul prealabil al Corion GmbH în Textform.`,
        `(7) Documentarea Inventarului (Inventar / Fotodokumentation): Echipamentele puse la dispoziție pot fi consemnate într-o listă scrisă de inventar (Inventarliste) anexată contractului și actualizată periodic. Părțile convin că, alternativ sau în completare, starea și prezența echipamentelor pot fi documentate exclusiv prin fotografii sau înregistrări video (Fotodokumentation) realizate la momentul predării, respectiv la momentul restituirii. Această documentare vizuală servește drept bază fermă de comparație (starea „înainte și după") pentru constatarea eventualelor lipsuri, uzuri excesive sau deteriorări, având deplină valoare probatorie între părți, chiar și în lipsa unei liste scrise de inventariere. Lipsa unei liste formale sau a fotografiilor nu afectează sub nicio formă dreptul de proprietate inalienabil al Corion GmbH asupra Echipamentelor.`,
      ]},
      { h: "§ 9 Execuția Lucrărilor, Răspunderea, Securitatea în Muncă și Asigurările", body: [
        `1. Calitate și Standarde: Partenerul execută comenzile în mod profesional, conform cerințelor producătorului (Herstellervorgabe), reparațiilor adecvate valorii (zeitwertgerechte Reparatur) sau procedurilor Smart-Repair, respectând termenele stabilite. Se va întocmi un proces-verbal (inclusiv foto) la preluarea și predarea lucrării.`,
        `2. Răspundere și Remedieri: Partenerul răspunde pentru calitatea muncii sale. Reclamațiile sau refacerile lucrărilor (Nachbesserungen) din culpa Partenerului vor fi remediate de acesta pe propria cheltuială (timp alocat). Dacă refacerea implică materiale suplimentare din vina exclusivă a Partenerului, costul acestora îi va fi imputat. Defectele cauzate de piese/materiale furnizate defectuos de Corion GmbH nu atrag răspunderea Partenerului. Pentru asigurarea financiară a acestor reparații se aplică prevederile Fondului de Garanție de la § 6.`,
        `3. Asigurări (Betriebshaftpflicht): Partenerul se obligă să mențină, pe toată durata contractului, o asigurare de răspundere civilă profesională (Betriebshaftpflichtversicherung) validă, care să acopere daunele provocate vehiculelor clienților sau infrastructurii Corion GmbH, și va prezenta dovada acesteia la cerere.`,
        `4. Securitatea și Sănătatea în Muncă: Partenerul este responsabil pentru respectarea normelor de protecția muncii (Arbeitsschutz) pentru sine și eventualii săi angajați/ajutoare.`,
      ]},
      { h: "§ 10 Confidențialitate, Protecția Datelor (DSGVO) și Proprietate Intelectuală", body: [
        `1. Secrete Comerciale: Partenerul va păstra confidențialitatea absolută asupra secretelor comerciale și de afaceri (inclusiv know-how, structuri de prețuri) aparținând Corion GmbH. Această obligație este valabilă pe durata contractului și timp de 2 ani după încetarea acestuia.`,
        `2. Informații Confidențiale: Alte informații operaționale vor fi păstrate confidențiale pe durata contractului și timp de 3 ani după încetarea acestuia, cu excepția informațiilor devenite publice în mod legal.`,
        `3. Protecția Datelor (DSGVO): Partenerul se obligă să respecte legislația privind protecția datelor (GDPR/DSGVO) referitor la datele clienților Corion GmbH și să le folosească strict pentru executarea lucrărilor, fiind interzisă copierea sau utilizarea lor în alte scopuri.`,
        `4. Proprietate Intelectuală: Materialele puse la dispoziție, platforma CorionOS și brandul rămân proprietatea exclusivă a Corion GmbH. Partenerului i se acordă doar un drept de utilizare limitat la durata și scopul acestui contract.`,
      ]},
      { h: "§ 11 Protecția Clienților, Neconcurența și Penalitățile Contractuale", body: [
        `1. Protecția Clienților (Kundenschutz): Pe durata contractului și timp de 12 luni după încetarea acestuia, Partenerului îi este strict interzis să abordeze, să atragă sau să presteze servicii (direct sau indirect, personal sau prin firme interpuse/membri de familie) pentru clienții Corion GmbH pe care i-a cunoscut prin intermediul acestei colaborări, cu scopul de a eluda Corion GmbH.`,
        `2. Interdicția de Neconcurență (Wettbewerbsverbot): Pe durata contractului și timp de 6 luni de la încetarea sa, pentru protejarea know-how-ului specific transmis, Partenerul nu va deschide și nu va opera o afacere concurentă directă pe o rază de 30 km de la locația atelierului Corion GmbH în care a activat.`,
        `3. Penalități (Vertragsstrafe / Hamburger Brauch): Pentru fiecare încălcare culpabilă (intenție sau neglijență) a clauzelor de protecție a clienților (alin. 1), de neconcurență (alin. 2) sau a obligațiilor de confidențialitate (§ 10), Partenerul se obligă să plătească o penalitate contractuală rezonabilă. Clarificări privind aplicarea și stabilirea penalității: a) Cuantumul exact al penalității va fi stabilit în mod rezonabil (nach billigem Ermessen) de către Corion GmbH în funcție de gravitatea abaterii, dar nu va depăși suma maximă de 25.000,00 EUR per încălcare. b) Proporționalitatea și valoarea acestei penalități pot fi supuse controlului și reducerii de către instanța competentă. c) Prin „fiecare încălcare” se înțelege fiecare act individual (de ex. fiecare client abordat separat, fiecare lucrare executată clandestin, fiecare document divulgat). d) În cazul unei încălcări continue (Dauerverstoß – de ex. operarea unui atelier concurent), fiecare lună calendaristică începută în care persistă încălcarea va fi considerată o abatere distinctă. e) Plata penalității nu exclude dreptul Corion GmbH de a solicita daune-interese suplimentare dovedite care depășesc valoarea penalității (Schadensersatz) și nu anulează obligația Partenerului de a înceta imediat acțiunea interzisă (Unterlassungsanspruch).`,
        `4. Clarificare: Nu constituie ocolire în sensul prezentului paragraf preluarea unui walk-in conform § 4 alin. (5) sau executarea clienților proprii conform § 4 alin. (6)–(7), cu condiția notificării în Textform și a decontării către Corion GmbH a cotei de 40% (Modelul B).`,
      ]},
      { h: "§ 12 Durata, Rezilierea și Obligațiile la Încetare", body: [
        `1. Durata: Contractul este încheiat pe durată nedeterminată și poate fi reziliat ordinar de ambele părți cu un preaviz de 3 luni, până la sfârșitul lunii (ordentlich kündbar).`,
        `2. Reziliere extraordinară: Dreptul la reziliere imediată din motive întemeiate (außerordentliche Kündigung) rămâne neafectat (ex. furt, atragerea clienților Corion GmbH pentru a executa lucrări în altă locație, neplata obligațiilor, deficiențe grave și repetate de calitate).`,
        `3. Obligații la încetare: La încetarea contractului, Partenerul va returna imediat și în stare bună de funcționare (exceptând uzura normală) toate sculele, echipamentele și documentele aparținând Corion GmbH. Accesul la CorionOS va fi revocat, iar Partenerul va șterge orice date aparținând clienților Corion GmbH din propriile dispozitive.`,
      ]},
      { h: "§ 13 Dispoziții Finale", body: [
        `1. Forma: Modificările și completările acestui contract necesită forma scrisă. Comunicările prin e-mail (Textform) sunt considerate valabile pentru acorduri operaționale curente.`,
        `2. Clauza Salvatorie: În cazul în care o dispoziție a acestui contract este sau devine nulă, valabilitatea celorlalte dispoziții nu va fi afectată. Părțile se obligă să înlocuiască clauza nulă cu una validă care să reflecte cel mai bine scopul economic inițial.`,
        `3. Jurisdicție: Instanța competentă pentru toate litigiile este cea din Frankfurt am Main, în măsura în care acest lucru este permis din punct de vedere legal (soweit gesetzlich zulässig). Se aplică exclusiv legislația Republicii Federale Germania.`,
      ]},
    ],
    signatures: "Semnături",
    forFranchisor: "Pentru Corion GmbH",
    forFranchisee: "Pentru Partener",
    date: "Data",
    generatedOn: "Generat la",
  };

  // ============================================================
  // DEUTSCH — Vollständige Übersetzung
  // ============================================================
  const de: I18n = {
    title: "KOOPERATIONS- UND FRANCHISEVERTRAG",
    subtitle: "Betriebsmodelle: Modell C (40/60) und Modell B (60/40)",
    parties: "Vertragsparteien",
    franchisor: "Auftraggeber / Franchisegeber",
    franchisee: "Partner / Franchisenehmer",
    represented: "vertreten durch",
    email: "E-Mail",
    phone: "Telefon",
    taxNumber: "USt-ID",
    address: "Anschrift",
    place: "Ort, Datum",
    sections: [
      { h: "§ 1 Vertragsgegenstand und Selbständigkeit des Partners", body: [
        `1. Der Partner erbringt als selbständiger Unternehmer handwerkliche Leistungen im Bereich Autolackierung, Smart Repair und Reparaturen für die von Corion GmbH vermittelten Kunden sowie für seine eigenen Kunden.`,
        `2. Corion GmbH stellt dem Partner den Arbeitsplatz (Werkstatt) sowie die für die Ausführung der Arbeiten erforderlichen Werkzeuge und Maschinen zur Verfügung.`,
        `3. Selbständigkeit und Unabhängigkeit: Der Partner handelt im eigenen Namen und auf eigene Rechnung und trägt das volle unternehmerische Risiko für die erbrachten Leistungen. Der Partner ist frei, seine Arbeitszeiten festzulegen (unter Beachtung der mit den Kunden vereinbarten Liefertermine) und seine Tätigkeit zu organisieren. Der Partner ist berechtigt, eigene Mitarbeiter oder Subunternehmer auf eigene Verantwortung einzusetzen, unter Beachtung der Zugangs- und Sicherheitsregeln in der Werkstatt der Corion GmbH. Die Exklusivität bezieht sich ausschließlich auf die Konzentration auf die Ausführungsqualität während der Anwesenheit in der Werkstatt, nicht auf eine ausschließliche wirtschaftliche Abhängigkeit von Corion GmbH.`,
      ]},
      { h: "§ 2 Onboarding, Handwerksrecht und Startkapital", body: [
        `1. Onboarding-Gebühr: Bei Vertragsabschluss wird eine einmalige Onboarding-Gebühr in Höhe von ${fee},00 EUR (netto) fällig, zahlbar bei Rechnungsstellung.`,
        `2. Verwaltungsleistungen: Auf Wunsch des Partners kann Corion GmbH administrative Unterstützung leisten. Die Onboarding-Gebühr deckt die Bearbeitungskosten für: Wohnsitzanmeldung (Anmeldung), Gewerbeanmeldung, Unterstützung bei der Eröffnung eines Bankkontos, Anmeldung bei der Krankenkasse sowie Einrichtung des Profils in CorionOS. Diese Leistungen stellen ausschließlich administrative Unterstützung dar und sind keine Steuer- oder Rechtsberatung.`,
        `3. Qualifikationen und Handwerksrecht: Der Partner garantiert, dass er die erforderlichen Qualifikationen besitzt und verpflichtet sich, alle gesetzlichen Voraussetzungen für die Ausübung des Handwerks zu erfüllen (z. B. Eintragung in die Handwerksrolle oder Erteilung einer Ausnahmebewilligung durch die HWK, soweit erforderlich). Corion GmbH haftet nicht für fehlende Genehmigungen des Partners.`,
      ]},
      { h: "§ 3 Vergütungsmodelle (Modell C und Modell B), Abrechnung und Materialkosten", body: [
        `1. Definition der Kooperationsmodelle: In diesem Vertrag gelten zwei Umsatzverteilungsmodelle in Abhängigkeit von der Herkunft des Kunden:`,
        `Modell C (Full-Service / Corion-Aufträge): Gilt für Kunden, die von Corion GmbH gewonnen, terminiert und verwaltet werden. Die prozentuale Verteilung des Nettoarbeitslohns beträgt 40 % für den Partner (für die handwerkliche Ausführung) und 60 % für Corion GmbH (für Management, Infrastruktur, Marketing und Kundengewinnung).`,
        `Modell B (Eigene Kunden): Gilt für Kunden, die der Partner selbst direkt akquiriert hat und die nicht aus den Kanälen der Corion GmbH stammen. Die prozentuale Verteilung des Nettoarbeitslohns beträgt 60 % für den Partner (für Ausführung und Kundengewinnung) und 40 % für Corion GmbH (für die Nutzung der Räumlichkeiten, Werkzeuge, Versorgungsleistungen und Infrastruktur).`,
        `2. Quoten für Modell C (Corion-Aufträge): Für Aufträge, die unter Modell C fallen, erhält der Partner 40 % des Nettowerts der Arbeitsleistung (effektive Arbeitszeit / Brutto-Ausführung, ohne Teile und Materialien, die separat in Rechnung gestellt werden), die dem Endkunden in Rechnung gestellt wird. Die übrigen 60 % gehen an Corion GmbH (deckt die Nutzung von Räumen, Werkzeugen, Marketing, CorionOS-Nutzung, Rechnungsstellung und Forderungseinzug).`,
        `3. Materialkosten (Pauschalabzug / BDE): Unabhängig vom angewandten Modell (B oder C) wird, wenn Materialien nicht separat und direkt dem Kunden in Rechnung gestellt werden, sondern zu einem Pauschalpreis (gesamt), ein dem Materialverbrauch entsprechender Prozentsatz vom Gesamtbetrag der Arbeitsleistung abgezogen, bevor die prozentuale Aufteilung erfolgt. Aktuell ist dieser Materialabzugssatz auf ${bde} % festgelegt. Dieser automatische Abzug basiert auf dem internen Normierungssystem (bekannt als BDE - Betriebsdatenerfassung) und wird alle 6 Monate aktualisiert, um den tatsächlichen Verbrauch widerzuspiegeln. Der Partner hat die Möglichkeit, eigene Materialien zu verwenden (in diesem Fall entfällt der prozentuale Abzug), unter der zwingenden Voraussetzung der strikten Einhaltung der Qualitätsstandards der Corion GmbH und der vollen Übernahme der den Kunden gewährten Garantie. Der Partner hat Anspruch auf eine transparente Abrechnung dieser Abzüge (spezifische Details für Modell B finden sich in § 5).`,
        `4. Abrechnung: Die Abrechnung und Auszahlung der Quoten erfolgt periodisch (z. B. monatlich) auf Grundlage der von CorionOS erstellten Berichte und der vom Partner ausgestellten Rechnungen.`,
      ]},
      { h: "§ 4 Kundenkategorien, Corion-Vertreter, Walk-in und Abrechnung für eigene Kunden (Modell B)", body: [
        `(1) Definitionen: a) „Corion-Aufträge” = Aufträge/Arbeiten, für die der Kunde durch Corion GmbH gewonnen, angeboten, terminiert, verwaltet oder abgerechnet wurde (einschließlich über Corion-Marketing, Partnerschaften, Plattformen, Telefon/E-Mail Corion, digitale Systeme Corion/CorionOS oder andere von Corion GmbH verwaltete Kanäle). b) „Eigene Kunden des Partners” = vom Partner selbst gewonnene Kunden, die nicht aus den Kanälen der Corion GmbH stammen und in Textform (z. B. E-Mail/WhatsApp) vor Beginn der Arbeit an Corion GmbH gemeldet werden, mit mindestens folgenden Angaben: Kundenname, Kontaktdaten, Kennzeichen (sofern vorhanden), Beschreibung der Arbeit, Datum/Uhrzeit des Termins. c) „Walk-in / Standort” = Kunde, der ohne Nachweis eines vorherigen Leads, ohne Termin/Registrierung in den Corion-Systemen und ohne vorherige Mitteilung gemäß lit. b) am Standort der Corion GmbH erscheint. d) „Textform” = Kommunikation in Textform (z. B. E-Mail, WhatsApp, SMS), die die Identifikation des Absenders und die Speicherung der Nachricht ermöglicht.`,
        `(2) Corion-Vertreter: a) „Corion-Vertreter” ist jede von Corion GmbH ausdrücklich bestimmte Person (oder System) zur Verwaltung der Kundeninteraktion (insbesondere: Annahme, Begutachtung, Angebot, Terminierung, Übergabe/Rückgabe, Rechnungsstellung/Inkasso), einschließlich: Geschäftsführer, Gesellschafter, Mitarbeiter der Corion GmbH; und/oder Drittpersonen (einschließlich Subunternehmer / externe Dienstleister) und automatisierte Systeme (einschließlich KI-Agenten), die im Namen der Corion GmbH aufgrund eines Mandats/Vertrags oder einer technischen Implementierung handeln (Beauftragte/Erfüllungsgehilfe). b) Die Bestimmung / Aktualisierung der Corion-Vertreter kann auch durch Mitteilung in Textform an den Partner erfolgen (z. B. Personenliste + Kontaktdaten).`,
        `(3) Verfügbarkeit des Corion-Vertreters: Ein Corion-Vertreter gilt als „verfügbar", wenn folgende Bedingungen kumulativ erfüllt sind: er ist physisch am Standort anwesend oder kann den Kunden sofort per Telefon/Video übernehmen; und kann die Walk-in-Abwicklung innerhalb von höchstens 10 Minuten nach Anfrage des Partners beginnen; und der Partner hat die Übernahme über einen verifizierbaren Kanal angefordert (Telefonanruf oder Nachricht in Textform). Sind diese Bedingungen nicht erfüllt, gilt der Corion-Vertreter im Sinne dieses § 4 als „nicht verfügbar”.`,
        `(4) Zuteilungsregeln (Lead-Regelung): a) Corion-Aufträge werden gemäß § 3 des Vertrags nach Modell C (40 % Partner / 60 % Corion GmbH) abgerechnet. b) Eigene Kunden des Partners können am Standort der Corion GmbH unter Beachtung von Abs. (1) lit. b) und der betrieblichen Regeln (Werkstattkapazität, Terminierung, Arbeitssicherheit und Gesundheitsschutz) bedient werden. Die Abrechnung erfolgt gemäß Abs. (6) nach Modell B (60 % Partner / 40 % Corion GmbH). c) Walk-in / Standort: ist ein Corion-Vertreter verfügbar (Abs. 3) → Walk-in wird als Corion-Auftrag behandelt (Abrechnung § 3 – Modell C); ist kein Corion-Vertreter verfügbar → es gilt Abs. (5) (Ausnahme: Walk-in vom Partner im eigenen Namen abgewickelt). d) Beweislast: Der Nachweis, dass ein Kunde „eigener Kunde” ist, obliegt dem Partner (durch vorherige Mitteilung in Textform gemäß Abs. (1) lit. b) oder über das Verfahren nach Abs. (5)).`,
        `(5) Ausnahme Walk-in — Partner übernimmt vollständig im eigenen Namen (Annahme/Übergabe + Rechnungsstellung + Inkasso): Wenn zum Zeitpunkt eines Walk-in kein Corion-Vertreter verfügbar ist (Abs. 3), kann der Partner den Walk-in als eigenen Kunden übernehmen, sofern er die folgenden Schritte vollständig im eigenen Namen abwickelt: Annahme, Kommunikation, Übergabe, Rechnungsstellung und Inkasso. Kumulative Bedingungen: a) Der Partner übermittelt am selben Tag (spätestens bis 20:00 Uhr) eine Mitteilung in Textform an Corion GmbH mit: Kundenname, Kontakt, Datum/Uhrzeit der Ankunft, Beschreibung der Arbeit, geschätzter Wert. b) Der Partner stellt die Rechnung an den Kunden aus und kassiert im eigenen Namen. c) Der Partner führt an Corion GmbH die 40 %-Quote nach Modell B gemäß Abs. (6) und (7) sowie § 5 ab. d) Ohne die Mitteilung gemäß lit. a) gilt der Fall als Corion-Auftrag und wird nach Modell C abgerechnet.`,
        `(6) Abrechnung für eigene Kunden (Modell B): a) Für eigene Kunden des Partners (Abs. 1 lit. b und Abs. 5) gilt Modell B mit folgender Verteilung des Nettoarbeitslohns: 60 % Partner / 40 % Corion GmbH. b) Berechnungsgrundlage ist der Nettoarbeitslohn (ohne MwSt.). Die Behandlung der Materialien vor Anwendung der Quote erfolgt nach dem in § 5 detaillierten Mechanismus. c) Was die 40 %-Quote der Corion GmbH unter Modell B abdeckt: Nutzung des Standorts/der Werkstatt, Werkzeuge/Maschinen, Versorgungsleistungen, Standardabnutzung, Infrastruktur und Zugang zu den für den Betrieb am Standort erforderlichen internen Prozessen.`,
        `(7) Fristen, Berichterstattung und Zahlung an Corion GmbH für eigene Kunden (Modell B): a) Der Partner führt ein Mindestverzeichnis (Liste) der am Standort bedienten eigenen Kunden (Name, Datum, Arbeit, Wert, Zahlungsstatus) und stellt es der Corion GmbH auf Verlangen zur Verfügung. b) Der Partner zahlt an Corion GmbH die 40 %-Quote des Nettoarbeitslohns für eigene Kunden innerhalb von ${pdays} Werktagen nach tatsächlichem Eingang der Zahlung des Kunden auf das von Corion GmbH angegebene Bankkonto. c) Bei Teilzahlungen erfolgt die Abrechnung gegenüber Corion GmbH proportional zum Eingang.`,
        `(8) Betriebliche Beschränkungen (Werkstattkapazität / interne Regeln): Der Partner kann eigene Kunden und Walk-ins nur akzeptieren, wenn dies die bereits geplanten Aufträge nicht wesentlich beeinträchtigt und die internen Regeln des Standorts (Ordnung, Arbeitssicherheit und Gesundheitsschutz, Umweltschutz, Werkzeugnutzung) eingehalten werden.`,
      ]},
      { h: "§ 5 Materialien / Verbrauchsstoffe (Materialkosten) – Modell B (60/40)", body: [
        `(1) Allgemeiner Grundsatz – Trennung „Arbeitsleistung” vs. „Materialien”: Die Parteien vereinbaren, dass die Verteilung 60 % Partner / 40 % Corion GmbH ausschließlich auf die Nettoarbeitsleistung („Arbeitsleistung / Lohnleistung", ohne MwSt.) angewendet wird, nach Behandlung der Materialien gemäß Abs. (2)–(5). „Materialien” umfassen, ohne Einschränkung: Lacke, Klarlacke, Verdünner, Spachtel, Schleifmittel, Smart-Repair-Verbrauchsmaterialien, Kleinteile, Hilfsstoffe und sonstige für die Ausführung der Arbeit verwendete Verbrauchsmaterialien.`,
        `(2) Material aus Corion-Bestand: Wird bei einer Arbeit für einen eigenen Kunden (Modell B) Material aus dem Bestand der Corion GmbH verwendet, gilt eine der folgenden Methoden (je nach Abrechnungsweise gegenüber dem Kunden): a) Material separat ausgewiesen: Wird das Material auf der Rechnung gesondert ausgewiesen (separate Position), so wird der Nettowert des Materials vor Berechnung der Nettoarbeitsleistung vollständig vom Erlös abgezogen. Die 60/40-Verteilung wird sodann nur auf die verbleibende Nettoarbeitsleistung angewendet. b) Material pauschal im Preis enthalten (pauschal kalkuliert / nicht separat): Sind Materialien nicht separat in Rechnung gestellt, sondern im Gesamtpreis enthalten, so wird vom in Rechnung gestellten Nettobetrag ein nach dem Materialnormierungssystem (BDE - Betriebsdatenerfassung) bestimmter Materialprozentsatz abgezogen. Der prozentuale Abzug wird vor der 60/40-Aufteilung vorgenommen, und die 60/40-Verteilung wird nur auf den nach Abzug verbleibenden Nettoarbeitsanteil angewendet. c) Aktualisierung des BDE-Prozentsatzes: Der BDE-Prozentsatz für Materialien wird regelmäßig (in der Regel alle 6 Monate) festgelegt und aktualisiert, um den tatsächlichen Verbrauch widerzuspiegeln.`,
        `(3) Material aus Partner-Bestand: Stammen die für die Arbeit verwendeten Materialien aus dem Bestand des Partners (vom Partner gekauft und bezahlt), gilt: a) Material separat ausgewiesen: Der Partner ist berechtigt, den Nettowert des Materials vollständig in Rechnung zu stellen und einzuziehen (separate Position auf der Rechnung), ohne dass die 60/40-Verteilung auf dieses Material angewendet wird. Die 60/40-Verteilung wird nur auf die Nettoarbeitsleistung angewendet. b) Material pauschal enthalten: Sind Materialien aus dem Bestand des Partners pauschal im Gesamtpreis enthalten (nicht separat ausgewiesen), so vereinbaren die Parteien, dass der auf die Materialien entfallende Anteil (entweder durch eine vorab vereinbarte Quote/Rate oder durch eine Kostendokumentation des Partners ermittelt) zu 100 % dem Partner zusteht und die 60/40-Verteilung nur auf den Nettoarbeitsanteil angewendet wird. Praxisempfehlung (zur Vermeidung von Streitigkeiten): Für Material aus dem Bestand des Partners ist vorrangig die separate Rechnungsstellung zu verwenden oder ein Anhang mit einem Standardprozentsatz/-satz einzuführen.`,
        `(4) Berechnungsreihenfolge – verbindlich: Für jede Arbeit nach Modell B (60/40) erfolgt die Berechnung in dieser Reihenfolge: 1. Es wird der dem Kunden in Rechnung gestellte Nettobetrag ermittelt (ohne MwSt.). 2. Die „Material”-Komponente wird gemäß Abs. (2) oder (3) bestimmt und getrennt – entweder durch separate Position auf der Rechnung oder durch festen prozentualen Abzug (wenn Materialien nicht separat sind). 3. Daraus ergibt sich die Nettoarbeitsleistung. 4. Die Nettoarbeitsleistung wird aufgeteilt: 60 % Partner / 40 % Corion GmbH.`,
        `(5) Klarstellung — Verbot der doppelten Vergütung: Es ist nicht zulässig, dass dieselbe Materialkomponente doppelt vergütet wird (z. B. sowohl als separate Position auf der Rechnung als auch als pauschaler Abzug). Sind Materialien separat ausgewiesen, wird der prozentuale Abzug (BDE) für diesen Teil nicht mehr angewendet.`,
        `(6) Nachweis der Materialherkunft: Auf Verlangen wird der Partner für eine Arbeit angeben, ob die Materialien aus dem Bestand der Corion GmbH oder des Partners stammen. Für Materialien des Partners kann dieser im zumutbaren Umfang Belege (z. B. Lieferantenrechnungen) vorlegen, insbesondere im Streitfall.`,
      ]},
      { h: "§ 6 Garantiefonds (Sicherheitseinbehalt / Garantiefonds)", body: [
        `(1) Bildung des Fonds: Zur Sicherung der Abdeckung möglicher Reklamationen, Gewährleistungsansprüche der Kunden oder Schäden aus der Tätigkeit des Partners wird ein kumulativer Garantiefonds in Höhe von maximal 3.000,00 EUR gebildet.`,
        `(2) Einbehaltsmechanismus: Der Garantiefonds wird schrittweise gebildet. Corion GmbH behält monatlich eine Quote von 5 % des dem Partner zustehenden Nettowerts (aus den periodischen Abrechnungen der Arbeitsleistung) ein, bis der Saldo des Fonds die Obergrenze von 3.000,00 EUR erreicht. Der Partner kann sich auch dafür entscheiden, diesen Betrag vorab vollständig zu hinterlegen.`,
        `(3) Zweck und Verwendung: Der Fonds wird ausschließlich zur Deckung der Kosten für Reparaturen, Nachbesserungen oder Schadensersatz verwendet, wenn: a) der Partner seiner Pflicht zur Behebung einer von ihm verschuldeten mangelhaften Arbeit innerhalb einer angemessenen, von Corion GmbH gesetzten Frist nicht nachkommt; b) Reklamationen oder Reparaturanfragen nach Beendigung dieses Vertrages auftreten und der Partner nicht mehr verfügbar ist oder die Reparatur verweigert.`,
        `(4) Rückerstattung des Fonds: Bei Vertragsende wird der Garantiefonds (oder der nach gerechtfertigten Abzügen verbleibende ungenutzte Betrag) von Corion GmbH für einen Zeitraum von 12 Kalendermonaten ab dem Datum der letzten vom Partner ausgeführten Arbeit einbehalten, um die Abdeckung verspäteter Reklamationen sicherzustellen. Nach Ablauf dieser Karenzzeit wird der verbleibende Saldo vollständig auf das Bankkonto des Partners überwiesen.`,
      ]},
      { h: "§ 7 Pflichten, Leistungen und Tarife der Corion GmbH", body: [
        `1. Infrastruktur und Standardmanagement: Corion GmbH stellt die Infrastruktur (Werkstatt, Werkzeuge) und das Standardmanagement (Auftragsgewinnung, Kundenkommunikation, Rechnungsstellung) sicher. Der Endkunde tritt in eine Vertragsbeziehung mit Corion GmbH, die die Ausführung an den Partner unterbeauftragt.`,
        `2. Beschaffung: Corion GmbH übernimmt die Bestellung der erforderlichen Ersatzteile und Materialien.`,
        `3. Zusatzmanagement: Für zusätzliche administrative Tätigkeiten (z. B. erweiterte Behördenkommunikation, manuelle Bearbeitung partnerspezifischer Dokumente) stellt Corion GmbH einen Tarif von 75,00 EUR netto pro Stunde in Rechnung. Mit Unterzeichnung dieses Vertrages akzeptiert der Partner die Erbringung dieser Zusatzmanagement-Leistungen und den entsprechenden Tarif. Möchte der Partner diese Leistung nicht in Anspruch nehmen, ist er verpflichtet, Corion GmbH dies vorab schriftlich (z. B. E-Mail / Textform) mitzuteilen.`,
      ]},
      { h: "§ 8 Werkzeuge, Maschinen und Ausrüstung – Nutzung, Instandhaltung, Ersatz, Verwahrung", body: [
        `(1) Zurverfügungstellung: Corion GmbH stellt dem Partner zur Ausführung der Arbeiten im Rahmen dieses Vertrages Werkzeuge, Maschinen und Ausrüstung (im Folgenden „Ausrüstung") einschließlich des dazugehörigen Zubehörs in dem für die Tätigkeit erforderlichen Umfang zur Verfügung (z. B. Kompressor, Lackierpistole, Smart-Repair-Geräte usw.).`,
        `(2) Eigentum und Verwahrung: a) Sämtliche von Corion GmbH zur Verfügung gestellte Ausrüstung verbleibt im Eigentum der Corion GmbH. b) Der Partner erhält die Ausrüstung in Verwahrung (Obhut) und nutzt sie ausschließlich für Arbeiten am Standort der Corion GmbH unter Beachtung der internen Regeln. c) Bei Vertragsende verbleibt sämtliche Ausrüstung in Verwahrung und Besitz der Corion GmbH; dem Partner steht kein Zurückbehaltungsrecht daran zu.`,
        `(3) Pflicht zur sachgerechten Nutzung und Instandhaltung: a) Der Partner ist verpflichtet, die Ausrüstung sachgerecht entsprechend den Herstellervorgaben und den Sicherheitsstandards (Herstellervorgaben/Arbeitsschutz) zu verwenden. b) Der Partner sorgt für die laufende Instandhaltung und tägliche Pflege (z. B. Reinigung, ordnungsgemäße Lagerung, Wartungsverbrauchsmaterialien), damit die Ausrüstung in funktionsfähigem Zustand erhalten bleibt. c) Defekte, übermäßiger Verschleiß, Verlust oder Beschädigung der Ausrüstung sind unverzüglich in Textform (z. B. WhatsApp/E-Mail) an Corion GmbH zu melden, spätestens innerhalb von 24 Stunden nach Feststellung.`,
        `(4) Normale Abnutzung vs. schuldhafte Beschädigung: a) Die normale Abnutzung infolge sachgerechter Nutzung wird nach den Ersatzregeln in Abs. (5) getragen. b) Bei Beschädigung/Verlust durch unsachgemäße Nutzung, Fahrlässigkeit oder Vorsatz (schuldhafte Beschädigung/Verlust) trägt der Partner die Reparatur- oder Ersatzkosten in voller Höhe, unabhängig von den in Abs. (5) vorgesehenen Verteilungssätzen. c) Im Streitfall über die Ursache dokumentieren die Parteien den Sachverhalt (Foto/Kurzbericht) und versuchen eine gütliche Einigung; falls erforderlich, kann ein technischer Befund (Kostenvoranschlag/Prüfbericht) eingeholt werden.`,
        `(5) Ersatzbeschaffung / Reinvestitionen – nach Quoten: a) Der Ersatz von Ausrüstung, die infolge normaler Abnutzung oder eines dem Partner nicht zurechenbaren Defekts unbrauchbar wird, erfolgt nach dem Prinzip der Kostenmitbeteiligung. Unabhängig von der Herkunft des Kunden oder der Art der Arbeit (Modell C oder Modell B) werden die Ersatzkosten zu 60 % von Corion GmbH und 40 % vom Partner getragen. b) Verrechnung über Abrechnung: Der Partneranteil wird aus den periodischen Abrechnungen einbehalten, oder separate Rechnungsstellung: Corion GmbH stellt den Partneranteil in Rechnung, fällig in 14 Tagen. c) Corion GmbH entscheidet über Lieferanten und technische Spezifikationen der Ersatzausrüstung unter angemessener Berücksichtigung der betrieblichen Erfordernisse und des Preis-Leistungs-Verhältnisses.`,
        `(6) Veräußerungs- und Verwendungsverbot: Der Partner ist nicht berechtigt, die Ausrüstung ohne vorherige Zustimmung der Corion GmbH in Textform zu veräußern, zu verpfänden, zu verleihen oder vom Standort der Corion GmbH zu entfernen.`,
        `(7) Inventardokumentation: Die zur Verfügung gestellte Ausrüstung kann in einer dem Vertrag beigefügten und periodisch aktualisierten schriftlichen Inventarliste erfasst werden. Die Parteien vereinbaren, dass alternativ oder ergänzend Zustand und Vorhandensein der Ausrüstung ausschließlich durch Fotos oder Videoaufnahmen (Fotodokumentation) zum Zeitpunkt der Übergabe bzw. Rückgabe dokumentiert werden können. Diese visuelle Dokumentation dient als verbindliche Vergleichsbasis (Zustand „vorher und nachher") zur Feststellung möglicher Fehlbestände, übermäßigen Verschleißes oder Beschädigungen und hat zwischen den Parteien volle Beweiskraft, auch ohne schriftliche Inventarliste. Das Fehlen einer formellen Liste oder von Fotos berührt das unveräußerliche Eigentumsrecht der Corion GmbH an der Ausrüstung in keiner Weise.`,
      ]},
      { h: "§ 9 Ausführung der Arbeiten, Haftung, Arbeitssicherheit und Versicherungen", body: [
        `1. Qualität und Standards: Der Partner führt die Aufträge fachmännisch entsprechend den Herstellervorgaben (Herstellervorgabe), wertangemessenen Reparaturen (zeitwertgerechte Reparatur) oder Smart-Repair-Verfahren unter Einhaltung der vereinbarten Termine aus. Bei Übernahme und Übergabe der Arbeit wird ein Protokoll (einschließlich Fotos) erstellt.`,
        `2. Haftung und Nachbesserungen: Der Partner haftet für die Qualität seiner Arbeit. Reklamationen oder Nachbesserungen aus Verschulden des Partners werden von diesem auf eigene Kosten (eingesetzte Zeit) behoben. Wenn die Nachbesserung aus alleinigem Verschulden des Partners zusätzliche Materialien erfordert, werden ihm deren Kosten in Rechnung gestellt. Mängel infolge fehlerhafter, von Corion GmbH gelieferter Teile/Materialien begründen keine Haftung des Partners. Für die finanzielle Absicherung dieser Reparaturen gelten die Bestimmungen des Garantiefonds nach § 6.`,
        `3. Versicherungen (Betriebshaftpflicht): Der Partner verpflichtet sich, während der gesamten Vertragsdauer eine gültige Betriebshaftpflichtversicherung zu unterhalten, die Schäden an Kundenfahrzeugen oder an der Infrastruktur der Corion GmbH abdeckt, und auf Verlangen einen Nachweis vorzulegen.`,
        `4. Arbeitssicherheit und Gesundheitsschutz: Der Partner ist für die Einhaltung der Arbeitsschutzvorschriften für sich selbst und seine etwaigen Mitarbeiter/Hilfskräfte verantwortlich.`,
      ]},
      { h: "§ 10 Vertraulichkeit, Datenschutz (DSGVO) und geistiges Eigentum", body: [
        `1. Geschäftsgeheimnisse: Der Partner wahrt absolute Vertraulichkeit über Geschäfts- und Betriebsgeheimnisse (einschließlich Know-how, Preisstrukturen) der Corion GmbH. Diese Pflicht gilt für die Vertragsdauer sowie für 2 Jahre nach Vertragsende.`,
        `2. Vertrauliche Informationen: Sonstige betriebliche Informationen werden während der Vertragsdauer und für 3 Jahre nach Vertragsende vertraulich behandelt, mit Ausnahme rechtmäßig öffentlich gewordener Informationen.`,
        `3. Datenschutz (DSGVO): Der Partner verpflichtet sich, die datenschutzrechtlichen Vorschriften (DSGVO/GDPR) bezüglich der Daten der Kunden der Corion GmbH einzuhalten und sie ausschließlich für die Ausführung der Arbeiten zu verwenden; Kopieren oder Verwendung zu anderen Zwecken ist untersagt.`,
        `4. Geistiges Eigentum: Die zur Verfügung gestellten Materialien, die CorionOS-Plattform und die Marke verbleiben im ausschließlichen Eigentum der Corion GmbH. Dem Partner wird lediglich ein auf Dauer und Zweck dieses Vertrages beschränktes Nutzungsrecht eingeräumt.`,
      ]},
      { h: "§ 11 Kundenschutz, Wettbewerbsverbot und Vertragsstrafen", body: [
        `1. Kundenschutz: Während der Vertragsdauer und für 12 Monate nach deren Beendigung ist es dem Partner strengstens untersagt, Kunden der Corion GmbH, die er im Rahmen dieser Zusammenarbeit kennengelernt hat, anzusprechen, abzuwerben oder ihnen Leistungen anzubieten (direkt oder indirekt, persönlich oder über zwischengeschaltete Firmen/Familienangehörige), um Corion GmbH zu umgehen.`,
        `2. Wettbewerbsverbot: Während der Vertragsdauer und für 6 Monate nach deren Beendigung wird der Partner zum Schutz des spezifisch übertragenen Know-hows kein direkt konkurrierendes Geschäft im Umkreis von 30 km vom Standort der Corion-Werkstatt eröffnen oder betreiben, an dem er tätig war.`,
        `3. Vertragsstrafe (Hamburger Brauch): Für jeden schuldhaften Verstoß (Vorsatz oder Fahrlässigkeit) gegen die Klauseln zum Kundenschutz (Abs. 1), zum Wettbewerbsverbot (Abs. 2) oder zu den Vertraulichkeitspflichten (§ 10) verpflichtet sich der Partner zur Zahlung einer angemessenen Vertragsstrafe. Klarstellungen zur Anwendung und Festsetzung der Strafe: a) Die genaue Höhe der Strafe wird von Corion GmbH nach billigem Ermessen je nach Schwere des Verstoßes festgelegt, jedoch maximal 25.000,00 EUR pro Verstoß. b) Die Verhältnismäßigkeit und Höhe dieser Strafe können der Kontrolle und Reduzierung durch das zuständige Gericht unterliegen. c) Unter „jedem Verstoß” ist jede einzelne Handlung zu verstehen (z. B. jeder einzelne angesprochene Kunde, jede heimlich ausgeführte Arbeit, jedes weitergegebene Dokument). d) Bei einem Dauerverstoß (z. B. Betrieb einer konkurrierenden Werkstatt) gilt jeder begonnene Kalendermonat, in dem der Verstoß fortbesteht, als gesonderter Verstoß. e) Die Zahlung der Vertragsstrafe schließt das Recht der Corion GmbH nicht aus, weitergehenden, nachgewiesenen Schadensersatz, der die Strafe übersteigt, zu verlangen, und hebt die Pflicht des Partners zur sofortigen Einstellung der untersagten Handlung (Unterlassungsanspruch) nicht auf.`,
        `4. Klarstellung: Die Übernahme eines Walk-in nach § 4 Abs. (5) oder die Bedienung eigener Kunden nach § 4 Abs. (6)–(7) stellt keine Umgehung im Sinne dieses Paragraphen dar, sofern die Mitteilung in Textform und die Abführung der 40 %-Quote (Modell B) an Corion GmbH erfolgt.`,
      ]},
      { h: "§ 12 Laufzeit, Kündigung und Pflichten bei Vertragsende", body: [
        `1. Laufzeit: Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Parteien ordentlich mit einer Frist von 3 Monaten zum Monatsende gekündigt werden (ordentlich kündbar).`,
        `2. Außerordentliche Kündigung: Das Recht zur fristlosen Kündigung aus wichtigem Grund (außerordentliche Kündigung) bleibt unberührt (z. B. Diebstahl, Abwerbung von Corion-Kunden zur Ausführung von Arbeiten an einem anderen Standort, Nichterfüllung von Verpflichtungen, schwerwiegende und wiederholte Qualitätsmängel).`,
        `3. Pflichten bei Vertragsende: Bei Vertragsende gibt der Partner sämtliche der Corion GmbH gehörenden Werkzeuge, Ausrüstungen und Dokumente unverzüglich und in funktionsfähigem Zustand (mit Ausnahme der normalen Abnutzung) zurück. Der Zugang zu CorionOS wird widerrufen, und der Partner löscht alle Daten der Corion-Kunden von seinen eigenen Geräten.`,
      ]},
      { h: "§ 13 Schlussbestimmungen", body: [
        `1. Form: Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform. Mitteilungen per E-Mail (Textform) gelten für laufende betriebliche Vereinbarungen als wirksam.`,
        `2. Salvatorische Klausel: Sollte eine Bestimmung dieses Vertrages nichtig sein oder werden, so wird die Wirksamkeit der übrigen Bestimmungen nicht berührt. Die Parteien verpflichten sich, die nichtige Klausel durch eine wirksame zu ersetzen, die dem ursprünglichen wirtschaftlichen Zweck am nächsten kommt.`,
        `3. Gerichtsstand: Zuständig für alle Streitigkeiten ist das Gericht in Frankfurt am Main, soweit gesetzlich zulässig. Es gilt ausschließlich das Recht der Bundesrepublik Deutschland.`,
      ]},
    ],
    signatures: "Unterschriften",
    forFranchisor: "Für Corion GmbH",
    forFranchisee: "Für den Partner",
    date: "Datum",
    generatedOn: "Erstellt am",
  };

  // ============================================================
  // ENGLISH — Full translation
  // ============================================================
  const en: I18n = {
    title: "COOPERATION AND FRANCHISE AGREEMENT",
    subtitle: "Operating models: Model C (40/60) and Model B (60/40)",
    parties: "Contracting Parties",
    franchisor: "Principal / Franchisor",
    franchisee: "Partner / Franchisee",
    represented: "represented by",
    email: "Email",
    phone: "Phone",
    taxNumber: "Tax / VAT ID",
    address: "Address",
    place: "Place, Date",
    sections: [
      { h: "§ 1 Subject of the Contract and Partner's Autonomy", body: [
        `1. The Partner provides, as an independent entrepreneur (selbstständiger Unternehmer), craft services in the field of automotive painting, smart-repair and repairs for clients referred by Corion GmbH, as well as for the Partner's own clients.`,
        `2. Corion GmbH provides the Partner with the workspace (workshop) and the tools and equipment necessary to perform the work.`,
        `3. Autonomy and independence: The Partner acts in their own name and on their own account, bearing the full entrepreneurial risk for the services rendered. The Partner is free to set their working hours (subject to the delivery deadlines agreed with clients) and to organise their activity. The Partner is entitled to use their own employees or subcontractors, on their own responsibility, in accordance with the access and safety rules of the Corion GmbH workshop. Exclusivity refers strictly to focusing on execution quality while present in the workshop, not to exclusive economic dependence on Corion GmbH.`,
      ]},
      { h: "§ 2 Onboarding, Trade Authorisations (Handwerksrecht) and Start-up Capital", body: [
        `1. Onboarding fee: Upon conclusion of the contract, a one-time onboarding fee of EUR ${fee}.00 (net) is payable, due on issuance of the invoice.`,
        `2. Administrative services: At the Partner's request, Corion GmbH may facilitate administrative assistance. The onboarding fee covers the processing costs for: residence registration (Anmeldung), trade registration (Gewerbeanmeldung), assistance with opening a bank account, registration with the health insurance fund (Krankenkasse), and configuration of the profile in CorionOS. These services constitute administrative support only and do not represent tax or legal advice.`,
        `3. Qualifications and Handwerksrecht: The Partner warrants that they hold the required qualifications and undertakes to fulfil all legal requirements for exercising the trade (e.g. registration in the Handwerksrolle or obtaining an Ausnahmebewilligung from the HWK, where applicable). Corion GmbH is not liable for any missing authorisations of the Partner.`,
      ]},
      { h: "§ 3 Remuneration Models (Model C and Model B), Settlement and Material Costs", body: [
        `1. Definition of Cooperation Models: Two revenue distribution models apply under this contract, depending on the origin of the client, as follows:`,
        `Model C (Full-Service / Corion Orders): Applies to clients acquired, scheduled and managed by Corion GmbH. The percentage distribution of net labour is 40% to the Partner (for craft execution) and 60% to Corion GmbH (for management, infrastructure, marketing and client acquisition).`,
        `Model B (Own Clients): Applies to clients brought directly by the Partner, who do not originate from Corion GmbH channels. The percentage distribution of net labour is 60% to the Partner (for execution and client acquisition) and 40% to Corion GmbH (for use of the location, tools, utilities and infrastructure).`,
        `2. Quotas for Model C (Corion Orders): For orders falling under Model C, the Partner receives 40% of the net value of the labour (effective working time / gross execution, excluding parts and materials invoiced separately) charged to the end client. The remaining 60% goes to Corion GmbH (covering use of premises, tools, marketing, CorionOS use, invoicing and debt collection).`,
        `3. Material costs (Flat Deduction / BDE): Regardless of the applied model (B or C), where materials are not directly and separately invoiced to the client but at a flat (overall) price, a percentage representing the materials consumed will be deducted from the total labour value before applying the percentage split. Currently, this material deduction percentage is set at ${bde}%. This automatic deduction is based on the internal standardisation system (known as BDE - Betriebsdatenerfassung) and will be updated every 6 months to reflect actual consumption. The Partner has the option to use their own materials (in which case the percentage deduction no longer applies), subject to the mandatory strict observance of Corion GmbH quality standards and full assumption of the warranty given to clients. The Partner is entitled to transparent reporting of these deductions (specific details for Model B are set out in § 5).`,
        `4. Settlement: Settlement and payment of quotas will be carried out periodically (e.g. monthly) based on reports generated by CorionOS and the invoices issued by the Partner.`,
      ]},
      { h: "§ 4 Client Categories, Corion Representative, Walk-in and Settlement for Own Clients (Model B)", body: [
        `(1) Definitions: a) \\"Corion Orders\\" = orders/works for which the client was acquired, quoted, scheduled, managed or invoiced by Corion GmbH (including via Corion marketing, partnerships, platforms, Corion phone/email, Corion/CorionOS digital systems or other channels managed by Corion GmbH). b) \\"Partner's own clients\\" = clients brought by the Partner that do not originate from Corion GmbH channels and are notified in Textform (e.g. email/WhatsApp) to Corion GmbH before the start of the work, with at least the following data: client name, contact details, license plate (if any), description of work, date/time of appointment. c) \\"Walk-in / Location\\" = a client who appears at the Corion GmbH location without proof of a prior lead, without an appointment/registration in Corion systems and without prior notification under (b). d) \\"Textform\\" = communication in text form (e.g. email, WhatsApp, SMS) that allows identification of the sender and preservation of the message.`,
        `(2) Corion Representative: a) A \\"Corion Representative\\" is any person (or system) expressly designated by Corion GmbH to manage the client interaction (in particular: reception, assessment, quoting, scheduling, hand-over/return, invoicing/collection), including: the Managing Director (Geschäftsführer), shareholders (Gesellschafter), employees of Corion GmbH; and/or third parties (including subcontractors / external service providers) and automated systems (including AI agents) acting on behalf of Corion GmbH on the basis of a mandate/contract or technical implementation (Beauftragte/Erfüllungsgehilfe). b) The designation / updating of Corion Representatives may also be done by notification in Textform to the Partner (e.g. list of persons + contact details).`,
        `(3) Availability of the Corion Representative: A Corion Representative is considered \\"available\\" if all of the following conditions are cumulatively met: they are physically present at the location or can take over the client immediately by phone/video; and they can begin walk-in handling within a maximum of 10 minutes from the Partner's request; and the Partner requested the takeover via a verifiable channel (phone call or message in Textform). If these conditions are not met, the Corion Representative is considered \\"unavailable\\" within the meaning of this § 4.`,
        `(4) Allocation rules (Lead-Regelung): a) Corion Orders are settled in accordance with § 3 of the contract under Model C (40% Partner / 60% Corion GmbH). b) The Partner's own clients may be served at the Corion GmbH location subject to (1)(b) and to the operational rules (workshop capacity, scheduling, occupational safety and health). Settlement is made under (6) on the basis of Model B (60% Partner / 40% Corion GmbH). c) Walk-in / Location: if a Corion Representative is available (par. 3) → the walk-in is treated as a Corion Order (settlement § 3 – Model C); if no Corion Representative is available → (5) applies (Walk-in exception processed by the Partner in own name). d) Burden of proof: the proof that a client is the \\"own client\\" lies with the Partner (through prior notification in Textform under (1)(b) or via the procedure under (5)).`,
        `(5) Walk-in Exception — Partner takes over fully in own name (reception/return + invoicing + collection): If at the moment a walk-in arrives no Corion Representative is available (par. 3), the Partner may take over the walk-in as own client, provided they fully manage in own name: reception, communication, return, invoicing and collection. Cumulative conditions: a) The Partner sends to Corion GmbH on the same day (no later than 20:00) a notification in Textform with: client name, contact, date/time of arrival, description of work, estimated value. b) The Partner issues the invoice to the client and collects in own name. c) The Partner remits to Corion GmbH the 40% share for Model B in accordance with (6) and (7) and § 5. d) Without the notification under (a), the case is treated as a Corion Order and is settled under Model C.`,
        `(6) Settlement for Own Clients (Model B): a) For the Partner's own clients (par. 1(b) and par. 5), Model B applies, with net labour distribution: 60% Partner / 40% Corion GmbH. b) The basis for calculation is the net value of the labour (excluding VAT). The treatment of materials before applying the share is carried out as detailed in § 5. c) What the 40% Corion GmbH share under Model B covers: use of the location/workshop, tools/equipment, utilities, standard wear, infrastructure and access to the internal processes necessary to operate at the location.`,
        `(7) Deadlines, reporting and payment to Corion GmbH for own clients (Model B): a) The Partner keeps a minimum record (list) of own clients processed at the location (name, date, work, value, payment status) and makes it available to Corion GmbH on request. b) The Partner pays Corion GmbH the 40% share of the net labour for own clients within ${pdays} working days from actual receipt of payment from the client, into the bank account indicated by Corion GmbH. c) In the case of partial collections, settlement to Corion GmbH is made proportional to the collection.`,
        `(8) Operational limitations (workshop capacity / internal rules): The Partner may accept own clients and walk-ins only if this does not significantly affect the orders already scheduled and the internal rules of the location are respected (order, occupational safety and health, environmental protection, use of tools).`,
      ]},
      { h: "§ 5 Materials / Consumables (Materialkosten) – Model B (60/40)", body: [
        `(1) General principle — separation of \\"labour\\" vs. \\"materials\\": The parties agree that the 60% Partner / 40% Corion GmbH distribution applies exclusively to the net labour (\\"Arbeitsleistung / Lohnleistung\\", excluding VAT), after the treatment of materials under (2)–(5). \\"Materials\\" include, without limitation: paints, lacquers, thinners, fillers, abrasives, smart-repair consumables, small parts, auxiliary materials and other consumables used to perform the work.`,
        `(2) Material from Corion GmbH stock: If, on a job for an own client (Model B), materials from Corion GmbH stock are used, one of the following methods applies (depending on the invoicing method to the client): a) Materials separately itemised: If the materials are shown separately on the invoice (separate line), the net value of the materials is fully deducted from the receipt before calculating net labour. The 60/40 distribution is then applied only to the remaining net labour. b) Materials included flat-rate (pauschal kalkuliert / not separate): If materials are not invoiced separately but included in the total price, then a material percentage determined according to the materials standardisation system (BDE - Betriebsdatenerfassung) is deducted from the net invoiced amount. The percentage deduction is applied before the 60/40 split, and the 60/40 distribution is applied only to the net labour portion resulting after deduction. c) Update of the BDE percentage: The BDE percentage for materials is set and updated periodically (typically every 6 months) to reflect actual consumption.`,
        `(3) Material from Partner stock: If the materials used for the work originate from the Partner's stock (purchased and paid by the Partner), then: a) Materials separately itemised: The Partner is entitled to invoice and collect in full the net value of the materials (separate line on the invoice), without applying the 60/40 distribution to those materials. The 60/40 distribution applies only to the net labour. b) Materials included flat-rate: If materials from the Partner's stock are included flat-rate in the total price (not shown separately), the parties agree that the share corresponding to materials (determined either by a quota/rate agreed in advance or by a Partner cost record) belongs 100% to the Partner, and the 60/40 distribution applies only to the net labour part. Practical recommendation (to avoid disputes): for materials from the Partner's stock, separate invoicing should be used as a priority, or an annex with a standard percentage/rate should be introduced.`,
        `(4) Calculation order — mandatory: For any work under Model B (60/40), the calculation is performed in this order: 1. The net amount invoiced to the client is determined (excluding VAT). 2. The \\"materials\\" component is determined and separated under (2) or (3) — either by a separate line on the invoice or by a fixed percentage deduction (if materials are not separated). 3. The result is the net labour. 4. The net labour is split: 60% Partner / 40% Corion GmbH.`,
        `(5) Clarification — prohibition of double remuneration: It is not permitted that the same material component be remunerated twice (e.g. both as a separate line on the invoice and as a flat deduction). If materials are itemised separately, the percentage deduction (BDE) no longer applies to that part.`,
        `(6) Proof of material origin: On request, the Partner shall indicate for the work whether the materials came from the stock of Corion GmbH or of the Partner. For Partner materials, the Partner may present supporting documents (e.g. supplier invoices) to a reasonable extent, in particular in case of dispute.`,
      ]},
      { h: "§ 6 Guarantee Fund (Sicherheitseinbehalt / Garantiefonds)", body: [
        `(1) Constitution of the fund: To guarantee coverage of any complaints, customer warranty claims (Gewährleistungsansprüche) or damages arising from the Partner's activity, a cumulative guarantee fund will be set up with a maximum value of EUR 3,000.00.`,
        `(2) Withholding mechanism: The guarantee fund is built up gradually. Corion GmbH withholds monthly a 5% share of the net amount due to the Partner (from the periodic settlements for labour) until the fund balance reaches the cap of EUR 3,000.00. The Partner may also choose to deposit this amount in full in advance.`,
        `(3) Purpose and use: The fund will be used exclusively to cover the costs of repairs, rework (Nachbesserungen) or compensation, where: a) the Partner fails to fulfil the obligation to remedy faulty work due to their fault within a reasonable time set by Corion GmbH; b) complaints or repair requests arise after the termination of this contract and the Partner is no longer available or refuses to perform the repair.`,
        `(4) Refund of the fund: Upon termination of the contract, the guarantee fund (or the unused amount remaining after any justified deductions) will be retained by Corion GmbH for a period of 12 calendar months from the date of the last work performed by the Partner, in order to ensure coverage of late complaints. After this grace period expires, the remaining balance will be transferred in full to the Partner's bank account.`,
      ]},
      { h: "§ 7 Obligations, Services and Tariffs of Corion GmbH", body: [
        `1. Infrastructure and standard management: Corion GmbH provides the infrastructure (workshop, tools) and the standard management (obtaining orders, communication with clients, invoicing). The end client enters into a contractual relationship with Corion GmbH, which subcontracts the execution to the Partner.`,
        `2. Procurement: Corion GmbH manages the ordering of spare parts and necessary materials.`,
        `3. Additional management: For additional administrative activities (e.g. extended communication with authorities, manual processing of partner-specific documents), Corion GmbH invoices a tariff of EUR 75.00 net per hour. By signing this contract, the Partner accepts the provision of these additional management services and the corresponding tariff. If the Partner does not wish to receive this service, they must notify Corion GmbH in advance in writing (e.g. email / Textform).`,
      ]},
      { h: "§ 8 Tools, Machines and Equipment — use, maintenance, replacement, custody", body: [
        `(1) Provision: Corion GmbH provides the Partner, for the execution of works under this contract, with tools, machines and equipment (hereinafter \\"Equipment\\"), including related accessories, to the extent necessary for the activity (e.g. compressor, paint gun, smart-repair equipment etc.).`,
        `(2) Ownership and custody: a) All Equipment provided by Corion GmbH remains the property of Corion GmbH. b) The Partner receives the Equipment in custody (Obhut) and uses it exclusively for work performed at the Corion GmbH location, in compliance with internal rules. c) Upon termination of the contract, all Equipment remains in the custody and possession of Corion GmbH; the Partner has no right of retention (Zurückbehaltungsrecht) thereon.`,
        `(3) Duty of proper use and maintenance: a) The Partner is required to use the Equipment properly, in accordance with the manufacturer's instructions and safety standards (Herstellervorgaben/Arbeitsschutz). b) The Partner ensures ongoing maintenance and daily care measures (e.g. cleaning, correct storage, maintenance consumables) so that the Equipment is kept in working condition. c) Defects, excessive wear, loss or damage to the Equipment must be reported to Corion GmbH immediately in Textform (e.g. WhatsApp/email), no later than 24 hours after discovery.`,
        `(4) Normal wear vs. culpable damage: a) Normal wear resulting from compliant use (normale Abnutzung) is borne under the replacement rules of par. (5). b) In case of damage/loss caused by improper use, negligence or intent (schuldhafte Beschädigung/Verlust), the Partner bears the costs of repair or replacement in full, regardless of the distribution percentages provided in par. (5). c) In case of dispute regarding the cause, the parties will document the situation (photo/short report) and try amicable settlement; if necessary, a technical assessment (Kostenvoranschlag/Prüfbericht) may be requested.`,
        `(5) Replacement / reinvestment — by percentage: a) Replacement of Equipment that becomes unusable due to normal wear or to a defect not attributable to the Partner is carried out on the principle of cost co-participation. Regardless of the origin of the client or type of work (Model C or Model B), the replacement cost is borne 60% by Corion GmbH / 40% by the Partner. b) Compensation by settlement: the Partner's share is withheld from periodic settlements, or separate invoicing: Corion GmbH invoices the Partner's share, due in 14 days. c) Corion GmbH decides on the supplier and the technical specifications of the replacement Equipment, taking reasonable account of operational needs and value-for-money.`,
        `(6) Prohibition of disposal and external use: The Partner has no right to dispose of, pledge, lend or remove from the Corion GmbH location the Equipment without the prior consent of Corion GmbH in Textform.`,
        `(7) Inventory documentation: The Equipment provided may be recorded in a written inventory list (Inventarliste) attached to the contract and updated periodically. The parties agree that, alternatively or additionally, the condition and presence of the equipment may be documented exclusively by photographs or video recordings (Fotodokumentation) made at the time of handover and at the time of return. This visual documentation serves as a firm basis for comparison (\\"before and after\\" condition) for ascertaining any shortages, excessive wear or damage, with full evidentiary value between the parties, even in the absence of a written inventory list. The absence of a formal list or photographs does not in any way affect Corion GmbH's inalienable property right over the Equipment.`,
      ]},
      { h: "§ 9 Performance of Works, Liability, Occupational Safety and Insurance", body: [
        `1. Quality and Standards: The Partner performs orders professionally, in accordance with the manufacturer's requirements (Herstellervorgabe), value-appropriate repairs (zeitwertgerechte Reparatur) or Smart-Repair procedures, respecting the deadlines set. A protocol (including photos) will be drawn up at the takeover and return of the work.`,
        `2. Liability and Rework: The Partner is liable for the quality of their work. Complaints or rework (Nachbesserungen) due to the Partner's fault will be remedied by them at their own expense (time invested). If rework involves additional materials due to the Partner's exclusive fault, those costs will be charged to them. Defects caused by parts/materials supplied defectively by Corion GmbH do not entail the Partner's liability. For the financial security of these repairs, the provisions of the Guarantee Fund in § 6 apply.`,
        `3. Insurance (Betriebshaftpflicht): The Partner undertakes to maintain, throughout the contract, valid professional civil liability insurance (Betriebshaftpflichtversicherung) covering damages caused to clients' vehicles or to Corion GmbH's infrastructure, and will present proof on request.`,
        `4. Occupational Safety and Health: The Partner is responsible for compliance with occupational safety rules (Arbeitsschutz) for themselves and their possible employees/helpers.`,
      ]},
      { h: "§ 10 Confidentiality, Data Protection (GDPR) and Intellectual Property", body: [
        `1. Trade Secrets: The Partner will keep absolute confidentiality over the trade and business secrets (including know-how, price structures) belonging to Corion GmbH. This obligation is valid for the duration of the contract and for 2 years after its termination.`,
        `2. Confidential Information: Other operational information will be kept confidential during the contract and for 3 years after its termination, except for information lawfully made public.`,
        `3. Data Protection (GDPR): The Partner undertakes to comply with data protection legislation (GDPR/DSGVO) regarding Corion GmbH client data and to use it strictly for performance of the works; copying or use for other purposes is prohibited.`,
        `4. Intellectual Property: The materials provided, the CorionOS platform and the brand remain the exclusive property of Corion GmbH. The Partner is granted only a right of use limited to the duration and purpose of this contract.`,
      ]},
      { h: "§ 11 Customer Protection, Non-compete and Contractual Penalties", body: [
        `1. Customer Protection (Kundenschutz): During the contract and for 12 months after its termination, the Partner is strictly forbidden to approach, attract or provide services (directly or indirectly, personally or through interposed companies/family members) to Corion GmbH clients whom they have come to know through this collaboration, with the aim of bypassing Corion GmbH.`,
        `2. Non-compete (Wettbewerbsverbot): During the contract and for 6 months after its termination, in order to protect the specific know-how transferred, the Partner will not open or operate a directly competing business within a radius of 30 km from the Corion GmbH workshop location where they were active.`,
        `3. Contractual Penalties (Vertragsstrafe / Hamburger Brauch): For each culpable breach (intent or negligence) of the customer protection clauses (par. 1), non-compete (par. 2) or confidentiality obligations (§ 10), the Partner undertakes to pay a reasonable contractual penalty. Clarifications on the application and setting of the penalty: a) The exact amount of the penalty will be set reasonably (nach billigem Ermessen) by Corion GmbH according to the gravity of the deviation, but will not exceed the maximum amount of EUR 25,000.00 per breach. b) The proportionality and value of this penalty may be subject to control and reduction by the competent court. c) By \\"each breach\\" is meant each individual act (e.g. each separately approached client, each clandestinely executed work, each disclosed document). d) In the case of a continuing breach (Dauerverstoß — e.g. operating a competing workshop), each calendar month begun in which the breach persists will be considered a distinct deviation. e) Payment of the penalty does not exclude Corion GmbH's right to claim additional proven damages exceeding the penalty (Schadensersatz) and does not annul the Partner's obligation to immediately cease the prohibited action (Unterlassungsanspruch).`,
        `4. Clarification: The takeover of a walk-in under § 4 par. (5) or the execution of own clients under § 4 par. (6)–(7) does not constitute circumvention within the meaning of this paragraph, provided that notification in Textform is made and the 40% share (Model B) is remitted to Corion GmbH.`,
      ]},
      { h: "§ 12 Duration, Termination and Obligations on Termination", body: [
        `1. Duration: The contract is concluded for an indefinite period and may be terminated ordinarily by both parties with 3 months' notice to the end of the month (ordentlich kündbar).`,
        `2. Extraordinary termination: The right to immediate termination for cause (außerordentliche Kündigung) remains unaffected (e.g. theft, attracting Corion GmbH clients to perform work at another location, non-payment of obligations, serious and repeated quality defects).`,
        `3. Obligations on termination: Upon termination of the contract, the Partner will return immediately and in good working order (excluding normal wear) all tools, equipment and documents belonging to Corion GmbH. Access to CorionOS will be revoked, and the Partner will delete any data of Corion GmbH clients from their own devices.`,
      ]},
      { h: "§ 13 Final Provisions", body: [
        `1. Form: Amendments and additions to this contract require the written form. Communications by email (Textform) are considered valid for current operational agreements.`,
        `2. Severability: If any provision of this contract is or becomes invalid, the validity of the other provisions will not be affected. The parties undertake to replace the invalid clause with a valid one which best reflects the original economic purpose.`,
        `3. Jurisdiction: The competent court for all disputes is that of Frankfurt am Main, to the extent permitted by law (soweit gesetzlich zulässig). The law of the Federal Republic of Germany applies exclusively.`,
      ]},
    ],
    signatures: "Signatures",
    forFranchisor: "For Corion GmbH",
    forFranchisee: "For the Partner",
    date: "Date",
    generatedOn: "Generated on",
  };

  // ============================================================
  // ESPAÑOL — Traducción completa
  // ============================================================
  const es: I18n = {
    title: "CONTRATO DE COOPERACIÓN Y FRANQUICIA",
    subtitle: "Modelos operativos: Modelo C (40/60) y Modelo B (60/40)",
    parties: "Partes contratantes",
    franchisor: "Comitente / Franquiciador",
    franchisee: "Socio / Franquiciado",
    represented: "representado por",
    email: "Correo electrónico",
    phone: "Teléfono",
    taxNumber: "NIF / USt-ID",
    address: "Dirección",
    place: "Lugar, Fecha",
    sections: [
      { h: "§ 1 Objeto del Contrato y Autonomía del Socio", body: [
        `1. El Socio presta, en calidad de empresario independiente (selbstständiger Unternehmer), servicios artesanales en el ámbito de pintura de automóviles, smart-repair y reparaciones para los clientes intermediados por Corion GmbH, así como para sus propios clientes.`,
        `2. Corion GmbH pone a disposición del Socio el espacio de trabajo (taller), así como las herramientas y equipos necesarios para la ejecución de los trabajos.`,
        `3. Autonomía e independencia: El Socio actúa en nombre propio y por cuenta propia, asumiendo el riesgo empresarial íntegro por los servicios prestados. El Socio es libre de fijar su horario de trabajo (respetando los plazos de entrega convenidos con los clientes) y de organizar su actividad. El Socio tiene derecho a utilizar sus propios empleados o subcontratistas, bajo su propia responsabilidad, respetando las normas de acceso y seguridad del taller de Corion GmbH. La exclusividad se refiere estrictamente a la concentración en la calidad de la ejecución durante la presencia en el taller, no a una dependencia económica exclusiva respecto a Corion GmbH.`,
      ]},
      { h: "§ 2 Onboarding, Autorizaciones (Handwerksrecht) y Capital Inicial", body: [
        `1. Cuota de onboarding: A la celebración del contrato se abonará una cuota única de onboarding de ${fee},00 EUR (neto), exigible al emitir la factura.`,
        `2. Servicios administrativos: A petición del Socio, Corion GmbH puede facilitar asistencia administrativa. La cuota de onboarding cubre los costes de tramitación de: registro de domicilio (Anmeldung), registro de actividad comercial (Gewerbeanmeldung), asistencia para la apertura de cuenta bancaria, registro en la caja del seguro de enfermedad (Krankenkasse) y configuración del perfil en CorionOS. Estos servicios constituyen exclusivamente apoyo administrativo y no constituyen asesoramiento fiscal o jurídico.`,
        `3. Cualificaciones y Handwerksrecht: El Socio garantiza poseer las cualificaciones necesarias y se obliga a cumplir todos los requisitos legales para el ejercicio del oficio (por ejemplo, inscripción en la Handwerksrolle u obtención de una Ausnahmebewilligung de la HWK, si procede). Corion GmbH no responde por la falta de autorizaciones del Socio.`,
      ]},
      { h: "§ 3 Modelos de Remuneración (Modelo C y Modelo B), Liquidación y Costes de Materiales", body: [
        `1. Definición de los Modelos de Cooperación: En el marco de este contrato se aplican dos modelos de distribución de ingresos en función del origen del cliente:`,
        `Modelo C (Servicio integral / Pedidos Corion): Se aplica a los clientes captados, programados y administrados por Corion GmbH. La distribución porcentual del importe neto de mano de obra es del 40 % para el Socio (por la ejecución artesanal) y del 60 % para Corion GmbH (por gestión, infraestructura, marketing y captación de clientes).`,
        `Modelo B (Clientes propios): Se aplica a los clientes traídos directamente por el Socio, que no provienen de los canales de Corion GmbH. La distribución porcentual del importe neto de mano de obra es del 60 % para el Socio (por ejecución y captación del cliente) y del 40 % para Corion GmbH (por uso del local, herramientas, suministros e infraestructura).`,
        `2. Cuotas para el Modelo C (Pedidos Corion): Para los pedidos encuadrados en el Modelo C, el Socio recibe el 40 % del valor neto de la mano de obra (tiempo efectivo de trabajo / ejecución bruta, excluidas piezas y materiales facturados por separado) facturada al cliente final. El restante 60 % corresponde a Corion GmbH (cubriendo el uso del espacio, herramientas, marketing, uso de CorionOS, facturación y cobro de créditos).`,
        `3. Costes de materiales (Deducción a tanto alzado / BDE): Independientemente del modelo aplicado (B o C), si los materiales no se facturan directa y separadamente al cliente, sino a un precio a tanto alzado (global), se deducirá del valor total de la mano de obra un porcentaje correspondiente a los materiales consumidos antes de aplicar la división porcentual. Actualmente, este porcentaje de deducción de materiales está fijado en el ${bde} %. Esta deducción automática se basa en el sistema interno de normalización (conocido como BDE - Betriebsdatenerfassung) y se actualizará cada 6 meses para reflejar el consumo real. El Socio tiene la posibilidad de optar por utilizar sus propios materiales (en cuyo caso ya no se aplica la deducción porcentual), con la condición obligatoria de respetar estrictamente los estándares de calidad de Corion GmbH y asumir íntegramente la garantía ofrecida a los clientes. El Socio tiene derecho a un informe transparente de estas deducciones (los detalles específicos para el Modelo B se encuentran en el § 5).`,
        `4. Liquidación: La liquidación y el pago de las cuotas se realizarán periódicamente (por ejemplo, mensualmente), sobre la base de los informes generados por CorionOS y de las facturas emitidas por el Socio.`,
      ]},
      { h: "§ 4 Categorías de clientes, Representante Corion, Walk-in y Liquidación para Clientes Propios (Modelo B)", body: [
        `(1) Definiciones: a) «Pedidos Corion» = pedidos/trabajos cuyo cliente fue captado, ofertado, programado, administrado o facturado por Corion GmbH (incluido a través de marketing Corion, alianzas, plataformas, teléfono/email Corion, los sistemas digitales Corion/CorionOS u otros canales gestionados por Corion GmbH). b) «Clientes propios del Socio» = clientes traídos por el Socio, que no provienen de los canales de Corion GmbH y que se notifican en Textform (p. ej., email/WhatsApp) a Corion GmbH antes del inicio del trabajo, con como mínimo los siguientes datos: nombre del cliente, datos de contacto, matrícula (si la hubiera), descripción del trabajo, fecha/hora de la cita. c) «Walk-in / Local» = cliente que se presenta en el local de Corion GmbH sin prueba de un lead anterior, sin cita/registro en los sistemas de Corion GmbH y sin notificación previa según el apartado b). d) «Textform» = comunicación en forma de texto (p. ej., email, WhatsApp, SMS) que permite identificar al remitente y conservar el mensaje.`,
        `(2) Representante Corion (Corion-Vertreter): a) Es «Representante Corion» toda persona (o sistema) expresamente designada por Corion GmbH para gestionar la interacción con el cliente (en particular: recepción, peritaje, oferta, programación, recepción/entrega, facturación/cobro), incluidos: el Administrador (Geschäftsführer), socios (Gesellschafter), empleados de Corion GmbH; y/o terceros (incluidos subcontratistas / prestadores externos) y sistemas automatizados (incluidos agentes de IA) que actúen en nombre de Corion GmbH sobre la base de un mandato/contrato o una implementación técnica (Beauftragte/Erfüllungsgehilfe). b) La designación / actualización de los Representantes Corion también puede realizarse mediante notificación en Textform al Socio (p. ej., lista de personas + datos de contacto).`,
        `(3) Disponibilidad del Representante Corion: Un Representante Corion se considera «disponible» si se cumplen acumulativamente las siguientes condiciones: está físicamente presente en el local o puede atender al cliente de inmediato por teléfono/vídeo; y puede iniciar la gestión del walk-in en un máximo de 10 minutos desde la solicitud del Socio; y el Socio ha solicitado la atención por un canal verificable (llamada telefónica o mensaje en Textform). Si no se cumplen estas condiciones, el Representante Corion se considera «no disponible» a efectos del presente § 4.`,
        `(4) Reglas de asignación (Lead-Regelung): a) Los Pedidos Corion se liquidan conforme al § 3 del contrato sobre la base del Modelo C (40 % Socio / 60 % Corion GmbH). b) Los clientes propios del Socio pueden ser ejecutados en el local de Corion GmbH respetando el apartado (1) letra b) y las reglas operativas (capacidad de taller, programación, seguridad y salud laboral). La liquidación se realiza conforme al apartado (6) sobre la base del Modelo B (60 % Socio / 40 % Corion GmbH). c) Walk-in / Local: si hay un Representante Corion disponible (apartado 3) → el walk-in se trata como Pedido Corion (liquidación § 3 — Modelo C); si no hay un Representante Corion disponible → se aplica el apartado (5) (Excepción de walk-in tramitado por el Socio en nombre propio). d) Carga de la prueba: la prueba de que un cliente es «cliente propio» recae sobre el Socio (mediante notificación previa en Textform conforme al apartado (1) letra b) o mediante el procedimiento del apartado (5)).`,
        `(5) Excepción de Walk-in — el Socio asume íntegramente en nombre propio (recepción/entrega + facturación + cobro): Si en el momento de la presentación de un walk-in no hay un Representante Corion disponible (apartado 3), el Socio podrá hacerse cargo del walk-in como cliente propio, siempre que gestione íntegramente en nombre propio: la recepción, la comunicación, la entrega, la facturación y el cobro. Condiciones acumulativas: a) El Socio remite a Corion GmbH el mismo día (a más tardar a las 20:00) una notificación en Textform con: nombre del cliente, contacto, fecha/hora de llegada, descripción del trabajo, valor estimado. b) El Socio emite la factura al cliente y cobra en nombre propio. c) El Socio liquida a Corion GmbH la cuota del 40 % correspondiente al Modelo B conforme a los apartados (6) y (7) y al § 5. d) A falta de la notificación de la letra a), el caso se considera Pedido Corion y se liquidará conforme al Modelo C.`,
        `(6) Liquidación para Clientes Propios (Modelo B): a) Para los clientes propios del Socio (apartado 1 letra b) y apartado 5), se aplica el Modelo B, con la siguiente distribución del importe neto de mano de obra: 60 % Socio / 40 % Corion GmbH. b) La base de cálculo es el valor neto de la mano de obra (sin IVA). El tratamiento de los materiales antes de aplicar la cuota se realiza conforme al mecanismo detallado en el § 5. c) Lo que cubre la cuota del 40 % de Corion GmbH en el Modelo B: uso del local/taller, herramientas/equipos, suministros, desgaste estándar, infraestructura y acceso a los procesos internos necesarios para operar en el local.`,
        `(7) Plazos, informes y pago a Corion GmbH para clientes propios (Modelo B): a) El Socio mantiene un registro mínimo (lista) de los clientes propios atendidos en el local (nombre, fecha, trabajo, valor, estado de pago) y lo pone a disposición de Corion GmbH a petición. b) El Socio paga a Corion GmbH la cuota del 40 % del importe neto de mano de obra de los clientes propios en un plazo de ${pdays} días hábiles desde el cobro efectivo del cliente, en la cuenta bancaria indicada por Corion GmbH. c) En caso de cobros parciales, la liquidación a Corion GmbH se realiza proporcionalmente al cobro.`,
        `(8) Limitaciones operativas (capacidad de taller / reglas internas): El Socio puede aceptar clientes propios y walk-ins solo si ello no afecta de manera significativa a los pedidos ya programados y si se respetan las reglas internas del local (orden, seguridad y salud laboral, protección del medio ambiente, uso de herramientas).`,
      ]},
      { h: "§ 5 Materiales / Consumibles (Materialkosten) — Modelo B (60/40)", body: [
        `(1) Principio general — separación de «mano de obra» frente a «materiales»: Las partes acuerdan que la distribución 60 % Socio / 40 % Corion GmbH se aplica exclusivamente a la mano de obra neta («Arbeitsleistung / Lohnleistung», sin IVA), tras el tratamiento de los materiales conforme a los apartados (2)–(5). Los «Materiales» incluyen, sin limitación: pinturas, lacas, diluyentes, masillas, abrasivos, consumibles smart-repair, piezas pequeñas, materiales auxiliares y otros consumibles utilizados para la ejecución del trabajo.`,
        `(2) Materiales del stock de Corion GmbH: Si en un trabajo para un cliente propio (Modelo B) se utilizan materiales del stock de Corion GmbH, se aplica uno de los siguientes métodos (en función de la forma de facturación al cliente): a) Materiales facturados por separado (separat ausgewiesen): Si los materiales se desglosan por separado en la factura (línea separada), el valor neto de los materiales se descuenta íntegramente del cobro antes de calcular la mano de obra neta. La distribución 60/40 se aplica entonces solo a la mano de obra neta restante. b) Materiales incluidos a tanto alzado en el precio (pauschal kalkuliert / no separados): Si los materiales no se facturan por separado, sino que se incluyen en el precio total, del importe neto facturado se deduce un porcentaje de materiales determinado conforme al sistema de normalización de materiales (BDE - Betriebsdatenerfassung). La deducción porcentual se aplica antes de la división 60/40, y la distribución 60/40 se aplica solo a la parte de mano de obra neta resultante tras la deducción. c) Actualización del porcentaje BDE: El porcentaje BDE de materiales se establece y actualiza periódicamente (normalmente cada 6 meses) para reflejar el consumo real.`,
        `(3) Materiales del stock del Socio: Si los materiales utilizados para el trabajo provienen del stock del Socio (adquiridos y pagados por este), entonces: a) Materiales facturados por separado: El Socio tiene derecho a facturar y cobrar íntegramente el valor neto de los materiales (línea separada en la factura), sin aplicar la distribución 60/40 a dichos materiales. La distribución 60/40 se aplica solo a la mano de obra neta. b) Materiales incluidos a tanto alzado: Si los materiales del stock del Socio están incluidos a tanto alzado en el precio total (no se desglosan), las partes acuerdan que la parte correspondiente a los materiales (determinada bien por una cuota/tarifa acordada previamente, bien por un registro de costes del Socio) corresponde al 100 % al Socio, y la distribución 60/40 se aplica solo a la parte de mano de obra neta. Recomendación práctica (para evitar disputas): para los materiales del stock del Socio, se utilizará prioritariamente la facturación por separado, o se introducirá un anexo con un porcentaje/tarifa estándar.`,
        `(4) Orden de cálculo — obligatorio: Para todo trabajo en el Modelo B (60/40), el cálculo se realiza en este orden: 1. Se determina el importe neto facturado al cliente (sin IVA). 2. Se determina y separa el componente «materiales» conforme al apartado (2) o (3) — bien mediante línea separada en la factura, bien mediante deducción porcentual fija (si los materiales no están separados). 3. Se obtiene la mano de obra neta. 4. La mano de obra neta se reparte: 60 % Socio / 40 % Corion GmbH.`,
        `(5) Aclaración — prohibición de la doble remuneración: No se permite que un mismo componente de materiales sea remunerado dos veces (p. ej., como línea separada en la factura y como deducción a tanto alzado). Si los materiales se desglosan por separado, ya no se aplica la deducción porcentual (BDE) para esa parte.`,
        `(6) Prueba del origen de los materiales: A petición, el Socio indicará para el trabajo si los materiales provienen del stock de Corion GmbH o del Socio. Para los materiales del Socio, este podrá presentar documentos justificativos (p. ej., facturas de proveedores) en la medida razonable, en particular en caso de disputa.`,
      ]},
      { h: "§ 6 Fondo de Garantía (Sicherheitseinbehalt / Garantiefonds)", body: [
        `(1) Constitución del fondo: Para garantizar la cobertura de eventuales reclamaciones, pretensiones de garantía de los clientes (Gewährleistungsansprüche) o daños derivados de la actividad del Socio, se constituirá un fondo de garantía acumulativo por un valor máximo de 3.000,00 EUR.`,
        `(2) Mecanismo de retención: El fondo de garantía se constituirá gradualmente. Corion GmbH retendrá mensualmente una cuota del 5 % del valor neto correspondiente al Socio (de las liquidaciones periódicas de mano de obra), hasta que el saldo del fondo alcance el límite de 3.000,00 EUR. El Socio también puede optar por depositar este importe íntegramente por adelantado.`,
        `(3) Finalidad y uso: El fondo se utilizará exclusivamente para cubrir los costes de reparaciones, reelaboraciones (Nachbesserungen) o indemnizaciones, cuando: a) el Socio no cumpla su obligación de subsanar un trabajo defectuoso por su culpa en un plazo razonable fijado por Corion GmbH; b) las reclamaciones o solicitudes de reparación se produzcan tras la finalización del presente contrato y el Socio ya no esté disponible o se niegue a realizar la reparación.`,
        `(4) Devolución del fondo: A la finalización del contrato, el fondo de garantía (o el importe restante no utilizado tras eventuales deducciones justificadas) será retenido por Corion GmbH durante un período de 12 meses naturales a partir de la fecha del último trabajo realizado por el Socio, para asegurar la cobertura de reclamaciones tardías. Tras expirar este período de gracia, el saldo restante se transferirá íntegramente a la cuenta bancaria del Socio.`,
      ]},
      { h: "§ 7 Obligaciones, Servicios y Tarifas de Corion GmbH", body: [
        `1. Infraestructura y gestión estándar: Corion GmbH garantiza la infraestructura (taller, herramientas) y la gestión estándar (obtención de pedidos, comunicación con los clientes, facturación). El cliente final entra en relación contractual con Corion GmbH, que subcontrata la ejecución al Socio.`,
        `2. Compras: Corion GmbH gestiona el pedido de las piezas de repuesto y de los materiales necesarios.`,
        `3. Gestión adicional: Por actividades administrativas adicionales (p. ej., comunicación ampliada con las autoridades, tramitación manual de documentos específicos del Socio), Corion GmbH facturará una tarifa de 75,00 EUR netos por hora. Al firmar el presente contrato, el Socio acepta la prestación de estos servicios de gestión adicional y la tarifa correspondiente. Si el Socio no desea beneficiarse de este servicio, deberá comunicarlo a Corion GmbH previamente por escrito (p. ej., email / Textform).`,
      ]},
      { h: "§ 8 Herramientas, máquinas y equipos — uso, mantenimiento, sustitución, custodia", body: [
        `(1) Puesta a disposición: Corion GmbH pone a disposición del Socio, para la ejecución de los trabajos en el marco del presente contrato, herramientas, máquinas y equipos (en lo sucesivo, «Equipos»), incluidos los accesorios correspondientes, en la medida necesaria para la actividad (p. ej., compresor, pistola de pintar, equipos smart-repair, etc.).`,
        `(2) Propiedad y custodia: a) Todos los Equipos puestos a disposición por Corion GmbH siguen siendo propiedad de Corion GmbH. b) El Socio recibe los Equipos en custodia (Obhut) y los utiliza exclusivamente para los trabajos realizados en el local de Corion GmbH, respetando las normas internas. c) A la finalización del contrato, todos los Equipos permanecen en custodia y posesión de Corion GmbH; el Socio no tiene derecho de retención (Zurückbehaltungsrecht) sobre ellos.`,
        `(3) Obligación de uso adecuado y mantenimiento: a) El Socio está obligado a utilizar los Equipos de forma adecuada, conforme a las instrucciones del fabricante y a las normas de seguridad (Herstellervorgaben/Arbeitsschutz). b) El Socio asegura el mantenimiento corriente y las medidas de cuidado diario (p. ej., limpieza, almacenamiento correcto, consumibles de mantenimiento), de modo que los Equipos se mantengan en estado de funcionamiento. c) Las averías, el desgaste excesivo, la pérdida o el deterioro de los Equipos deben comunicarse a Corion GmbH inmediatamente en Textform (p. ej., WhatsApp/email), a más tardar dentro de las 24 horas siguientes a la constatación.`,
        `(4) Desgaste normal vs. deterioro culpable: a) El desgaste normal derivado del uso conforme (normale Abnutzung) se soporta conforme a las reglas de sustitución del apartado (5). b) En caso de deterioro/pérdida causado por uso inadecuado, negligencia o intención (schuldhafte Beschädigung/Verlust), el Socio soporta íntegramente los costes de reparación o sustitución, con independencia de los porcentajes de distribución previstos en el apartado (5). c) En caso de disputa sobre la causa, las partes documentarán la situación (foto/informe breve) y procurarán una solución amistosa; si fuera necesario, podrá solicitarse un peritaje técnico (Kostenvoranschlag/Prüfbericht).`,
        `(5) Sustitución / reinversiones — por porcentaje: a) La sustitución de los Equipos que se vuelvan inutilizables por desgaste normal o por avería no imputable al Socio se realizará sobre la base del principio de coparticipación en los costes. Con independencia del origen del cliente o del tipo de trabajo (Modelo C o Modelo B), el coste de sustitución se soporta en una proporción del 60 % Corion GmbH / 40 % Socio. b) Compensación por liquidación: la parte del Socio se retiene de las liquidaciones periódicas, o facturación separada: Corion GmbH factura la parte del Socio, con vencimiento a 14 días. c) Corion GmbH decide el proveedor y las especificaciones técnicas de los Equipos de sustitución, teniendo en cuenta de manera razonable las necesidades operativas y la relación calidad/precio.`,
        `(6) Prohibición de enajenación y uso externo: El Socio no tiene derecho a enajenar, pignorar, prestar o sacar del local de Corion GmbH los Equipos sin el previo acuerdo de Corion GmbH en Textform.`,
        `(7) Documentación del Inventario: Los Equipos puestos a disposición pueden consignarse en una lista escrita de inventario (Inventarliste) anexa al contrato y actualizada periódicamente. Las partes acuerdan que, alternativa o complementariamente, el estado y la presencia de los equipos pueden documentarse exclusivamente mediante fotografías o grabaciones de vídeo (Fotodokumentation) realizadas en el momento de la entrega y de la devolución. Esta documentación visual sirve como base firme de comparación (estado «antes y después») para la constatación de eventuales faltantes, desgastes excesivos o deterioros, con plena fuerza probatoria entre las partes, incluso en ausencia de una lista escrita de inventario. La falta de una lista formal o de las fotografías no afecta de modo alguno al derecho de propiedad inalienable de Corion GmbH sobre los Equipos.`,
      ]},
      { h: "§ 9 Ejecución de los Trabajos, Responsabilidad, Seguridad Laboral y Seguros", body: [
        `1. Calidad y Estándares: El Socio ejecuta los pedidos de manera profesional, conforme a los requisitos del fabricante (Herstellervorgabe), a las reparaciones adecuadas al valor (zeitwertgerechte Reparatur) o a los procedimientos Smart-Repair, respetando los plazos establecidos. Se levantará un acta (incluidas fotos) en la recepción y entrega del trabajo.`,
        `2. Responsabilidad y Subsanaciones: El Socio responde por la calidad de su trabajo. Las reclamaciones o reelaboraciones de los trabajos (Nachbesserungen) por culpa del Socio serán subsanadas por este a su propia cuenta (tiempo invertido). Si la subsanación implica materiales adicionales por culpa exclusiva del Socio, el coste de los mismos le será imputado. Los defectos causados por piezas/materiales suministrados de forma defectuosa por Corion GmbH no implican responsabilidad del Socio. Para el aseguramiento financiero de estas reparaciones se aplican las disposiciones del Fondo de Garantía del § 6.`,
        `3. Seguros (Betriebshaftpflicht): El Socio se obliga a mantener, durante toda la duración del contrato, un seguro de responsabilidad civil profesional (Betriebshaftpflichtversicherung) válido, que cubra los daños causados a vehículos de los clientes o a la infraestructura de Corion GmbH, y presentará prueba del mismo a petición.`,
        `4. Seguridad y Salud Laboral: El Socio es responsable del cumplimiento de las normas de protección laboral (Arbeitsschutz) para sí mismo y para sus eventuales empleados/ayudantes.`,
      ]},
      { h: "§ 10 Confidencialidad, Protección de Datos (RGPD) y Propiedad Intelectual", body: [
        `1. Secretos Comerciales: El Socio mantendrá la confidencialidad absoluta sobre los secretos comerciales y de negocio (incluido el know-how, las estructuras de precios) pertenecientes a Corion GmbH. Esta obligación es válida durante la vigencia del contrato y durante 2 años tras su finalización.`,
        `2. Información Confidencial: Otras informaciones operativas se mantendrán confidenciales durante la vigencia del contrato y durante 3 años tras su finalización, salvo las informaciones devenidas públicas legalmente.`,
        `3. Protección de Datos (RGPD): El Socio se obliga a cumplir la legislación sobre protección de datos (RGPD/DSGVO) respecto a los datos de los clientes de Corion GmbH y a utilizarlos estrictamente para la ejecución de los trabajos, estando prohibida su copia o uso para otros fines.`,
        `4. Propiedad Intelectual: Los materiales puestos a disposición, la plataforma CorionOS y la marca permanecen como propiedad exclusiva de Corion GmbH. Al Socio se le concede únicamente un derecho de uso limitado a la duración y finalidad del presente contrato.`,
      ]},
      { h: "§ 11 Protección de Clientes, No Competencia y Penalizaciones Contractuales", body: [
        `1. Protección de Clientes (Kundenschutz): Durante la vigencia del contrato y durante 12 meses tras su finalización, le está estrictamente prohibido al Socio abordar, captar o prestar servicios (directa o indirectamente, personalmente o a través de empresas interpuestas/familiares) a los clientes de Corion GmbH a los que haya conocido a través de esta colaboración, con el fin de eludir a Corion GmbH.`,
        `2. Prohibición de Competencia (Wettbewerbsverbot): Durante la vigencia del contrato y durante 6 meses tras su finalización, para proteger el know-how específico transmitido, el Socio no abrirá ni operará un negocio directamente competidor en un radio de 30 km del local del taller de Corion GmbH en el que haya operado.`,
        `3. Penalizaciones (Vertragsstrafe / Hamburger Brauch): Por cada incumplimiento culpable (intención o negligencia) de las cláusulas de protección de clientes (apartado 1), de no competencia (apartado 2) o de las obligaciones de confidencialidad (§ 10), el Socio se obliga a pagar una penalización contractual razonable. Aclaraciones sobre la aplicación y fijación de la penalización: a) El importe exacto de la penalización será fijado de manera razonable (nach billigem Ermessen) por Corion GmbH en función de la gravedad de la infracción, pero no superará la suma máxima de 25.000,00 EUR por incumplimiento. b) La proporcionalidad y el importe de esta penalización podrán ser objeto de control y reducción por el tribunal competente. c) Por «cada incumplimiento» se entiende cada acto individual (p. ej., cada cliente abordado por separado, cada trabajo ejecutado clandestinamente, cada documento divulgado). d) En caso de incumplimiento continuado (Dauerverstoß — p. ej., explotación de un taller competidor), cada mes natural comenzado en el que persista el incumplimiento se considerará una infracción distinta. e) El pago de la penalización no excluye el derecho de Corion GmbH a reclamar daños y perjuicios adicionales acreditados que excedan del importe de la penalización (Schadensersatz) y no anula la obligación del Socio de cesar inmediatamente la acción prohibida (Unterlassungsanspruch).`,
        `4. Aclaración: No constituye elusión a efectos del presente apartado la asunción de un walk-in conforme al § 4 apartado (5) ni la ejecución de clientes propios conforme al § 4 apartados (6)–(7), siempre que se realice la notificación en Textform y se liquide a Corion GmbH la cuota del 40 % (Modelo B).`,
      ]},
      { h: "§ 12 Duración, Resolución y Obligaciones a la Finalización", body: [
        `1. Duración: El contrato se celebra por tiempo indefinido y puede ser resuelto ordinariamente por ambas partes con un preaviso de 3 meses, hasta el final del mes (ordentlich kündbar).`,
        `2. Resolución extraordinaria: El derecho a la resolución inmediata por causas justificadas (außerordentliche Kündigung) permanece inalterado (p. ej., robo, captación de clientes de Corion GmbH para ejecutar trabajos en otro local, impago de obligaciones, deficiencias graves y reiteradas de calidad).`,
        `3. Obligaciones a la finalización: A la finalización del contrato, el Socio devolverá inmediatamente y en buen estado de funcionamiento (salvo el desgaste normal) todas las herramientas, equipos y documentos pertenecientes a Corion GmbH. Se revocará el acceso a CorionOS y el Socio borrará cualquier dato de los clientes de Corion GmbH de sus propios dispositivos.`,
      ]},
      { h: "§ 13 Disposiciones Finales", body: [
        `1. Forma: Las modificaciones y los anexos del presente contrato requieren la forma escrita. Las comunicaciones por email (Textform) se consideran válidas para los acuerdos operativos corrientes.`,
        `2. Cláusula de Salvaguarda: En caso de que una disposición del presente contrato sea o devenga nula, la validez de las restantes disposiciones no se verá afectada. Las partes se obligan a sustituir la cláusula nula por una válida que refleje del mejor modo el propósito económico inicial.`,
        `3. Jurisdicción: El tribunal competente para todos los litigios es el de Frankfurt am Main, en la medida en que esté permitido por la ley (soweit gesetzlich zulässig). Se aplica exclusivamente la legislación de la República Federal de Alemania.`,
      ]},
    ],
    signatures: "Firmas",
    forFranchisor: "Por Corion GmbH",
    forFranchisee: "Por el Socio",
    date: "Fecha",
    generatedOn: "Generado el",
  };

  return { de, en, ro, es };
}

export function generateFranchiseContractPdf(language: ContractLanguage, fields: ContractFields): Buffer {
  const i18n = buildI18n(fields);
  const t = i18n[language];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 18;
  let y = 0;

  // Header band
  doc.setFillColor(0xE5, 0x39, 0x35);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`+1 CORION LACKDOKTOR`, M, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(transliterate(`${CORION.address}  |  ${CORION.email}`), M, 16);
  y = 30;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(transliterate(t.title), W / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(transliterate(t.subtitle), W / 2, y, { align: "center" });
  y += 8;
  doc.setTextColor(0, 0, 0);

  // Parties block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(transliterate(t.parties), M, y); y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const writeKv = (label: string, val: string) => {
    if (!val) return;
    const line = `${label}: ${val}`;
    const wrapped = doc.splitTextToSize(transliterate(line), W - 2 * M);
    doc.text(wrapped, M, y);
    y += wrapped.length * 4.5;
  };

  doc.setFont("helvetica", "bold");
  doc.text(transliterate(`${t.franchisor}: ${CORION.name}`), M, y); y += 4.5;
  doc.setFont("helvetica", "normal");
  writeKv(t.represented, CORION.rep);
  writeKv(t.address, CORION.address);
  writeKv(t.email, CORION.email);
  y += 2;

  doc.setFont("helvetica", "bold");
  doc.text(transliterate(`${t.franchisee}: ${fields.partnerCompany || "—"}`), M, y); y += 4.5;
  doc.setFont("helvetica", "normal");
  writeKv(t.represented, fields.partnerRepresentative);
  writeKv(t.address, fields.partnerAddress);
  writeKv(t.taxNumber, fields.partnerTaxNumber);
  writeKv(t.email, fields.partnerEmail);
  writeKv(t.phone, fields.partnerPhone);
  y += 5;

  // Sections
  for (const sec of t.sections) {
    if (y > 260) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    const heading = doc.splitTextToSize(transliterate(sec.h), W - 2 * M);
    if (y + heading.length * 5 > 275) { doc.addPage(); y = M; }
    doc.text(heading, M, y);
    y += heading.length * 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    for (const para of sec.body) {
      const lines = doc.splitTextToSize(transliterate(para), W - 2 * M);
      if (y + lines.length * 4.5 > 275) { doc.addPage(); y = M; }
      doc.text(lines, M, y);
      y += lines.length * 4.5 + 2;
    }
    y += 2;
  }

  // Place + date line and signatures
  if (y > 230) { doc.addPage(); y = M; }
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(transliterate(`${t.place}: ${CORION.address.split(",").pop()?.trim() || ""}, ${fields.contractDate}`), M, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(transliterate(t.signatures), M, y); y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const colW = (W - 2 * M - 10) / 2;
  doc.line(M, y, M + colW, y);
  doc.line(M + colW + 10, y, W - M, y);
  y += 5;
  doc.text(transliterate(t.forFranchisor), M, y);
  doc.text(transliterate(t.forFranchisee), M + colW + 10, y);
  y += 5;
  doc.setTextColor(120, 120, 120);
  doc.text(transliterate(`${t.date}: ${fields.contractDate}`), M, y);
  doc.text(transliterate(`${t.date}: ${fields.contractDate}`), M + colW + 10, y);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      transliterate(`+1 Corion Lackdoktor  |  ${t.generatedOn} ${new Date().toISOString().slice(0, 10)}  |  ${i}/${pageCount}`),
      W / 2, 290, { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
