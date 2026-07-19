import { jsPDF } from "jspdf";

export type FlyerLanguage = "de" | "en" | "ro" | "es";

const BRAND_RED: [number, number, number] = [229, 57, 53];
const DARK: [number, number, number] = [20, 20, 20];
const LIGHT_GRAY: [number, number, number] = [240, 240, 240];
const TEXT_GRAY: [number, number, number] = [80, 80, 80];
const BG_SOFT: [number, number, number] = [248, 248, 248];

const RO_TRANSLITERATION: Record<string, string> = {
  "ă": "a", "Ă": "A",
  "â": "a", "Â": "A",
  "î": "i", "Î": "I",
  "ș": "s", "Ș": "S",
  "ş": "s", "Ş": "S",
  "ț": "t", "Ț": "T",
  "ţ": "t", "Ţ": "T",
};

function stripEmojis(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const isEmoji =
      (cp >= 0x1f000 && cp <= 0x1ffff) ||
      (cp >= 0x2600 && cp <= 0x27bf) ||
      cp === 0xfe0f ||
      cp === 0x200d;
    if (!isEmoji) out += ch;
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function sanitize(text: string, lang: FlyerLanguage): string {
  let out = stripEmojis(text);
  if (lang === "ro") {
    out = out.replace(/[ăĂâÂîÎșȘşŞțȚţŢ]/g, (c) => RO_TRANSLITERATION[c] || c);
  }
  return out;
}

const t = {
  documentTitle: {
    de: "Werde +1 CORION LACKDOKTOR Partner",
    en: "Become a +1 CORION LACKDOKTOR Partner",
    ro: "Fii Partener +1 CORION LACKDOKTOR",
    es: "Conviértete en Socio +1 CORION LACKDOKTOR",
  },
  tagline: {
    de: "Verwandle deine Leidenschaft in ein profitables Geschäft. Sei dein eigener Chef – ohne den Aufwand einer klassischen Werkstatt.",
    en: "Turn your passion into a profitable business. Be your own boss – without the headaches of a traditional workshop.",
    ro: "Transformă-ți pasiunea într-o afacere profitabilă. Fii propriul tău șef, fără bătăile de cap ale unui atelier tradițional!",
    es: "Convierte tu pasión en un negocio rentable. Sé tu propio jefe, sin los dolores de cabeza de un taller tradicional.",
  },
  intro: {
    de: "Du bist ein talentierter Fahrzeuglackierer oder Smart-Repair-Experte? Müde von einem Festgehalt, das deinen wahren Wert nicht widerspiegelt? Bei +1 Corion Lackdoktor sind wir überzeugt: gute Handwerker verdienen es, entsprechend ihrer Leistung zu verdienen. Wir liefern Infrastruktur, Premium-Kunden und Spitzentechnologie (KI & CRM) – du konzentrierst dich ausschließlich auf das, was du am besten kannst: Reparaturen auf höchstem Niveau.",
    en: "Are you a talented automotive painter or smart-repair expert? Tired of a fixed salary that does not reflect your real value? At +1 Corion Lackdoktor we believe good craftsmen deserve to earn in line with their effort. We provide the infrastructure, premium clients and top-tier technology (AI & CRM) – you focus exclusively on what you do best: repairs at the highest standards.",
    ro: "Ești un vopsitor auto sau un expert în smart-repair talentat? Te-ai săturat de un salariu fix care nu îți reflectă valoarea? La +1 Corion Lackdoktor, noi credem că meșterii buni merită să câștige pe măsura efortului lor. Îți oferim infrastructura, clienții premium și tehnologia de top (AI & CRM), iar tu te concentrezi exclusiv pe ceea ce știi să faci cel mai bine: reparații auto la cele mai înalte standarde.",
    es: "¿Eres un pintor automotriz o un experto en smart-repair con talento? ¿Cansado de un salario fijo que no refleja tu verdadero valor? En +1 Corion Lackdoktor creemos que los buenos artesanos merecen ganar acorde a su esfuerzo. Te ofrecemos la infraestructura, clientes premium y tecnología de primer nivel (IA & CRM), tú te concentras exclusivamente en lo que mejor sabes hacer: reparaciones al más alto estándar.",
  },
  brandBenefitsTitle: {
    de: "WARUM PARTNER WERDEN? (Deine Vorteile)",
    en: "WHY PARTNER WITH US? (Your Advantages)",
    ro: "DE CE SĂ PARTENERIEZI CU NOI? (Avantajele Tale)",
    es: "¿POR QUÉ ASOCIARTE CON NOSOTROS? (Tus Ventajas)",
  },
  modelsSectionTitle: {
    de: "WÄHLE DAS PASSENDE MODELL",
    en: "CHOOSE THE MODEL THAT FITS YOU",
    ro: "ALEGE MODELUL CARE ȚI SE POTRIVEȘTE",
    es: "ELIGE EL MODELO QUE SE ADAPTA A TI",
  },
  modelsSectionIntro: {
    de: "Egal ob du bereits eine eigene Werkstatt hast oder bei null anfängst – wir haben die passende Formel für dich.",
    en: "Whether you already have your own workshop or you want to start from zero, we have the perfect formula for you.",
    ro: "Fie că ai deja propriul atelier, fie că vrei să începi de la zero, avem formula perfectă pentru tine.",
    es: "Tanto si ya tienes tu propio taller como si quieres empezar de cero, tenemos la fórmula perfecta para ti.",
  },
  modelLabel: { de: "Modell", en: "Model", ro: "Model", es: "Modelo" },
  recommended: {
    de: "EMPFOHLEN",
    en: "RECOMMENDED",
    ro: "RECOMANDAT",
    es: "RECOMENDADO",
  },
  whatYouDo: {
    de: "Was du machst",
    en: "What you do",
    ro: "Ce faci tu",
    es: "Qué haces tú",
  },
  whatWeDo: {
    de: "Was wir machen",
    en: "What we do",
    ro: "Ce facem noi",
    es: "Qué hacemos nosotros",
  },
  yourBenefit: {
    de: "Dein maximaler Vorteil",
    en: "Your maximum benefit",
    ro: "Beneficiul tău maxim",
    es: "Tu beneficio máximo",
  },
  hybridTitle: {
    de: "HYBRID-ANSATZ: KOMBINIERE MODELL B MIT MODELL C",
    en: "HYBRID APPROACH: COMBINE MODEL B WITH MODEL C",
    ro: "ABORDAREA HIBRIDĂ: COMBINĂ MODELUL B CU MODELUL C",
    es: "ENFOQUE HÍBRIDO: COMBINA EL MODELO B CON EL MODELO C",
  },
  hybridIntro: {
    de: "Der intelligenteste und flexibelste Weg, dein Einkommen in unserer Werkstatt zu maximieren.",
    en: "The smartest and most flexible way to maximize your earnings while working in our workshop.",
    ro: "Cea mai inteligentă și flexibilă cale de a-ți maximiza veniturile lucrând în atelierul nostru.",
    es: "La forma más inteligente y flexible de maximizar tus ingresos trabajando en nuestro taller.",
  },
  hybridSubIntro: {
    de: "Da beide Modelle in der Corion-Location und mit unserer Infrastruktur ablaufen, kannst du sie parallel kombinieren und das Beste aus jeder Situation herausholen:",
    en: "Since both models run in the Corion location and use our infrastructure, you can combine them in parallel to get the most out of every situation:",
    ro: "Deoarece ambele modele presupun lucrul în locația și cu infrastructura Corion, le poți combina simultan pentru a profita la maximum de fiecare situație:",
    es: "Dado que ambos modelos se realizan en la ubicación e infraestructura de Corion, puedes combinarlos en paralelo para aprovechar al máximo cada situación:",
  },
  hybridAdvantagesTitle: {
    de: "Vorteile der Kombination B + C:",
    en: "Advantages of combining B + C:",
    ro: "Avantajele Combinării B + C:",
    es: "Ventajas de combinar B + C:",
  },
  materialsTitle: {
    de: "WIE GEHEN WIR MIT MATERIALIEN UM? (Volle Transparenz)",
    en: "HOW DO WE HANDLE MATERIALS? (Full Transparency)",
    ro: "CUM PROCEDĂM CU MATERIALELE? (Transparență totală)",
    es: "¿CÓMO MANEJAMOS LOS MATERIALES? (Transparencia total)",
  },
  ctaTitle: {
    de: "BEREIT FÜR DEN NÄCHSTEN SCHRITT?",
    en: "READY TO TAKE THE NEXT STEP?",
    ro: "EȘTI GATA SĂ TRECI LA NIVELUL URMĂTOR?",
    es: "¿LISTO PARA DAR EL SIGUIENTE PASO?",
  },
  ctaBody: {
    de: "Überlasse Bürokratie und Marketing der künstlichen Intelligenz und dem Corion-Management. Verwandle deine Fähigkeiten in eine echte, unabhängige Einkommensquelle.",
    en: "Leave bureaucracy and marketing to artificial intelligence and the Corion management. Turn your skills into a real, independent source of income.",
    ro: "Lasă birocrația și marketingul în seama inteligenței artificiale și a managementului Corion. Transformă-ți îndemânarea într-o sursă de venit reală și independentă.",
    es: "Deja la burocracia y el marketing en manos de la inteligencia artificial y la dirección de Corion. Convierte tu habilidad en una fuente de ingresos real e independiente.",
  },
  contactCta: {
    de: "Kontaktiere uns jetzt für einen Termin:",
    en: "Contact us now to arrange a meeting:",
    ro: "Contactează-ne acum pentru a stabili o întâlnire:",
    es: "Contáctanos ahora para concertar una cita:",
  },
  footer: {
    de: "+1 Corion Lackdoktor · Smart Repair Spezialist · Premium Qualität",
    en: "+1 Corion Lackdoktor · Smart Repair Specialist · Premium Quality",
    ro: "+1 Corion Lackdoktor · Specialist Smart Repair · Calitate Premium",
    es: "+1 Corion Lackdoktor · Especialista en Smart Repair · Calidad Premium",
  },
  page: { de: "Seite", en: "Page", ro: "Pagina", es: "Página" },
};

interface BrandBenefit {
  title: Record<FlyerLanguage, string>;
  body: Record<FlyerLanguage, string>;
}

const brandBenefits: BrandBenefit[] = [
  {
    title: {
      de: "Unbegrenzte Einnahmen",
      en: "Uncapped Earnings",
      ro: "Câștiguri Neplafonate",
      es: "Ganancias Sin Límite",
    },
    body: {
      de: "Du bist nicht einfach Angestellter, du bist Unternehmer (selbstständig). Je effizienter du arbeitest, desto mehr verdienst du.",
      en: "You are not just an employee, you are an entrepreneur (selbstständig). The more efficiently you work, the more you earn.",
      ro: "Nu ești un simplu angajat, ești antreprenor (selbstständig). Cu cât lucrezi mai eficient, cu atât câștigi mai mult.",
      es: "No eres un simple empleado, eres empresario (selbstständig). Cuanto más eficientemente trabajas, más ganas.",
    },
  },
  {
    title: {
      de: "KI-Technologie & Automatisierung",
      en: "AI Technology & Automation",
      ro: "Tehnologie AI și Automatizare",
      es: "Tecnología IA y Automatización",
    },
    body: {
      de: "Schluss mit Papierkram. Wir nutzen künstliche Intelligenz für die schnelle Schadensanalyse und ein zu 100 % digitalisiertes CRM-System für Termine.",
      en: "Forget the paperwork. We use artificial intelligence for rapid damage analysis and a 100% digitalised CRM system for appointments.",
      ro: "Scapi de hârtii. Folosim inteligența artificială pentru analiza rapidă a daunelor și un sistem CRM 100% digitalizat pentru programări.",
      es: "Olvídate del papeleo. Usamos inteligencia artificial para el análisis rápido de daños y un sistema CRM 100% digitalizado para las citas.",
    },
  },
  {
    title: {
      de: "Starke Marke & 2 Jahre Garantie",
      en: "Strong Brand & 2-Year Warranty",
      ro: "Brand Puternic & Garanție 2 Ani",
      es: "Marca Fuerte & Garantía 2 Años",
    },
    body: {
      de: "Kunden vertrauen uns. Wir bieten 2 Jahre Garantie auf Reparaturen, was dir einen konstanten Strom an Kunden sichert, die bereit sind, für Premium-Qualität zu zahlen.",
      en: "Clients trust us. We offer a 2-year warranty on repairs, which secures you a constant flow of customers willing to pay for premium quality.",
      ro: "Clienții au încredere în noi. Oferim o garanție de 2 ani pentru reparații, ceea ce îți asigură un flux constant de clienți dispuși să plătească pentru calitate premium.",
      es: "Los clientes confían en nosotros. Ofrecemos 2 años de garantía en las reparaciones, lo que te asegura un flujo constante de clientes dispuestos a pagar por calidad premium.",
    },
  },
  {
    title: {
      de: "Corion Academy",
      en: "Corion Academy",
      ro: "Corion Academy",
      es: "Corion Academy",
    },
    body: {
      de: "Kontinuierlicher Zugang zu Weiterbildung und neuesten Zertifizierungen. Wir helfen dir, immer der Beste zu sein.",
      en: "Continuous access to professional training and the latest certifications. We help you stay the best at what you do.",
      ro: "Acces continuu la formare profesională și certificări de ultimă oră. Noi te ajutăm să fii mereu cel mai bun.",
      es: "Acceso continuo a formación profesional y certificaciones de última generación. Te ayudamos a ser siempre el mejor.",
    },
  },
];

interface ModelData {
  letter: string;
  color: [number, number, number];
  title: Record<FlyerLanguage, string>;
  share: Record<FlyerLanguage, string>;
  partnerPercent: number;
  corionPercent: number;
  recommended?: boolean;
  intro: Record<FlyerLanguage, string>;
  whatYouDo: Record<FlyerLanguage, string>;
  whatWeDo: Record<FlyerLanguage, string>;
  yourBenefit: Record<FlyerLanguage, string>;
}

const models: ModelData[] = [
  {
    letter: "A",
    color: [34, 197, 94],
    partnerPercent: 80,
    corionPercent: 20,
    title: {
      de: "Der unabhängige Subunternehmer",
      en: "The Independent Subcontractor",
      ro: "Subcontractorul Independent",
      es: "El Subcontratista Independiente",
    },
    share: {
      de: "80% Du / 20% Corion",
      en: "80% You / 20% Corion",
      ro: "80% Tu / 20% Corion",
      es: "80% Tú / 20% Corion",
    },
    intro: {
      de: "Du hast bereits deine eigene Werkstatt und Ausstattung, willst aber den nächsten Schritt gehen.",
      en: "You already have your own workshop and equipment, but you want to take it to the next level.",
      ro: "Ai deja propriul tău atelier și echipament, dar vrei să treci la nivelul următor.",
      es: "Ya tienes tu propio taller y equipo, pero quieres dar el siguiente salto.",
    },
    whatYouDo: {
      de: "Du führst die Arbeiten in deiner eigenen Werkstatt mit deinen Werkzeugen und Materialien aus. Du übernimmst die Garantie für deine Arbeit.",
      en: "You carry out the work in your own workshop, using your own tools and materials. You take responsibility for the warranty on your work.",
      ro: "Execuți lucrările în propriul tău atelier, folosind sculele și materialele tale. Îți asumi garanția pentru lucrare.",
      es: "Ejecutas los trabajos en tu propio taller, usando tus herramientas y materiales. Asumes la garantía de tu trabajo.",
    },
    whatWeDo: {
      de: "Wir bringen dir Premium-Kunden unter der Marke Corion, geben dir Zugriff auf unsere KI-Tools zur Schadensbewertung und optimieren deine Arbeitsprozesse.",
      en: "We bring you premium clients under the Corion brand, give you access to our AI damage-assessment tools and optimise your work processes.",
      ro: "Îți aducem clienți premium sub brandul Corion, îți oferim acces la uneltele noastre AI de evaluare a daunelor și îți optimizăm procesele de lucru.",
      es: "Te llevamos clientes premium bajo la marca Corion, te damos acceso a nuestras herramientas de IA para la evaluación de daños y optimizamos tus procesos.",
    },
    yourBenefit: {
      de: "Du behältst 80 % vom Wert der Arbeit, vergrößerst dein Kundenvolumen und profitierst von unserem Marketing, ohne selbst Geld für Werbung auszugeben.",
      en: "You keep 80% of the work value, grow your customer volume and benefit from our marketing without spending money on ads yourself.",
      ro: "Păstrezi 80% din valoarea lucrării, îți crești volumul de clienți și profiti de marketingul nostru fără a cheltui bani pe reclame.",
      es: "Te quedas con el 80% del valor del trabajo, aumentas tu volumen de clientes y aprovechas nuestro marketing sin gastar dinero en publicidad.",
    },
  },
  {
    letter: "B",
    color: [59, 130, 246],
    partnerPercent: 60,
    corionPercent: 40,
    title: {
      de: "Management & Eigene Kunden",
      en: "Management & Your Own Clients",
      ro: "Management & Clienți Proprii",
      es: "Gestión & Clientes Propios",
    },
    share: {
      de: "60% Du / 40% Corion",
      en: "60% You / 40% Corion",
      ro: "60% Tu / 40% Corion",
      es: "60% Tú / 40% Corion",
    },
    intro: {
      de: "Für Handwerker, die in unserem Ökosystem arbeiten, mit eigenem Kundenstamm oder die von der erweiterten Corion-Vermittlung profitieren.",
      en: "For craftsmen who work in our ecosystem, with their own client portfolio or who benefit from advanced Corion brokering.",
      ro: "Pentru meșterii care lucrează în ecosistemul nostru, cu propriul portofoliu de clienți sau care beneficiază de intermedierea avansată Corion.",
      es: "Para artesanos que trabajan en nuestro ecosistema, con su propia cartera de clientes o que se benefician de la intermediación avanzada Corion.",
    },
    whatYouDo: {
      de: "Du konzentrierst dich ausschließlich auf Produktion und Reparatur und sicherst die Premium-Qualität von Corion. Du führst die Reparaturen, auch für deine eigenen Kunden, in unserer Location und unseren Werkstätten aus.",
      en: "You focus exclusively on production and repair, ensuring Corion premium quality. You carry out the repairs, including for your own clients, in our location and our workshops.",
      ro: "Te concentrezi exclusiv pe producție și reparație, asigurând calitatea premium Corion. Execuți reparațiile, inclusiv pentru clienții tăi proprii, în locația și atelierele noastre.",
      es: "Te concentras exclusivamente en producción y reparación, asegurando la calidad premium Corion. Ejecutas las reparaciones, incluso para tus propios clientes, en nuestra ubicación y talleres.",
    },
    whatWeDo: {
      de: "Wir stellen dir eine Top-Infrastruktur zur Verfügung. Wir machen das Management und übernehmen das Schwere: Disposition, CRM, Terminplanung und Kundenbeziehungsmanagement.",
      en: "We provide you with a top-tier infrastructure. We do the management and shoulder the heavy work: dispatch, CRM, appointment planning and customer relationship management.",
      ro: "Îți punem la dispoziție o infrastructură de top. Noi facem managementul și preluăm greul: dispecerat, CRM, planificarea programărilor și managementul relațiilor cu clienții.",
      es: "Te ponemos a disposición una infraestructura de primer nivel. Nosotros hacemos la gestión y asumimos lo pesado: despacho, CRM, planificación de citas y gestión de relaciones con clientes.",
    },
    yourBenefit: {
      de: "Du behältst 60 % der Arbeitsleistung. Wir kümmern uns um den „langweiligen Teil\" des Geschäfts (Verwaltung und Organisation), und du gewinnst Zeit und Geld.",
      en: "You keep 60% of the labour. We take care of the \"boring side\" of the business (administration and organisation), and you gain time and money.",
      ro: "Păstrezi 60% din manoperă. Noi ne ocupăm de „partea plictisitoare\" a afacerii (administrația și organizarea), iar tu câștigi timp și bani.",
      es: "Te quedas con el 60% de la mano de obra. Nosotros nos encargamos de la „parte aburrida\" del negocio (administración y organización), y tú ganas tiempo y dinero.",
    },
  },
  {
    letter: "C",
    color: BRAND_RED,
    partnerPercent: 40,
    corionPercent: 60,
    recommended: true,
    title: {
      de: "Full-Service / Sorglos",
      en: "Full-Service / Worry-Free",
      ro: "Full-Service / Fără Griji",
      es: "Full-Service / Sin Preocupaciones",
    },
    share: {
      de: "40% Du / 60% Corion",
      en: "40% You / 60% Corion",
      ro: "40% Tu / 60% Corion",
      es: "40% Tú / 60% Corion",
    },
    intro: {
      de: "Du kommst zur Arbeit, reparierst das Auto und gehst nach Hause. Null administrativer Stress.",
      en: "You come to work, repair the car and go home. Zero administrative stress.",
      ro: "Vii la muncă, repari mașina și pleci acasă. Zero stres administrativ.",
      es: "Vienes a trabajar, reparas el coche y te vas a casa. Cero estrés administrativo.",
    },
    whatYouDo: {
      de: "Reines Handwerk. Du führst die Reparatur in unserer Location aus.",
      en: "Pure craftsmanship. You carry out the repair in our location.",
      ro: "Doar pur meșteșug. Execuți reparația în locația noastră.",
      es: "Puro oficio. Ejecutas la reparación en nuestra ubicación.",
    },
    whatWeDo: {
      de: "ABSOLUT ALLES. Wir geben dir die Werkstatt kostenlos, zahlen Strom und Heizung, stellen die Profi-Werkzeuge bereit. Wir suchen die Kunden, machen die Angebote, schreiben die Rechnungen und treiben das Geld ein (Inkasso).",
      en: "ABSOLUTELY EVERYTHING. We give you the workshop for free, pay electricity and heating, supply professional tools. We find the clients, make the quotes, issue the invoices and collect the money (Inkasso).",
      ro: "ABSOLUT TOT. Îți dăm atelierul gratuit, plătim curentul, căldura, punem la dispoziție sculele profesionale. Căutăm clienții, facem devizele, emitem facturile și recuperăm banii (Inkasso).",
      es: "ABSOLUTAMENTE TODO. Te damos el taller gratis, pagamos la electricidad, la calefacción, ponemos a disposición las herramientas profesionales. Buscamos a los clientes, hacemos los presupuestos, emitimos las facturas y cobramos el dinero (Inkasso).",
    },
    yourBenefit: {
      de: "Die 40 %, die du von der Arbeitsleistung kassierst, sind dein Brutto-Geld – ohne Sorge um Werkstattmiete, Werkzeugkauf oder Kundenakquise.",
      en: "The 40% you cash in from the labour is your gross money – with no worries about workshop rent, buying tools or finding clients.",
      ro: "Cei 40% pe care îi încasezi din manoperă sunt banii tăi brut, fără nicio grijă legată de plata chiriei atelierului, achiziția de unelte sau găsirea clienților.",
      es: "El 40% que cobras de la mano de obra es tu dinero bruto, sin preocupación alguna por el alquiler del taller, la compra de herramientas o la búsqueda de clientes.",
    },
  },
  {
    letter: "D",
    color: [234, 179, 8],
    partnerPercent: 70,
    corionPercent: 30,
    title: {
      de: "Start-Up & Leasing",
      en: "Start-Up & Leasing",
      ro: "Start-Up & Leasing",
      es: "Start-Up & Leasing",
    },
    share: {
      de: "70% Du / 30% Corion",
      en: "70% You / 30% Corion",
      ro: "70% Tu / 30% Corion",
      es: "70% Tú / 30% Corion",
    },
    intro: {
      de: "Du bist extrem talentiert, willst unabhängig sein, hast aber nicht das Kapital von Zehntausenden Euro für eine Werkstatt.",
      en: "You are extremely talented, you want to be independent, but you do not have the tens of thousands of euros of capital needed for a workshop.",
      ro: "Ești extrem de talentat, vrei să fii independent, dar nu ai capitalul zecilor de mii de euro necesari pentru un atelier.",
      es: "Eres muy talentoso, quieres ser independiente, pero no tienes el capital de decenas de miles de euros necesarios para un taller.",
    },
    whatYouDo: {
      de: "Du bearbeitest den Kundenstrom und kümmerst dich um die in Verwahrung übergebenen Werkzeuge (Mindestvertragslaufzeit 1 Jahr).",
      en: "You handle the flow of clients and take care of the tools entrusted to you (minimum contract duration of 1 year).",
      ro: "Prelucrezi fluxul de clienți și ai grijă de uneltele primite în custodie (necesită contract minim de 1 an).",
      es: "Procesas el flujo de clientes y cuidas las herramientas recibidas en custodia (requiere contrato mínimo de 1 año).",
    },
    whatWeDo: {
      de: "Wir finanzieren deinen Start. Wir geben dir Werkstatt und professionelle Ausrüstung im Leasing/Mietmodell und einen Kundenstamm ab dem ersten Tag.",
      en: "We finance your start. We provide the workshop and professional equipment on a leasing/rental basis and a client base from day one.",
      ro: "Finanțăm începutul tău. Îți oferim atelierul și echipamentele profesionale în regim de leasing/închiriere și o bază de clienți din prima zi.",
      es: "Financiamos tu inicio. Te ofrecemos el taller y los equipos profesionales en régimen de leasing/alquiler y una base de clientes desde el primer día.",
    },
    yourBenefit: {
      de: "Du startest dein Geschäft ohne Anfangsinvestition. Du behältst 70 % der Arbeitsleistung und erzielst ab dem ersten Tag Profit!",
      en: "You start your business without initial investment. You keep 70% of the labour and generate profit from day one!",
      ro: "Începi afacerea fără investiții inițiale. Păstrezi 70% din manoperă și generezi profit din prima zi!",
      es: "Inicias tu negocio sin inversiones iniciales. Te quedas con el 70% de la mano de obra y generas ganancias desde el primer día.",
    },
  },
];

interface HybridBlock {
  label: Record<FlyerLanguage, string>;
  body: Record<FlyerLanguage, string>;
}

const hybridBlocks: HybridBlock[] = [
  {
    label: {
      de: "Deine sichere Basis (Modell C – 40/60)",
      en: "Your secure base (Model C – 40/60)",
      ro: "Baza ta sigură (Modelul C - 40/60)",
      es: "Tu base segura (Modelo C – 40/60)",
    },
    body: {
      de: "Du übernimmst den konstanten Auftragsfluss, den Corion generiert. Wir kümmern uns um das gesamte Management (Angebote, Terminplanung, Rechnung), und du hast garantiert jeden Tag Arbeit, mit 40 % an der Arbeitsleistung.",
      en: "You take on the constant flow of jobs generated by Corion. We handle the entire management (quotes, scheduling, invoicing), and you have guaranteed work every day, earning 40% of the labour.",
      ro: "Preiei fluxul constant de comenzi generate de Corion. Noi ne ocupăm de tot managementul (ofertare, programare, facturare), iar tu ai de lucru garantat zi de zi, încasând 40% din manoperă.",
      es: "Tomas el flujo constante de pedidos generados por Corion. Nosotros nos encargamos de toda la gestión (ofertas, programación, facturación), y tú tienes trabajo garantizado cada día, cobrando el 40% de la mano de obra.",
    },
  },
  {
    label: {
      de: "Dein Wachstums-Bonus (Modell B – 60/40)",
      en: "Your growth bonus (Model B – 60/40)",
      ro: "Bonusul tău de creștere (Modelul B - 60/40)",
      es: "Tu bonus de crecimiento (Modelo B – 60/40)",
    },
    body: {
      de: "Du hast ein eigenes Netzwerk an Bekannten, ehemaligen Kunden oder bringst jemand Neues mit (Walk-in)? Du führst die Arbeit ebenfalls in unserer Werkstatt aus, doch weil du den Kunden gebracht hast, kassierst du einen erhöhten Anteil von 60 % der Arbeitsleistung!",
      en: "You have your own network of acquaintances, former clients or you bring in someone new (walk-in)? You still carry out the work in our workshop, but because you generated the client, you cash in an increased share of 60% of the labour!",
      ro: "Ai o rețea proprie de cunoștințe, foști clienți sau aduci pe cineva nou (Walk-in)? Execuți lucrarea tot în atelierul nostru, dar, pentru că ai generat clientul, încasezi un procent majorat de 60% din manoperă!",
      es: "¿Tienes una red propia de conocidos, antiguos clientes o traes a alguien nuevo (walk-in)? Ejecutas el trabajo también en nuestro taller, pero, como tú generaste al cliente, ¡cobras un porcentaje mayor del 60% de la mano de obra!",
    },
  },
];

const hybridAdvantages: BrandBenefit[] = [
  {
    title: {
      de: "Stabilität",
      en: "Stability",
      ro: "Stabilitate",
      es: "Estabilidad",
    },
    body: {
      de: "Du musst dir nie Sorgen machen, dass du keine Arbeit hast; unsere Aufträge (Modell C) sichern deine Basis.",
      en: "You never have to worry about being out of work; our jobs (Model C) secure your base.",
      ro: "Nu trebuie să te stresezi vreodată că nu ai de lucru; comenzile noastre (Model C) îți asigură baza.",
      es: "Nunca tienes que preocuparte por no tener trabajo; nuestros pedidos (Modelo C) aseguran tu base.",
    },
  },
  {
    title: {
      de: "Extra Motivation",
      en: "Extra motivation",
      ro: "Motivare extra",
      es: "Motivación extra",
    },
    body: {
      de: "Du wirst direkt für dein Engagement belohnt. Jeder Kunde, den du persönlich bringst, steigert deine Marge erheblich (Modell B).",
      en: "You are directly rewarded for your engagement. Every client you personally bring significantly increases your profit margin (Model B).",
      ro: "Ești direct recompensat pentru implicare. Orice client pe care îl aduci personal îți crește semnificativ marja de profit (Model B).",
      es: "Eres recompensado directamente por tu implicación. Cada cliente que traes personalmente aumenta significativamente tu margen de beneficio (Modelo B).",
    },
  },
  {
    title: {
      de: "Kostenlose Infrastruktur",
      en: "Free infrastructure",
      ro: "Infrastructură gratuită",
      es: "Infraestructura gratuita",
    },
    body: {
      de: "Du nutzt für beide Varianten dieselben Werkzeuge und denselben Raum, bezahlt von Corion.",
      en: "You use the same tools and the same space for both variants, paid by Corion.",
      ro: "Beneficiezi de ambele variante folosind aceleași scule și același spațiu plătit de Corion.",
      es: "Disfrutas de ambas variantes utilizando las mismas herramientas y el mismo espacio pagado por Corion.",
    },
  },
  {
    title: {
      de: "Volle Flexibilität",
      en: "Total flexibility",
      ro: "Flexibilitate totală",
      es: "Flexibilidad total",
    },
    body: {
      de: "Der Wechsel zwischen den beiden Modellen erfolgt transparent und automatisch über unser Betriebssystem (CorionOS), je nachdem, wer den Kunden gebracht hat.",
      en: "Switching between the two models happens transparently and automatically through our operating system (CorionOS), depending on who brought the client.",
      ro: "Alternarea între cele două modele se face transparent și automat prin sistemul nostru de operare (CorionOS), în funcție de cine a adus clientul.",
      es: "La alternancia entre los dos modelos se realiza de forma transparente y automática mediante nuestro sistema operativo (CorionOS), según quién haya traído al cliente.",
    },
  },
];

const materialsBlocks: HybridBlock[] = [
  {
    label: {
      de: "Unsere Materialien",
      en: "Our materials",
      ro: "Materialele noastre",
      es: "Nuestros materiales",
    },
    body: {
      de: "Wir stellen alle benötigten Materialien zur Verfügung. Dafür wird automatisch ein Pauschalbetrag (ca. 20 % gemäß BDE-System) vom dem Kunden in Rechnung gestellten Betrag abgezogen, bevor die Arbeitsleistung aufgeteilt wird.",
      en: "We provide all the necessary materials. For this, a flat-rate share (approx. 20% according to the BDE system) is automatically deducted from the invoice value before the labour is split.",
      ro: "Noi punem la dispoziție toate materialele necesare. Pentru asta, din valoarea facturii emise clientului se deduce automat un procent paușal (aprox. 20% conform sistemului BDE) înainte de a împărți manopera.",
      es: "Nosotros ponemos a disposición todos los materiales necesarios. Para ello, del valor de la factura emitida al cliente se deduce automáticamente un porcentaje fijo (aprox. 20% según el sistema BDE) antes de repartir la mano de obra.",
    },
  },
  {
    label: {
      de: "Du willst deine eigenen Materialien nutzen?",
      en: "Want to use your own materials?",
      ro: "Vrei să folosești materialele tale?",
      es: "¿Quieres usar tus propios materiales?",
    },
    body: {
      de: "Kein Problem! Solange du unsere Qualitätsstandards einhältst, kannst du mit deinen eigenen Materialien kommen. In diesem Fall entfällt der Abzug von 20 %, und deine Berechnungsbasis für den Verdienst ist höher!",
      en: "No problem! As long as you meet our quality standards, you can come with your own materials. In that case the 20% deduction disappears and your calculation base for earnings is higher!",
      ro: "Nicio problemă! Dacă respecți standardele noastre de calitate, poți veni cu materialele tale proprii. În acest caz, deducerea de 20% dispare, iar baza ta de calcul pentru câștig va fi mai mare!",
      es: "¡Sin problema! Mientras respetes nuestros estándares de calidad, puedes traer tus propios materiales. En ese caso, la deducción del 20% desaparece, ¡y tu base de cálculo para las ganancias será mayor!",
    },
  },
];

const materialsIntro: Record<FlyerLanguage, string> = {
  de: "In den Modellen, in denen du in unserer Werkstatt arbeitest (z. B. Modell C), willst du sofort produktiv sein, ohne dein Geld in Lacken und Kitten zu binden:",
  en: "In the models where you work in our workshop (e.g. Model C), we want you to be productive immediately, without tying up your money in paints and fillers:",
  ro: "În modelele unde lucrezi în atelierul nostru (ex. Modelul C), vrem să fii productiv imediat, fără să blochezi bani în vopsele și chituri:",
  es: "En los modelos en los que trabajas en nuestro taller (p. ej. Modelo C), queremos que seas productivo de inmediato, sin bloquear tu dinero en pinturas y masillas:",
};

const sloganLine: Record<FlyerLanguage, string> = {
  de: "+1 Corion Lackdoktor – Smart Repair Spezialist · Premium Qualität",
  en: "+1 Corion Lackdoktor – Smart Repair Specialist · Premium Quality",
  ro: "+1 Corion Lackdoktor – Specialist Smart Repair Calitate Premium",
  es: "+1 Corion Lackdoktor – Especialista Smart Repair · Calidad Premium",
};

export function generateFranchiseFlyer(language: FlyerLanguage): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 15;
  let y = 0;
  let currentPage = 1;

  const setText = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const safeText = (text: string, x: number, yPos: number, opts?: any) => {
    doc.text(sanitize(text, language), x, yPos, opts);
  };

  const writeWrapped = (text: string, x: number, startY: number, maxW: number, lineH = 4.4): number => {
    const lines = doc.splitTextToSize(sanitize(text, language), maxW);
    lines.forEach((line: string, i: number) => doc.text(line, x, startY + i * lineH));
    return startY + lines.length * lineH;
  };

  const drawHeader = () => {
    setFill(DARK);
    doc.rect(0, 0, W, 38, "F");
    setFill(BRAND_RED);
    doc.rect(0, 38, W, 2, "F");

    setText([255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("+1 CORION", M, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("LACKDOKTOR", M, 18.5);

    setFill(BRAND_RED);
    doc.circle(M + 32, 13.5, 2.2, "F");
    setText([255, 255, 255]);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    safeText(t.documentTitle[language], M, 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText([200, 200, 200]);
    const taglineLines = doc.splitTextToSize(sanitize(t.tagline[language], language), W - 2 * M);
    doc.text(taglineLines[0], M, 34);

    setText(DARK);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    setFill(LIGHT_GRAY);
    doc.rect(0, H - 15, W, 15, "F");
    setFill(BRAND_RED);
    doc.rect(0, H - 15, W, 0.5, "F");

    setText(TEXT_GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    safeText(t.footer[language], M, H - 8);
    doc.text("corion.gmbh · coriongmh@gmail.com · 0176 8345 8274", M, H - 4.5);
    safeText(`${t.page[language]} ${pageNum}/${totalPages}`, W - M, H - 4.5, { align: "right" });
  };

  const ensureSpace = (need: number) => {
    if (y + need > H - 22) {
      doc.addPage();
      currentPage++;
      drawHeader();
      y = 48;
    }
  };

  const drawSectionTitle = (label: string, accent: [number, number, number] = BRAND_RED) => {
    ensureSpace(14);
    setFill(accent);
    doc.rect(M, y, 4, 7.5, "F");
    setText(DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    safeText(label, M + 7, y + 5.5);
    y += 11;
  };

  // ─── Page 1 ───
  drawHeader();
  y = 48;

  // Intro paragraph
  setText(DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  y = writeWrapped(t.intro[language], M, y, W - 2 * M, 4.5) + 5;

  // ─── Brand Benefits Section ───
  drawSectionTitle(t.brandBenefitsTitle[language]);

  const benefitColW = (W - 2 * M - 6) / 2;
  const benefitH = 26;
  for (let i = 0; i < brandBenefits.length; i += 2) {
    ensureSpace(benefitH + 4);
    const rowY = y;
    for (let j = 0; j < 2 && i + j < brandBenefits.length; j++) {
      const cx = M + j * (benefitColW + 6);
      const b = brandBenefits[i + j];

      setFill(BG_SOFT);
      doc.rect(cx, rowY, benefitColW, benefitH, "F");
      setFill(BRAND_RED);
      doc.rect(cx, rowY, 1.5, benefitH, "F");

      setText(BRAND_RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      safeText(b.title[language], cx + 4, rowY + 5.5);

      setText(DARK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(sanitize(b.body[language], language), benefitColW - 6);
      lines.forEach((line: string, k: number) => doc.text(line, cx + 4, rowY + 11 + k * 4));
    }
    y = rowY + benefitH + 4;
  }
  y += 2;

  // ─── Models Section ───
  drawSectionTitle(t.modelsSectionTitle[language]);

  setText(TEXT_GRAY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  y = writeWrapped(t.modelsSectionIntro[language], M, y, W - 2 * M, 4.2) + 4;

  models.forEach((model) => {
    ensureSpace(70);

    // Model header
    const cardY = y;
    const cardH = 9;
    setFill(model.color);
    doc.rect(M, cardY, W - 2 * M, cardH, "F");

    // Letter badge
    setFill([255, 255, 255]);
    doc.circle(M + 5, cardY + 4.5, 3.2, "F");
    setText(model.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(model.letter, M + 5, cardY + 6, { align: "center" });

    // Title
    setText([255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    safeText(`${t.modelLabel[language]} ${model.letter}: ${model.title[language]}`, M + 11, cardY + 6);

    // Recommended badge if applicable
    let shareX = W - M - 2;
    if (model.recommended) {
      const recLabel = t.recommended[language];
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const recW = doc.getTextWidth(sanitize(recLabel, language)) + 6;
      setFill([255, 255, 255]);
      doc.roundedRect(W - M - recW - 2, cardY + 1.7, recW, 5.6, 1, 1, "F");
      setText(model.color);
      safeText(recLabel, W - M - recW / 2 - 2, cardY + 5.6, { align: "center" });
      shareX = W - M - recW - 5;
    }

    // Share text
    setText([255, 255, 255]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    safeText(model.share[language], shareX, cardY + 6, { align: "right" });

    y = cardY + cardH + 4;

    // Intro
    setText(TEXT_GRAY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    y = writeWrapped(model.intro[language], M, y, W - 2 * M, 4.2) + 2;

    // What you do
    ensureSpace(20);
    setText(model.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    safeText(t.whatYouDo[language] + ":", M, y);
    y += 4;
    setText(DARK);
    doc.setFont("helvetica", "normal");
    y = writeWrapped(model.whatYouDo[language], M, y, W - 2 * M, 4.2) + 2;

    // What we do
    ensureSpace(20);
    setText(model.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    safeText(t.whatWeDo[language] + ":", M, y);
    y += 4;
    setText(DARK);
    doc.setFont("helvetica", "normal");
    y = writeWrapped(model.whatWeDo[language], M, y, W - 2 * M, 4.2) + 2;

    // Your benefit (highlighted)
    ensureSpace(18);
    const benY = y;
    const benLabel = t.yourBenefit[language] + ":";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const benLines = doc.splitTextToSize(sanitize(model.yourBenefit[language], language), W - 2 * M - 6);
    const blockH = 6 + benLines.length * 4.2 + 2;

    setFill(BG_SOFT);
    doc.rect(M, benY, W - 2 * M, blockH, "F");
    setFill(model.color);
    doc.rect(M, benY, 1.5, blockH, "F");

    setText(model.color);
    safeText(benLabel, M + 4, benY + 5);
    setText(DARK);
    doc.setFont("helvetica", "normal");
    benLines.forEach((line: string, i: number) => doc.text(line, M + 4, benY + 9.5 + i * 4.2));
    y = benY + blockH + 5;
  });

  // ─── Hybrid B+C Section ───
  ensureSpace(20);
  drawSectionTitle(t.hybridTitle[language], [251, 146, 60]);

  setText(DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  y = writeWrapped(t.hybridIntro[language], M, y, W - 2 * M, 4.4) + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(TEXT_GRAY);
  y = writeWrapped(t.hybridSubIntro[language], M, y, W - 2 * M, 4.2) + 4;

  hybridBlocks.forEach((blk) => {
    const lines = doc.splitTextToSize(sanitize(blk.body[language], language), W - 2 * M - 6);
    const blkH = 8 + lines.length * 4.2 + 3;
    ensureSpace(blkH + 3);
    const blkY = y;

    setFill(BG_SOFT);
    doc.rect(M, blkY, W - 2 * M, blkH, "F");
    setFill([251, 146, 60]);
    doc.rect(M, blkY, 1.5, blkH, "F");

    setText([251, 146, 60]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    safeText(blk.label[language], M + 4, blkY + 5.5);
    setText(DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    lines.forEach((line: string, i: number) => doc.text(line, M + 4, blkY + 10.5 + i * 4.2));
    y = blkY + blkH + 3;
  });

  // Hybrid advantages
  ensureSpace(14);
  setText(DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  safeText(t.hybridAdvantagesTitle[language], M, y);
  y += 5;

  const advColW = (W - 2 * M - 6) / 2;
  const advH = 22;
  for (let i = 0; i < hybridAdvantages.length; i += 2) {
    ensureSpace(advH + 4);
    const rowY = y;
    for (let j = 0; j < 2 && i + j < hybridAdvantages.length; j++) {
      const cx = M + j * (advColW + 6);
      const a = hybridAdvantages[i + j];

      setFill([255, 255, 255]);
      doc.setDrawColor(220, 220, 220);
      doc.rect(cx, rowY, advColW, advH, "FD");

      setText([251, 146, 60]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      safeText(a.title[language], cx + 3, rowY + 5);

      setText(DARK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(sanitize(a.body[language], language), advColW - 6);
      lines.forEach((line: string, k: number) => doc.text(line, cx + 3, rowY + 10 + k * 3.8));
    }
    y = rowY + advH + 3;
  }
  y += 4;

  // ─── Materials Section ───
  drawSectionTitle(t.materialsTitle[language]);
  setText(DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  y = writeWrapped(materialsIntro[language], M, y, W - 2 * M, 4.4) + 4;

  materialsBlocks.forEach((blk) => {
    const lines = doc.splitTextToSize(sanitize(blk.body[language], language), W - 2 * M - 6);
    const blkH = 8 + lines.length * 4.2 + 3;
    ensureSpace(blkH + 3);
    const blkY = y;

    setFill(BG_SOFT);
    doc.rect(M, blkY, W - 2 * M, blkH, "F");
    setFill(BRAND_RED);
    doc.rect(M, blkY, 1.5, blkH, "F");

    setText(BRAND_RED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    safeText(blk.label[language], M + 4, blkY + 5.5);
    setText(DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    lines.forEach((line: string, i: number) => doc.text(line, M + 4, blkY + 10.5 + i * 4.2));
    y = blkY + blkH + 3;
  });
  y += 3;

  // ─── CTA / Contact ───
  ensureSpace(60);
  const ctaY = y;
  const ctaH = 50;
  setFill(DARK);
  doc.rect(M, ctaY, W - 2 * M, ctaH, "F");
  setFill(BRAND_RED);
  doc.rect(M, ctaY, W - 2 * M, 1.5, "F");

  setText([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  safeText(t.ctaTitle[language], M + 5, ctaY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText([220, 220, 220]);
  const ctaLines = doc.splitTextToSize(sanitize(t.ctaBody[language], language), W - 2 * M - 10);
  ctaLines.forEach((line: string, i: number) => doc.text(line, M + 5, ctaY + 15 + i * 4.2));

  let contactY = ctaY + 15 + ctaLines.length * 4.2 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText([255, 255, 255]);
  safeText(t.contactCta[language], M + 5, contactY);
  contactY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText([220, 220, 220]);
  doc.text("Email: coriongmh@gmail.com", M + 5, contactY);
  doc.text("Web: corion.gmbh", M + 5, contactY + 4.5);
  doc.text("Telefon: 0176 8345 8274", M + 5, contactY + 9);

  y = ctaY + ctaH + 4;

  // Slogan
  ensureSpace(8);
  setText(BRAND_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  safeText(sloganLine[language], W / 2, y + 4, { align: "center" });

  // Page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(i, total);
  }

  return doc;
}

export function downloadFranchiseFlyer(language: FlyerLanguage) {
  const doc = generateFranchiseFlyer(language);
  const fname = `Corion-Lackdoktor-Franchise-${language.toUpperCase()}.pdf`;
  doc.save(fname);
}
