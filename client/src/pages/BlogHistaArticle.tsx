import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Clock, CheckCircle, ExternalLink, Sparkles, DollarSign, Users, Zap, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import histaCover from "@/assets/images/blog/hista-cover.png";
import histaFleetBranding from "@/assets/images/blog/hista-fleet-branding.png";
import histaDigitalAssets from "@/assets/images/blog/hista-digital-assets.png";

export default function BlogHistaArticle() {
  const { language } = useLanguage();

  const pricingModels = [
    {
      icon: DollarSign,
      title: "One-Time Buy",
      subtitle: "Einmalzahlung",
      price: "3.800 €",
      description: "Komplettes Know-How-Paket mit allen digitalen Assets, Anleitungen und Zertifizierung.",
      features: [
        "Technisches Manual (PDF + Video)",
        "Plotter-Schablonen & Layouts",
        "Corporate Identity Templates",
        "Ausführungsprozedur zertifiziert"
      ]
    },
    {
      icon: Zap,
      title: "AI Subscription",
      subtitle: "Monatliches Abo",
      price: "49 € / Monat",
      description: "Kontinuierlicher AI-Support und Training für optimale Ergebnisse.",
      features: [
        "AI-gesteuerter Instructaj",
        "Schritt-für-Schritt Anleitung",
        "Prozessverifikation",
        "Technische Updates"
      ]
    },
    {
      icon: Sparkles,
      title: "Tokenized Access",
      subtitle: "Flexibler Einstieg",
      price: "500 € Token",
      description: "Für kleine Ateliers oder Testphasen – skalierbar und flexibel.",
      features: [
        "Token-basierter Zugang",
        "Generiert durch AI-Nutzung",
        "Stakeable für Rabatte",
        "Update-Berechtigung"
      ]
    },
    {
      icon: TrendingUp,
      title: "Revenue Share",
      subtitle: "Partnerschaft",
      price: "10% / Auftrag",
      description: "Faire Beteiligung am Erfolg – gemeinsames Interesse an Qualität.",
      features: [
        "Keine versteckten Kosten",
        "Keine hohen Abonnements",
        "Qualitätsfokus",
        "Win-Win Modell"
      ]
    }
  ];

  const processSteps = [
    { step: "01", title: "Vorbereitung", desc: "Reinigung, Entfettung und Oberflächenkontrolle" },
    { step: "02", title: "Basislack", desc: "Lackierung in gewünschter Farbe mit Qualitätskontrolle" },
    { step: "03", title: "Zwischenschicht", desc: "Klarlackschicht zum Schutz des Basislacks" },
    { step: "04", title: "Maskierung", desc: "Digitalisierung & präzise Masken via Cutter-Plotter" },
    { step: "05", title: "Designlackierung", desc: "Farbauftrag in Silber/Gold mit Kantenkontrolle" },
    { step: "06", title: "Hochglanz-Finish", desc: "Finale Klarlackschicht für UV-Schutz" },
    { step: "07", title: "Politur", desc: "3-Stufen Hochglanzpolitur für Spiegeloptik" }
  ];

  return (
    <>
      <SEO 
        title="HISTA Franchise: Digitale Assets für Flottenbranding - Corion Lackdoktor"
        description="Entdecken Sie das HISTA Franchise-Modell: Erstellen und verkaufen Sie digitale Assets für Flottenbranding. One-Time, Abo oder Token-basiert."
      />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-12 md:py-20 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" data-testid="button-back-blog">
                  <ArrowLeft className="w-4 h-4" />
                  Zurück zum Blog
                </Button>
              </Link>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-md">
                  Franchise
                </span>
                <span className="text-sm font-medium text-amber-500 bg-amber-500/10 px-3 py-1 rounded-md">
                  Digital Assets
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  01. Februar 2026
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  8 min Lesezeit
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
                HISTA: Digitale Assets für Premium-Flottenbranding
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Wie Sie mit unserem Franchise-Modell digitale Design-Assets erstellen, verkaufen und skalieren können – als One-Time-Kauf, Abonnement oder Token-basiert.
              </p>

              <a 
                href="https://hista-assets--adrianlackdokto.replit.app" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2" data-testid="button-view-hista-project">
                  <ExternalLink className="w-4 h-4" />
                  HISTA Projekt ansehen
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
                src={histaCover} 
                alt="HISTA Corporate Identity Board - Farbpalette und Design"
                className="w-full rounded-lg shadow-2xl"
              />
              <p className="text-sm text-muted-foreground text-center mt-4">
                HISTA Corporate Identity: Farbpalette, Typografie und Design-System
              </p>
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Introduction */}
              <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
                  Was ist HISTA?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Forum HisTa</strong> steht für "Historie + Tag" – die elegante Brücke zwischen Vergangenheit und Gegenwart. 
                  Unser Projekt kombiniert traditionelles Lackierer-Handwerk mit modernen digitalen Technologien, um 
                  Premium-Fahrzeugbranding für Flotten und Corporate Identity zu schaffen.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Das Besondere: Alle Design-Assets, Schablonen und Prozesse werden als <strong className="text-foreground">digitale Produkte</strong> erstellt, 
                  die über verschiedene Geschäftsmodelle lizenziert und weiterverkauft werden können.
                </p>
              </div>

              {/* Digital Assets Image */}
              <div className="my-10">
                <img 
                  src={histaDigitalAssets} 
                  alt="HISTA Digital Assets Dashboard"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Digitale Assets: Plotter-Dateien, Brand Boards und Prozessdokumentation
                </p>
              </div>

              {/* What We Create */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Was wird erstellt und verkauft?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {[
                  { title: "Technisches Manual", desc: "PDF + Video mit Schritt-für-Schritt Anleitung" },
                  { title: "Plotter-Schablonen", desc: "Digitale Dateien für präzise Maskierung" },
                  { title: "Corporate Identity", desc: "Layouts, Proportionen, Farbrezepturen" },
                  { title: "Prozesszertifizierung", desc: "Auditierbare Checklisten und Standards" },
                  { title: "AI Training Agent", desc: "Interaktiver Assistent für Ausführung" },
                  { title: "Materialkalkulation", desc: "Automatische Kostenberechnung" }
                ].map((item, index) => (
                  <Card key={index} className="p-4 bg-card border-card-border hover-elevate">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Franchise Models */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Franchise & Lizenzmodelle
              </h2>

              <p className="text-muted-foreground mb-8">
                Wählen Sie das Modell, das am besten zu Ihrem Geschäft passt:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {pricingModels.map((model, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Card className="p-6 h-full bg-card border-card-border hover-elevate">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <model.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-foreground">{model.title}</h3>
                          <p className="text-xs text-muted-foreground">{model.subtitle}</p>
                        </div>
                      </div>
                      
                      <div className="text-2xl font-bold text-primary mb-3">{model.price}</div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                      
                      <ul className="space-y-2">
                        {model.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Value Quote */}
              <Card className="p-8 my-12 bg-primary/5 border-primary/20 text-center">
                <blockquote className="text-xl md:text-2xl font-heading font-bold text-foreground italic">
                  „Nicht plätești ca să înveți.<br />
                  Plătești ca să faci parte dintr-un sistem care produce valoare."
                </blockquote>
                <p className="text-muted-foreground mt-4">
                  — HISTA Philosophie: Du bezahlst nicht, um zu lernen. Du bezahlst, um Teil eines wertschöpfenden Systems zu werden.
                </p>
              </Card>

              {/* Technical Process */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Der technische Prozess
              </h2>

              <p className="text-muted-foreground mb-6">
                Jeder HISTA-Lizenznehmer erhält den kompletten 7-Stufen-Prozess für Premium-Flottenbranding:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {processSteps.map((step, index) => (
                  <Card key={index} className="p-4 bg-card border-card-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{step.title}</h4>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Target Audience */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Für wen ist HISTA geeignet?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: Users, title: "Lackierbetriebe", desc: "Erweitern Sie Ihr Angebot mit Premium-Flottenbranding" },
                  { icon: Award, title: "Meisterbetriebe", desc: "Dokumentierte Prozesse für Prüfungsprojekte" },
                  { icon: TrendingUp, title: "Flottenmanager", desc: "Corporate Identity für Ihre Fahrzeugflotte" }
                ].map((item, index) => (
                  <Card key={index} className="p-5 bg-card border-card-border text-center hover-elevate">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-heading font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </Card>
                ))}
              </div>

              {/* Revenue Example */}
              <Card className="p-6 my-10 bg-card border-card-border">
                <h3 className="text-xl font-heading font-bold text-foreground mb-4">
                  Beispielrechnung: Revenue Share
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-background rounded-md">
                    <p className="text-sm text-muted-foreground">Lucrare vândută</p>
                    <p className="text-2xl font-bold text-foreground">3.000 €</p>
                  </div>
                  <div className="p-4 bg-background rounded-md">
                    <p className="text-sm text-muted-foreground">Comision HISTA (10%)</p>
                    <p className="text-2xl font-bold text-primary">300 €</p>
                  </div>
                  <div className="p-4 bg-background rounded-md">
                    <p className="text-sm text-muted-foreground">Ihr Gewinn</p>
                    <p className="text-2xl font-bold text-green-500">2.700 €</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Keine versteckten Kosten. Keine hohen Abonnements. Gemeinsames Interesse an Qualität.
                </p>
              </Card>

              {/* CTA Section */}
              <div className="bg-card border border-card-border rounded-lg p-8 text-center mt-12">
                <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                  Interesse an HISTA?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Erfahren Sie mehr über unser Franchise-Programm und werden Sie Teil des HISTA-Netzwerks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="https://hista-assets--adrianlackdokto.replit.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-hista-project">
                      <ExternalLink className="w-4 h-4" />
                      Projekt ansehen
                    </Button>
                  </a>
                  <Link href="/franchise">
                    <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-franchise-info">
                      Franchise-Info
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </article>

        {/* Back to Blog */}
        <section className="py-8 border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link href="/blog">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück zum Blog
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
