import { useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Wrench, 
  Car,
  Euro,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  HandHeart,
  Briefcase,
  Brain,
  Network,
  FileCheck,
  Home,
  UserPlus,
  Rocket,
  TrendingUp,
  Armchair,
  QrCode,
  Shield,
  Cpu,
  Star,
  Clock,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  CircleDot
} from "lucide-react";

type Lang = "de" | "ro" | "en";

const flyerContent = {
  de: {
    hookHeadline: "Sie lieben Ihr Handwerk, aber hassen den Papierkram?",
    hookSubheadline: "Starten Sie jetzt Ihre Karriere als selbstständiger Partner. Mit oder ohne Eigenkapital.",
    hookLeft: "Alleine kämpfen: Stress, Bürokratie, Unsicherheit",
    hookRight: "Corion Partner: Fokus, Support, Erfolg",
    modelsTitle: "Wählen Sie Ihren Weg zum Erfolg",
    modelsSubtitle: "4 Modelle für jeden Typ",
    models: [
      {
        letter: "A",
        name: "Independent",
        target: "Eigene Werkstatt vorhanden",
        benefits: "Branding & Schulung",
        share: "80%",
        description: "Sie haben bereits eine Werkstatt und wollen Teil eines starken Netzwerks werden.",
        icon: "building",
        color: "blue",
      },
      {
        letter: "B",
        name: "Wachstum",
        target: "Eigene Werkstatt, keine Kunden",
        benefits: "+ Volle Auftragsbücher",
        share: "60%",
        description: "Sie haben die Werkstatt, wir bringen die Kunden. Wachstum garantiert.",
        icon: "trending",
        color: "green",
      },
      {
        letter: "C",
        name: "Full-Service",
        target: "Fokus nur auf Arbeit",
        benefits: "+ Komplettes Management",
        share: "40%",
        description: "Sie konzentrieren sich auf Ihr Handwerk. Wir erledigen alles andere.",
        icon: "armchair",
        color: "purple",
        recommended: true,
      },
      {
        letter: "D",
        name: "Start-Up",
        target: "Kein Kapital & keine Werkstatt",
        benefits: "+ Werkstatt & Werkzeug gestellt!",
        share: "70%",
        description: "Kein Geld für eine eigene Werkstatt? Kein Problem. Wir stellen Ihnen Hebebühne, Lackierkabine und Werkzeug. Sie bringen Ihr Talent.",
        icon: "rocket",
        color: "orange",
        featured: true,
      },
    ],
    matrixHeaders: ["Modell", "Für wen?", "Das bekommen Sie", "Ihr Anteil*"],
    matrixFootnote: "*Prozente vom Nettoerlös. Modell D inkl. Infrastrukturnutzung gegen Gebühr.",
    startupTitle: "Neu: Das Corion Start-Up Modell (D)",
    startupText: "Kein Geld für eine eigene Werkstatt? Kein Problem.\nWir stellen Ihnen Hebebühne, Lackierkabine und Werkzeug. Sie bringen Ihr Talent.\nSicherheitsnetz: Mindestvertragslaufzeit 1 Jahr.",
    adminTitle: "Nie wieder Stress mit dem Finanzamt",
    adminText: 'Auf Wunsch \u00FCbernimmt unser \u201ECorionOS\u201C Management Ihre komplette Verwaltung f\u00FCr eine faire Pauschale.\nAnmeldung, Buchhaltung, Beh\u00F6rden \u2013 erledigt.',
    techTitle: "Powered by Corion Hub",
    techText: "Wir nutzen modernste KI-Technologie zur Auftragsabwicklung. Das bedeutet für Sie: Weniger Wartezeit, schnellere Bezahlung, klare Prozesse.",
    ctaTitle: "Welches Modell passt zu Ihnen?",
    ctaSubtitle: "Scannen Sie den Code und machen Sie den 1-Minuten-Check.",
    elevatorPitch: "Bei Corion glauben wir, dass gutes Handwerk fürstlich entlohnt werden muss – nicht in Bürokratie ertrinken. Deshalb haben wir ein System der umgekehrten Franchise geschaffen: Wir geben Ihnen Kunden und Infrastruktur, Sie geben uns Qualität.",
    elevatorLabel: "Unsere Philosophie",
    targetAudience: "Für Lackierer, Karosseriebauer, Smart-Repairerer & Gutachter",
    safetyNet: "Sicherheitsnetz: Mindestvertragslaufzeit 1 Jahr",
    contact: "Jetzt Partner werden",
    contactNote: "Kontaktieren Sie uns – wir melden uns innerhalb von 24 Stunden!",
    steps: "Ihr Weg zum Erfolg:",
    stepsList: ["Kontakt aufnehmen", "Modell wählen", "Durchstarten!"],
    footer: "Tu faci meseria. Noi facem restul. – Sie machen die Arbeit. Wir machen den Rest.",
    download: "Als PDF drucken",
    print: "Drucken",
  },
  ro: {
    hookHeadline: "Iubești meseria, dar urăști hârțogăraia?",
    hookSubheadline: "Începe acum cariera ta ca partener independent. Cu sau fără capital propriu.",
    hookLeft: "Singur: Stres, birocrație, nesiguranță",
    hookRight: "Partener Corion: Focus, suport, succes",
    modelsTitle: "Alege drumul tău spre succes",
    modelsSubtitle: "4 modele pentru fiecare tip",
    models: [
      {
        letter: "A",
        name: "Independent",
        target: "Atelier propriu existent",
        benefits: "Branding & Training",
        share: "80%",
        description: "Ai deja un atelier și vrei să faci parte dintr-o rețea puternică.",
        icon: "building",
        color: "blue",
      },
      {
        letter: "B",
        name: "Creștere",
        target: "Atelier propriu, fără clienți",
        benefits: "+ Agende pline de comenzi",
        share: "60%",
        description: "Tu ai atelierul, noi aducem clienții. Creștere garantată.",
        icon: "trending",
        color: "green",
      },
      {
        letter: "C",
        name: "Full-Service",
        target: "Focus doar pe muncă",
        benefits: "+ Management complet",
        share: "40%",
        description: "Te concentrezi pe meșteșugul tău. Noi ne ocupăm de restul.",
        icon: "armchair",
        color: "purple",
        recommended: true,
      },
      {
        letter: "D",
        name: "Start-Up",
        target: "Fără capital & fără atelier",
        benefits: "+ Atelier & unelte puse la dispoziție!",
        share: "70%",
        description: "Nu ai bani pentru un atelier propriu? Nicio problemă. Îți punem la dispoziție elevator, cabină de vopsit și unelte. Tu aduci talentul.",
        icon: "rocket",
        color: "orange",
        featured: true,
      },
    ],
    matrixHeaders: ["Model", "Pentru cine?", "Ce primești", "Cota ta*"],
    matrixFootnote: "*Procente din venitul net. Modelul D incl. utilizare infrastructură contra cost.",
    startupTitle: "Nou: Modelul Start-Up Corion (D)",
    startupText: "Nu ai bani pentru un atelier propriu? Nicio problemă.\nÎți punem la dispoziție elevator, cabină de vopsit și unelte. Tu aduci talentul.\nPlasă de siguranță: Durată minimă a contractului 1 an.",
    adminTitle: "Fără stres cu Finanzamt-ul",
    adminText: 'La cerere, managementul nostru \u201ECorionOS\u201C preia toat\u0103 administra\u021Bia ta pentru un tarif corect.\n\u00CEnregistrare, contabilitate, autorit\u0103\u021Bi \u2013 rezolvat.',
    techTitle: "Powered by Corion Hub",
    techText: "Folosim cele mai moderne tehnologii AI pentru procesarea comenzilor. Asta înseamnă pentru tine: Mai puțină așteptare, plăți mai rapide, procese clare.",
    ctaTitle: "Ce model ți se potrivește?",
    ctaSubtitle: "Scanează codul și fă testul de 1 minut.",
    elevatorPitch: "La Corion, credem că un meseriaș bun trebuie să fie plătit regește, nu îngropat în taxe. De aceea am creat un sistem de franciză inversată: noi îți dăm clienții și infrastructura, tu ne dai calitatea.",
    elevatorLabel: "Filosofia noastră",
    targetAudience: "Pentru vopsitori, tinichigii, smart-repaireri & evaluatori",
    safetyNet: "Plasă de siguranță: Durată minimă a contractului 1 an",
    contact: "Devino partener acum",
    contactNote: "Contactează-ne – răspundem în maxim 24 de ore!",
    steps: "Drumul tău spre succes:",
    stepsList: ["Contactează-ne", "Alege modelul", "Începe treaba!"],
    footer: "Tu faci meseria. Noi facem restul.",
    download: "Printează ca PDF",
    print: "Printează",
  },
  en: {
    hookHeadline: "You love your craft, but hate the paperwork?",
    hookSubheadline: "Start your career as an independent partner now. With or without your own capital.",
    hookLeft: "Going alone: Stress, bureaucracy, uncertainty",
    hookRight: "Corion Partner: Focus, support, success",
    modelsTitle: "Choose Your Path to Success",
    modelsSubtitle: "4 Models for Every Type",
    models: [
      {
        letter: "A",
        name: "Independent",
        target: "Already have your own workshop",
        benefits: "Branding & Training",
        share: "80%",
        description: "You already have a workshop and want to join a strong network.",
        icon: "building",
        color: "blue",
      },
      {
        letter: "B",
        name: "Growth",
        target: "Own workshop, no customers",
        benefits: "+ Full order books",
        share: "60%",
        description: "You have the workshop, we bring the customers. Growth guaranteed.",
        icon: "trending",
        color: "green",
      },
      {
        letter: "C",
        name: "Full-Service",
        target: "Focus only on work",
        benefits: "+ Complete management",
        share: "40%",
        description: "You focus on your craft. We handle everything else.",
        icon: "armchair",
        color: "purple",
        recommended: true,
      },
      {
        letter: "D",
        name: "Start-Up",
        target: "No capital & no workshop",
        benefits: "+ Workshop & tools provided!",
        share: "70%",
        description: "No money for your own workshop? No problem. We provide the lift, spray booth and tools. You bring your talent.",
        icon: "rocket",
        color: "orange",
        featured: true,
      },
    ],
    matrixHeaders: ["Model", "For whom?", "What you get", "Your share*"],
    matrixFootnote: "*Percentages of net revenue. Model D incl. infrastructure usage for a fee.",
    startupTitle: "New: The Corion Start-Up Model (D)",
    startupText: "No money for your own workshop? No problem.\nWe provide the lift, spray booth and tools. You bring your talent.\nSafety net: Minimum contract duration 1 year.",
    adminTitle: "Never stress about taxes again",
    adminText: "On request, our \"CorionOS\" management handles your complete administration for a fair flat rate.\nRegistration, accounting, authorities – done.",
    techTitle: "Powered by Corion Hub",
    techText: "We use cutting-edge AI technology for order processing. For you this means: Less waiting, faster payment, clear processes.",
    ctaTitle: "Which model fits you?",
    ctaSubtitle: "Scan the code and take the 1-minute check.",
    elevatorPitch: "At Corion, we believe that good craftsmanship should be royally rewarded – not drowned in taxes. That's why we created a reverse franchise system: we give you customers and infrastructure, you give us quality.",
    elevatorLabel: "Our Philosophy",
    targetAudience: "For painters, body repair specialists, smart repair techs & appraisers",
    safetyNet: "Safety net: Minimum contract duration 1 year",
    contact: "Become a Partner Now",
    contactNote: "Contact us – we'll respond within 24 hours!",
    steps: "Your Path to Success:",
    stepsList: ["Get in touch", "Choose your model", "Start working!"],
    footer: "You do the work. We do the rest.",
    download: "Print as PDF",
    print: "Print",
  },
};

