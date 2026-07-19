import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";
import {
  Shield,
  TrendingUp,
  Cpu,
  Paintbrush,
  MessageCircle,
  Calculator,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Bot,
  Loader2,
  Award,
  Building2,
  Brain,
  Headphones,
  ArrowRight,
  Calendar,
  Navigation,
} from "lucide-react";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const leistungen = [
  {
    icon: Shield,
    title: "Unfall- & Schadensgutachten",
    desc: "Pr\u00e4zise Gutachten zur Beweissicherung und Schadensregulierung, auch bei versteckten Sch\u00e4den dank KI-Analyse. Von Versicherungen anerkannt.",
  },
  {
    icon: TrendingUp,
    title: "Restwert-/Marktwertgutachten",
    desc: "Marktgerechte Wertermittlung f\u00fcr Gebrauchtwagen, Unfallwagen und Oldtimer. Fundierte Basis f\u00fcr Kauf, Verkauf oder Versicherung.",
  },
  {
    icon: Cpu,
    title: "Digitale & KI-Analyse",
    desc: "Aufsp\u00fcren von Rahmenverziehungen, Struktursch\u00e4den und Lackm\u00e4ngeln durch modernste digitale Dokumentation und KI-gest\u00fctzte Verfahren.",
  },
  {
    icon: Paintbrush,
    title: "Karosserie & Lack",
    desc: "Expertise aus \u00fcber 25 Jahren Erfahrung in Karosserie- & Lackierarbeiten f\u00fcr eine umfassende Schadensbeurteilung und Werterhaltung.",
  },
  {
    icon: MessageCircle,
    title: "Kostenlose Erstberatung",
    desc: "Unverbindliche und kostenfreie Erstberatung zu Ihrem Schadenfall oder Bewertungsanliegen. Wir kl\u00e4ren Ihre Fragen.",
  },
  {
    icon: Calculator,
    title: "Kostenvoranschl\u00e4ge",
    desc: "Erstellung qualifizierter Kostenvoranschl\u00e4ge f\u00fcr Reparaturen, ideal auch zur Abrechnung von Bagatellsch\u00e4den direkt mit der Versicherung.",
  },
];

const standorte = [
  "Frankfurt am Main",
  "Hofheim am Taunus",
  "Wiesbaden",
  "Mainz",
];

const blogPosts = [
  {
    title: "Wann ist ein Schadengutachten nach einem Unfall sinnvoll?",
    date: "10. Juni 2024",
    excerpt: "Auch bei vermeintlich kleinen Sch\u00e4den kann ein unabh\u00e4ngiges Gutachten entscheidend sein...",
    gradient: "from-[#c00000]/20 via-[#1f2937] to-[#374151]",
  },
  {
    title: "Die Bedeutung der KI in der modernen Fahrzeugbewertung",
    date: "25. Mai 2024",
    excerpt: "Wie k\u00fcnstliche Intelligenz hilft, versteckte M\u00e4ngel aufzudecken...",
    gradient: "from-[#374151] via-[#1f2937] to-[#c00000]/20",
  },
  {
    title: "Tipps vom Lackdoktor: Lackpflege und Werterhalt",
    date: "15. April 2024",
    excerpt: "Erfahren Sie, wie Sie den Lack Ihres Fahrzeugs optimal sch\u00fctzen...",
    gradient: "from-[#1a1a2e] via-[#1f2937] to-[#374151]",
  },
];

const kernkompetenzen = [
  "Karosserie- & Lackierarbeiten: Modernste Techniken zur nachhaltigen Reparatur",
  "Zertifizierte KFZ-Gutachten: Von Versicherungen und Gerichten anerkannt",
  "Digitale & KI-gest\u00fctzte Analyse: Aufsp\u00fcren versteckter Sch\u00e4den",
  "Restwert-/Marktwertgutachten: Marktgerechte Wertermittlung",
];

