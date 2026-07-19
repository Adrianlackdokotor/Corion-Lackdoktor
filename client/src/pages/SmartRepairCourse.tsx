import { ChevronLeft, CheckCircle, Play, BookOpen, Award, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import courseImage from "@assets/Beilackieren_1761515825845.jpg";

export default function SmartRepairCourse() {
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Einführung in Smart Repair & Lackiertechnik",
    "description": "Kostenloser Kurs über Smart Repair Grundlagen - Lerne die Kunst der Kratzerpolitur und Lackaufbereitung von erfahrenen Experten.",
    "provider": {
      "@type": "Organization",
      "name": "Corion Academy",
      "url": "https://www.corion-lackdoktor.de/academy",
      "sameAs": "https://www.corion-lackdoktor.de"
    },
    "coursePrerequisites": "Keine Vorkenntnisse erforderlich",
    "educationalLevel": "Einsteiger bis Fortgeschrittene",
    "isAccessibleForFree": true,
    "inLanguage": "de",
    "numberOfModules": 6,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "duration": "PT3H"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  const courseTopics = [
    "Ursachen von Kratzern am Autolack",
    "Vorbereitung des Arbeitsplatzes und des Fahrzeugs",
    "Werkzeuge und Materialien für die Kratzerpolitur",
    "Schleiftechnik mit 1500er und 3000er Schleifpapier",
    "Poliertechnik mit professionellen Pasten",
    "Versiegelung und Nachbehandlung",
    "Fehlervermeidung und Tipps zur Lackpflege"
  ];

  const whatYouWillLearn = [
    "Grundlagen der Smart Repair Technik verstehen",
    "Kratzer und Lackfehler professionell entfernen",
    "Richtige Auswahl und Verwendung von Schleifpapier",
    "Professionelle Poliertechniken anwenden",
    "Farbtonanpassung und Oberflächenfinish",
    "Sicherheitsmaßnahmen beim Arbeiten mit Lackmaterialien",
    "Tipps zur Erhaltung des glänzenden Autolacks"
  ];

  const courseModules = [
    {
      title: "1. Einleitung",
      topics: [
        "Vorstellung der Thematik: Kratzer im Autolack",
        "Ziel des Kurses: Vermittlung von Kenntnissen und praktischen Fähigkeiten zur Entfernung von Kratzern am Autolack"
      ]
    },
    {
      title: "2. Theorie",
      topics: [
        "Ursachen von Kratzern am Autolack",
        "Vorbereitung des Arbeitsplatzes und des Fahrzeugs",
        "Werkzeug und Materialien für die Kratzerpolitur",
        "Sicherheitsmaßnahmen"
      ]
    },
    {
      title: "3. Praktischer Teil",
      topics: [
        "Vorbereitung der Oberfläche",
        "Schleiftechnik mit 1500er Schleifpapier von Kovax",
        "Schleiftechnik mit 3000er Schleifpapier von 3M",
        "Poliertechnik mit 3M Schleifpoliturpaste (Fast Cut Plus 51815)",
        "Poliertechnik mit 3M Antihologrammpaste (Ultrafina SE 50383)",
        "Versiegelung"
      ]
    },
    {
      title: "4. Tipps und Tricks",
      topics: [
        "Fehlervermeidung beim Schleifen und Polieren",
        "Tipps zur Verwendung von Schleifpapier und Polierpaste",
        "Tipps zur Erhaltung des glänzenden Autolacks"
      ]
    },
    {
      title: "5. Persönliche Beratung und Unterstützung",
      topics: [
        "Möglichkeit, Fragen zu stellen und individuelle Unterstützung zu erhalten",
        "Austausch von Erfahrungen und Tipps"
      ]
    },
    {
      title: "6. Zusammenfassung und Abschluss",
      topics: [
        "Zusammenfassung der wichtigsten Punkte des Kurses",
        "Abschluss des Kurses",
        "Möglichkeit zur weiteren Vernetzung und Zusammenarbeit"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Einführung in Smart Repair & Lackiertechnik | Corion Academy"
        description="Kostenloser Kurs über Smart Repair Grundlagen - Lerne die Kunst der Kratzerpolitur und Lackaufbereitung von erfahrenen Experten. Ideal für Einsteiger und Profis."
        canonical="https://www.corion-lackdoktor.de/academy/smart-repair-einfuehrung"
        keywords="smart repair kurs, lackiertechnik lernen, kratzerpolitur anleitung, autolack reparieren, kostenloser kurs lackierung, corion academy"
        schemaMarkup={courseSchema}
      />

      {/* Back Button */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/academy">
            <Button variant="ghost" className="gap-2" data-testid="button-back-academy">
              <ChevronLeft className="w-4 h-4" />
              Zurück zur Academy
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Hero */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Kostenloser Kurs
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              Einführung in Smart Repair & Lackiertechnik
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Lerne die Grundlagen der professionellen Kratzerpolitur und Lackaufbereitung. 
              Von der Theorie bis zur praktischen Anwendung.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>ca. 2-3 Stunden</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span>Für Einsteiger & Profis</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-5 h-5" />
                <span>6 Module</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-primary">
              Erstellt von Ionut Adrian Apostol, Lackdoktor-Experte
            </p>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Intro */}
            <section>
              <h2 className="text-3xl font-bold font-heading mb-4">Willkommen zum Kurs!</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">
                  Herzlich willkommen zum Kurs "Kratzerpolitur am Auto"! In diesem Kurs werden wir Ihnen beibringen, 
                  wie Sie Kratzer am Autolack entfernen und eine glänzende Oberfläche erzielen können.
                </p>
                <p className="text-muted-foreground">
                  Dieser Kurs besteht aus verschiedenen Abschnitten, in denen wir Ihnen die Grundlagen der Kratzerpolitur 
                  am Auto vermitteln werden. Wir werden Ihnen die Ursachen von Kratzern am Autolack erklären, Ihnen zeigen, 
                  welche Werkzeuge und Materialien Sie benötigen, um Kratzer am Autolack zu entfernen, und Ihnen Schritt 
                  für Schritt zeigen, wie Sie Kratzer am Autolack entfernen und eine glänzende Oberfläche erzielen können.
                </p>
                <p className="text-muted-foreground">
                  Wir empfehlen Ihnen, den Kurs aufmerksam durchzuarbeiten und die praktischen Übungen durchzuführen, 
                  um Ihre Fähigkeiten zu verbessern. Am Ende des Kurses sollten Sie in der Lage sein, Kratzer am Autolack 
                  zu entfernen und eine glänzende Oberfläche zu erzielen.
                </p>
              </div>
            </section>

            {/* Featured Image - Professional Corion Workshop */}
            <section className="rounded-lg overflow-hidden">
              <img 
                src={courseImage}
                alt="Professionelle Lackierung bei Corion Lackdoktor - Smart Repair Techniken"
                className="w-full h-[400px] object-cover rounded-lg"
                loading="lazy"
              />
            </section>

            {/* Video Section - Instructional Content */}
            <section className="bg-card border rounded-lg p-6">
              <h3 className="text-2xl font-bold font-heading mb-4">Kurs-Einführungsvideo</h3>
              <p className="text-muted-foreground mb-4">
                Schauen Sie sich dieses Video an, um einen Überblick über die professionellen Techniken der Lackaufbereitung und Kratzerpolitur zu erhalten.
              </p>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/Zxnyu4PqHYo"
                  title="Smart Repair & Lackiertechnik - Professionelle Techniken"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0"
                  loading="lazy"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Dieses Video zeigt grundlegende Techniken zur Lackaufbereitung und Kratzerpolitur, die in diesem Kurs vertieft werden.
              </p>
            </section>

            {/* What You Will Learn */}
            <section className="bg-card border rounded-lg p-6">
              <h3 className="text-2xl font-bold font-heading mb-6">Was du lernen wirst</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Course Modules */}
            <section>
              <h3 className="text-2xl font-bold font-heading mb-6">Kursmodule</h3>
              <div className="space-y-4">
                {courseModules.map((module, index) => (
                  <div key={index} className="bg-card border rounded-lg p-6">
                    <h4 className="text-xl font-bold mb-4">{module.title}</h4>
                    <ul className="space-y-2">
                      {module.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          <span className="text-muted-foreground">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Applications */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="text-2xl font-bold font-heading mb-4">Anwendungsbereiche</h3>
              <p className="text-muted-foreground mb-4">
                Das Polieren von Oberflächen hat viele Anwendungsbereiche:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Beseitigung von Lackfehlern wie Kratzern, Schleifspuren, Staubeinschlüssen</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Wiederherstellung des Glanzes und der Farbtiefe von alten oder verwitterten Lackoberflächen</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Schutz der Lackoberfläche vor Witterungseinflüssen</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Vorbereitung der Lackoberfläche für eine Lackversiegelung oder Wachsbeschichtung</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Erhöhung des Wiederverkaufswerts von Fahrzeugen</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Course Info Card */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Kursdetails</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kursdauer</p>
                    <p className="font-semibold">2-3 Stunden</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Schwierigkeitsgrad</p>
                    <p className="font-semibold">Einsteiger bis Fortgeschritten</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preis</p>
                    <p className="font-semibold text-primary text-xl">Kostenlos</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Zertifikat</p>
                    <p className="font-semibold">Nach Abschluss erhältlich</p>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-primary text-primary-foreground rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Bereit zu starten?</h3>
                <p className="mb-4 opacity-90">
                  Kontaktiere uns für weitere Informationen oder buche direkt einen Termin.
                </p>
                <div className="space-y-3">
                  <Link href="/kontakt">
                    <Button variant="secondary" className="w-full" data-testid="button-contact-course">
                      Jetzt kontaktieren
                    </Button>
                  </Link>
                  <a href="tel:017683458274">
                    <Button 
                      variant="outline" 
                      className="w-full bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                      data-testid="button-call-course"
                    >
                      0176 834 582 74
                    </Button>
                  </a>
                </div>
              </div>

              {/* Topics List */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Kursthemen</h3>
                <ul className="space-y-2">
                  {courseTopics.map((topic, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
