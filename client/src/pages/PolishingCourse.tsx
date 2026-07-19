import { ChevronLeft, CheckCircle, Play, BookOpen, Award, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import polishMachineImg from "@assets/generated_images/professional_polishing_machine_in_action.png";
import beforeAfterImg from "@assets/generated_images/before_and_after_polishing_results.png";
import toolsImg from "@assets/generated_images/professional_polishing_tools_collection.png";
import techniqueImg from "@assets/generated_images/professional_polishing_technique.png";
import resultImg from "@assets/generated_images/gleaming_polished_car_result.png";
import workshopImg from "@assets/generated_images/professional_detailing_workshop_setup.png";

export default function PolishingCourse() {
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Kratzerpolitur am Auto - Professionelle Fahrzeugaufbereitung",
    "description": "Online-Kurs zur professionellen Entfernung von Kratzern am Autolack. Lerne Schritt für Schritt die besten Poliertechniken von Lackdoktor Adrian Apostol.",
    "provider": {
      "@type": "Organization",
      "name": "Corion Academy",
      "url": "https://www.corion-lackdoktor.de/academy",
      "sameAs": "https://www.corion-lackdoktor.de"
    },
    "instructor": {
      "@type": "Person",
      "name": "Lackdoktor Ionut Adrian Apostol",
      "description": "28+ Jahre Erfahrung in Fahrzeuglackierung"
    },
    "coursePrerequisites": "Keine Vorkenntnisse erforderlich",
    "educationalLevel": "Einsteiger bis Fortgeschrittene",
    "inLanguage": "de",
    "numberOfModules": 6,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "duration": "PT4H30M"
    },
    "offers": {
      "@type": "Offer",
      "price": "39",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  const courseTopics = [
    "Ursachen von Autolackkratzern verstehen",
    "Arbeitsplatz vorbereiten und Sicherheit",
    "Fahrzeug gründlich reinigen und analysieren",
    "Werkzeuge und Materialien korrekt auswählen",
    "Schleifen mit P1500 und P3000 Schleifpapier",
    "Professionelle Poliertechniken mit 3M Produkten",
    "Versiegelung und Nachbehandlung",
    "Fehlervermeidung und Tipps zur Lackpflege"
  ];

  const courseModules = [
    {
      title: "1. Einleitung & Grundlagen",
      topics: [
        "Was sind Autolackkratzer?",
        "Ursachen: Steinschlag, Waschanlagen, unsachgemäße Reinigung",
        "Auswirkungen auf Optik und Werterhalt des Fahrzeugs"
      ]
    },
    {
      title: "2. Theorie & Vorbereitung",
      topics: [
        "Arbeitsplatz vorbereiten (Beleuchtung, Belüftung, Sicherheit)",
        "Fahrzeugreinigung und Lackzustandsanalyse",
        "Werkzeuge und Materialien im Detail",
        "Sicherheitsmaßnahmen beim Arbeiten mit Lackmaterialien"
      ]
    },
    {
      title: "3. Praktische Anwendung - Schritt für Schritt",
      topics: [
        "Vorbereitung: Gründliche Reinigung und Abkleben",
        "Schleifen mit P1500 (Kovax) - tiefere Kratzer egalisieren",
        "Feinschliff mit P3000 (3M) - feine Schleifspuren entfernen",
        "Polieren mit 3M Fast Cut Plus - Grobschliffpolitur",
        "Finish mit 3M Ultrafina SE - Antihologrammpaste",
        "Versiegelung: Wachs, Keramik oder Polymerversiegelung"
      ]
    },
    {
      title: "4. Profitipps & Fehlervermeidung",
      topics: [
        "Häufige Fehler und wie man sie vermeidet",
        "Poliertechniken: Kreis- vs. Kreuzbewegung",
        "Druckanpassung und Überhitzung vermeiden",
        "Tipps zur langfristigen Lackpflege"
      ]
    },
    {
      title: "5. Werkzeugkunde & Produktempfehlungen",
      topics: [
        "Rotative vs. exzentrische Poliermaschinen",
        "Verbrauchsmaterialien: Schwämme, Pads, Schleifmittel",
        "Empfehlung von 3M, Kovax, Sonax und Menzerna Produkten",
        "Wo man hochwertige Materialien kauft"
      ]
    },
    {
      title: "6. Zusammenfassung & Abschluss",
      topics: [
        "Zusammenfassung der wichtigsten Punkte",
        "Teilnahmebestätigung und Zertifikat",
        "Zugang zur Private Community für Fragen",
        "Empfehlungen für Aufbaukurse"
      ]
    }
  ];

  const benefits = [
    {
      icon: Award,
      title: "28+ Jahre Expertise",
      description: "Von Lackdoktor Adrian Apostol - bewährte Methoden und praxisnahe Techniken"
    },
    {
      icon: Users,
      title: "Live Q&A Sessions",
      description: "Stellen Sie Fragen und erhalten Sie Unterstützung von Experten"
    },
    {
      icon: CheckCircle,
      title: "Private Community",
      description: "Austausch mit anderen Autopflegern und Profis"
    },
    {
      icon: Clock,
      title: "Flexibel Online",
      description: "Lernen Sie in Ihrem eigenen Tempo, jederzeit und überall"
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Kratzerpolitur am Auto | Online-Kurs | Corion Academy"
        description="Lerne professionelle Kratzerpolitur und Fahrzeugaufbereitung online. Von Lackdoktor Adrian Apostol mit 28+ Jahren Erfahrung. Nur 39€. Jetzt anmelden!"
        canonical="https://www.corion-lackdoktor.de/academy/kratzerpolitur-kurs"
        keywords="kratzerpolitur kurs, auto polieren lernen, fahrzeugaufbereitung anleitung, online kurs lackierung, smart repair, corion academy"
        schemaMarkup={courseSchema}
      />

      {/* Back Button */}
      <div className="bg-background border-b sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/academy">
            <Button variant="ghost" className="gap-2" data-testid="button-back-course">
              <ChevronLeft className="w-4 h-4" />
              Zurück zur Academy
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block mb-4 px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary">
                Online Kurs • 39€
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Kratzerpolitur am Auto
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Professionelle Fahrzeugaufbereitung mit System - Lerne die Entfernung von Kratzern, Hohlogrammen und matten Stellen vom Experten.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>~4,5 Stunden Online</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Zugang zur Community</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Teilnahmebestätigung</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/academy/kratzerpolitur-waitlist">
                  <Button size="lg" data-testid="button-join-waitlist">
                    Warteliste beitreten - 39€
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Kostenlos testen: Schauen Sie sich die Vorschau an und melden Sie sich zur Warteliste an. Die nächste Kursstaffel startet bald!
              </p>
            </div>

            <img 
              src={polishMachineImg} 
              alt="Professionelle Poliermaschine beim Polieren eines Autos" 
              className="rounded-lg shadow-lg w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Course Overview */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold mb-12">Was Sie lernen werden</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {courseTopics.map((topic, idx) => (
              <div key={idx} className="flex gap-4">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span>{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Images Grid */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold mb-12">Praktische Einblicke</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <img src={beforeAfterImg} alt="Vorher-Nachher Vergleich Polierung" className="rounded-lg shadow-lg w-full h-auto" loading="lazy" />
            <img src={toolsImg} alt="Professionelle Polierwerkzeuge" className="rounded-lg shadow-lg w-full h-auto" loading="lazy" />
            <img src={techniqueImg} alt="Professionelle Poliertechnik" className="rounded-lg shadow-lg w-full h-auto" loading="lazy" />
            <img src={resultImg} alt="Glänzendes poliertes Auto" className="rounded-lg shadow-lg w-full h-auto" loading="lazy" />
            <img src={workshopImg} alt="Professionelle Werkstatt" className="rounded-lg shadow-lg w-full h-auto md:col-span-2" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Course Modules */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold mb-12">Kursmodule</h2>
          
          <div className="space-y-6">
            {courseModules.map((module, idx) => (
              <div key={idx} className="border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-heading font-bold mb-3">{module.title}</h3>
                    <ul className="space-y-2">
                      {module.topics.map((topic, topicIdx) => (
                        <li key={topicIdx} className="flex gap-3 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold mb-12">Warum dieser Kurs?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4">
                <benefit.icon className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-12 md:py-16 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold mb-8">Ihr Kursleiter</h2>
          
          <div className="bg-accent/10 rounded-lg p-8">
            <h3 className="text-2xl font-heading font-bold mb-2">
              Lackdoktor Ionut Adrian Apostol
            </h3>
            <p className="text-primary font-semibold mb-4">28+ Jahre Erfahrung in der Fahrzeuglackierung</p>
            <p className="text-muted-foreground mb-4">
              Adrian ist ein anerkannter Experte in professioneller Fahrzeugaufbereitung und Lackiertechnik. Seine praxisnahen Methoden und bewährten Produkte haben Tausenden zufriedenen Kunden geholfen, ihre Fahrzeuge wieder zum Glänzen zu bringen.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                Praxisnahe Methoden & bewährte Produkte
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                Tausende zufriedene Kunden
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                Spezialist für Smart Repair & Fahrzeugaufbereitung
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold mb-6">
            Bereit zu lernen?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Melden Sie sich zur Warteliste an und seien Sie unter den Ersten, wenn der nächste Kurs startet. Nur 39€ für über 4 Stunden professionelle Anleitung!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/academy/kratzerpolitur-waitlist">
              <Button size="lg" data-testid="button-join-waitlist-bottom">
                Warteliste beitreten - 39€
              </Button>
            </Link>
            <Link href="/academy">
              <Button size="lg" variant="outline" data-testid="button-explore-courses">
                Andere Kurse ansehen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