interface ModelDetail {
  benefitsList: string[];
  responsibilitiesList: string[];
  earningLabel: string;
  earningExamples: { daily: string; yourShare: string; monthly: string }[];
  corionGets: string;
  footnote: string;
}

const modelDetails: Record<Lang, Record<string, ModelDetail>> = {
  de: {
    A: {
      benefitsList: [
        "Corion-Marke & Logo-Nutzung",
        "Zugang zum Corion Hub (KI-Auftragssystem)",
        "Schulungen & Weiterbildung",
        "Netzwerk-Zugang & Empfehlungen",
      ],
      responsibilitiesList: [
        "Eigene Werkstatt betreiben & finanzieren",
        "Eigene Kundenakquise",
        "Eigene Buchhaltung & Verwaltung",
        "Qualitätsstandards einhalten",
      ],
      earningLabel: "Verdienstbeispiele (Manopera/Tag: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "480 EUR (80%)", monthly: "~10.560 EUR (22 Tage)" },
        { daily: "1.000 EUR", yourShare: "800 EUR (80%)", monthly: "~17.600 EUR (22 Tage)" },
        { daily: "1.400 EUR", yourShare: "1.120 EUR (80%)", monthly: "~24.640 EUR (22 Tage)" },
      ],
      corionGets: "Corion erhält 20% für Branding, Schulung & Netzwerk",
      footnote: "Alle Beträge netto. Tatsächliche Einnahmen variieren je nach Auftragslage.",
    },
    B: {
      benefitsList: [
        "Alles aus Modell A",
        "Volle Auftragsbücher – Kunden kommen von Corion",
        "Marketing & Werbung durch Corion",
        "Zugang zu Versicherungs- & Flottenkunden",
      ],
      responsibilitiesList: [
        "Eigene Werkstatt betreiben & finanzieren",
        "Aufträge termingerecht erledigen",
        "Qualitätsstandards einhalten",
        "Material & Werkzeug selbst beschaffen",
      ],
      earningLabel: "Verdienstbeispiele (Manopera/Tag: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "360 EUR (60%)", monthly: "~7.920 EUR (22 Tage)" },
        { daily: "1.000 EUR", yourShare: "600 EUR (60%)", monthly: "~13.200 EUR (22 Tage)" },
        { daily: "1.400 EUR", yourShare: "840 EUR (60%)", monthly: "~18.480 EUR (22 Tage)" },
      ],
      corionGets: "Corion erhält 40% für Branding, Kunden, Marketing & Netzwerk",
      footnote: "Alle Beträge netto. Keine Kaltakquise nötig – Aufträge kommen automatisch.",
    },
    C: {
      benefitsList: [
        "Alles aus Modell A + B",
        "Komplettes Management (Buchhaltung, Steuern, Behörden)",
        "CorionOS übernimmt gesamte Verwaltung",
        "Keine Bürokratie – nur arbeiten",
        "Rechtsberatung & Steuerberater inklusive",
      ],
      responsibilitiesList: [
        "Eigene Werkstatt betreiben",
        "Aufträge fachgerecht & pünktlich erledigen",
        "Qualitätsstandards einhalten",
      ],
      earningLabel: "Verdienstbeispiele (Manopera/Tag: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "240 EUR (40%)", monthly: "~5.280 EUR (22 Tage)" },
        { daily: "1.000 EUR", yourShare: "400 EUR (40%)", monthly: "~8.800 EUR (22 Tage)" },
        { daily: "1.400 EUR", yourShare: "560 EUR (40%)", monthly: "~12.320 EUR (22 Tage)" },
      ],
      corionGets: "Corion erhält 60% für Kunden, Management, Buchhaltung, Steuern & Verwaltung",
      footnote: "Alle Beträge netto. Null Papierkram – Sie arbeiten, wir erledigen den Rest.",
    },
    D: {
      benefitsList: [
        "Alles aus Modell A + B + C",
        "Werkstatt wird von Corion gestellt (Hebebühne, Kabine, Werkzeug)",
        "Kein Eigenkapital erforderlich",
        "Sofortiger Start möglich",
        "Sicherheitsnetz: Mindestvertragslaufzeit 1 Jahr",
      ],
      responsibilitiesList: [
        "Aufträge fachgerecht & pünktlich erledigen",
        "Werkstatt pfleglich behandeln",
        "Qualitätsstandards einhalten",
        "Infrastrukturgebühr (im Anteil enthalten)",
      ],
      earningLabel: "Verdienstbeispiele (Manopera/Tag: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "420 EUR (70%)", monthly: "~9.240 EUR (22 Tage)" },
        { daily: "1.000 EUR", yourShare: "700 EUR (70%)", monthly: "~15.400 EUR (22 Tage)" },
        { daily: "1.400 EUR", yourShare: "980 EUR (70%)", monthly: "~21.560 EUR (22 Tage)" },
      ],
      corionGets: "Corion erhält 30% für Werkstatt, Kunden, Management & komplette Infrastruktur",
      footnote: "Alle Beträge netto. Infrastrukturgebühr bereits im 30%-Anteil enthalten.",
    },
  },
  ro: {
    A: {
      benefitsList: [
        "Folosirea brandului & logo-ului Corion",
        "Acces la Corion Hub (sistem AI de comenzi)",
        "Training-uri & perfecționare",
        "Acces la rețea & recomandări",
      ],
      responsibilitiesList: [
        "Atelier propriu – operat & finanțat de tine",
        "Achiziția proprie de clienți",
        "Contabilitate & administrație proprie",
        "Respectarea standardelor de calitate",
      ],
      earningLabel: "Exemple de câștig (Manoperă/zi: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "480 EUR (80%)", monthly: "~10.560 EUR (22 zile)" },
        { daily: "1.000 EUR", yourShare: "800 EUR (80%)", monthly: "~17.600 EUR (22 zile)" },
        { daily: "1.400 EUR", yourShare: "1.120 EUR (80%)", monthly: "~24.640 EUR (22 zile)" },
      ],
      corionGets: "Corion primește 20% pentru branding, training & rețea",
      footnote: "Toate sumele nete. Veniturile reale variază în funcție de comenzi.",
    },
    B: {
      benefitsList: [
        "Tot din Modelul A",
        "Agende pline – clienții vin de la Corion",
        "Marketing & publicitate prin Corion",
        "Acces la clienți asigurări & flote",
      ],
      responsibilitiesList: [
        "Atelier propriu – operat & finanțat de tine",
        "Comenzi finalizate la timp",
        "Respectarea standardelor de calitate",
        "Material & unelte proprii",
      ],
      earningLabel: "Exemple de câștig (Manoperă/zi: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "360 EUR (60%)", monthly: "~7.920 EUR (22 zile)" },
        { daily: "1.000 EUR", yourShare: "600 EUR (60%)", monthly: "~13.200 EUR (22 zile)" },
        { daily: "1.400 EUR", yourShare: "840 EUR (60%)", monthly: "~18.480 EUR (22 zile)" },
      ],
      corionGets: "Corion primește 40% pentru branding, clienți, marketing & rețea",
      footnote: "Toate sumele nete. Fără prospectare la rece – comenzile vin automat.",
    },
    C: {
      benefitsList: [
        "Tot din Modelul A + B",
        "Management complet (contabilitate, taxe, autorități)",
        "CorionOS preia toată administrația",
        "Zero birocrație – doar lucrezi",
        "Consultanță juridică & contabil incluse",
      ],
      responsibilitiesList: [
        "Atelier propriu operat de tine",
        "Comenzi finalizate profesional & la timp",
        "Respectarea standardelor de calitate",
      ],
      earningLabel: "Exemple de câștig (Manoperă/zi: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "240 EUR (40%)", monthly: "~5.280 EUR (22 zile)" },
        { daily: "1.000 EUR", yourShare: "400 EUR (40%)", monthly: "~8.800 EUR (22 zile)" },
        { daily: "1.400 EUR", yourShare: "560 EUR (40%)", monthly: "~12.320 EUR (22 zile)" },
      ],
      corionGets: "Corion primește 60% pentru clienți, management, contabilitate & administrație",
      footnote: "Toate sumele nete. Zero hârțogăraie – tu lucrezi, noi facem restul.",
    },
    D: {
      benefitsList: [
        "Tot din Modelul A + B + C",
        "Atelier pus la dispoziție de Corion (elevator, cabină, unelte)",
        "Fără capital propriu necesar",
        "Start imediat posibil",
        "Plasă de siguranță: contract minim 1 an",
      ],
      responsibilitiesList: [
        "Comenzi finalizate profesional & la timp",
        "Îngrijirea atelierului pus la dispoziție",
        "Respectarea standardelor de calitate",
        "Taxă infrastructură (inclusă în cota Corion)",
      ],
      earningLabel: "Exemple de câștig (Manoperă/zi: 600–1.400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "420 EUR (70%)", monthly: "~9.240 EUR (22 zile)" },
        { daily: "1.000 EUR", yourShare: "700 EUR (70%)", monthly: "~15.400 EUR (22 zile)" },
        { daily: "1.400 EUR", yourShare: "980 EUR (70%)", monthly: "~21.560 EUR (22 zile)" },
      ],
      corionGets: "Corion primește 30% pentru atelier, clienți, management & infrastructură completă",
      footnote: "Toate sumele nete. Taxa de infrastructură deja inclusă în cota de 30%.",
    },
  },
  en: {
    A: {
      benefitsList: [
        "Corion brand & logo usage",
        "Access to Corion Hub (AI order system)",
        "Training & professional development",
        "Network access & referrals",
      ],
      responsibilitiesList: [
        "Operate & finance your own workshop",
        "Own customer acquisition",
        "Own accounting & administration",
        "Maintain quality standards",
      ],
      earningLabel: "Earning examples (Labor/day: 600–1,400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "480 EUR (80%)", monthly: "~10,560 EUR (22 days)" },
        { daily: "1,000 EUR", yourShare: "800 EUR (80%)", monthly: "~17,600 EUR (22 days)" },
        { daily: "1,400 EUR", yourShare: "1,120 EUR (80%)", monthly: "~24,640 EUR (22 days)" },
      ],
      corionGets: "Corion receives 20% for branding, training & network",
      footnote: "All amounts net. Actual earnings vary depending on order volume.",
    },
    B: {
      benefitsList: [
        "Everything from Model A",
        "Full order books – customers come from Corion",
        "Marketing & advertising by Corion",
        "Access to insurance & fleet customers",
      ],
      responsibilitiesList: [
        "Operate & finance your own workshop",
        "Complete orders on time",
        "Maintain quality standards",
        "Source your own materials & tools",
      ],
      earningLabel: "Earning examples (Labor/day: 600–1,400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "360 EUR (60%)", monthly: "~7,920 EUR (22 days)" },
        { daily: "1,000 EUR", yourShare: "600 EUR (60%)", monthly: "~13,200 EUR (22 days)" },
        { daily: "1,400 EUR", yourShare: "840 EUR (60%)", monthly: "~18,480 EUR (22 days)" },
      ],
      corionGets: "Corion receives 40% for branding, customers, marketing & network",
      footnote: "All amounts net. No cold calling needed – orders come automatically.",
    },
    C: {
      benefitsList: [
        "Everything from Model A + B",
        "Complete management (accounting, taxes, authorities)",
        "CorionOS handles all administration",
        "Zero paperwork – just work",
        "Legal advice & tax consultant included",
      ],
      responsibilitiesList: [
        "Operate your own workshop",
        "Complete orders professionally & on time",
        "Maintain quality standards",
      ],
      earningLabel: "Earning examples (Labor/day: 600–1,400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "240 EUR (40%)", monthly: "~5,280 EUR (22 days)" },
        { daily: "1,000 EUR", yourShare: "400 EUR (40%)", monthly: "~8,800 EUR (22 days)" },
        { daily: "1,400 EUR", yourShare: "560 EUR (40%)", monthly: "~12,320 EUR (22 days)" },
      ],
      corionGets: "Corion receives 60% for customers, management, accounting & administration",
      footnote: "All amounts net. Zero paperwork – you work, we handle the rest.",
    },
    D: {
      benefitsList: [
        "Everything from Model A + B + C",
        "Workshop provided by Corion (lift, spray booth, tools)",
        "No own capital required",
        "Immediate start possible",
        "Safety net: Minimum contract 1 year",
      ],
      responsibilitiesList: [
        "Complete orders professionally & on time",
        "Take care of the provided workshop",
        "Maintain quality standards",
        "Infrastructure fee (included in Corion's share)",
      ],
      earningLabel: "Earning examples (Labor/day: 600–1,400 EUR)",
      earningExamples: [
        { daily: "600 EUR", yourShare: "420 EUR (70%)", monthly: "~9,240 EUR (22 days)" },
        { daily: "1,000 EUR", yourShare: "700 EUR (70%)", monthly: "~15,400 EUR (22 days)" },
        { daily: "1,400 EUR", yourShare: "980 EUR (70%)", monthly: "~21,560 EUR (22 days)" },
      ],
      corionGets: "Corion receives 30% for workshop, customers, management & full infrastructure",
      footnote: "All amounts net. Infrastructure fee already included in the 30% share.",
    },
  },
};