export default function Gutachter() {
  const { toast } = useToast();
  const [unfallText, setUnfallText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleUnfallAssistent = async () => {
    if (!unfallText.trim()) return;
    setIsAnalyzing(true);
    setAiResult("");
    try {
      const res = await fetch("/api/gutachter/unfall-assistent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: unfallText }),
      });
      const data = await res.json();
      setAiResult(data.result || "Keine Analyse verf\u00fcgbar.");
    } catch {
      setAiResult("Fehler bei der Analyse. Bitte versuchen Sie es erneut.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted) {
      toast({ title: "Bitte stimmen Sie der Datenschutzerkl\u00e4rung zu.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      await apiRequest("POST", "/api/gutachter/contact", {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        subject: contactForm.subject,
        message: contactForm.message,
      });
      toast({ title: "Nachricht gesendet!", description: "Wir melden uns in K\u00fcrze bei Ihnen." });
      setContactForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setPrivacyAccepted(false);
    } catch {
      toast({ title: "Fehler beim Senden", description: "Bitte versuchen Sie es erneut.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-[#e5e7eb] pb-16 lg:pb-0" style={{ scrollBehavior: "smooth" }}>
      <SEO
        title="Corion Gutachter | Kfz-Sachverst\u00e4ndiger Frankfurt, Hofheim, Wiesbaden & Mainz"
        description="Schnell, professionell und unabh\u00e4ngig. Wir erstellen Schadengutachten und Wertgutachten f\u00fcr Ihr Fahrzeug im Rhein-Main-Gebiet. KI-gest\u00fctzte Analyse, 25+ Jahre Erfahrung."
        canonical="https://www.corion-gutachter.de/"
        keywords="kfz gutachter frankfurt, schadengutachten hofheim, wertgutachten wiesbaden, unfallgutachten mainz, kfz sachverst\u00e4ndiger rhein-main, corion gutachter"
      />

      {/* ========== 1. HERO ========== */}
      <section id="hero" className="relative bg-gradient-to-br from-[#111827] via-[#1a1a2e] to-[#111827] py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Corion Gutachter: Ihr Partner f\u00fcr Kfz-Gutachten im Rhein-Main-Gebiet
          </h1>
          <p className="text-lg md:text-xl text-[#d1d5db] max-w-3xl mx-auto mb-10">
            Schnell, professionell und unabh\u00e4ngig. Wir erstellen Schadengutachten und Wertgutachten f\u00fcr Ihr Fahrzeug in Frankfurt, Hofheim, Wiesbaden & Mainz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => scrollTo("leistungen")}
              className="inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 font-medium bg-[#c00000] text-white hover:bg-[#a00000] transition-colors"
              data-testid="button-hero-leistungen"
            >
              Unsere Leistungen
            </button>
            <button
              onClick={() => scrollTo("kontakt")}
              className="inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 font-medium bg-white text-[#c00000] hover:bg-gray-100 transition-colors"
              data-testid="button-hero-kontakt"
            >
              Direkt anfragen
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-[#9ca3af]">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#c00000]" />
              <span>25+ Jahre Erfahrung</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#c00000]" />
              <span>Alle Versicherungen</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#c00000]" />
              <span>KI-Analyse</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#c00000]" />
              <span>Kostenlose Beratung</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 2. LEISTUNGEN ========== */}
      <section id="leistungen" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Gutachter-Leistungen</h2>
          <p className="text-[#d1d5db] text-lg">Professionelle Kfz-Gutachten f\u00fcr jede Situation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leistungen.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_8px_30px_rgba(192,0,0,0.3)]"
                data-testid={`card-leistung-${i}`}
              >
                <div className="w-14 h-14 rounded-full bg-[#c00000]/10 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-[#c00000]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-[#d1d5db] text-sm flex-1 mb-4">{item.desc}</p>
                <button
                  onClick={() => scrollTo("kontakt")}
                  className="text-[#c00000] text-sm font-medium flex items-center gap-1 hover:underline"
                  data-testid={`link-mehr-erfahren-${i}`}
                >
                  Mehr erfahren <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== 3. UEBER UNS ========== */}
      <section id="ueber-uns" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">\u00dcber Corion Gutachter & den Lackdoktor</h2>
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-[65%]">
            <p className="text-[#d1d5db] text-lg mb-6 leading-relaxed">
              Mit \u00fcber 25 Jahren Erfahrung in der Karosserie- und Autolackierbranche und drei Jahren als zertifizierter KFZ-Gutachter (Marke \u201eLackdoktor\u201c) erstelle ich pr\u00e4zise Unfall- und Schadensgutachten, die selbst versteckte Sch\u00e4den zuverl\u00e4ssig erkennen. Dank digitaler Dokumentation und KI-gest\u00fctzter Analyseverfahren biete ich Ihnen faire Restwert- und Marktwertgutachten sowie eine transparente Schadensermittlung.
            </p>
            <h3 className="text-xl font-bold mb-4">Unsere Kernkompetenzen:</h3>
            <ul className="space-y-3 mb-8">
              {kernkompetenzen.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#c00000] flex-shrink-0 mt-0.5" />
                  <span className="text-[#d1d5db]">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => scrollTo("kontakt")}
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-medium bg-[#c00000] text-white hover:bg-[#a00000] transition-colors"
              data-testid="button-ueber-uns-kontakt"
            >
              Kontakt aufnehmen
            </button>
          </div>
          <div className="lg:w-[35%]">
            <div className="rounded-xl overflow-hidden h-72 lg:h-full min-h-[280px]">
              <img src={paintImage} alt="Corion Gutachter Werkstatt" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4. KI-UNFALL-ASSISTENT ========== */}
      <section id="unfall-assistent" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">KI-Unfall-Assistent</h2>
              <p className="text-[#d1d5db] text-lg mb-4">
                Beschreiben Sie kurz Ihren Unfall, und unser KI-Assistent gibt Ihnen eine allgemeine Checkliste mit ersten Schritten.
              </p>
              <p className="text-[#9ca3af] text-sm">
                Hinweis: Dies ist keine Rechtsberatung. Kontaktieren Sie uns f\u00fcr eine professionelle Begutachtung.
              </p>
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="Beschreiben Sie hier Ihren Unfallhergang..."
                value={unfallText}
                onChange={(e) => setUnfallText(e.target.value)}
                className="bg-[#111827] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280] min-h-[120px]"
                data-testid="textarea-unfall-beschreibung"
              />
              <button
                onClick={handleUnfallAssistent}
                disabled={isAnalyzing || !unfallText.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-medium bg-[#c00000] text-white hover:bg-[#a00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-unfall-analyse"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Wird analysiert...
                  </>
                ) : (
                  "Ratgeber erhalten"
                )}
              </button>
            </div>
            {aiResult && (
              <div className="mt-6 bg-[#111827] border border-[#374151] rounded-xl p-6" data-testid="div-ai-result">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-[#c00000]" />
                  <span className="font-bold">KI-Empfehlung:</span>
                </div>
                <p className="text-[#d1d5db] whitespace-pre-wrap">{aiResult}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== 5. STANDORTE ========== */}
      <section id="standorte" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">F\u00fcr Sie vor Ort</h2>
          <p className="text-[#d1d5db] text-lg">Corion Gutachter ist Ihr regionaler Partner im Rhein-Main-Gebiet.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standorte.map((city, i) => (
            <div
              key={i}
              className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_8px_30px_rgba(192,0,0,0.3)]"
              data-testid={`card-standort-${i}`}
            >
              <MapPin className="w-10 h-10 text-[#c00000] mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-4">{city}</h3>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(city + " Corion Gutachter")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-[#374151] text-[#e5e7eb] hover:bg-[#4b5563] transition-colors"
                  data-testid={`link-route-${i}`}
                >
                  <Navigation className="w-4 h-4" /> Route planen
                </a>
                <a
                  href={`https://wa.me/4917683458274?text=Hallo%20Corion%20Gutachter,%20ich%20habe%20eine%20Anfrage%20aus%20${encodeURIComponent(city)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
                  data-testid={`link-whatsapp-${i}`}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href="tel:+4917683458274"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-[#c00000]/20 text-[#c00000] hover:bg-[#c00000]/30 transition-colors"
                  data-testid={`link-anrufen-${i}`}
                >
                  <Phone className="w-4 h-4" /> Anrufen
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 6. BLOG PREVIEW ========== */}
      <section id="blog" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Aktuelles & Wissenswertes</h2>
          <p className="text-[#d1d5db] text-lg">Informieren Sie sich \u00fcber Neuigkeiten rund um Kfz-Gutachten und Fahrzeugbewertung.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {blogPosts.map((post, i) => (
            <div
              key={i}
              className="bg-[#1f2937] border border-[#374151] rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_8px_30px_rgba(192,0,0,0.3)]"
              data-testid={`card-blog-${i}`}
            >
              <div className={`h-40 bg-gradient-to-br ${post.gradient}`} />
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#9ca3af] text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{post.date}</span>
                </div>
                <h3 className="font-bold mb-2 leading-snug">{post.title}</h3>
                <p className="text-[#d1d5db] text-sm mb-4">{post.excerpt}</p>
                <Link href="/blog" className="text-[#c00000] text-sm font-medium flex items-center gap-1 hover:underline" data-testid={`link-weiterlesen-${i}`}>
                  Weiterlesen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/blog" data-testid="link-alle-blog">
            <span className="inline-flex items-center gap-2 text-[#c00000] font-medium hover:underline cursor-pointer">
              Alle Blogbeitr\u00e4ge anzeigen <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* ========== 7. KONTAKT ========== */}
      <section id="kontakt" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nehmen Sie Kontakt auf</h2>
          <p className="text-[#d1d5db] text-lg">Wir sind f\u00fcr Sie da! Schildern Sie uns Ihr Anliegen \u2013 wir beraten Sie gerne kostenlos und unverbindlich.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[60%]">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <Label htmlFor="contact-name" className="text-[#d1d5db] mb-1.5 block">Name *</Label>
                <Input
                  id="contact-name"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="bg-[#1f2937] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280]"
                  placeholder="Ihr vollst\u00e4ndiger Name"
                  data-testid="input-contact-name"
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-[#d1d5db] mb-1.5 block">E-Mail *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-[#1f2937] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280]"
                  placeholder="ihre@email.de"
                  data-testid="input-contact-email"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone" className="text-[#d1d5db] mb-1.5 block">Telefon</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="bg-[#1f2937] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280]"
                  placeholder="+49 ..."
                  data-testid="input-contact-phone"
                />
              </div>
              <div>
                <Label htmlFor="contact-subject" className="text-[#d1d5db] mb-1.5 block">Betreff *</Label>
                <Input
                  id="contact-subject"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="bg-[#1f2937] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280]"
                  placeholder="Worum geht es?"
                  data-testid="input-contact-subject"
                />
              </div>
              <div>
                <Label htmlFor="contact-message" className="text-[#d1d5db] mb-1.5 block">Nachricht *</Label>
                <Textarea
                  id="contact-message"
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="bg-[#1f2937] border-[#374151] text-[#e5e7eb] placeholder:text-[#6b7280] min-h-[120px]"
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                  data-testid="textarea-contact-message"
                />
              </div>
              <div>
                <Label className="text-[#d1d5db] mb-1.5 block">Fotos vom Fahrzeug (optional)</Label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="block w-full text-sm text-[#9ca3af] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#374151] file:text-[#e5e7eb] hover:file:bg-[#4b5563]"
                  data-testid="input-contact-files"
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy-check"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 accent-[#c00000]"
                  data-testid="checkbox-privacy"
                />
                <label htmlFor="privacy-check" className="text-sm text-[#9ca3af]">
                  Ich habe die Datenschutzerkl\u00e4rung gelesen und stimme zu.
                </label>
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 font-medium bg-[#c00000] text-white hover:bg-[#a00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                data-testid="button-contact-submit"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Wird gesendet...
                  </>
                ) : (
                  "Nachricht senden"
                )}
              </button>
            </form>
          </div>
          <div className="lg:w-[40%]">
            <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Direkter Draht zu uns:</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#c00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#9ca3af] text-sm block">Telefon:</span>
                    <a href="tel:+4917683458274" className="text-[#e5e7eb] hover:text-[#c00000] transition-colors" data-testid="link-contact-phone">
                      +49 176 83458274
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#c00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#9ca3af] text-sm block">E-Mail:</span>
                    <a href="mailto:info@corion-gutachter.de" className="text-[#e5e7eb] hover:text-[#c00000] transition-colors" data-testid="link-contact-email">
                      info@corion-gutachter.de
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#c00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#9ca3af] text-sm block">WhatsApp:</span>
                    <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer" className="text-[#e5e7eb] hover:text-[#c00000] transition-colors" data-testid="link-contact-whatsapp">
                      Chat starten
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="https://wa.me/4917683458274?text=Hallo%20Corion%20Gutachter,%20ich%20habe%20eine%20Anfrage."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-md px-6 py-3 font-medium bg-[#25D366] text-white hover:bg-[#1fb855] transition-colors"
                  data-testid="button-whatsapp-kontakt"
                >
                  <MessageCircle className="w-5 h-5" />
                  Direkt per WhatsApp kontaktieren
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 8. FOOTER ========== */}
      <footer className="bg-[#0d1117] border-t border-[#374151] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#9ca3af] text-sm">&copy; 2026 Corion Gutachter. Alle Rechte vorbehalten.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/impressum" className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors" data-testid="link-footer-impressum">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors" data-testid="link-footer-datenschutz">
              Datenschutz
            </Link>
            <Link href="/" className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors" data-testid="link-footer-lackdoktor">
              Corion Lackdoktor
            </Link>
            <Link href="/partner" className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors" data-testid="link-footer-portal">
              Gutachter-Portal
            </Link>
          </div>
        </div>
      </footer>

      {/* ========== 9. FLOATING BUTTONS (desktop) ========== */}
      <a
        href="https://wa.me/4917683458274"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 z-50 hidden lg:flex w-14 h-14 rounded-full bg-[#25D366] text-white items-center justify-center shadow-lg hover:bg-[#1fb855] transition-colors"
        data-testid="floating-whatsapp"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
      <a
        href="tel:+4917683458274"
        className="fixed bottom-6 right-6 z-50 hidden lg:flex w-14 h-14 rounded-full bg-[#c00000] text-white items-center justify-center shadow-lg hover:bg-[#a00000] transition-colors"
        data-testid="floating-phone"
        aria-label="Anrufen"
      >
        <Phone className="w-6 h-6" />
      </a>

      {/* ========== MOBILE STICKY FOOTER ========== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#374151] flex lg:hidden">
        <a
          href="tel:+4917683458274"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#e5e7eb] hover:bg-[#1f2937] transition-colors"
          data-testid="mobile-footer-anrufen"
        >
          <Phone className="w-4 h-4" /> Anrufen
        </a>
        <a
          href="https://wa.me/4917683458274"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#25D366] hover:bg-[#1f2937] transition-colors border-x border-[#374151]"
          data-testid="mobile-footer-whatsapp"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
        <Link
          href="/partner"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#e5e7eb] hover:bg-[#1f2937] transition-colors"
          data-testid="mobile-footer-portal"
        >
          <Building2 className="w-4 h-4" /> Portal
        </Link>
      </div>
    </div>
  );
}