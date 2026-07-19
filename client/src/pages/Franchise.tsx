import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Handshake, 
  Sparkles, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  Brain,
  Wrench,
  Euro,
  Phone,
  Building2,
  Shield,
  Briefcase,
  ChevronDown,
  Rocket,
  FileText,
  Download,
  Target,
  Clock,
  Award,
  Network,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import { useLanguage, type Language } from "@/i18n/LanguageContext";
import { downloadFranchiseFlyer, type FlyerLanguage } from "@/lib/franchisePdfGenerator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, MessageCircle, ClipboardCheck } from "lucide-react";
import damageBeforeAfterImg from "@assets/Car_door_damage_vs_repair_comparation_1777038620889.png";
import technicianImg from "@assets/Focused_repair_in_the_workshop_1777038689994.png";

const waitlistSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().optional(),
  interestType: z.enum(["model-a", "model-b", "model-c", "model-d", "unsure"], {
    required_error: "Bitte wählen Sie eine Option aus"
  }),
  message: z.string().optional()
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

const tx = (texts: {de: string, en: string, ro: string, es: string, tr: string, el: string}, lang: string) => {
  return (texts as any)[lang] || texts.de;
};

export default function Franchise() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [shareView, setShareView] = useState<"with" | "without">("with");

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: WaitlistFormData) => {
      return apiRequest("POST", "/api/franchise-waitlist", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: tx({de: "Erfolgreich angemeldet!", en: "Successfully registered!", ro: "Înregistrare reușită!", es: "¡Registro exitoso!", tr: "Başarıyla kayıt olundu!", el: "Επιτυχής εγγραφή!"}, language),
        description: tx({
          de: "Vielen Dank für Ihr Interesse. Wir melden uns bald bei Ihnen.",
          en: "Thank you for your interest. We will contact you soon.",
          ro: "Mulțumim pentru interes. Vă vom contacta în curând.",
          es: "Gracias por su interés. Nos pondremos en contacto pronto.",
          tr: "İlginiz için teşekkürler. Yakında sizinle iletişime geçeceğiz.",
          el: "Ευχαριστούμε για το ενδιαφέρον σας. Θα επικοινωνήσουμε σύντομα."
        }, language),
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: tx({de: "Fehler", en: "Error", ro: "Eroare", es: "Error", tr: "Hata", el: "Σφάλμα"}, language),
        description: tx({
          de: "Es gab ein Problem bei der Anmeldung. Bitte versuchen Sie es erneut.",
          en: "There was a problem with the registration. Please try again.",
          ro: "A apărut o problemă la înregistrare. Vă rugăm încercați din nou.",
          es: "Hubo un problema con el registro. Por favor, inténtelo de nuevo.",
          tr: "Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.",
          el: "Υπήρξε πρόβλημα με την εγγραφή. Παρακαλώ δοκιμάστε ξανά."
        }, language),
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: WaitlistFormData) => {
    submitMutation.mutate(data);
  };

  const toggleModel = (id: string) => {
    setExpandedModel(expandedModel === id ? null : id);
  };

  const models = [
    {
      id: "model-a",
      letter: "A",
      title: {
        de: "Der unabhängige Subunternehmer",
        en: "The Independent Subcontractor",
        ro: "Subcontractorul Independent",
        es: "El Subcontratista Independiente",
        tr: "Bağımsız Taşeron",
        el: "Ο Ανεξάρτητος Υπεργολάβος"
      },
      subtitle: {
        de: "Für selbstständige Partner mit eigener Werkstatt",
        en: "For self-employed partners with their own workshop",
        ro: "Pentru parteneri independenți cu atelier propriu",
        es: "Para socios autónomos con taller propio",
        tr: "Kendi atölyesi olan bağımsız ortaklar için",
        el: "Για αυτοαπασχολούμενους συνεργάτες με δικό τους εργαστήριο"
      },
      icon: Wrench,
      partnerPercent: 80,
      corionPercent: 20,
      color: "from-blue-500 to-blue-600",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      desc: {
        de: "In diesem Modell agieren Sie als völlig eigenständiger Unternehmer. Corion fungiert als strategischer Partner für Branding und Auftragsvolumen.",
        en: "In this model, you act as a completely independent entrepreneur. Corion serves as a strategic partner for branding and order volume.",
        ro: "În acest model, acționați ca un antreprenor complet independent. Corion funcționează ca partener strategic pentru branding și volum de comenzi.",
        es: "En este modelo, usted actúa como empresario completamente independiente. Corion funciona como socio estratégico para branding y volumen de pedidos.",
        tr: "Bu modelde tamamen bağımsız bir girişimci olarak hareket edersiniz. Corion, markalaşma ve sipariş hacmi için stratejik ortak olarak görev yapar.",
        el: "Σε αυτό το μοντέλο, ενεργείτε ως εντελώς ανεξάρτητος επιχειρηματίας. Η Corion λειτουργεί ως στρατηγικός εταίρος για branding και όγκο παραγγελιών."
      },
      corionOffers: {
        de: ["Marketing & Markenbekanntheit (Branding)", "Professionelles Training & Schulungen mit KI-Unterstützung", "Qualitätssicherung (Endkontrolle) durch Kfz-Lackierer Meister", "Optimierte Arbeitsprozesse", "Kundenaufklärung (Transparenz & Standards)"],
        en: ["Marketing & Brand Awareness (Branding)", "Professional Training & Courses with AI Support", "Quality Assurance (Final Inspection) by Master Car Painter", "Optimized Work Processes", "Customer Education (Transparency & Standards)"],
        ro: ["Marketing & Notorietate de Brand (Branding)", "Training Profesional & Cursuri cu Suport AI", "Asigurarea Calității (Control Final) de către Meșter Vopsitor", "Procese de Lucru Optimizate", "Educarea Clienților (Transparență & Standarde)"],
        es: ["Marketing & Reconocimiento de Marca (Branding)", "Formación Profesional & Cursos con Soporte IA", "Aseguramiento de Calidad (Inspección Final) por Maestro Pintor", "Procesos de Trabajo Optimizados", "Educación al Cliente (Transparencia & Estándares)"],
        tr: ["Pazarlama & Marka Bilinirliği (Branding)", "Profesyonel Eğitim & Yapay Zekâ Destekli Kurslar", "Kalite Güvencesi (Son Kontrol) Usta Boyacı tarafından", "Optimize Edilmiş Çalışma Süreçleri", "Müşteri Bilgilendirme (Şeffaflık & Standartlar)"],
        el: ["Μάρκετινγκ & Αναγνωρισιμότητα Μάρκας (Branding)", "Επαγγελματική Εκπαίδευση & Μαθήματα με Υποστήριξη AI", "Διασφάλιση Ποιότητας (Τελικός Έλεγχος) από Μάστορα Βαφέα", "Βελτιστοποιημένες Διαδικασίες Εργασίας", "Ενημέρωση Πελατών (Διαφάνεια & Πρότυπα)"]
      },
      partnerResp: {
        de: ["Vollständige operative Durchführung", "Nutzung eigener Werkstatt/Infrastruktur", "Haftung für die eigene Arbeit"],
        en: ["Complete operational execution", "Use of own workshop/infrastructure", "Liability for own work"],
        ro: ["Execuție operațională completă", "Utilizarea atelierului/infrastructurii proprii", "Răspundere pentru propria muncă"],
        es: ["Ejecución operativa completa", "Uso del propio taller/infraestructura", "Responsabilidad por el propio trabajo"],
        tr: ["Tam operasyonel yürütme", "Kendi atölyesini/altyapısını kullanma", "Kendi işi için sorumluluk"],
        el: ["Πλήρης επιχειρησιακή εκτέλεση", "Χρήση ιδίου εργαστηρίου/υποδομής", "Ευθύνη για την ίδια εργασία"]
      },
      ideal: {
        de: "Selbstständige Lackierer & Handwerker mit eigener Ausstattung",
        en: "Self-employed painters & craftsmen with their own equipment",
        ro: "Vopsitori & meșteri independenți cu echipament propriu",
        es: "Pintores y artesanos autónomos con equipo propio",
        tr: "Kendi ekipmanına sahip bağımsız boyacılar ve zanaatkârlar",
        el: "Αυτοαπασχολούμενοι βαφείς & τεχνίτες με δικό τους εξοπλισμό"
      }
    },
    {
      id: "model-b",
      letter: "B",
      title: {
        de: "Auftragsvermittlung & Prozessmanagement",
        en: "Order Brokering & Process Management",
        ro: "Intermediere Comenzi & Management Procese",
        es: "Intermediación de Pedidos & Gestión de Procesos",
        tr: "Sipariş Aracılığı & Süreç Yönetimi",
        el: "Μεσιτεία Παραγγελιών & Διαχείριση Διαδικασιών"
      },
      subtitle: {
        de: "Volle Konzentration auf Ihre Arbeit",
        en: "Full focus on your work",
        ro: "Concentrare totală pe munca dumneavoastră",
        es: "Concentración total en su trabajo",
        tr: "İşinize tam odaklanma",
        el: "Πλήρης εστίαση στην εργασία σας"
      },
      icon: Network,
      partnerPercent: 60,
      corionPercent: 40,
      color: "from-green-500 to-green-600",
      badgeColor: "bg-green-500/10 text-green-500 border-green-500/20",
      desc: {
        de: "Sie bleiben unabhängig, aber Corion übernimmt die komplette Kundenakquise. Ihr Auftragsbuch wird durch uns gefüllt.",
        en: "You remain independent, but Corion takes over complete customer acquisition. Your order book is filled by us.",
        ro: "Rămâneți independent, dar Corion preia complet achiziția de clienți. Carnetul de comenzi este completat de noi.",
        es: "Usted sigue siendo independiente, pero Corion asume la captación completa de clientes. Su cartera de pedidos la llenamos nosotros.",
        tr: "Bağımsız kalırsınız, ancak Corion müşteri edinimi tamamen üstlenir. Sipariş defteriniz bizim tarafımızdan doldurulur.",
        el: "Παραμένετε ανεξάρτητοι, αλλά η Corion αναλαμβάνει πλήρως την απόκτηση πελατών. Το βιβλίο παραγγελιών σας γεμίζει από εμάς."
      },
      corionOffers: {
        de: ["Alle Leistungen aus Modell A", "Aktive Kundengenerierung & Vertrieb", "Customer Relationship Management (CRM)", "Terminplanung & Disposition", "Erweitertes Qualitätsmanagement & Prozessstandardisierung"],
        en: ["All services from Model A", "Active Customer Generation & Sales", "Customer Relationship Management (CRM)", "Appointment Scheduling & Dispatch", "Enhanced Quality Management & Process Standardization"],
        ro: ["Toate serviciile din Modelul A", "Generare Activă de Clienți & Vânzări", "Managementul Relațiilor cu Clienții (CRM)", "Planificarea Programărilor & Dispecerat", "Management Extins al Calității & Standardizare Procese"],
        es: ["Todos los servicios del Modelo A", "Generación Activa de Clientes & Ventas", "Gestión de Relaciones con Clientes (CRM)", "Programación de Citas & Despacho", "Gestión de Calidad Ampliada & Estandarización de Procesos"],
        tr: ["Model A'daki tüm hizmetler", "Aktif Müşteri Oluşturma & Satış", "Müşteri İlişkileri Yönetimi (CRM)", "Randevu Planlama & Sevkiyat", "Gelişmiş Kalite Yönetimi & Süreç Standardizasyonu"],
        el: ["Όλες οι υπηρεσίες από το Μοντέλο Α", "Ενεργή Δημιουργία Πελατών & Πωλήσεις", "Διαχείριση Σχέσεων Πελατών (CRM)", "Προγραμματισμός Ραντεβού & Αποστολή", "Βελτιωμένη Διαχείριση Ποιότητας & Τυποποίηση Διαδικασιών"]
      },
      partnerResp: {
        de: ["Konzentration fast ausschließlich auf die Produktion/Reparatur"],
        en: ["Focus almost exclusively on production/repair"],
        ro: ["Concentrare aproape exclusivă pe producție/reparație"],
        es: ["Concentración casi exclusiva en la producción/reparación"],
        tr: ["Neredeyse tamamen üretime/onarıma odaklanma"],
        el: ["Εστίαση σχεδόν αποκλειστικά στην παραγωγή/επισκευή"]
      },
      ideal: {
        de: "Partner die sich voll auf die Arbeit konzentrieren wollen",
        en: "Partners who want to focus entirely on their craft",
        ro: "Parteneri care vor să se concentreze exclusiv pe meserie",
        es: "Socios que quieren concentrarse totalmente en su oficio",
        tr: "Tamamen işine odaklanmak isteyen ortaklar",
        el: "Συνεργάτες που θέλουν να εστιάσουν εξ ολοκλήρου στην τέχνη τους"
      }
    },
    {
      id: "model-c",
      letter: "C",
      title: {
        de: "Corion Full-Service",
        en: "Corion Full-Service",
        ro: "Corion Full-Service",
        es: "Corion Full-Service",
        tr: "Corion Full-Service",
        el: "Corion Full-Service"
      },
      subtitle: {
        de: "Das Sorglos-Paket – Maximale Entlastung",
        en: "The Worry-Free Package – Maximum Relief",
        ro: "Pachetul Fără Griji – Descărcare Maximă",
        es: "El Paquete Sin Preocupaciones – Máximo Alivio",
        tr: "Endişesiz Paket – Maksimum Rahatlık",
        el: "Το Πακέτο Χωρίς Έγνοιες – Μέγιστη Ανακούφιση"
      },
      icon: Shield,
      partnerPercent: 40,
      corionPercent: 60,
      color: "from-primary to-red-600",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      highlighted: true,
      desc: {
        de: "Corion steuert den gesamten geschäftlichen Ablauf. Sie sind der technische Experte, wir sind das Management.",
        en: "Corion manages the entire business process. You are the technical expert, we are the management.",
        ro: "Corion gestionează întregul proces de afaceri. Dumneavoastră sunteți expertul tehnic, noi suntem managementul.",
        es: "Corion gestiona todo el proceso empresarial. Usted es el experto técnico, nosotros somos la gestión.",
        tr: "Corion tüm iş süreçlerini yönetir. Siz teknik uzmansınız, biz yönetimiz.",
        el: "Η Corion διαχειρίζεται ολόκληρη τη διαδικασία της επιχείρησης. Εσείς είστε ο τεχνικός ειδικός, εμείς η διοίκηση."
      },
      corionOffers: {
        de: ["Komplette Kundenabwicklung", "Marketing, Sales & After-Sales", "Operatives Management & Disposition", "Fakturierung & Mahnwesen", "Laufende Qualitätskontrolle & Weiterbildung"],
        en: ["Complete Customer Handling", "Marketing, Sales & After-Sales", "Operational Management & Dispatch", "Invoicing & Dunning", "Continuous Quality Control & Training"],
        ro: ["Gestionare Completă a Clienților", "Marketing, Vânzări & Post-Vânzare", "Management Operațional & Dispecerat", "Facturare & Urmărire Plăți", "Control Continuu al Calității & Formare"],
        es: ["Gestión Completa de Clientes", "Marketing, Ventas & Postventa", "Gestión Operativa & Despacho", "Facturación & Cobro", "Control de Calidad Continuo & Formación"],
        tr: ["Tam Müşteri Yönetimi", "Pazarlama, Satış & Satış Sonrası", "Operasyonel Yönetim & Sevkiyat", "Faturalandırma & İcra", "Sürekli Kalite Kontrol & Eğitim"],
        el: ["Πλήρης Διαχείριση Πελατών", "Μάρκετινγκ, Πωλήσεις & Μεταπώληση", "Επιχειρησιακή Διαχείριση & Αποστολή", "Τιμολόγηση & Είσπραξη", "Συνεχής Έλεγχος Ποιότητας & Εκπαίδευση"]
      },
      partnerResp: {
        de: ["Ausschließlich technische Ausführung (Reine Handwerksleistung)"],
        en: ["Exclusively technical execution (Pure craftsmanship)"],
        ro: ["Exclusiv execuție tehnică (Pur meșteșug)"],
        es: ["Exclusivamente ejecución técnica (Pura artesanía)"],
        tr: ["Yalnızca teknik uygulama (Salt zanaatkârlık)"],
        el: ["Αποκλειστικά τεχνική εκτέλεση (Καθαρή τεχνοτροπία)"]
      },
      ideal: {
        de: "Technische Experten die sich 100% auf Handwerk konzentrieren wollen",
        en: "Technical experts who want to focus 100% on their craft",
        ro: "Experți tehnici care vor să se concentreze 100% pe meșteșug",
        es: "Expertos técnicos que quieren concentrarse al 100% en su oficio",
        tr: "Zanaatlarına %100 odaklanmak isteyen teknik uzmanlar",
        el: "Τεχνικοί ειδικοί που θέλουν να εστιάσουν 100% στην τέχνη τους"
      }
    },
    {
      id: "model-d",
      letter: "D",
      title: {
        de: "Start-Up & Infrastruktur-Leasing",
        en: "Start-Up & Infrastructure Leasing",
        ro: "Start-Up & Leasing Infrastructură",
        es: "Start-Up & Leasing de Infraestructura",
        tr: "Start-Up & Altyapı Kiralama",
        el: "Start-Up & Leasing Υποδομής"
      },
      subtitle: {
        de: "Starten Sie ab Tag 1 – ohne Eigenkapital",
        en: "Start from Day 1 – without own capital",
        ro: "Începeți din Ziua 1 – fără capital propriu",
        es: "Empiece desde el Día 1 – sin capital propio",
        tr: "1. Günden başlayın – öz sermaye olmadan",
        el: "Ξεκινήστε από την 1η Μέρα – χωρίς ίδιο κεφάλαιο"
      },
      icon: Rocket,
      partnerPercent: 70,
      corionPercent: 30,
      color: "from-yellow-500 to-orange-500",
      badgeColor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      desc: {
        de: "Dieses Modell richtet sich an talentierte Handwerker, die sich selbstständig machen wollen, aber kein Kapital für Werkstatt oder Werkzeug haben.",
        en: "This model is aimed at talented craftsmen who want to become self-employed but have no capital for workshop or tools.",
        ro: "Acest model se adresează meșterilor talentați care vor să devină independenți, dar nu au capital pentru atelier sau unelte.",
        es: "Este modelo está dirigido a artesanos talentosos que quieren ser autónomos pero no tienen capital para taller o herramientas.",
        tr: "Bu model, bağımsız çalışmak isteyen ancak atölye veya alet için sermayesi olmayan yetenekli zanaatkârlara yöneliktir.",
        el: "Αυτό το μοντέλο απευθύνεται σε ταλαντούχους τεχνίτες που θέλουν να αυτοαπασχοληθούν αλλά δεν έχουν κεφάλαιο για εργαστήριο ή εργαλεία."
      },
      corionOffers: {
        de: ["Bereitstellung der Werkstatt (Mietnutzung)", "Bereitstellung von Profi-Werkzeugen & Equipment", "Kundenstamm & Marketing", "Admin-Support & Buchhaltungsvorbereitung"],
        en: ["Workshop Provision (Rental Use)", "Professional Tools & Equipment Provision", "Customer Base & Marketing", "Admin Support & Accounting Preparation"],
        ro: ["Asigurarea Atelierului (Utilizare în Regim de Închiriere)", "Asigurarea Uneltelor & Echipamentelor Profesionale", "Bază de Clienți & Marketing", "Suport Administrativ & Pregătire Contabilitate"],
        es: ["Provisión del Taller (Uso en Alquiler)", "Provisión de Herramientas y Equipos Profesionales", "Base de Clientes & Marketing", "Soporte Administrativo & Preparación Contable"],
        tr: ["Atölye Sağlama (Kiralama Kullanımı)", "Profesyonel Alet & Ekipman Sağlama", "Müşteri Tabanı & Pazarlama", "İdari Destek & Muhasebe Hazırlığı"],
        el: ["Παροχή Εργαστηρίου (Ενοικίαση)", "Παροχή Επαγγελματικών Εργαλείων & Εξοπλισμού", "Πελατειακή Βάση & Μάρκετινγκ", "Διοικητική Υποστήριξη & Προετοιμασία Λογιστικής"]
      },
      partnerResp: {
        de: ["Keine Investitionskosten, direkter Umsatz ab Tag 1"],
        en: ["No investment costs, direct revenue from Day 1"],
        ro: ["Fără costuri de investiție, venituri directe din Ziua 1"],
        es: ["Sin costes de inversión, ingresos directos desde el Día 1"],
        tr: ["Yatırım maliyeti yok, 1. Günden doğrudan gelir"],
        el: ["Χωρίς κόστος επένδυσης, άμεσα έσοδα από την 1η Μέρα"]
      },
      contractTerms: {
        de: ["Kein Startkapital erforderlich", "Mindestvertragslaufzeit: 1 Jahr", "Verschwiegenheitsvereinbarung (NDA)", "Kaution für Werkzeuge & Maschinen"],
        en: ["No starting capital required", "Minimum contract duration: 1 year", "Non-Disclosure Agreement (NDA)", "Deposit for tools & machines"],
        ro: ["Nu este necesar capital de pornire", "Durata minimă a contractului: 1 an", "Acord de Confidențialitate (NDA)", "Garanție pentru unelte & mașini"],
        es: ["No se requiere capital inicial", "Duración mínima del contrato: 1 año", "Acuerdo de Confidencialidad (NDA)", "Depósito para herramientas y máquinas"],
        tr: ["Başlangıç sermayesi gerekmiyor", "Minimum sözleşme süresi: 1 yıl", "Gizlilik Sözleşmesi (NDA)", "Alet ve makineler için depozito"],
        el: ["Δεν απαιτείται αρχικό κεφάλαιο", "Ελάχιστη διάρκεια σύμβασης: 1 έτος", "Συμφωνία Εμπιστευτικότητας (NDA)", "Εγγύηση για εργαλεία & μηχανήματα"]
      },
      ideal: {
        de: "Talentierte Handwerker ohne Eigenkapital – sofort starten",
        en: "Talented craftsmen without capital – start immediately",
        ro: "Meșteri talentați fără capital – pornire imediată",
        es: "Artesanos talentosos sin capital – empiece de inmediato",
        tr: "Sermayesiz yetenekli zanaatkârlar – hemen başlayın",
        el: "Ταλαντούχοι τεχνίτες χωρίς κεφάλαιο – ξεκινήστε αμέσως"
      }
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title={tx({
          de: "Partnerschaftsmodelle & Servicevereinbarungen | Corion Lackdoktor",
          en: "Partnership Models & Service Agreements | Corion Lackdoktor",
          ro: "Modele de Parteneriat & Convenții de Servicii | Corion Lackdoktor",
          es: "Modelos de Asociación & Acuerdos de Servicio | Corion Lackdoktor",
          tr: "Ortaklık Modelleri & Hizmet Anlaşmaları | Corion Lackdoktor",
          el: "Μοντέλα Συνεργασίας & Συμφωνίες Υπηρεσιών | Corion Lackdoktor"
        }, language)}
        description={tx({
          de: "Vier flexible Kooperationsmodelle für Handwerker. Qualität im Fokus, Bürokratie im Hintergrund.",
          en: "Four flexible cooperation models for craftsmen. Quality in focus, bureaucracy in the background.",
          ro: "Patru modele flexibile de cooperare pentru meșteri. Calitate în prim-plan, birocrație în fundal.",
          es: "Cuatro modelos flexibles de cooperación para artesanos. Calidad en primer plano, burocracia en segundo.",
          tr: "Zanaatkârlar için dört esnek işbirliği modeli. Kalite odakta, bürokrasi arka planda.",
          el: "Τέσσερα ευέλικτα μοντέλα συνεργασίας για τεχνίτες. Ποιότητα σε πρώτο πλάνο, γραφειοκρατία στο παρασκήνιο."
        }, language)}
        canonical="https://www.corion-lackdoktor.de/franchise"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDEzNGgzNnYzNkgzNnptMC0zNmgzNnYzNkgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Handshake className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {tx({de: "Partnerschaftsmodelle", en: "Partnership Models", ro: "Modele de Parteneriat", es: "Modelos de Asociación", tr: "Ortaklık Modelleri", el: "Μοντέλα Συνεργασίας"}, language)}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-4">
              <span className="text-primary">CORION</span> {tx({de: "Partner", en: "Partner", ro: "Partener", es: "Socio", tr: "Ortak", el: "Συνεργάτης"}, language)}
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold mb-3 text-foreground">
              {tx({
                de: "Ihr Partner für Erfolg im Handwerk.",
                en: "Your Partner for Success in Craftsmanship.",
                ro: "Partenerul Dumneavoastră pentru Succes în Meșteșug.",
                es: "Su Socio para el Éxito en la Artesanía.",
                tr: "Zanaatte Başarı İçin Ortağınız.",
                el: "Ο Συνεργάτης σας για Επιτυχία στην Τεχνοτροπία."
              }, language)}
            </p>
            
            <p className="text-lg text-primary font-bold mb-8">
              {tx({
                de: "Qualität im Fokus. Bürokratie im Hintergrund.",
                en: "Quality in Focus. Bureaucracy in the Background.",
                ro: "Calitate în Prim-Plan. Birocrație în Fundal.",
                es: "Calidad en Primer Plano. Burocracia en Segundo.",
                tr: "Kalite Odakta. Bürokrasi Arka Planda.",
                el: "Ποιότητα σε Πρώτο Πλάνο. Γραφειοκρατία στο Παρασκήνιο."
              }, language)}
            </p>

            {/* Principle Quote */}
            <Card className="max-w-2xl mx-auto p-6 bg-primary/5 border-primary/20 mb-8">
              <p className="text-lg italic text-foreground">
                {tx({
                  de: "\u201EWir halten Ihnen den R\u00FCcken frei.\u201C \u2013 Sie k\u00FCmmern sich um Qualit\u00E4t und Produktivit\u00E4t. Wir k\u00FCmmern uns um Kunden, Marketing und Verwaltung.",
                  en: "\"We've got your back.\" \u2013 You focus on quality and productivity. We handle customers, marketing and administration.",
                  ro: "\u201EV\u0103 acoperim spatele.\u201C \u2013 Dumneavoastr\u0103 v\u0103 ocupa\u021Bi de calitate \u0219i productivitate. Noi ne ocup\u0103m de clien\u021Bi, marketing \u0219i administrare.",
                  es: "\"Le cubrimos las espaldas.\" \u2013 Usted se centra en la calidad y la productividad. Nosotros nos encargamos de clientes, marketing y administración.",
                  tr: "\"Arkanızdayız.\" \u2013 Siz kalite ve üretkenliğe odaklanın. Müşteriler, pazarlama ve yönetimi biz üstleniyoruz.",
                  el: "\"Σας καλύπτουμε.\" \u2013 Εσείς εστιάζετε στην ποιότητα και την παραγωγικότητα. Εμείς αναλαμβάνουμε πελάτες, μάρκετινγκ και διοίκηση."
                }, language)}
              </p>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="#warteliste">
                <Button size="lg" className="gap-2" data-testid="button-waitlist-hero">
                  {tx({de: "Jetzt bewerben", en: "Apply Now", ro: "Aplică Acum", es: "Solicitar Ahora", tr: "Şimdi Başvurun", el: "Υποβολή Αίτησης"}, language)}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <a href="tel:+4917683458274">
                <Button variant="outline" size="lg" className="gap-2" data-testid="button-call-hero">
                  <Phone className="w-5 h-5" />
                  +49 176 83458274
                </Button>
              </a>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block mb-10"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-3"
                    data-testid="button-download-flyer"
                  >
                    <FileText className="w-5 h-5" />
                    {tx({de: "Franchise-Flyer herunterladen (PDF)", en: "Download Franchise Flyer (PDF)", ro: "Descarcă Flyerul de Franciză (PDF)", es: "Descargar Folleto de Franquicia (PDF)", tr: "Franchise Broşürünü İndirin (PDF)", el: "Κατεβάστε το Φυλλάδιο Franchise (PDF)"}, language)}
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem
                    onClick={() => downloadFranchiseFlyer("de")}
                    data-testid="menu-download-flyer-de"
                  >
                    <span className="font-mono text-xs mr-2 text-muted-foreground">DE</span>
                    Deutsch
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadFranchiseFlyer("en")}
                    data-testid="menu-download-flyer-en"
                  >
                    <span className="font-mono text-xs mr-2 text-muted-foreground">EN</span>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadFranchiseFlyer("ro")}
                    data-testid="menu-download-flyer-ro"
                  >
                    <span className="font-mono text-xs mr-2 text-muted-foreground">RO</span>
                    Română
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadFranchiseFlyer("es")}
                    data-testid="menu-download-flyer-es"
                  >
                    <span className="font-mono text-xs mr-2 text-muted-foreground">ES</span>
                    Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

            {/* Key Stats */}
            <div className="grid grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">4</div>
                <div className="text-xs text-muted-foreground">{tx({de: "Modelle", en: "Models", ro: "Modele", es: "Modelos", tr: "Model", el: "Μοντέλα"}, language)}</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">80%</div>
                <div className="text-xs text-muted-foreground">{tx({de: "Max. Partner", en: "Max. Partner", ro: "Max. Partener", es: "Máx. Socio", tr: "Maks. Ortak", el: "Μέγ. Συνεργάτης"}, language)}</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">{tx({de: "Bürokratie", en: "Bureaucracy", ro: "Birocrație", es: "Burocracia", tr: "Bürokrasi", el: "Γραφειοκρατία"}, language)}</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">{tx({de: "Transparenz", en: "Transparency", ro: "Transparență", es: "Transparencia", tr: "Şeffaflık", el: "Διαφάνεια"}, language)}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Overview - 4 Models at a Glance */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {tx({de: "Vier Modelle – Sie wählen", en: "Four Models – You Choose", ro: "Patru Modele – Dumneavoastră Alegeți", es: "Cuatro Modelos – Usted Elige", tr: "Dört Model – Siz Seçin", el: "Τέσσερα Μοντέλα – Εσείς Επιλέγετε"}, language)}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">
              {tx({de: "Kooperationsmodelle", en: "Cooperation Models", ro: "Modele de Cooperare", es: "Modelos de Cooperación", tr: "İşbirliği Modelleri", el: "Μοντέλα Συνεργασίας"}, language)}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {tx({
                de: "Angepasst an Ihre aktuelle Situation – vom etablierten Unternehmer bis zum Start-up ohne Eigenkapital",
                en: "Adapted to your current situation – from established entrepreneur to start-up without capital",
                ro: "Adaptate la situația dumneavoastră actuală – de la antreprenor stabilit la start-up fără capital",
                es: "Adaptados a su situación actual – desde empresario establecido hasta start-up sin capital",
                tr: "Mevcut durumunuza uyarlanmış – yerleşik girişimciden sermayesiz start-up'a",
                el: "Προσαρμοσμένα στην τρέχουσα κατάστασή σας – από εδραιωμένο επιχειρηματία έως start-up χωρίς κεφάλαιο"
              }, language)}
            </p>
          </motion.div>

          {/* Visual Revenue Split Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {models.map((model, index) => {
              const Icon = model.icon;
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-4 md:p-6 text-center cursor-pointer hover-elevate ${model.highlighted ? 'border-primary ring-2 ring-primary/20' : ''}`}
                    onClick={() => {
                      const el = document.getElementById(model.id);
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    data-testid={`card-overview-${model.id}`}
                  >
                    {model.highlighted && (
                      <div className="text-xs font-semibold text-primary mb-2 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {tx({de: "Empfohlen", en: "Recommended", ro: "Recomandat", es: "Recomendado", tr: "Önerilen", el: "Προτεινόμενο"}, language)}
                      </div>
                    )}
                    <div className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${model.color} mb-3`}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{model.letter}</div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                      {tx(model.title, language)}
                    </p>
                    
                    {/* Visual Split Bar */}
                    <div className="w-full h-6 rounded-md overflow-hidden flex mb-2">
                      <div 
                        className="bg-primary flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${model.partnerPercent}%` }}
                      >
                        {model.partnerPercent}%
                      </div>
                      <div 
                        className="bg-muted-foreground/30 flex items-center justify-center text-[10px] font-bold"
                        style={{ width: `${model.corionPercent}%` }}
                      >
                        {model.corionPercent}%
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{tx({de: "Partner", en: "Partner", ro: "Partener", es: "Socio", tr: "Ortak", el: "Συνεργάτης"}, language)}</span>
                      <span>Corion</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Detailed Model Cards with Dropdowns */}
          <div className="space-y-6">
            {models.map((model, index) => {
              const Icon = model.icon;
              const isExpanded = expandedModel === model.id;
              const offers = model.corionOffers[language as keyof typeof model.corionOffers] || model.corionOffers.de;
              const resp = model.partnerResp[language as keyof typeof model.partnerResp] || model.partnerResp.de;

              return (
                <motion.div
                  key={model.id}
                  id={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`overflow-hidden ${model.highlighted ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    {/* Header - Always Visible */}
                    <button
                      onClick={() => toggleModel(model.id)}
                      className="w-full p-6 md:p-8 flex items-center gap-4 md:gap-6 text-left"
                      data-testid={`button-toggle-${model.id}`}
                    >
                      <div className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className={model.badgeColor}>
                            {tx({de: "Modell", en: "Model", ro: "Model", es: "Modelo", tr: "Model", el: "Μοντέλο"}, language)} {model.letter}
                          </Badge>
                          {model.highlighted && (
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {tx({de: "Empfohlen", en: "Recommended", ro: "Recomandat", es: "Recomendado", tr: "Önerilen", el: "Προτεινόμενο"}, language)}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold font-heading text-foreground">
                          {tx(model.title, language)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tx(model.subtitle, language)}
                        </p>
                      </div>

                      {/* Revenue Split Mini */}
                      <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">{model.partnerPercent}%</div>
                        <div className="text-xs text-muted-foreground">{tx({de: "Ihr Anteil", en: "Your Share", ro: "Partea Dvs.", es: "Su Parte", tr: "Payınız", el: "Το Μερίδιό σας"}, language)}</div>
                      </div>

                      <ChevronDown className={`w-6 h-6 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-8 border-t">
                            {/* Description */}
                            <p className="text-muted-foreground mt-6 mb-6 text-lg">
                              {tx(model.desc, language)}
                            </p>

                            {/* Revenue Split Visual */}
                            <div className="mb-8">
                              <h4 className="font-semibold text-foreground mb-3">
                                {tx({de: "Honorarteilung", en: "Revenue Split", ro: "Împărțirea Veniturilor", es: "Reparto de Ingresos", tr: "Gelir Paylaşımı", el: "Κατανομή Εσόδων"}, language)}
                              </h4>
                              <div className="w-full h-10 rounded-lg overflow-hidden flex shadow-inner">
                                <div 
                                  className="bg-primary flex items-center justify-center text-sm font-bold text-white"
                                  style={{ width: `${model.partnerPercent}%` }}
                                >
                                  {model.partnerPercent}% {tx({de: "Partner", en: "Partner", ro: "Partener", es: "Socio", tr: "Ortak", el: "Συνεργάτης"}, language)}
                                </div>
                                <div 
                                  className="bg-muted-foreground/20 flex items-center justify-center text-sm font-bold text-foreground"
                                  style={{ width: `${model.corionPercent}%` }}
                                >
                                  {model.corionPercent}% Corion
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Corion Offers */}
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                                  {tx({de: "Leistungen Corion", en: "Corion Services", ro: "Servicii Corion", es: "Servicios Corion", tr: "Corion Hizmetleri", el: "Υπηρεσίες Corion"}, language)}
                                </h4>
                                <ul className="space-y-2">
                                  {offers.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                      <span className="text-sm text-foreground">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Partner Responsibilities */}
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                                  {tx({de: "Verantwortung Partner", en: "Partner Responsibility", ro: "Responsabilitatea Partenerului", es: "Responsabilidad del Socio", tr: "Ortak Sorumluluğu", el: "Ευθύνη Συνεργάτη"}, language)}
                                </h4>
                                <ul className="space-y-2">
                                  {resp.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                      <span className="text-sm text-foreground">{item}</span>
                                    </li>
                                  ))}
                                </ul>

                                {/* Contract Terms for Model D */}
                                {model.contractTerms && (
                                  <div className="mt-6">
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                                      {tx({de: "Vertragliche Rahmenbedingungen", en: "Contract Framework", ro: "Condiții Contractuale", es: "Marco Contractual", tr: "Sözleşme Koşulları", el: "Συμβατικό Πλαίσιο"}, language)}
                                    </h4>
                                    <ul className="space-y-2">
                                      {(model.contractTerms[language as keyof typeof model.contractTerms] || model.contractTerms.de).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                          <span className="text-sm text-foreground">{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ideal For */}
                            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                              <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-foreground">
                                  {tx({de: "Ideal für:", en: "Ideal for:", ro: "Ideal pentru:", es: "Ideal para:", tr: "İdeal:", el: "Ιδανικό για:"}, language)}
                                </span>
                                <span className="text-muted-foreground">
                                  {tx(model.ideal, language)}
                                </span>
                              </div>
                            </div>

                            {/* CTA */}
                            <div className="mt-6 flex flex-wrap gap-3">
                              <a href="#warteliste">
                                <Button className="gap-2" data-testid={`button-apply-${model.id}`}>
                                  {tx({de: "Für Modell", en: "Apply for Model", ro: "Aplică pentru Modelul", es: "Solicitar Modelo", tr: "Model için Başvur", el: "Αίτηση για Μοντέλο"}, language)} {model.letter} {tx({de: "bewerben", en: "", ro: "", es: "", tr: "", el: ""}, language)}
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </a>
                              <a href="tel:+4917683458274">
                                <Button variant="outline" className="gap-2">
                                  <Phone className="w-4 h-4" />
                                  {tx({de: "Anrufen", en: "Call", ro: "Sună", es: "Llamar", tr: "Ara", el: "Κλήση"}, language)}
                                </Button>
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              {tx({de: "Modelle im Vergleich", en: "Model Comparison", ro: "Compararea Modelelor", es: "Comparación de Modelos", tr: "Model Karşılaştırması", el: "Σύγκριση Μοντέλων"}, language)}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-4 md:p-6 overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-comparison">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3">{tx({de: "Aspekt", en: "Aspect", ro: "Aspect", es: "Aspecto", tr: "Husus", el: "Πτυχή"}, language)}</th>
                    <th className="text-center py-3 px-3 whitespace-nowrap">A</th>
                    <th className="text-center py-3 px-3 whitespace-nowrap">B</th>
                    <th className="text-center py-3 px-3 whitespace-nowrap bg-primary/5">C</th>
                    <th className="text-center py-3 px-3 whitespace-nowrap">D</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-medium">{tx({de: "Partner-Anteil", en: "Partner Share", ro: "Partea Partenerului", es: "Parte del Socio", tr: "Ortak Payı", el: "Μερίδιο Συνεργάτη"}, language)}</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">80%</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">60%</td>
                    <td className="text-center py-3 px-3 font-bold text-primary bg-primary/5">40%</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">70%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-medium">{tx({de: "Corion-Anteil", en: "Corion Share", ro: "Partea Corion", es: "Parte de Corion", tr: "Corion Payı", el: "Μερίδιο Corion"}, language)}</td>
                    <td className="text-center py-3 px-3">20%</td>
                    <td className="text-center py-3 px-3">40%</td>
                    <td className="text-center py-3 px-3 bg-primary/5">60%</td>
                    <td className="text-center py-3 px-3">30%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-medium">{tx({de: "Werkstatt", en: "Workshop", ro: "Atelier", es: "Taller", tr: "Atölye", el: "Εργαστήριο"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Eigene", en: "Own", ro: "Propriu", es: "Propio", tr: "Kendi", el: "Ιδιόκτητο"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Eigene", en: "Own", ro: "Propriu", es: "Propio", tr: "Kendi", el: "Ιδιόκτητο"}, language)}</td>
                    <td className="text-center py-3 px-3 bg-primary/5">{tx({de: "Eigene", en: "Own", ro: "Propriu", es: "Propio", tr: "Kendi", el: "Ιδιόκτητο"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Von Corion", en: "From Corion", ro: "De la Corion", es: "De Corion", tr: "Corion'dan", el: "Από Corion"}, language)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-medium">{tx({de: "Kundenakquise", en: "Customer Acquisition", ro: "Achiziția Clienților", es: "Captación de Clientes", tr: "Müşteri Edinimi", el: "Απόκτηση Πελατών"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Teilweise", en: "Partial", ro: "Parțial", es: "Parcial", tr: "Kısmen", el: "Μερική"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Komplett", en: "Complete", ro: "Complet", es: "Completa", tr: "Tam", el: "Πλήρης"}, language)}</td>
                    <td className="text-center py-3 px-3 bg-primary/5">{tx({de: "Komplett", en: "Complete", ro: "Complet", es: "Completa", tr: "Tam", el: "Πλήρης"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Komplett", en: "Complete", ro: "Complet", es: "Completa", tr: "Tam", el: "Πλήρης"}, language)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-medium">{tx({de: "Verwaltung", en: "Administration", ro: "Administrare", es: "Administración", tr: "Yönetim", el: "Διοίκηση"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Selbst", en: "Self", ro: "Proprie", es: "Propia", tr: "Kendi", el: "Ιδία"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Teilweise", en: "Partial", ro: "Parțial", es: "Parcial", tr: "Kısmen", el: "Μερική"}, language)}</td>
                    <td className="text-center py-3 px-3 bg-primary/5">{tx({de: "Komplett", en: "Complete", ro: "Complet", es: "Completa", tr: "Tam", el: "Πλήρης"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Teilweise", en: "Partial", ro: "Parțial", es: "Parcial", tr: "Kısmen", el: "Μερική"}, language)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">{tx({de: "Startkapital", en: "Starting Capital", ro: "Capital de Pornire", es: "Capital Inicial", tr: "Başlangıç Sermayesi", el: "Αρχικό Κεφάλαιο"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Erforderlich", en: "Required", ro: "Necesar", es: "Necesario", tr: "Gerekli", el: "Απαιτείται"}, language)}</td>
                    <td className="text-center py-3 px-3">{tx({de: "Erforderlich", en: "Required", ro: "Necesar", es: "Necesario", tr: "Gerekli", el: "Απαιτείται"}, language)}</td>
                    <td className="text-center py-3 px-3 bg-primary/5">{tx({de: "Erforderlich", en: "Required", ro: "Necesar", es: "Necesario", tr: "Gerekli", el: "Απαιτείται"}, language)}</td>
                    <td className="text-center py-3 px-3 font-bold text-green-500">{tx({de: "Nicht nötig", en: "Not needed", ro: "Nu e necesar", es: "No necesario", tr: "Gerekli değil", el: "Δεν απαιτείται"}, language)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Management Services */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {tx({de: "Management Services", en: "Management Services", ro: "Servicii de Management", es: "Servicios de Gestión", tr: "Yönetim Hizmetleri", el: "Υπηρεσίες Διαχείρισης"}, language)}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              {tx({de: "Corion Management Services", en: "Corion Management Services", ro: "Servicii de Management Corion", es: "Servicios de Gestión Corion", tr: "Corion Yönetim Hizmetleri", el: "Υπηρεσίες Διαχείρισης Corion"}, language)}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {tx({
                de: "Transparente Verwaltung. Zeit für das Wesentliche.",
                en: "Transparent administration. Time for what matters.",
                ro: "Administrare transparentă. Timp pentru ceea ce contează.",
                es: "Administración transparente. Tiempo para lo esencial.",
                tr: "Şeffaf yönetim. Önemli olan için zaman.",
                el: "Διαφανής διοίκηση. Χρόνος για τα ουσιαστικά."
              }, language)}
            </p>
          </motion.div>

          {/* Rate Card */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="p-6 bg-primary/5 border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {tx({de: "Stundensatz", en: "Hourly Rate", ro: "Tarif Orar", es: "Tarifa por Hora", tr: "Saatlik Ücret", el: "Ωριαία Χρέωση"}, language)}
                </span>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">90,00 € <span className="text-lg text-muted-foreground font-normal">/ {tx({de: "Stunde", en: "hour", ro: "oră", es: "hora", tr: "saat", el: "ώρα"}, language)} ({tx({de: "netto", en: "net", ro: "net", es: "neto", tr: "net", el: "καθαρά"}, language)})</span></div>
              <p className="text-sm text-muted-foreground">
                {tx({
                  de: "Jährliche Indexierung gemäß Inflationsrate. Transparent und minutengenau nach Aufwand.",
                  en: "Annual indexation according to inflation rate. Transparent and precise billing by the minute.",
                  ro: "Indexare anuală conform ratei inflației. Facturare transparentă și precisă la minut.",
                  es: "Indexación anual según la tasa de inflación. Facturación transparente y precisa al minuto.",
                  tr: "Enflasyon oranına göre yıllık endeksleme. Dakika bazında şeffaf ve hassas faturalandırma.",
                  el: "Ετήσια τιμαριθμική αναπροσαρμογή σύμφωνα με τον πληθωρισμό. Διαφανής και ακριβής χρέωση ανά λεπτό."
                }, language)}
              </p>
            </Card>
          </div>

          {/* Service Categories */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
              <Card className="p-6 h-full">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {tx({de: "Behördenmanagement", en: "Authority Management", ro: "Management Autorități", es: "Gestión de Autoridades", tr: "Resmi Kurum Yönetimi", el: "Διαχείριση Αρχών"}, language)}
                </h3>
                <ul className="space-y-2">
                  {[
                    tx({de: "Kommunikation mit Finanzamt, IHK, HWK", en: "Communication with tax office, IHK, HWK", ro: "Comunicare cu Finanțele, IHK, HWK", es: "Comunicación con Hacienda, IHK, HWK", tr: "Vergi dairesi, IHK, HWK ile iletişim", el: "Επικοινωνία με εφορία, IHK, HWK"}, language),
                    tx({de: "Gewerbeanmeldung & -ummeldung", en: "Business registration & re-registration", ro: "Înregistrarea & re-înregistrarea afacerii", es: "Registro y modificación de empresa", tr: "İşletme kaydı ve değişikliği", el: "Εγγραφή & επανεγγραφή επιχείρησης"}, language)
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Card className="p-6 h-full">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {tx({de: "Unternehmens-Setup", en: "Business Setup", ro: "Configurarea Afacerii", es: "Configuración Empresarial", tr: "İşletme Kurulumu", el: "Ίδρυση Επιχείρησης"}, language)}
                </h3>
                <ul className="space-y-2">
                  {[
                    tx({de: "Einrichtung der Buchhaltungsprozesse", en: "Setting up accounting processes", ro: "Configurarea proceselor contabile", es: "Configuración de procesos contables", tr: "Muhasebe süreçlerinin kurulması", el: "Ρύθμιση λογιστικών διαδικασιών"}, language),
                    tx({de: "Setup interner Abläufe und Dokumentation", en: "Setup of internal processes and documentation", ro: "Configurarea proceselor interne și documentare", es: "Configuración de procesos internos y documentación", tr: "İç süreçlerin ve dokümantasyonun kurulması", el: "Ρύθμιση εσωτερικών διαδικασιών και τεκμηρίωσης"}, language)
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Card className="p-6 h-full">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {tx({de: "Externe Koordination", en: "External Coordination", ro: "Coordonare Externă", es: "Coordinación Externa", tr: "Dış Koordinasyon", el: "Εξωτερικός Συντονισμός"}, language)}
                </h3>
                <ul className="space-y-2">
                  {[
                    tx({de: "Kommunikation mit Steuerberatern", en: "Communication with tax advisors", ro: "Comunicare cu consultanții fiscali", es: "Comunicación con asesores fiscales", tr: "Mali müşavirlerle iletişim", el: "Επικοινωνία με φορολογικούς συμβούλους"}, language),
                    tx({de: "Vermittlung an Unternehmensberater", en: "Referral to business consultants", ro: "Intermediere către consultanți de afaceri", es: "Referencia a consultores empresariales", tr: "İş danışmanlarına yönlendirme", el: "Παραπομπή σε επιχειρηματικούς συμβούλους"}, language),
                    tx({de: "Abwicklung mit autorisierten Stellen", en: "Processing with authorized bodies", ro: "Procesare cu organisme autorizate", es: "Tramitación con organismos autorizados", tr: "Yetkili kurumlarla işlem yapma", el: "Επεξεργασία με εξουσιοδοτημένους φορείς"}, language)
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partner Recruitment Section - Smart Repair & Fahrzeuglackierung */}
      <section id="partner-recruitment" className="py-16 md:py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 1. Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-partner-recruitment">
              {tx({ de: "Partner werden", en: "Become a Partner", ro: "Devino Partener", es: "Conviértete en Socio", tr: "Partner Olun", el: "Γίνε Συνεργάτης" }, language)}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6 text-foreground" data-testid="heading-partner-recruitment">
              {tx({
                de: "Deine Arbeit ist mehr wert.",
                en: "Your work is worth more.",
                ro: "Munca ta valorează mai mult.",
                es: "Tu trabajo vale más.",
                tr: "Emeğin daha fazlasını hak ediyor.",
                el: "Η δουλειά σου αξίζει περισσότερα."
              }, language)}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {tx({
                de: "Werde Corion Partner im Bereich Smart Repair & Fahrzeuglackierung – mit echten Aufträgen, klarer Struktur und mehr Freiheit.",
                en: "Become a Corion partner in smart repair and automotive painting – with real jobs, clear structure and more freedom.",
                ro: "Devino partener Corion în Smart Repair & vopsitorie auto – cu lucrări reale, structură clară și mai multă libertate.",
                es: "Conviértete en socio Corion en Smart Repair y pintura automotriz – con trabajos reales, estructura clara y más libertad.",
                tr: "Smart Repair ve araç boyama alanında Corion ortağı olun – gerçek işler, net yapı ve daha fazla özgürlük ile.",
                el: "Γίνε συνεργάτης Corion στο smart repair και τη βαφή αυτοκινήτων – με πραγματικές δουλειές, σαφή δομή και περισσότερη ελευθερία."
              }, language)}
            </p>
          </motion.div>

          {/* 2. Pain Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: Award,
                title: { de: "Zu wenig Anerkennung", en: "Too little recognition", ro: "Prea puțină recunoaștere", es: "Poco reconocimiento", tr: "Yeterince takdir görmüyorsun", el: "Πολύ λίγη αναγνώριση" },
                text: {
                  de: "Du lieferst Qualität, aber dein Einkommen bleibt begrenzt.",
                  en: "You deliver quality, but your income stays limited.",
                  ro: "Lucrezi bine, dar venitul tău rămâne limitat.",
                  es: "Entregas calidad, pero tus ingresos siguen limitados.",
                  tr: "Kalite üretiyorsun ama gelirin sınırlı kalıyor.",
                  el: "Παρέχεις ποιότητα, αλλά το εισόδημά σου παραμένει περιορισμένο."
                }
              },
              {
                icon: Clock,
                title: { de: "Zu wenig Freiheit", en: "Too little freedom", ro: "Prea puțină libertate", es: "Poca libertad", tr: "Yeterince özgürlük yok", el: "Πολύ λίγη ελευθερία" },
                text: {
                  de: "Urlaub, Arbeitszeit und Tempo werden oft von anderen bestimmt.",
                  en: "Your schedule, holidays and pace are often decided by others.",
                  ro: "Programul, concediile și ritmul sunt deseori decise de alții.",
                  es: "El horario, las vacaciones y el ritmo muchas veces los deciden otros.",
                  tr: "Tatil, çalışma saatleri ve tempo çoğu zaman başkaları tarafından belirleniyor.",
                  el: "Το ωράριο, οι διακοπές και ο ρυθμός συχνά ορίζονται από άλλους."
                }
              },
              {
                icon: Briefcase,
                title: { de: "Zu viel Risiko alleine", en: "Too much risk alone", ro: "Prea mult risc singur", es: "Demasiado riesgo solo", tr: "Tek başına çok fazla risk", el: "Πολύ ρίσκο μόνος" },
                text: {
                  de: "Selbstständig sein klingt gut – aber Kunden, Angebote und Abrechnung kosten Zeit.",
                  en: "Independence sounds good, but clients, offers and billing take time.",
                  ro: "Independența sună bine, dar clienții, ofertele și facturarea consumă timp.",
                  es: "Ser independiente suena bien, pero clientes, ofertas y facturación consumen tiempo.",
                  tr: "Bağımsız olmak güzel ama müşteriler, teklifler ve faturalama zaman alır.",
                  el: "Η ανεξαρτησία ακούγεται καλή, αλλά πελάτες, προσφορές και τιμολόγηση παίρνουν χρόνο."
                }
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full" data-testid={`card-pain-${idx}`}>
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading mb-2 text-foreground">
                    {tx(item.title, language)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tx(item.text, language)}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 3. Decentralized Model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 text-foreground">
              {tx({
                de: "Viele kleine Standorte. Eine starke Marke.",
                en: "Many small locations. One strong brand.",
                ro: "Multe ateliere mici. O marcă puternică.",
                es: "Muchos puntos pequeños. Una marca fuerte.",
                tr: "Birçok küçük lokasyon. Tek güçlü marka.",
                el: "Πολλές μικρές τοποθεσίες. Μία ισχυρή μάρκα."
              }, language)}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {tx({
                de: "Corion baut kein zentrales Großatelier auf. Das Modell basiert auf kleinen lokalen Partnerwerkstätten und kompakten Arbeitseinheiten. So können wir Kunden regional schneller bedienen und Partner bleiben nah an ihrer Region.",
                en: "Corion is not built around one large central workshop. The model is based on small local partner workshops and compact work units. This allows better regional coverage while partners stay close to their area.",
                ro: "Corion nu construiește un atelier central uriaș. Modelul se bazează pe ateliere locale mici și unități compacte de lucru. Astfel putem acoperi mai bine zone geografice mai mari, iar partenerii rămân aproape de regiunea lor.",
                es: "Corion no se basa en un gran taller central. El modelo se apoya en pequeños talleres locales y unidades compactas de trabajo. Así podemos cubrir mejor más zonas geográficas y los socios permanecen cerca de su región.",
                tr: "Corion büyük bir merkez atölye üzerine kurulu değildir. Model, küçük yerel ortak atölyeler ve kompakt çalışma birimlerine dayanır. Böylece daha geniş bir bölgesel kapsama alanı sağlanırken ortaklar bölgelerine yakın kalır.",
                el: "Η Corion δεν βασίζεται σε ένα μεγάλο κεντρικό εργαστήριο. Το μοντέλο στηρίζεται σε μικρά τοπικά συνεργαζόμενα εργαστήρια και συμπαγείς μονάδες εργασίας. Έτσι επιτυγχάνεται καλύτερη περιφερειακή κάλυψη ενώ οι συνεργάτες παραμένουν κοντά στην περιοχή τους."
              }, language)}
            </p>
          </motion.div>

          {/* Benefit cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-20">
            {[
              { icon: MapPin, title: { de: "Regionale Abdeckung", en: "Regional coverage", ro: "Acoperire regională", es: "Cobertura regional", tr: "Bölgesel kapsama", el: "Περιφερειακή κάλυψη" } },
              { icon: Briefcase, title: { de: "Echte Aufträge", en: "Real jobs", ro: "Lucrări reale", es: "Trabajos reales", tr: "Gerçek işler", el: "Πραγματικές δουλειές" } },
              { icon: ClipboardCheck, title: { de: "Klare Prozesse", en: "Clear processes", ro: "Procese clare", es: "Procesos claros", tr: "Net süreçler", el: "Σαφείς διαδικασίες" } },
              { icon: Target, title: { de: "Mehr Eigenverantwortung", en: "More ownership", ro: "Mai multă responsabilitate proprie", es: "Más responsabilidad propia", tr: "Daha fazla sorumluluk", el: "Περισσότερη ευθύνη" } },
              { icon: TrendingUp, title: { de: "Wachstum ohne Alleingang", en: "Growth without being alone", ro: "Creștere fără să fii singur", es: "Crecimiento sin estar solo", tr: "Yalnız kalmadan büyüme", el: "Ανάπτυξη χωρίς απομόνωση" } }
            ].map((b, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 h-full text-center" data-testid={`card-benefit-${idx}`}>
                  <b.icon className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{tx(b.title, language)}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 4. Income Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-foreground">
              {tx({
                de: "Was kann möglich sein?",
                en: "What could be possible?",
                ro: "Ce poate fi posibil?",
                es: "¿Qué puede ser posible?",
                tr: "Neler mümkün olabilir?",
                el: "Τι μπορεί να είναι εφικτό;"
              }, language)}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {tx({
                de: "Beispielrechnungen im Modell C – transparent und realistisch.",
                en: "Example calculations in Model C – transparent and realistic.",
                ro: "Exemple orientative în Modelul C – transparent și realist.",
                es: "Ejemplos orientativos en el Modelo C – transparentes y realistas.",
                tr: "Model C'de örnek hesaplamalar – şeffaf ve gerçekçi.",
                el: "Παραδειγματικοί υπολογισμοί στο Μοντέλο C – διαφανείς και ρεαλιστικοί."
              }, language)}
            </p>

            {/* Calculation logic explainer */}
            <div className="max-w-3xl mx-auto mb-6 text-sm text-muted-foreground">
              <p className="mb-1">
                <strong className="text-foreground">{tx({ de: "40% Partneranteil auf die Netto-Arbeitsleistung", en: "40% partner share on net labor revenue", ro: "40% partea partenerului din venitul net de manoperă", es: "40% parte del socio sobre los ingresos netos de mano de obra", tr: "Net işçilik gelirinin %40'ı ortak payı", el: "40% μερίδιο συνεργάτη επί του καθαρού εργατικού εσόδου" }, language)}</strong>
              </p>
              <p>
                {tx({
                  de: "Bei 20% Materialabzug entspricht das ca. 32% vom Rechnungsvolumen.",
                  en: "With 20% material deduction this equals approx. 32% of invoice volume.",
                  ro: "Cu 20% deducere materiale, aceasta corespunde aprox. 32% din volumul facturii.",
                  es: "Con un 20% de deducción por materiales, equivale aprox. al 32% del volumen facturado.",
                  tr: "%20 malzeme kesintisi ile bu, fatura hacminin yaklaşık %32'sine denk gelir.",
                  el: "Με 20% αφαίρεση υλικών αυτό ισούται με περίπου 32% του τιμολογιακού όγκου."
                }, language)}
              </p>
            </div>

            {/* Toggle */}
            <div className="inline-flex rounded-md border border-border p-1 mb-8 bg-card" data-testid="toggle-share-view">
              <button
                onClick={() => setShareView("without")}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${shareView === "without" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover-elevate"}`}
                data-testid="button-share-without"
              >
                {tx({
                  de: "Ohne Materialabzug (40%)",
                  en: "Without material deduction (40%)",
                  ro: "Fără deducere materiale (40%)",
                  es: "Sin deducción de material (40%)",
                  tr: "Malzeme kesintisi olmadan (%40)",
                  el: "Χωρίς αφαίρεση υλικών (40%)"
                }, language)}
              </button>
              <button
                onClick={() => setShareView("with")}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${shareView === "with" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover-elevate"}`}
                data-testid="button-share-with"
              >
                {tx({
                  de: "Mit 20% Materialabzug (32%)",
                  en: "With 20% material deduction (32%)",
                  ro: "Cu 20% deducere materiale (32%)",
                  es: "Con 20% deducción de material (32%)",
                  tr: "%20 malzeme kesintisi ile (%32)",
                  el: "Με 20% αφαίρεση υλικών (32%)"
                }, language)}
              </button>
            </div>
          </motion.div>

          {/* Income Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              {
                title: { de: "2 Türen pro Tag", en: "2 doors per day", ro: "2 uși pe zi", es: "2 puertas por día", tr: "Günde 2 kapı", el: "2 πόρτες την ημέρα" },
                daily: "2 × 500 € = 1.000 €",
                monthly: "22.000 €",
                share40: "8.800 €",
                share32: "≈ 7.040 €"
              },
              {
                title: { de: "2 Türen + 1 Smart Repair", en: "2 doors + 1 smart repair", ro: "2 uși + 1 Smart Repair", es: "2 puertas + 1 Smart Repair", tr: "2 kapı + 1 Smart Repair", el: "2 πόρτες + 1 smart repair" },
                daily: "2 × 500 € + 250 € = 1.250 €",
                monthly: "27.500 €",
                share40: "11.000 €",
                share32: "≈ 8.800 €"
              },
              {
                title: { de: "2 Türen + 2 Smart Repairs", en: "2 doors + 2 smart repairs", ro: "2 uși + 2 Smart Repair", es: "2 puertas + 2 Smart Repairs", tr: "2 kapı + 2 Smart Repair", el: "2 πόρτες + 2 smart repairs" },
                daily: "2 × 500 € + 2 × 250 € = 1.500 €",
                monthly: "33.000 €",
                share40: "13.200 €",
                share32: "≈ 10.560 €",
                highlight: true
              },
              {
                title: { de: "3 Smart Repairs pro Tag", en: "3 smart repairs per day", ro: "3 Smart Repair pe zi", es: "3 Smart Repairs por día", tr: "Günde 3 Smart Repair", el: "3 smart repairs την ημέρα" },
                daily: "3 × 250 € = 750 €",
                monthly: "16.500 €",
                share40: "6.600 €",
                share32: "≈ 5.280 €"
              }
            ].map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`p-6 h-full flex flex-col ${s.highlight ? "border-primary/40" : ""}`} data-testid={`card-income-${idx}`}>
                  {s.highlight && (
                    <Badge className="self-start mb-3 bg-primary/10 text-primary border-primary/20">
                      {tx({ de: "Beliebt", en: "Popular", ro: "Popular", es: "Popular", tr: "Popüler", el: "Δημοφιλές" }, language)}
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold font-heading mb-4 text-foreground">{tx(s.title, language)}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-wide">{tx({ de: "Tagesumsatz", en: "Daily revenue", ro: "Venit zilnic", es: "Ingresos diarios", tr: "Günlük ciro", el: "Ημερήσιος τζίρος" }, language)}</span>
                      <p className="text-foreground">{s.daily}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide">{tx({ de: "Monatsumsatz (22 Tage)", en: "Monthly revenue (22 days)", ro: "Venit lunar (22 zile)", es: "Ingresos mensuales (22 días)", tr: "Aylık ciro (22 gün)", el: "Μηνιαίος τζίρος (22 ημέρες)" }, language)}</span>
                      <p className="text-foreground font-medium">{s.monthly}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {shareView === "without"
                        ? tx({ de: "40% Partneranteil", en: "40% partner share", ro: "40% partea partenerului", es: "40% parte del socio", tr: "%40 ortak payı", el: "40% μερίδιο συνεργάτη" }, language)
                        : tx({ de: "32% effektiv (mit Material)", en: "32% effective (with material)", ro: "32% efectiv (cu materiale)", es: "32% efectivo (con material)", tr: "%32 efektif (malzeme dahil)", el: "32% αποτελεσματικό (με υλικά)" }, language)}
                    </p>
                    <p className="text-2xl font-bold text-primary" data-testid={`text-share-${idx}`}>
                      {shareView === "without" ? s.share40 : s.share32}
                      <span className="text-sm font-normal text-muted-foreground ml-1">/ {tx({ de: "Monat", en: "month", ro: "lună", es: "mes", tr: "ay", el: "μήνα" }, language)}</span>
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground max-w-4xl mx-auto text-center mb-20 px-4" data-testid="text-income-disclaimer">
            {tx({
              de: "Alle Zahlen sind Beispielrechnungen auf Basis von 22 Arbeitstagen pro Monat im Modell C. Der tatsächliche Partneranteil hängt von Auslastung, Auftragsmix, Qualität, Materialabrechnung und individueller Vereinbarung ab. Keine Einkommensgarantie.",
              en: "All figures are example calculations based on 22 working days per month in Model C. The actual partner share depends on workload, job mix, quality, material billing and individual agreement. No income guarantee.",
              ro: "Toate cifrele sunt exemple calculate la 22 zile lucrătoare pe lună în Modelul C. Partea reală a partenerului depinde de gradul de ocupare, mixul de lucrări, calitate, decontarea materialelor și acordul individual. Nu reprezintă o garanție de venit.",
              es: "Todas las cifras son ejemplos calculados con 22 días laborables al mes en el Modelo C. La parte real del socio depende de la carga de trabajo, mezcla de trabajos, calidad, facturación de materiales y acuerdo individual. No es una garantía de ingresos.",
              tr: "Tüm rakamlar Model C'de aylık 22 iş günü esasına dayalı örnek hesaplamalardır. Gerçek ortak payı; iş yükü, iş karışımı, kalite, malzeme faturalama ve bireysel anlaşmaya bağlıdır. Gelir garantisi değildir.",
              el: "Όλα τα ποσά είναι παραδειγματικοί υπολογισμοί βάσει 22 εργάσιμων ημερών ανά μήνα στο Μοντέλο C. Το πραγματικό μερίδιο εξαρτάται από φόρτο, μείγμα εργασιών, ποιότητα, τιμολόγηση υλικών και ατομική συμφωνία. Δεν αποτελεί εγγύηση εισοδήματος."
            }, language)}
          </p>

          {/* 5. Ideal Partner Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-8 text-center text-foreground">
              {tx({ de: "Für wen passt das?", en: "Who is this for?", ro: "Pentru cine se potrivește?", es: "¿Para quién es?", tr: "Kim için uygun?", el: "Για ποιον είναι αυτό;" }, language)}
            </h2>
            <Card className="p-8">
              <ul className="space-y-4">
                {[
                  { de: "Erfahrene Fahrzeuglackierer", en: "Experienced automotive painters", ro: "Vopsitori auto cu experiență", es: "Pintores automotrices con experiencia", tr: "Deneyimli araç boyacıları", el: "Έμπειροι βαφείς αυτοκινήτων" },
                  { de: "Smart-Repair-Profis", en: "Smart repair specialists", ro: "Specialiști Smart Repair", es: "Especialistas en Smart Repair", tr: "Smart Repair uzmanları", el: "Ειδικοί smart repair" },
                  { de: "Kleine Werkstätten oder mobile Einheiten", en: "Small workshops or mobile units", ro: "Ateliere mici sau unități mobile", es: "Pequeños talleres o unidades móviles", tr: "Küçük atölyeler veya mobil birimler", el: "Μικρά εργαστήρια ή κινητές μονάδες" },
                  { de: "Fachkräfte mit sauberer und zuverlässiger Arbeitsweise", en: "Professionals with clean and reliable work standards", ro: "Profesioniști care lucrează curat și responsabil", es: "Profesionales con trabajo limpio y fiable", tr: "Temiz ve güvenilir iş standartlarına sahip profesyoneller", el: "Επαγγελματίες με καθαρά και αξιόπιστα πρότυπα εργασίας" },
                  { de: "Menschen, die mehr Verantwortung und Flexibilität suchen", en: "People looking for more responsibility and flexibility", ro: "Oameni care caută mai multă responsabilitate și flexibilitate", es: "Personas que buscan más responsabilidad y flexibilidad", tr: "Daha fazla sorumluluk ve esneklik arayan insanlar", el: "Άνθρωποι που αναζητούν περισσότερη ευθύνη και ευελιξία" }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3" data-testid={`item-profile-${idx}`}>
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{tx(item, language)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* 6. Before / After Visual Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 items-center mb-20"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-foreground">
                {tx({
                  de: "Aus kleinen Schäden wird großer Wert.",
                  en: "Small damages can create strong value.",
                  ro: "Din daune mici se creează valoare mare.",
                  es: "De pequeños daños nace un gran valor.",
                  tr: "Küçük hasarlardan büyük değer doğar.",
                  el: "Από μικρές ζημιές δημιουργείται μεγάλη αξία."
                }, language)}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {tx({
                  de: "Smart Repair lebt von Präzision. Kleine Schäden, sauber behoben, schaffen echten Kundennutzen – und ein starkes regionales Geschäftsmodell.",
                  en: "Smart repair is built on precision. Small damages, repaired properly, create real customer value and a strong regional business model.",
                  ro: "Smart Repair înseamnă precizie. Daunele mici, reparate corect, creează valoare reală pentru client și un model regional puternic.",
                  es: "Smart Repair se basa en precisión. Pequeños daños, reparados correctamente, crean valor real para el cliente y un modelo regional sólido.",
                  tr: "Smart Repair hassasiyet üzerine kuruludur. Küçük hasarlar, doğru onarıldığında gerçek müşteri değeri ve güçlü bir bölgesel iş modeli yaratır.",
                  el: "Το smart repair βασίζεται στην ακρίβεια. Μικρές ζημιές, σωστά επισκευασμένες, δημιουργούν πραγματική αξία για τον πελάτη και ένα ισχυρό περιφερειακό επιχειρηματικό μοντέλο."
                }, language)}
              </p>
              <div className="rounded-md overflow-hidden border border-border">
                <img src={technicianImg} alt={tx({ de: "Partner in schwarzer Corion-Arbeitskleidung", en: "Partner in black Corion workwear", ro: "Partener în îmbrăcăminte de lucru Corion neagră", es: "Socio con ropa de trabajo Corion negra", tr: "Siyah Corion iş kıyafetli ortak", el: "Συνεργάτης με μαύρη στολή εργασίας Corion" }, language)} className="w-full h-auto" data-testid="img-technician" />
              </div>
            </div>
            <div className="rounded-md overflow-hidden border border-border">
              <img src={damageBeforeAfterImg} alt={tx({ de: "Vorher / Nachher Smart Repair", en: "Before / After smart repair", ro: "Înainte / După Smart Repair", es: "Antes / Después Smart Repair", tr: "Önce / Sonra Smart Repair", el: "Πριν / Μετά smart repair" }, language)} className="w-full h-auto" data-testid="img-before-after" />
              <div className="bg-card p-3 text-center text-sm text-muted-foreground">
                {tx({ de: "Vorher / Nachher – Schaden an Tür", en: "Before / After – door damage", ro: "Înainte / După – daună la ușă", es: "Antes / Después – daño en puerta", tr: "Önce / Sonra – kapı hasarı", el: "Πριν / Μετά – ζημιά πόρτας" }, language)}
              </div>
            </div>
          </motion.div>

          {/* 7. Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 text-center text-foreground">
              {tx({ de: "So läuft der Einstieg", en: "How the start works", ro: "Cum începe colaborarea", es: "Cómo empieza la colaboración", tr: "Başlangıç nasıl işler", el: "Πώς ξεκινά η συνεργασία" }, language)}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: { de: "Kontaktanfrage", en: "Contact request", ro: "Cerere de contact", es: "Solicitud de contacto", tr: "İletişim talebi", el: "Αίτημα επικοινωνίας" },
                  desc: { de: "Du sendest uns deine Anfrage – kurz und unverbindlich.", en: "You send us your request – short and non-binding.", ro: "Ne trimiți cererea ta – scurtă și fără obligații.", es: "Nos envías tu solicitud – breve y sin compromiso.", tr: "Bize talebinizi gönderirsiniz – kısa ve bağlayıcı değildir.", el: "Μας στέλνεις το αίτημά σου – σύντομο και χωρίς δέσμευση." }
                },
                {
                  title: { de: "Erfahrungs- & Regionscheck", en: "Experience and region check", ro: "Verificare experiență și regiune", es: "Verificación de experiencia y región", tr: "Deneyim ve bölge kontrolü", el: "Έλεγχος εμπειρίας και περιοχής" },
                  desc: { de: "Wir prüfen gemeinsam Erfahrung, Region und Passung.", en: "We jointly check experience, region and fit.", ro: "Verificăm împreună experiența, regiunea și potrivirea.", es: "Revisamos juntos experiencia, región y ajuste.", tr: "Birlikte deneyim, bölge ve uyumu kontrol ederiz.", el: "Ελέγχουμε από κοινού εμπειρία, περιοχή και ταίριασμα." }
                },
                {
                  title: { de: "Partnermodell-Erklärung", en: "Partner model explanation", ro: "Explicarea modelului de parteneriat", es: "Explicación del modelo de socio", tr: "Ortak model açıklaması", el: "Εξήγηση μοντέλου συνεργασίας" },
                  desc: { de: "Wir erklären transparent das passende Modell und die Konditionen.", en: "We transparently explain the fitting model and the conditions.", ro: "Îți explicăm transparent modelul potrivit și condițiile.", es: "Explicamos de forma transparente el modelo adecuado y las condiciones.", tr: "Uygun modeli ve koşulları şeffaf bir şekilde açıklarız.", el: "Εξηγούμε με διαφάνεια το κατάλληλο μοντέλο και τους όρους." }
                },
                {
                  title: { de: "Start als Corion Partner", en: "Start as Corion partner", ro: "Start ca partener Corion", es: "Inicio como socio Corion", tr: "Corion ortağı olarak başlama", el: "Έναρξη ως συνεργάτης Corion" },
                  desc: { de: "Onboarding, erste Aufträge und laufende Unterstützung.", en: "Onboarding, first jobs and ongoing support.", ro: "Onboarding, primele lucrări și suport continuu.", es: "Onboarding, primeros trabajos y apoyo continuo.", tr: "Oryantasyon, ilk işler ve sürekli destek.", el: "Ένταξη, πρώτες δουλειές και συνεχής υποστήριξη." }
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6 h-full" data-testid={`card-step-${idx}`}>
                    <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-semibold font-heading mb-2 text-foreground">{tx(step.title, language)}</h3>
                    <p className="text-sm text-muted-foreground">{tx(step.desc, language)}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 8. CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-foreground">
              {tx({
                de: "Lass uns vertraulich sprechen.",
                en: "Let's talk confidentially.",
                ro: "Hai să discutăm confidențial.",
                es: "Hablemos de forma confidencial.",
                tr: "Gizli bir şekilde konuşalım.",
                el: "Ας μιλήσουμε εμπιστευτικά."
              }, language)}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {tx({
                de: "Prüfe jetzt, ob das Corion Partnermodell zu dir, deiner Erfahrung und deiner Region passt.",
                en: "Find out if the Corion partner model fits your experience and your region.",
                ro: "Verifică dacă modelul de parteneriat Corion se potrivește cu experiența și regiunea ta.",
                es: "Comprueba si el modelo de socio Corion encaja con tu experiencia y tu región.",
                tr: "Corion ortaklık modelinin deneyiminize ve bölgenize uygun olup olmadığını kontrol edin.",
                el: "Δες αν το μοντέλο συνεργασίας Corion ταιριάζει με την εμπειρία και την περιοχή σου."
              }, language)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" onClick={() => document.getElementById("warteliste")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-cta-partner-request">
                <ArrowRight className="w-5 h-5" />
                {tx({
                  de: "Partner-Anfrage senden",
                  en: "Send partner request",
                  ro: "Trimite cerere de parteneriat",
                  es: "Enviar solicitud de socio",
                  tr: "Ortaklık talebi gönder",
                  el: "Αποστολή αιτήματος συνεργασίας"
                }, language)}
              </Button>
              <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-cta-whatsapp">
                  <MessageCircle className="w-5 h-5" />
                  {tx({
                    de: "Per WhatsApp Kontakt aufnehmen",
                    en: "Contact via WhatsApp",
                    ro: "Contact pe WhatsApp",
                    es: "Contactar por WhatsApp",
                    tr: "WhatsApp ile iletişime geç",
                    el: "Επικοινωνία μέσω WhatsApp"
                  }, language)}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Promise */}
      <section className="py-16 md:py-24 bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6 text-foreground">
              {tx({
                de: "Corion befreit den Meister von der Bürokratie.",
                en: "Corion frees the master from bureaucracy.",
                ro: "Corion eliberează meșterul de birocrație.",
                es: "Corion libera al maestro de la burocracia.",
                tr: "Corion ustayı bürokrasiden kurtarır.",
                el: "Η Corion απελευθερώνει τον μάστορα από τη γραφειοκρατία."
              }, language)}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {tx({
                de: "In einer Zeit, in der Vorschriften und Papierkram zunehmen, ist Zeit Ihre wertvollste Ressource. Unsere Strukturen erlauben es Ihnen, das zu tun, was Sie am besten können: Perfektes Handwerk. Alles andere erledigen wir.",
                en: "In a time when regulations and paperwork are increasing, time is your most valuable resource. Our structures allow you to do what you do best: Perfect craftsmanship. We handle everything else.",
                ro: "Într-o perioadă în care reglementările și birocrația cresc, timpul este cea mai valoroasă resursă. Structurile noastre vă permit să faceți ceea ce știți cel mai bine: Meșteșug perfect. Noi ne ocupăm de restul.",
                es: "En una época en la que las regulaciones y el papeleo aumentan, el tiempo es su recurso más valioso. Nuestras estructuras le permiten hacer lo que mejor sabe: Artesanía perfecta. Nosotros nos encargamos del resto.",
                tr: "Düzenlemelerin ve evrak işlerinin arttığı bir dönemde zaman en değerli kaynağınızdır. Yapılarımız en iyi yaptığınız şeyi yapmanızı sağlar: Mükemmel zanaatkârlık. Gerisini biz hallederiz.",
                el: "Σε μια εποχή που οι κανονισμοί και η γραφειοκρατία αυξάνονται, ο χρόνος είναι ο πιο πολύτιμος πόρος σας. Οι δομές μας σας επιτρέπουν να κάνετε αυτό που κάνετε καλύτερα: Τέλεια τεχνοτροπία. Εμείς αναλαμβάνουμε τα υπόλοιπα."
              }, language)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="warteliste" className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">
              {tx({de: "Jetzt bewerben", en: "Apply Now", ro: "Aplică Acum", es: "Solicitar Ahora", tr: "Şimdi Başvurun", el: "Υποβολή Αίτησης"}, language)}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              {tx({
                de: "Rufen Sie uns an oder füllen Sie das Formular aus.",
                en: "Call us or fill out the form below.",
                ro: "Sunați-ne sau completați formularul de mai jos.",
                es: "Llámenos o rellene el formulario a continuación.",
                tr: "Bizi arayın veya aşağıdaki formu doldurun.",
                el: "Καλέστε μας ή συμπληρώστε την παρακάτω φόρμα."
              }, language)}
              <span className="text-primary font-semibold"> {tx({de: "Wir antworten innerhalb 24h!", en: "We respond within 24h!", ro: "Răspundem în 24h!", es: "¡Respondemos en 24h!", tr: "24 saat içinde yanıt veriyoruz!", el: "Απαντάμε εντός 24 ωρών!"}, language)}</span>
            </p>
            
            <a href="tel:+4917683458274">
              <Button size="lg" className="gap-2 mb-8" data-testid="button-call-waitlist">
                <Phone className="w-5 h-5" />
                +49 176 83458274
              </Button>
            </a>
          </motion.div>

          <Card className="p-8 max-w-2xl mx-auto">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">
                  {tx({de: "Vielen Dank!", en: "Thank you!", ro: "Mulțumim!", es: "¡Muchas gracias!", tr: "Teşekkürler!", el: "Ευχαριστούμε!"}, language)}
                </h3>
                <p className="text-muted-foreground">
                  {tx({
                    de: "Wir werden uns bald bei Ihnen melden.",
                    en: "We will contact you soon.",
                    ro: "Vă vom contacta în curând.",
                    es: "Nos pondremos en contacto pronto.",
                    tr: "Yakında sizinle iletişime geçeceğiz.",
                    el: "Θα επικοινωνήσουμε σύντομα μαζί σας."
                  }, language)}
                </p>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx({de: "Name", en: "Name", ro: "Nume", es: "Nombre", tr: "İsim", el: "Όνομα"}, language)} *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={tx({de: "Ihr vollständiger Name", en: "Your full name", ro: "Numele complet", es: "Su nombre completo", tr: "Tam adınız", el: "Το πλήρες όνομά σας"}, language)}
                            {...field} 
                            data-testid="input-waitlist-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="ihre@email.de" 
                            {...field} 
                            data-testid="input-waitlist-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx({de: "Telefon (Optional)", en: "Phone (Optional)", ro: "Telefon (Opțional)", es: "Teléfono (Opcional)", tr: "Telefon (İsteğe Bağlı)", el: "Τηλέφωνο (Προαιρετικό)"}, language)}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+49 ..." 
                            {...field} 
                            data-testid="input-waitlist-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx({de: "Interessiertes Modell", en: "Model of Interest", ro: "Model de Interes", es: "Modelo de Interés", tr: "İlgilenilen Model", el: "Μοντέλο Ενδιαφέροντος"}, language)} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-waitlist-interest">
                              <SelectValue placeholder={tx({de: "Bitte wählen...", en: "Please select...", ro: "Vă rugăm selectați...", es: "Por favor seleccione...", tr: "Lütfen seçin...", el: "Παρακαλώ επιλέξτε..."}, language)} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="model-a">A: {tx({de: "Unabhängiger Subunternehmer", en: "Independent Subcontractor", ro: "Subcontractor Independent", es: "Subcontratista Independiente", tr: "Bağımsız Taşeron", el: "Ανεξάρτητος Υπεργολάβος"}, language)}</SelectItem>
                            <SelectItem value="model-b">B: {tx({de: "Auftragsvermittlung", en: "Order Brokering", ro: "Intermediere Comenzi", es: "Intermediación de Pedidos", tr: "Sipariş Aracılığı", el: "Μεσιτεία Παραγγελιών"}, language)}</SelectItem>
                            <SelectItem value="model-c">C: {tx({de: "Corion Full-Service", en: "Corion Full-Service", ro: "Corion Full-Service", es: "Corion Full-Service", tr: "Corion Full-Service", el: "Corion Full-Service"}, language)}</SelectItem>
                            <SelectItem value="model-d">D: {tx({de: "Start-Up & Infrastruktur", en: "Start-Up & Infrastructure", ro: "Start-Up & Infrastructură", es: "Start-Up & Infraestructura", tr: "Start-Up & Altyapı", el: "Start-Up & Υποδομή"}, language)}</SelectItem>
                            <SelectItem value="unsure">{tx({de: "Noch unsicher", en: "Not sure yet", ro: "Nu sunt sigur", es: "Aún no estoy seguro", tr: "Henüz emin değilim", el: "Δεν είμαι σίγουρος ακόμα"}, language)}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx({de: "Nachricht (Optional)", en: "Message (Optional)", ro: "Mesaj (Opțional)", es: "Mensaje (Opcional)", tr: "Mesaj (İsteğe Bağlı)", el: "Μήνυμα (Προαιρετικό)"}, language)}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={tx({
                              de: "Erzählen Sie uns mehr über sich und Ihre Erfahrung...",
                              en: "Tell us more about yourself and your experience...",
                              ro: "Spuneți-ne mai multe despre dumneavoastră și experiența dvs...",
                              es: "Cuéntenos más sobre usted y su experiencia...",
                              tr: "Kendiniz ve deneyiminiz hakkında daha fazla bilgi verin...",
                              el: "Πείτε μας περισσότερα για εσάς και την εμπειρία σας..."
                            }, language)}
                            {...field} 
                            data-testid="textarea-waitlist-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full gap-2"
                    disabled={submitMutation.isPending}
                    data-testid="button-waitlist-submit"
                  >
                    {submitMutation.isPending ? (
                      tx({de: "Wird gesendet...", en: "Sending...", ro: "Se trimite...", es: "Enviando...", tr: "Gönderiliyor...", el: "Αποστολή..."}, language)
                    ) : (
                      <>
                        {tx({de: "Bewerbung absenden", en: "Send Application", ro: "Trimite cererea", es: "Enviar solicitud", tr: "Başvuruyu Gönder", el: "Αποστολή Αίτησης"}, language)}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </Card>

          <div className="mt-8 text-center text-muted-foreground">
            <p className="mb-2">
              <strong>Corion GmbH</strong> | Mainzer Str. 75, 65189 Wiesbaden
            </p>
            <p>
              <a href="tel:+4917683458274" className="text-primary hover:underline">+49 176 83458274</a>
              {" | "}
              <a href="https://www.corion-lackdoktor.de" className="text-primary hover:underline">www.corion-lackdoktor.de</a>
            </p>
            <p className="text-xs mt-2">&copy; Corion | Adrian Apostol | Hofheim am Taunus | 2026</p>
          </div>
        </div>
      </section>
    </div>
  );
}
