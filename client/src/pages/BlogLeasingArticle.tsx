import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Clock, CheckCircle, AlertTriangle, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import bumperScratchBefore from "@/assets/images/blog/bumper-scratch-before.png";
import spotRepairProcess from "@/assets/images/blog/spot-repair-process.png";
import bumperBeforeAfter from "@/assets/images/blog/bumper-before-after.png";
import spotRepairReal from "@/assets/images/blog/spot-repair-real.jpg";

export default function BlogLeasingArticle() {
  const { language } = useLanguage();

  const benefits = [
    "Deutlich geringere Rückgabekosten",
    "Keine bösen Überraschungen bei der Abrechnung",
    "Fachgerechte Reparaturen nach Leasingstandard",
    "Schnelle Termine und kurze Standzeiten",
    "Persönliche Beratung statt pauschaler Lösungen"
  ];

  const damageTypes = [
    "Kratzer im Lack oder an Stoßfängern",
    "Kleine Dellen (z. B. Parkschäden)",
    "Bordsteinschäden an Alufelgen",
    "Abnutzung im Innenraum über die Toleranz hinaus"
  ];

  return (
    <>
      <SEO 
        title="Leasingrückgabe: Kosten sparen mit Spot-Repair - Corion Lackdoktor"
        description="Vermeiden Sie teure Leasingrückgabe-Strafen. Mit unserer Spot-Repair Technik sparen Sie bis zu 70% gegenüber Komplettverlackierung."
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
                  Leasing
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  25. November 2024
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  6 min Lesezeit
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
                Leasingrückgabe: Wir helfen Ihnen, Kosten zu sparen
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Vermeiden Sie teure Rückgabestrafen mit unserem Leasingrückgabe-Optimierungsservice
              </p>
            </motion.div>
          </div>
        </section>

        {/* Savings Highlight Banner */}
        <section className="py-8 bg-primary/10 border-b border-primary/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-5xl md:text-6xl font-heading font-bold text-primary">
                bis zu 70%
              </div>
              <div className="text-lg md:text-xl text-foreground">
                <span className="font-semibold">sparen</span> mit unserer Spot-Repair Technik<br />
                gegenüber Komplettverlackierung
              </div>
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="prose prose-lg dark:prose-invert max-w-none"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Introduction */}
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Die Rückgabe eines Leasingfahrzeugs kann schnell teuer werden. Kratzer, Dellen, 
                Felgenschäden oder Gebrauchsspuren, die im Alltag kaum auffallen, werden bei der 
                Leasingrückgabe oft streng bewertet. Viele Leasingnehmer sind überrascht, wenn am 
                Ende hohe Nachzahlungen fällig werden.
              </p>

              <p className="text-xl font-semibold text-foreground mb-8">
                Genau hier kommen wir ins Spiel.
              </p>

              {/* Before Image - Scratched Bumper */}
              <div className="my-10">
                <img 
                  src={bumperScratchBefore} 
                  alt="Stoßfänger mit Kratzern vor der Reparatur"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Typische Stoßfänger-Kratzer, die bei der Leasingrückgabe teuer werden können
                </p>
              </div>

              {/* Why is it expensive */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Warum wird die Leasingrückgabe so teuer?
              </h2>

              <p className="text-muted-foreground mb-6">
                Leasinggesellschaften unterscheiden klar zwischen normalen Gebrauchsspuren und 
                wertmindernden Schäden. Was für den Fahrer noch „normal" aussieht, wird bei der 
                Rückgabe häufig als Schaden eingestuft, zum Beispiel:
              </p>

              <Card className="p-6 mb-8 bg-card border-card-border">
                <ul className="space-y-3">
                  {damageTypes.map((damage, index) => (
                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      {damage}
                    </li>
                  ))}
                </ul>
              </Card>

              <p className="text-muted-foreground mb-8">
                Diese Schäden werden meist nicht repariert, sondern direkt mit hohen Pauschalbeträgen 
                berechnet – oft <span className="text-foreground font-semibold">deutlich teurer als 
                eine fachgerechte Reparatur im Vorfeld</span>.
              </p>

              {/* Spot Repair Section */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Spot-Repair: Die intelligente Lösung
              </h2>

              <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                      Nur der Schaden wird repariert – nicht das ganze Teil
                    </h3>
                    <p className="text-muted-foreground">
                      Bei herkömmlichen Lackierereien wird oft der gesamte Stoßfänger oder das 
                      komplette Bauteil lackiert. Das ist teuer und zeitaufwändig. Mit unserer 
                      <span className="text-primary font-semibold"> Spot-Repair Technik</span> lackieren 
                      wir nur den beschädigten Bereich – präzise, schnell und kostensparend.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-heading font-bold text-primary">70%</div>
                    <div className="text-sm text-muted-foreground">Ersparnis möglich</div>
                  </div>
                </div>
              </Card>

              {/* Real Spot Repair Image */}
              <div className="my-10">
                <img 
                  src={spotRepairReal} 
                  alt="Spot-Repair Technik - nur der Kratzer wird lackiert"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Unsere Spot-Repair Technik: Das Fahrzeug wird abgedeckt, nur der beschädigte 
                  Bereich wird professionell lackiert
                </p>
              </div>

              {/* Process Image */}
              <div className="my-10">
                <img 
                  src={spotRepairProcess} 
                  alt="Spot-Repair Prozess in unserer Werkstatt"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Präzise Maskierung und punktgenaue Lackinstandsetzung
                </p>
              </div>

              {/* Our Process */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Leasingrückgabe-Optimierung: clever sparen statt teuer zahlen
              </h2>

              <p className="text-muted-foreground mb-6">
                Mit unserem Leasingrückgabe-Optimierungsservice helfen wir Ihnen, unnötige 
                Kosten zu vermeiden. Unser Ablauf ist einfach und transparent:
              </p>

              <div className="space-y-6 mb-10">
                {[
                  {
                    step: "1",
                    title: "Professionelle Fahrzeugprüfung",
                    desc: "Wir prüfen Ihr Fahrzeug vor der Leasingrückgabe und identifizieren alle relevanten Schäden."
                  },
                  {
                    step: "2",
                    title: "Ehrliche Einschätzung",
                    desc: "Wir sagen Ihnen genau, welche Schäden wirklich relevant sind, welche repariert werden sollten und wo sich eine Reparatur nicht lohnt."
                  },
                  {
                    step: "3",
                    title: "Gezielte Smart-Repair & Lackarbeiten",
                    desc: "Statt teurer Komplettlackierungen setzen wir auf effiziente Spot-Repair-Methoden und punktgenaue Lackinstandsetzung."
                  },
                  {
                    step: "4",
                    title: "Kostenkontrolle & Transparenz",
                    desc: "Sie wissen vorher, was es kostet – und was Sie sich dadurch bei der Leasingrückgabe sparen."
                  }
                ].map((item, index) => (
                  <Card key={index} className="p-5 bg-card border-card-border hover-elevate">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Before/After Image */}
              <div className="my-10">
                <img 
                  src={bumperBeforeAfter} 
                  alt="Vorher-Nachher Vergleich Stoßfänger Reparatur"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Vorher-Nachher: Perfektes Ergebnis durch professionelle Spot-Repair Technik
                </p>
              </div>

              {/* Benefits */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Ihre Vorteile auf einen Blick
              </h2>

              <Card className="p-6 mb-8 bg-card border-card-border">
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Card>

              <p className="text-lg text-foreground font-semibold mb-8">
                In vielen Fällen liegen die Reparaturkosten weit unter den Forderungen der Leasinggesellschaft.
              </p>

              {/* Target Audience */}
              <h2 className="text-2xl font-heading font-bold text-foreground mt-12 mb-6">
                Für wen ist der Service ideal?
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {["Privatleasing-Kunden", "Gewerbliche Leasingfahrzeuge", "Firmenflotten", "Alle Leasinggesellschaften"].map((item, index) => (
                  <Card key={index} className="p-4 text-center bg-card border-card-border">
                    <p className="text-sm font-medium text-foreground">{item}</p>
                  </Card>
                ))}
              </div>

              <p className="text-muted-foreground mb-8">
                Egal ob kurz vor Vertragsende oder einige Wochen vorher – <span className="text-foreground font-semibold">je früher, desto besser</span>.
              </p>

              {/* Tip Box */}
              <Card className="p-6 mb-10 bg-primary/10 border-primary/20">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  👉 Unser Tipp
                </h3>
                <p className="text-foreground">
                  Lassen Sie Ihr Fahrzeug prüfen, bevor die Leasinggesellschaft es tut. 
                  So behalten Sie die Kontrolle über die Kosten – nicht der Leasinggeber.
                </p>
              </Card>

              {/* CTA Section */}
              <div className="bg-card border border-card-border rounded-lg p-8 text-center">
                <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                  Jetzt Termin vereinbaren
                </h2>
                <p className="text-muted-foreground mb-6">
                  Kontaktieren Sie uns rechtzeitig vor Ihrer Leasingrückgabe. 
                  Wir beraten Sie ehrlich, professionell und mit dem klaren Ziel: Kosten sparen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="gap-2" data-testid="button-call-leasing">
                    <Phone className="w-4 h-4" />
                    Jetzt anrufen
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-whatsapp-leasing">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
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
