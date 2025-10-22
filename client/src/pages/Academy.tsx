import { GraduationCap, Award, BookOpen, Users, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEO from "@/components/SEO";

export default function Academy() {
  const courses = [
    {
      icon: GraduationCap,
      title: "Smart Repair Grundlagen",
      duration: "2 Tage",
      description: "Lernen Sie die Grundlagen der professionellen Smart Repair Technik für kleinere Lackschäden.",
      topics: ["Spot Repair Technik", "Materialauswahl", "Farbabstimmung", "Qualitätskontrolle"],
    },
    {
      icon: Award,
      title: "Lackiertechnik Fortgeschritten",
      duration: "3 Tage",
      description: "Vertiefen Sie Ihre Kenntnisse in modernen Lackiertechniken und professioneller Ausführung.",
      topics: ["Mehrschichtlackierung", "Effektlacke", "Polieren & Finish", "Fehleranalyse"],
    },
    {
      icon: BookOpen,
      title: "Gutachter Ausbildung",
      duration: "5 Tage",
      description: "Qualifizieren Sie sich zum professionellen KFZ-Gutachter mit anerkanntem Zertifikat.",
      topics: ["Schadenbewertung", "Dokumentation", "Rechtliche Grundlagen", "Kommunikation"],
    },
  ];

  const benefits = [
    "Praxisnahe Ausbildung von erfahrenen Profis",
    "Modernste Werkstatt und Technologie",
    "Kleine Gruppen für intensives Lernen",
    "Anerkannte Zertifikate nach Abschluss",
    "Flexible Terminplanung möglich",
    "Inkl. Arbeitsmaterialien und Dokumentation",
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Academy | Corion Lackdoktor - Professionelle KFZ Ausbildung"
        description="Professionelle Weiterbildung für Lackierer, Smart Repair Techniker und KFZ-Gutachter. Praxisnahe Kurse von erfahrenen Profis in Hofheim."
        canonical="https://www.corion-lackdoktor.de/academy"
      />
      
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-heading">Corion Academy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Professionelle Weiterbildung und Zertifizierung für KFZ-Fachkräfte
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold font-heading mb-6">Werden Sie zum Experten</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Die Corion Academy bietet professionelle Weiterbildungskurse für Lackierer, 
              KFZ-Mechaniker und alle, die sich im Bereich Smart Repair und Fahrzeugreparatur 
              spezialisieren möchten.
            </p>
            <p>
              Mit über 20 Jahren Erfahrung geben wir unser Wissen an die nächste Generation 
              weiter. Unsere Kurse kombinieren theoretisches Fachwissen mit praktischer 
              Anwendung in einer modernen Werkstatt.
            </p>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading mb-12 text-center">Unsere Kurse</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {courses.map((course, index) => {
              const Icon = course.icon;
              return (
                <div key={index} className="bg-background p-6 rounded-md border">
                  <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="space-y-2">
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl font-bold font-heading mb-12 text-center">Ihre Vorteile</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-lg">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            Starten Sie Ihre Weiterbildung
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Kontaktieren Sie uns für weitere Informationen zu unseren Kursen, 
            Terminen und individuellen Schulungsmöglichkeiten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt">
              <Button size="lg" variant="secondary" data-testid="button-contact-academy">
                Jetzt informieren
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
