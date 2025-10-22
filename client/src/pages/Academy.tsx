import { useState } from "react";
import { GraduationCap, Award, BookOpen, Users, Clock, CheckCircle, ArrowRight, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import paintMasterBanner from "@assets/generated_images/AI_PaintMaster_GPT_avatar_0d76b779.png";

export default function Academy() {
  const [promptText, setPromptText] = useState("");

  const handleAskPaintMaster = () => {
    const baseUrl = "https://chat.openai.com/g/g-OyZuqL3BE-paintmaster";
    if (promptText.trim()) {
      window.open(`${baseUrl}?q=${encodeURIComponent(promptText)}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(baseUrl, "_blank", "noopener,noreferrer");
    }
  };

  const courses = [
    {
      icon: Wrench,
      title: "Smart Repair Grundlagen",
      duration: "2 Tage",
      description: "Lerne die wichtigsten Schritte der professionellen Spot- und Smart-Repair-Technik für kleine Lackschäden.",
      topics: [
        "Spot Repair Technik",
        "Materialauswahl & Oberflächenvorbereitung",
        "Farbtonfindung & Mischsysteme",
        "Qualitätskontrolle & Dokumentation"
      ],
      ideal: "Ideal für: Einsteiger, die präzise, schnelle und kosteneffiziente Reparaturen durchführen wollen."
    },
    {
      icon: Award,
      title: "Lackiertechnik Fortgeschritten",
      duration: "3 Tage",
      description: "Vertiefe dein Wissen über moderne Mehrschicht- und Effektlackierungen. Perfektioniere dein Finish mit AI-gestützter Fehleranalyse.",
      topics: [
        "Mehrschichtlackierung & Effektlacke",
        "Airbrush & Spezialbeschichtungen",
        "Polieren & Finish auf OEM-Niveau",
        "Lackfehler erkennen & vermeiden"
      ],
      ideal: "Ideal für: Profis, die Qualität und Geschwindigkeit optimieren wollen."
    },
    {
      icon: Wrench,
      title: "Dellen- und Drucktechnik (PDR)",
      duration: "3 Tage",
      description: "Lerne die Kunst der Dellenentfernung ohne Lackieren – eine der gefragtesten Kompetenzen im modernen Karosseriebereich.",
      topics: [
        "Werkzeugkunde & Hebeltechniken",
        "Aluminium & Stahl – Unterschiede in der Verarbeitung",
        "Temperaturführung & Lichttechnik",
        "Dellenanalyse mit AI-Unterstützung"
      ],
      ideal: "Ideal für: Karosseriebauer, Lackierer, Detailer & Smart-Repair-Techniker."
    },
    {
      icon: Sparkles,
      title: "Fahrzeugaufbereitung & Finish Excellence",
      duration: "2 Tage",
      description: "Werde zum Aufbereitungsprofi mit System! Vom Innenraum bis zum Hochglanz-Finish – perfekt vorbereitet durch praxisnahe Übungen und AI-Unterstützung.",
      topics: [
        "Lackreinigung & Schleiftechnik",
        "Polituren & Versiegelungen",
        "Innenraumaufbereitung & Lederpflege",
        "Glanzmessung & Qualitätsprüfung"
      ],
      ideal: "Ideal für: Aufbereiter & Smart Repair Werkstätten."
    },
    {
      icon: BookOpen,
      title: "Gutachter Ausbildung (Zertifiziert)",
      duration: "5 Tage",
      description: "Erhalte deine anerkannte Zertifizierung als KFZ-Gutachter mit praxisnaher Erfahrung und digitaler Dokumentation.",
      topics: [
        "Schadenanalyse & Bewertung",
        "Kalkulation & Dokumentation mit AI-Unterstützung",
        "Rechtliche Grundlagen & Kommunikation",
        "Praktische Gutachtenübungen"
      ],
      ideal: "Ideal für: Lackierer, Werkstattleiter, Versicherungsfachleute & Selbständige."
    },
  ];

  const benefits = [
    "Praxisnahe Ausbildung von erfahrenen Profis",
    "Modernste Werkstatt & Lackiertechnik",
    "Kleine Gruppen für intensives Lernen (max. 6 Teilnehmer)",
    "Zertifikat nach erfolgreichem Abschluss",
    "Flexible Termine & individuelle Schulungen",
    "Inklusive Materialien, Dokumentation & Support durch AI PaintMaster",
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Academy | Corion Lackdoktor - Professionelle KFZ Ausbildung"
        description="Professionelle Weiterbildung für Lackierer, Smart Repair Techniker und KFZ-Gutachter. Praxisnahe Kurse von erfahrenen Profis in Hofheim. Jetzt mit AI PaintMeister – dein persönlicher AI-Tutor."
        canonical="https://www.corion-lackdoktor.de/academy"
      />
      
      {/* PaintMaster GPT Section */}
      <section className="w-full bg-background border-b py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6">
          {/* Clickable Banner Image */}
          <motion.a
            href="https://chat.openai.com/g/g-OyZuqL3BE-paintmaster"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            data-testid="link-paintmaster-banner"
          >
            <img
              src={paintMasterBanner}
              alt="AI PaintMaster - Ihr persönlicher AI-Tutor für Smart Repair & Lackierung"
              className="w-full max-w-2xl rounded-xl shadow-lg cursor-pointer transition-shadow duration-300 hover:shadow-2xl"
            />
          </motion.a>

          {/* Headline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-xl md:text-2xl font-medium"
            data-testid="text-paintmaster-headline"
          >
            💬 Frag den <span className="text-primary font-bold">AI PaintMeister</span> – schreibe einen Prompt!
          </motion.p>

          {/* Interactive Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-3 w-full max-w-3xl"
          >
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAskPaintMaster();
                }
              }}
              placeholder="z. B. Wie lackiere ich Metallic-Flächen richtig?"
              className="flex-1 p-3 rounded-md bg-card border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-paintmaster-prompt"
            />
            <Button
              size="lg"
              onClick={handleAskPaintMaster}
              className="font-semibold"
              data-testid="button-ask-paintmaster"
            >
              Mit AI besprechen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Quick Questions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {[
              "Smart Repair Basics",
              "Farbmischung Tipps",
              "Lackfehler vermeiden",
              "Polieren & Finish"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setPromptText(question);
                  setTimeout(() => handleAskPaintMaster(), 100);
                }}
                className="text-sm px-3 py-1.5 rounded-full bg-card border border-border hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-quick-question-${index}`}
              >
                {question}
              </button>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-heading">Corion Academy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Professionelle Weiterbildung & Zertifizierung für KFZ-Fachkräfte
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold font-heading mb-6">Werde Teil der neuen Generation von Fahrzeugexperten</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Mit Unterstützung von <span className="text-primary font-semibold">AI PaintMaster</span> und 
              über <span className="font-semibold">20 Jahren Erfahrung</span> im Bereich Lackierung, Smart Repair und Fahrzeugaufbereitung.
            </p>
            <p>
              Unsere Kurse verbinden <span className="font-semibold">moderne Technologie</span> mit 
              praxisnaher Ausbildung und ermöglichen eine sofortige Umsetzung des Gelernten in deinem Berufsalltag.
            </p>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading mb-12 text-center">Unsere Kurse</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => {
              const Icon = course.icon;
              return (
                <div key={index} className="bg-background p-6 rounded-md border hover-elevate">
                  <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold">Kursinhalte:</p>
                    <ul className="space-y-1">
                      {course.topics.map((topic, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-primary font-semibold">{course.ideal}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl font-bold font-heading mb-12 text-center">Deine Vorteile mit der Corion Academy</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-lg">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI PaintMaster Info Section */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold font-heading mb-6">
            🤖 AI PaintMaster – Dein digitaler Begleiter
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Dein persönlicher AI-Assistent begleitet dich während des Kurses und danach.
            Er merkt sich deine Projekte, bewertet deine Fortschritte und hilft dir, 
            deine Fähigkeiten auf das nächste Level zu bringen.
          </p>
          <p className="text-2xl font-bold font-heading text-primary mb-4">
            "Lernen. Üben. Verbessern. Und verdienen."
          </p>
          <p className="text-muted-foreground">
            Das ist die Zukunft des Handwerks mit Corion Academy
          </p>
        </div>
      </div>

      {/* CTA - Waitlist */}
      <div className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            🟥 Jetzt auf die Warteliste eintragen!
          </h2>
          <p className="text-lg mb-4 opacity-90">
            Erhalte Zugang zu Early-Bird-Plätzen, Bonusinhalten und AI-PaintMaster Tools zur Kursvorbereitung.
          </p>
          <div className="space-y-2 mb-8 opacity-90">
            <p>📍 Ort: Wiesbaden & Umgebung</p>
            <p>📅 Flexible Termine | Kleine Gruppen (max. 6 Teilnehmer)</p>
            <p>💰 Förderung durch Bildungsprämie möglich</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt">
              <Button size="lg" variant="secondary" data-testid="button-contact-academy">
                Jetzt auf Warteliste eintragen
              </Button>
            </Link>
            <a href="tel:017683458274">
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20" data-testid="button-call-academy">
                0176 834 582 74
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
