import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  ExternalLink,
  Palette,
  Globe,
  Layers,
  Sparkles,
  Shield,
  Network,
  Brain,
  Coins,
  Target,
  CheckCircle,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import histaCover from "@/assets/images/blog/hista-cover.png";
import histaMercedesBg from "@/assets/images/blog/hista-mercedes-bg.png";

export default function BlogMeisterschuleArticle() {
  return (
    <>
      <SEO 
        title="Meisterschule Projekt: Vom Schulprojekt zum skalierbaren Business | Corion Lackdoktor Blog"
        description="Wie Adrian Apostol ein Meisterschule-Projekt an der Forum HisTa in ein skalierbares Business-System für Fahrzeuglackierung verwandelt hat. Corporate Identity, digitale Plattform und handwerkliche Innovation."
        keywords="Meisterschule, Forum HisTa, Fahrzeuglackierung, Corporate Identity, Franchise, Adrian Apostol, Lackierhandwerk"
      />
      
      <main className="min-h-screen bg-background pt-20">
        <article>
          {/* Hero Section with Image */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link href="/blog">
                  <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-to-blog">
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Blog
                  </Button>
                </Link>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Meisterschule
                  </Badge>
                  <Badge variant="outline">
                    Case Study
                  </Badge>
                  <Badge variant="outline">
                    Innovation
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6 leading-tight">
                  Wie ich ein Schulprojekt in ein skalierbares Business-System verwandelt habe
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8">
                  Von der Meisterschule Forum HisTa zu einer replizierbaren Methode im Fahrzeuglackierhandwerk
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adrian Apostol
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Februar 2026
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    12 min Lesezeit
                  </div>
                </div>

                <a 
                  href="https://hista-assets--adrianlackdokto.replit.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2" data-testid="button-view-hista-live">
                    <ExternalLink className="w-4 h-4" />
                    Forum HisTa Projekt ansehen
                  </Button>
                </a>
              </motion.div>
            </div>
          </section>

          {/* Hero Image */}
          <section className="py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <img 
                  src={histaMercedesBg} 
                  alt="Mercedes C-Klasse mit HISTA Corporate Branding"
                  className="w-full rounded-lg shadow-2xl bg-black/50"
                />
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mercedes C-Klasse mit handwerklich appliziertem HISTA Logo – Das Ergebnis meines Meisterschule-Projekts
                </p>
              </motion.div>
            </div>
          </section>

          {/* Introduction */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="prose prose-lg dark:prose-invert max-w-none"
              >
                <p className="text-xl leading-relaxed text-foreground">
                  Was als Abschlussprojekt an der <strong>Meisterschule Forum HisTa</strong> begann, entwickelte sich Schritt für Schritt zu weit mehr als einer akademischen Arbeit. Aus einer Pflichtaufgabe entstand ein reales, marktfähiges Konzept mit dem Ziel, handwerkliche Qualität, digitale Prozesse und unternehmerisches Denken in einem skalierbaren System zu vereinen.
                </p>
                
                <Card className="p-6 my-8 bg-primary/5 border-primary/20">
                  <p className="text-lg italic text-foreground mb-0">
                    Dieses Projekt ist der Beweis dafür, dass ein traditionelles Lackierhandwerk nicht im Widerspruch zu Innovation, Standardisierung und Wachstum stehen muss.
                  </p>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Von der Aufgabenstellung zur Vision */}
          <section className="py-12 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Von der Aufgabenstellung zur strategischen Vision
                  </h2>
                </div>

                <div className="space-y-6 text-muted-foreground">
                  <p>
                    Die ursprüngliche Aufgabenstellung war klar: <strong className="text-foreground">Entwicklung einer vollständigen visuellen Identität und einer digitalen Präsenz für einen Fahrzeuglackierbetrieb.</strong>
                  </p>

                  <p>
                    Meine Vision ging jedoch weiter. Ich habe mir eine zentrale Frage gestellt:
                  </p>

                  <Card className="p-6 bg-background border-primary/30">
                    <p className="text-xl font-medium text-primary mb-0">
                      „Wie kann handwerkliche Arbeit ihre menschliche Signatur behalten und gleichzeitig systematisiert und skalierbar werden?"
                    </p>
                  </Card>

                  <p>
                    Die Antwort darauf war ein ganzheitlicher Ansatz aus <strong className="text-foreground">Branding, Lackiertechnik, Digitalisierung und Prozessdesign</strong>.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Corporate Identity Section */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Klare Corporate Identity als Fundament
                  </h2>
                </div>

                <p className="text-muted-foreground mb-8">
                  Im ersten Schritt wurde eine konsistente Markenidentität aufgebaut:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Palette, text: "Definierte Farbpalette" },
                    { icon: Award, text: "Logo mit klarer Geometrie und Bedeutung" },
                    { icon: Layers, text: "Typografie mit Charakter und Wiedererkennung" },
                    { icon: Sparkles, text: "Visuelle Signatur mit handwerklichem Anspruch" }
                  ].map((item, index) => (
                    <Card key={index} className="p-4 flex items-center gap-3 bg-card border-card-border">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground">{item.text}</span>
                    </Card>
                  ))}
                </div>

                <img 
                  src={histaCover} 
                  alt="HISTA Corporate Identity Board"
                  className="w-full rounded-lg shadow-lg mb-4"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Corporate Identity Board: Farbpalette, Typografie und Design-System
                </p>

                <p className="text-muted-foreground mt-8">
                  Diese Identität wurde nicht nur für digitale Medien entwickelt, sondern explizit für die <strong className="text-foreground">physische Anwendung auf Fahrzeugkarosserien</strong>.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Digitale Plattform */}
          <section className="py-12 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Digitale Plattform als skalierbarer Hub
                  </h2>
                </div>

                <p className="text-muted-foreground mb-6">
                  Die Website wurde nicht als einfache Visitenkarte konzipiert, sondern als <strong className="text-foreground">digitaler Knotenpunkt</strong>:
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    "Klare Service-Struktur",
                    "Einfache Kontakt- und Angebotsanfragen",
                    "Fokus auf Prozesse statt nur auf Ergebnisse",
                    "Grundlage für spätere System- und Netzwerk-Integration"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <Card className="p-6 bg-background border-primary/30">
                  <p className="text-lg text-foreground mb-4">
                    Diese Plattform ist replizierbar und bildet die Basis für mehrere Standorte oder Franchise-Modelle.
                  </p>
                  <a 
                    href="https://hista-assets--adrianlackdokto.replit.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Live-Plattform besuchen
                    </Button>
                  </a>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Die Innovation */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Die Innovation: Lackiertes Logo mit menschlicher Signatur
                  </h2>
                </div>

                <p className="text-muted-foreground mb-6">
                  Der zentrale Bestandteil des Projekts ist eine <strong className="text-foreground">eigene Lackiertechnik</strong>, bei der Logos direkt auf die Karosserie appliziert werden – <em>nicht gedruckt, nicht geklebt, sondern handwerklich interpretiert</em>.
                </p>

                <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                  Die Methode kombiniert:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {[
                    "Plotter-Schablonen",
                    "Goldfolie",
                    "Spezielle Klarlacke",
                    "Künstlerisches Schleifen",
                    "Kontrollierte Licht- und Tiefeneffekte"
                  ].map((item, index) => (
                    <Card key={index} className="p-3 bg-card border-card-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
                  <h4 className="text-lg font-semibold text-foreground mb-4">
                    Jedes Logo trägt eine individuelle handwerkliche Signatur:
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Einzigartig</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Nicht industriell kopierbar</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Wird zum Wiedererkennungsmerkmal des Ateliers</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Digitale Sicherung */}
          <section className="py-12 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Digitale Sicherung der handwerklichen Identität
                  </h2>
                </div>

                <p className="text-muted-foreground mb-6">
                  Damit diese Technik skalierbar wird, wurde sie durch einen <strong className="text-foreground">digitalen Workflow</strong> ergänzt:
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Layers, title: "Dokumentation", desc: "Jedes Logo wird dokumentiert und archiviert" },
                    { icon: Globe, title: "Zentrale Speicherung", desc: "Vektordaten werden zentral gespeichert" },
                    { icon: Shield, title: "Wiederherstellung", desc: "Nach Unfall oder Reparatur möglich" },
                    { icon: Network, title: "Netzwerk-Zugriff", desc: "Für autorisierte Partner innerhalb des Netzwerks" }
                  ].map((item, index) => (
                    <Card key={index} className="p-4 bg-card border-card-border">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <p className="text-muted-foreground mt-8">
                  So bleibt die handwerkliche Individualität erhalten, während die Reproduzierbarkeit gesichert ist.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Skalierbarkeit & Franchise */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Network className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Skalierbarkeit & Franchise-Denken von Anfang an
                  </h2>
                </div>

                <p className="text-muted-foreground mb-8">
                  Das gesamte Projekt wurde bewusst für Wachstum konzipiert:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 bg-card border-card-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Digitale Asset-Bibliothek</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Logos</li>
                      <li>• Schablonen</li>
                      <li>• Anwendungsrichtlinien</li>
                      <li>• Material- und Lackrezepturen</li>
                      <li>• Qualitätsstandards</li>
                    </ul>
                  </Card>

                  <Card className="p-6 bg-card border-card-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Standardisierte Ausbildung</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Klare Prozessschritte</li>
                      <li>• Checklisten</li>
                      <li>• Abnahmekriterien</li>
                      <li>• Kontinuierlicher Support</li>
                    </ul>
                  </Card>

                  <Card className="p-6 bg-card border-card-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Vernetzte Werkstätten</h3>
                    <p className="text-sm text-muted-foreground">
                      Ein Fahrzeug kann in Werkstatt A gestaltet und in Werkstatt B identisch instand gesetzt werden – ohne Verlust der Markenidentität.
                    </p>
                  </Card>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Technologie & KI */}
          <section className="py-12 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Technologie, KI und Token-basierter Zugang
                  </h2>
                </div>

                <p className="text-muted-foreground mb-6">
                  Ein weiterer Schritt war die Integration moderner Technologien:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Brain, text: "KI-Agenten für Anleitung und Qualitätssicherung" },
                    { icon: Globe, text: "Digitale Trainings- und Prozessmaterialien" },
                    { icon: Coins, text: "Token-basierter Zugang für kleinere Betriebe" },
                    { icon: Network, text: "Beteiligungsmodell statt hoher Fixkosten" }
                  ].map((item, index) => (
                    <Card key={index} className="p-4 bg-card border-card-border">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="text-foreground text-sm">{item.text}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-6 bg-primary/5 border-primary/20">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Das Ergebnis:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Niedrige Einstiegshürden</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Gemeinsames Qualitätsinteresse</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-foreground">Nachhaltiges Wachstum für alle Beteiligten</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Fazit */}
          <section className="py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Fazit
                  </h2>
                </div>

                <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-8">
                  <p className="text-xl text-foreground mb-6">
                    Dieses Projekt ist mehr als ein Meisterstück.
                  </p>
                  <p className="text-lg text-foreground mb-6">Es zeigt, dass:</p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      <span className="text-lg text-foreground">Handwerk digital gedacht werden kann</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      <span className="text-lg text-foreground">Kunst und Standardisierung kein Widerspruch sind</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      <span className="text-lg text-foreground">Ein Atelier zu einer Marke werden kann</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      <span className="text-lg text-foreground">Ein Prozess zu einem skalierbaren System reift</span>
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-bold text-primary">
                    Ich habe kein Logo entworfen.<br />
                    Ich habe eine Methode entwickelt.
                  </p>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Zusammenarbeit CTA */}
          <section className="py-16 bg-primary/10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6">
                  Zusammenarbeit & Ausblick
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Ich bin offen für Kooperationen mit Werkstätten, Aufbau von Netzwerken, Franchise-Modelle und strategische Investitionen.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a 
                    href="https://hista-assets--adrianlackdokto.replit.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Forum HisTa Projekt
                    </Button>
                  </a>
                  <Link href="/kontakt">
                    <Button size="lg" variant="outline" className="gap-2">
                      Kontakt aufnehmen
                    </Button>
                  </Link>
                  <Link href="/franchise">
                    <Button size="lg" variant="outline" className="gap-2">
                      Franchise-Modelle
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Back to Blog */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Link href="/blog">
                <Button variant="outline" className="gap-2" data-testid="button-back-to-blog-bottom">
                  <ArrowLeft className="w-4 h-4" />
                  Zurück zum Blog
                </Button>
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
