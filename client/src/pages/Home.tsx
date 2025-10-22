import { Link } from "wouter";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import TestimonialCard from "@/components/TestimonialCard";
import StatsDisplay from "@/components/StatsDisplay";
import { Button } from "@/components/ui/button";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";

import dentImage from "@assets/generated_images/Dent_removal_service_image_b9ce6b23.png";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";
import wheelImage from "@assets/generated_images/Wheel_repair_service_image_878b7e9d.png";
import detailImage from "@assets/generated_images/Auto_detailing_service_image_222c746b.png";
import oldtimerImage from "@assets/generated_images/Classic_car_restoration_image_360d4f59.png";

export default function Home() {
  const featuredServices = [
    {
      title: "Unfallschäden",
      description: "Professionelle Reparatur von Unfallschäden mit modernster Technik und Original-Ersatzteilen.",
      image: paintImage,
      href: "/leistungen/unfallschaeden",
    },
    {
      title: "Smart Repair",
      description: "Schnelle und kostengünstige Reparatur kleiner Lackschäden ohne komplette Neulackierung.",
      image: dentImage,
      href: "/leistungen/smart-repair",
    },
    {
      title: "Felgenreparaturen",
      description: "Reparatur von Kratzern, Schrammen und Beschädigungen an Ihren Felgen.",
      image: wheelImage,
      href: "/leistungen/felgenreparaturen",
    },
    {
      title: "Autoaufbereitung",
      description: "Professionelle Innen- und Außenreinigung für ein perfektes Erscheinungsbild.",
      image: detailImage,
      href: "/leistungen/autoaufbereitung",
    },
    {
      title: "Oldtimer",
      description: "Liebevolle Restaurierung und Pflege klassischer Fahrzeuge mit Expertise.",
      image: oldtimerImage,
      href: "/leistungen/oldtimer",
    },
    {
      title: "Lackschäden",
      description: "Beseitigung von Kratzern, Steinschlägen und anderen Lackschäden.",
      image: paintImage,
      href: "/leistungen/lackschaeden",
    },
  ];

  const testimonials = [
    {
      name: "Thomas Müller",
      rating: 5,
      text: "Hervorragender Service! Mein Auto sieht aus wie neu. Die Reparatur war schnell und der Preis fair. Absolut empfehlenswert!",
      date: "Vor 2 Wochen",
      source: "Google",
    },
    {
      name: "Anna Schmidt",
      rating: 5,
      text: "Sehr professionell und freundlich. Die Lackierung ist perfekt geworden. Danke für die tolle Arbeit!",
      date: "Vor 1 Monat",
      source: "Google",
    },
    {
      name: "Michael Weber",
      rating: 5,
      text: "Kompetente Beratung und schnelle Abwicklung. Preis-Leistung stimmt absolut. Gerne wieder!",
      date: "Vor 3 Wochen",
      source: "Google",
    },
  ];

  const stats = [
    { value: "20+", label: "Jahre Erfahrung", description: "Seit 2003" },
    { value: "4.6/5", label: "Kundenbewertung", description: "642 Bewertungen" },
    { value: "5.000+", label: "Reparaturen", description: "Pro Jahr" },
    { value: "100%", label: "Garantie", description: "Auf alle Arbeiten" },
  ];

  const whyChooseUs = [
    "Über 20 Jahre Erfahrung",
    "Schnelle Terminvergabe",
    "Faire und transparente Preise",
    "Kostenloser Leihwagen",
    "Kostenloser Abhol- und Bringservice",
    "Garantie auf alle Arbeiten",
  ];

  return (
    <div>
      <Hero />

      {/* Featured Services */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Unsere Leistungen</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professionelle Autoreparatur und -pflege für alle Marken und Modelle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredServices.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/leistungen/unfallschaeden">
              <Button size="lg" variant="outline" data-testid="button-all-services">
                Alle Leistungen ansehen
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                Warum +1 Corion Lackdoktor?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Wir sind Ihr zuverlässiger Partner für alle Autoreparaturen in Wiesbaden 
                und Umgebung. Vertrauen Sie auf unsere langjährige Erfahrung und höchste Qualität.
              </p>
              <ul className="space-y-4">
                {whyChooseUs.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/uber-uns">
                  <Button size="lg" data-testid="button-learn-more">
                    Mehr über uns erfahren
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <StatsDisplay stats={stats} />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Das sagen unsere Kunden</h2>
            <p className="text-lg text-muted-foreground">
              Über 642 zufriedene Kunden haben uns bewertet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/bewertungen">
              <Button size="lg" variant="outline" data-testid="button-all-reviews">
                Alle Bewertungen ansehen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            Bereit für eine professionelle Autoreparatur?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Kontaktieren Sie uns jetzt für einen kostenlosen Kostenvoranschlag
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" data-testid="button-cta-quote">
                Kostenvoranschlag erhalten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:017683458274" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20" data-testid="button-cta-call">
                <Phone className="mr-2 w-5 h-5" />
                0176 834 582 74
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