const detailLabels = {
  de: { benefits: "Ihre Vorteile", responsibilities: "Ihre Aufgaben", earnings: "Verdienstrechnung", dailyRate: "Tagessatz", yourShare: "Ihr Anteil", monthlyEst: "Monat (ca.)", showDetails: "Details anzeigen", hideDetails: "Details ausblenden" },
  ro: { benefits: "Beneficiile tale", responsibilities: "Responsabilitățile tale", earnings: "Calcul câștig", dailyRate: "Tarif/zi", yourShare: "Cota ta", monthlyEst: "Lună (aprox.)", showDetails: "Arată detalii", hideDetails: "Ascunde detalii" },
  en: { benefits: "Your Benefits", responsibilities: "Your Responsibilities", earnings: "Earnings Breakdown", dailyRate: "Daily Rate", yourShare: "Your Share", monthlyEst: "Monthly (est.)", showDetails: "Show details", hideDetails: "Hide details" },
};

function getModelIcon(icon: string) {
  switch (icon) {
    case "building": return Building2;
    case "trending": return TrendingUp;
    case "armchair": return Armchair;
    case "rocket": return Rocket;
    default: return Building2;
  }
}

function getModelColorClasses(color: string) {
  switch (color) {
    case "blue": return { bg: "bg-blue-500/10 dark:bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500 text-white" };
    case "green": return { bg: "bg-green-500/10 dark:bg-green-500/20", border: "border-green-500/30", text: "text-green-600 dark:text-green-400", badge: "bg-green-500 text-white" };
    case "purple": return { bg: "bg-purple-500/10 dark:bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", badge: "bg-purple-500 text-white" };
    case "orange": return { bg: "bg-orange-500/10 dark:bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", badge: "bg-orange-500 text-white" };
    default: return { bg: "bg-muted", border: "border-border", text: "text-foreground", badge: "bg-primary text-white" };
  }
}

