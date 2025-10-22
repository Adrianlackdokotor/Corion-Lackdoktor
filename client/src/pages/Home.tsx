import { Link } from "wouter";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import AngebotEinholen from "@/components/AngebotEinholen";
import GoogleReviews from "@/components/GoogleReviews";
import WarumCorion from "@/components/WarumCorion";
import SoFunktionierts from "@/components/SoFunktionierts";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";

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

      {/* Warum Corion Section */}
      <WarumCorion />

      {/* So funktioniert's Section */}
      <SoFunktionierts />

      {/* Angebot Einholen Section */}
      <AngebotEinholen />

      {/* Google Reviews */}
      <GoogleReviews maxReviews={9} averageRating={4.6} totalReviews={642} />

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
