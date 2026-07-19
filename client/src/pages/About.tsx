import { CheckCircle, Award, Users, Clock } from "lucide-react";
import StatsDisplay from "@/components/StatsDisplay";
import SEO from "@/components/SEO";

export default function About() {
  // todo: remove mock data
  const stats = [
    { value: "20+", label: "Jahre Erfahrung", description: "Seit 2003" },
    { value: "5.000+", label: "Reparaturen", description: "Pro Jahr" },
    { value: "642", label: "Bewertungen", description: "4.6/5 Sterne" },
    { value: "3", label: "Standorte", description: "In der Region" },
  ];

  // todo: remove mock data
  const values = [
    {
      icon: Award,
      title: "Höchste Qualität",
      description: "Wir verwenden nur hochwertige Materialien und modernste Technologie für perfekte Ergebnisse.",
    },
    {
      icon: Clock,
      title: "Schneller Service",
      description: "Kurze Wartezeiten und schnelle Terminvergabe - Ihre Zeit ist uns wichtig.",
    },
    {
      icon: Users,
      title: "Erfahrenes Team",
      description: "Unsere Fachkräfte verfügen über jahrelange Erfahrung und regelmäßige Weiterbildungen.",
    },
  ];

  // todo: remove mock data
  const guarantees = [
    "20+ Jahre Erfahrung in der Autoreparatur",
    "Lackdoktor-Team in Ausbildung zum Meister",
    "Faire und transparente Preisgestaltung",
    "Kostenloser Leihwagen während der Reparatur",
    "Kostenloser Abhol- und Bringservice",
    "Garantie auf alle durchgeführten Arbeiten",
    "Arbeit mit allen Versicherungen",
    "Modernste Lackier- und Reparaturtechnik",
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Über Uns | Corion Lackdoktor - 20+ Jahre Erfahrung"
        description="Seit über 20 Jahren Ihr Partner für professionelle Autoreparatur in Wiesbaden. Erfahrenes Lackdoktor-Team mit modernster Technik und fairen Preisen."
        canonical="https://www.corion-lackdoktor.de/uber-uns"
      />
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Über Uns</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Ihr vertrauensvoller Partner für professionelle Autoreparatur seit über 20 Jahren
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Unsere Geschichte</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Seit über 20 Jahren steht +1 Corion Lackdoktor für professionelle Autoreparatur 
              und erstklassigen Service in Wiesbaden und Umgebung. Was als kleine Werkstatt 
              begann, hat sich zu einem der führenden Fachbetriebe für Karosserie- und 
              Lackierarbeiten in der Region entwickelt.
            </p>
            <p>
              Wir sind ein engagiertes Lackdoktor-Team in Ausbildung zum Meister. 
              Unsere Kunden geben uns täglich das beste Zeugnis – durch ihr Vertrauen und ihre Zufriedenheit.
            </p>
            <p>
              Mit modernster Technologie und präziser, leidenschaftlicher Arbeit sorgen wir dafür, 
              dass Ihr Fahrzeug in bestem Zustand zu Ihnen zurückkommt. Vertrauen Sie 
              auf unsere Expertise und Erfahrung.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsDisplay stats={stats} />
        </div>
      </div>

      {/* Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl font-bold mb-12 text-center">Unsere Werte</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guarantees */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Warum +1 Corion Lackdoktor?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {guarantees.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
