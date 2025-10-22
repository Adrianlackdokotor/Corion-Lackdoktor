import { Link } from "wouter";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";

export default function Hero() {
  return (
    <div className="relative h-[600px] md:h-[700px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional Lackdoktor Workshop" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading text-white mb-6">
            Professionelle Autoreparatur in Wiesbaden
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Über 20 Jahre Erfahrung in Unfallschäden, Lackierung und Smart Repair. 
            Schneller Service, faire Preise und höchste Qualität.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link href="/kontakt">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-quote">
                Kostenvoranschlag erhalten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:017683458274" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full bg-background/20 backdrop-blur-sm border-white/30 text-white hover:bg-background/30" data-testid="button-hero-call">
                <Phone className="mr-2 w-5 h-5" />
                Jetzt Anrufen
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-white/90">
            <div>
              <div className="text-2xl md:text-3xl font-bold font-heading text-white">20+</div>
              <div className="text-sm md:text-base">Jahre Erfahrung</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold font-heading text-white">4.6/5</div>
              <div className="text-sm md:text-base">642 Bewertungen</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold font-heading text-white">100%</div>
              <div className="text-sm md:text-base">Garantie</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