function FlyerCard({ lang }: { lang: Lang }) {
  const content = flyerContent[lang];
  const labels = detailLabels[lang];
  const details = modelDetails[lang];
  const flyerRef = useRef<HTMLDivElement>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const modelsRows = content.models.map(m => `
      <tr>
        <td style="font-weight:700;">${m.letter}. ${m.name} ${m.featured ? '<span style="color:#E53935;">*</span>' : ''}</td>
        <td>${m.target}</td>
        <td>${m.benefits}</td>
        <td style="font-weight:800; font-size:20px; color:#E53935;">${m.share}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corion Lackdoktor - Partner Flyer</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Open Sans', sans-serif; background: white; color: #1a1a1a; padding: 20px; }
            h1, h2, h3 { font-family: 'Poppins', sans-serif; }
            .flyer { max-width: 800px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #121212 0%, #1E1E1E 100%); color: white; padding: 40px; text-align: center; border-radius: 16px 16px 0 0; }
            .header h1 { font-size: 26px; font-weight: 800; margin-bottom: 8px; color: #E53935; }
            .header p { font-size: 16px; opacity: 0.9; }
            .header .logo { font-size: 22px; font-weight: 800; margin-bottom: 16px; letter-spacing: 1px; }
            .content { padding: 30px; background: #fafafa; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 18px; font-weight: 700; color: #E53935; margin-bottom: 12px; }
            .models-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            .models-table th { background: #E53935; color: white; padding: 12px; text-align: left; font-weight: 600; }
            .models-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .models-table tr:nth-child(even) td { background: #f5f5f5; }
            .highlight-box { background: #FFF3E0; border: 2px solid #E53935; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .highlight-box h3 { color: #E53935; margin-bottom: 8px; }
            .tech-box { background: #121212; color: white; padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center; }
            .tech-box h3 { color: #E53935; }
            .quote-box { border-left: 4px solid #E53935; padding: 16px 20px; font-style: italic; background: #f9f9f9; margin: 16px 0; }
            .contact-box { background: #1a1a1a; color: white; padding: 24px; border-radius: 12px; text-align: center; }
            .contact-box h3 { color: #E53935; margin-bottom: 12px; }
            .contact-info { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin: 16px 0; }
            .steps { display: flex; justify-content: space-around; margin: 20px 0; }
            .step { text-align: center; flex: 1; }
            .step-num { width: 40px; height: 40px; background: #E53935; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; background: #E53935; color: white; border-radius: 0 0 16px 16px; font-weight: 600; font-style: italic; }
            .footnote { font-size: 12px; color: #666; margin-top: 8px; }
            @media print { body { padding: 0; } .flyer { max-width: 100%; } }
          </style>
        </head>
        <body>
          <div class="flyer">
            <div class="header">
              <div class="logo">+1 CORION LACKDOKTOR</div>
              <h1>${content.hookHeadline}</h1>
              <p>${content.hookSubheadline}</p>
              <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">${content.targetAudience}</p>
            </div>
            <div class="content">
              <div class="section">
                <div class="section-title">${content.modelsTitle}: ${content.modelsSubtitle}</div>
                <table class="models-table">
                  <thead><tr>${content.matrixHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                  <tbody>${modelsRows}</tbody>
                </table>
                <p class="footnote">${content.matrixFootnote}</p>
              </div>
              <div class="highlight-box">
                <h3>${content.startupTitle}</h3>
                <p>${content.startupText.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="section" style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
                <div class="section-title">${content.adminTitle}</div>
                <p>${content.adminText.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="tech-box">
                <h3>${content.techTitle}</h3>
                <p>${content.techText}</p>
              </div>
              <div class="quote-box">
                <p><strong>${content.elevatorLabel}:</strong></p>
                <p>"${content.elevatorPitch}"</p>
              </div>
              <div class="contact-box">
                <h3>${content.ctaTitle}</h3>
                <p>${content.ctaSubtitle}</p>
                <div class="contact-info">
                  <span>+49 176 834 582 74</span>
                  <span>adrianlackdoktor@gmail.com</span>
                  <span>www.corion.gmbh</span>
                </div>
                <p style="font-size: 13px; opacity: 0.7;">${content.contactNote}</p>
                <div class="steps">
                  ${content.stepsList.map((s: string, i: number) => `
                    <div class="step">
                      <div class="step-num">${i + 1}</div>
                      <div>${s}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="footer">"${content.footer}"</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" data-testid={`button-print-${lang}`}>
          <Printer className="w-4 h-4 mr-2" />
          {content.print}
        </Button>
        <Button onClick={handlePrint} data-testid={`button-download-${lang}`}>
          <Download className="w-4 h-4 mr-2" />
          {content.download}
        </Button>
      </div>

      <div ref={flyerRef} className="bg-card rounded-xl overflow-hidden shadow-xl border">
        {/* Hero / Hook Section */}
        <div className="bg-gradient-to-br from-[#121212] to-[#1E1E1E] text-white p-8 md:p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="w-8 h-8" />
            <span className="text-xl font-bold font-heading tracking-wider">+1 CORION LACKDOKTOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-heading mb-3 text-[#E53935]" data-testid="text-hook-headline">
            {content.hookHeadline}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-4">{content.hookSubheadline}</p>
          <p className="text-sm text-white/50">{content.targetAudience}</p>

          {/* Split-screen concept */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-white/60 text-sm">{content.hookLeft}</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <p className="text-white text-sm font-medium">{content.hookRight}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8">

          {/* 4 Partnership Models - Cards */}
          <div>
            <h2 className="text-2xl font-bold text-center mb-2" data-testid="text-models-title">
              {content.modelsTitle}
            </h2>
            <p className="text-center text-muted-foreground mb-6">{content.modelsSubtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.models.map((model) => {
                const Icon = getModelIcon(model.icon);
                const colors = getModelColorClasses(model.color);
                const isExpanded = expandedModel === model.letter;
                const detail = details[model.letter];
                return (
                  <Card
                    key={model.letter}
                    className={`relative p-5 ${colors.bg} border ${colors.border} ${model.featured ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`card-model-${model.letter.toLowerCase()}`}
                  >
                    {model.featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white">
                          <Rocket className="w-3 h-3 mr-1" />
                          {lang === 'de' ? 'NEU' : lang === 'ro' ? 'NOU' : 'NEW'}
                        </Badge>
                      </div>
                    )}
                    {model.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          {lang === 'de' ? 'EMPFOHLEN' : lang === 'ro' ? 'RECOMANDAT' : 'RECOMMENDED'}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.badge}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{model.letter}. {model.name}</h3>
                          <span className={`text-2xl font-extrabold ${colors.text}`}>{model.share}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{model.target}</p>
                        <p className="text-sm font-medium mt-1">{model.benefits}</p>
                        <p className="text-sm text-muted-foreground mt-2">{model.description}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 gap-2"
                      onClick={() => setExpandedModel(isExpanded ? null : model.letter)}
                      data-testid={`button-details-${model.letter.toLowerCase()}`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          {labels.hideDetails}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          {labels.showDetails}
                        </>
                      )}
                    </Button>

                    {isExpanded && detail && (
                      <div className="mt-3 pt-3 border-t border-current/10 space-y-4" data-testid={`details-${model.letter.toLowerCase()}`}>
                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {labels.benefits}
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {detail.benefitsList.map((b, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CircleDot className="w-3 h-3 mt-1 flex-shrink-0 text-green-500" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            {labels.responsibilities}
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {detail.responsibilitiesList.map((r, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CircleDot className="w-3 h-3 mt-1 flex-shrink-0 text-orange-500" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                            <Euro className="w-4 h-4 text-primary flex-shrink-0" />
                            {detail.earningLabel}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-foreground/5">
                                  <th className="p-2 text-left font-semibold">{labels.dailyRate}</th>
                                  <th className="p-2 text-left font-semibold">{labels.yourShare}</th>
                                  <th className="p-2 text-left font-semibold">{labels.monthlyEst}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.earningExamples.map((ex, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-foreground/[0.02]" : ""}>
                                    <td className="p-2 border-t border-foreground/5">{ex.daily}</td>
                                    <td className={`p-2 border-t border-foreground/5 font-bold ${colors.text}`}>{ex.yourShare}</td>
                                    <td className="p-2 border-t border-foreground/5 font-medium">{ex.monthly}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{detail.corionGets}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">{detail.footnote}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="table-models-matrix">
              <thead>
                <tr className="bg-primary text-white">
                  {content.matrixHeaders.map((h, i) => (
                    <th key={i} className="p-3 text-left font-semibold text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.models.map((m, i) => (
                  <tr key={m.letter} className={i % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                    <td className="p-3 border-b border-border font-bold">
                      {m.letter}. {m.name}
                      {m.featured && <Rocket className="w-4 h-4 inline ml-1 text-primary" />}
                    </td>
                    <td className="p-3 border-b border-border text-sm">{m.target}</td>
                    <td className="p-3 border-b border-border text-sm">{m.benefits}</td>
                    <td className="p-3 border-b border-border">
                      <span className="text-xl font-extrabold text-primary">{m.share}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">{content.matrixFootnote}</p>
          </div>

          {/* Model D Highlight */}
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-primary p-6" data-testid="section-startup-highlight">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">{content.startupTitle}</h3>
                {content.startupText.split('\n').map((line, i) => (
                  <p key={i} className="text-sm mb-1">
                    {line.startsWith('Sicherheitsnetz') || line.startsWith('Safety') || line.startsWith('Plas') ? (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        <strong>{line}</strong>
                      </span>
                    ) : line}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          {/* Admin / CorionOS Section */}
          <Card className="bg-muted/30 border p-6" data-testid="section-admin">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-500 dark:bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{content.adminTitle}</h3>
                {content.adminText.split('\n').map((line, i) => (
                  <p key={i} className="text-sm mb-1">{line}</p>
                ))}
              </div>
            </div>
          </Card>

          {/* Tech / AI Box */}
          <div className="bg-[#121212] text-white rounded-xl p-6 text-center" data-testid="section-tech">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Cpu className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-primary">{content.techTitle}</h3>
            </div>
            <p className="text-white/80 max-w-xl mx-auto">{content.techText}</p>
          </div>

          {/* Elevator Pitch */}
          <div className="border-l-4 border-primary bg-muted/30 rounded-r-lg p-5" data-testid="section-elevator-pitch">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">{content.elevatorLabel}</p>
            <p className="italic text-foreground/80 leading-relaxed">"{content.elevatorPitch}"</p>
          </div>

          {/* CTA / Contact Section */}
          <div className="bg-foreground text-background rounded-xl p-6 md:p-8 text-center" data-testid="section-cta">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-primary">{content.ctaTitle}</h3>
            </div>
            <p className="text-background/80 mb-6">{content.ctaSubtitle}</p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a href="https://wa.me/4917683458274" data-testid="link-whatsapp-flyer">
                <Button variant="default" data-testid="button-whatsapp-flyer">
                  <Phone className="w-4 h-4 mr-2" />
                  +49 176 834 582 74
                </Button>
              </a>
              <a href="mailto:adrianlackdoktor@gmail.com" data-testid="link-email-flyer">
                <Button variant="default" data-testid="button-email-flyer">
                  <Mail className="w-4 h-4 mr-2" />
                  adrianlackdoktor@gmail.com
                </Button>
              </a>
              <a href="https://www.corion.gmbh" target="_blank" rel="noopener noreferrer" data-testid="link-web-flyer">
                <Button variant="outline" data-testid="button-web-flyer">
                  <Globe className="w-4 h-4 mr-2" />
                  www.corion.gmbh
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-background/70">Hofheim am Taunus</span>
            </div>

            <p className="font-semibold mt-6 mb-3">{content.steps}</p>
            <div className="flex justify-center gap-6 flex-wrap">
              {content.stepsList.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <span className="text-sm text-background/80">{step}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-background/50 mt-4">{content.contactNote}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-primary text-white p-4 text-center">
          <p className="font-semibold italic text-sm" data-testid="text-footer-quote">
            "{content.footer}"
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecruitmentFlyers() {
  const [activeTab, setActiveTab] = useState<string>("de");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partner werden | Corion Lackdoktor"
        description="Werde Partner bei Corion Lackdoktor. 4 Modelle für jeden Typ – mit oder ohne Eigenkapital. Branding, Kunden, Management & Werkstatt inklusive."
      />

      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {activeTab === 'de' ? 'Zurück' : activeTab === 'ro' ? 'Înapoi' : 'Back'}
              </Button>
            </Link>
            <h1 className="text-lg font-bold font-heading">
              {activeTab === 'de' ? 'Partner-Rekrutierung' : activeTab === 'ro' ? 'Recrutare Parteneri' : 'Partner Recruitment'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8" data-testid="tabs-language">
            <TabsTrigger value="de" data-testid="tab-de">
              Deutsch
            </TabsTrigger>
            <TabsTrigger value="ro" data-testid="tab-ro">
              Romana
            </TabsTrigger>
            <TabsTrigger value="en" data-testid="tab-en">
              English
            </TabsTrigger>
          </TabsList>

          <TabsContent value="de">
            <FlyerCard lang="de" />
          </TabsContent>
          <TabsContent value="ro">
            <FlyerCard lang="ro" />
          </TabsContent>
          <TabsContent value="en">
            <FlyerCard lang="en" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
