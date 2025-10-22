import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Clock, Shield } from "lucide-react";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Gutachter() {
  const benefits = [
    "Unabhängige Schadengutachten",
    "Schnelle Terminvergabe innerhalb 24h",
    "Professionelle Dokumentation",
    "Direkt vor Ort oder in unserer Werkstatt",
    "Expertise seit über 20 Jahren",
    "Anerkannt bei allen Versicherungen",
  ];

  const process = [
    "Kontaktaufnahme und Terminvereinbarung",
    "Begutachtung des Schadens vor Ort",
    "Fotodokumentation und Schadensanalyse",
    "Erstellung des Gutachtens",
    "Übergabe des fertigen Gutachtens",
    "Unterstützung bei Versicherungsabwicklung",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={paintImage} 
            alt="Gutachter Service" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-white mb-4">
            Schadengutachten
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Unabhängige Expertise für Ihre Versicherungsabwicklung - 
            schnell, professionell und zuverlässig
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Left Column */}
          <div>
            <h2 className="text-3xl font-bold font-heading mb-6">Warum ein Gutachten?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Nach einem Unfall benötigen Sie ein professionelles Gutachten für die 
              Versicherungsabwicklung. Wir erstellen unabhängige Schadengutachten, 
              die bei allen Versicherungen anerkannt sind.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Mit über 20 Jahren Erfahrung garantieren wir eine präzise Schadensbewertung 
              und unterstützen Sie bei der gesamten Abwicklung.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-card rounded-md border">
                <Clock className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold font-heading mb-1">24h</div>
                <div className="text-sm text-muted-foreground">Termin</div>
              </div>
              <div className="text-center p-6 bg-card rounded-md border">
                <FileText className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold font-heading mb-1">48h</div>
                <div className="text-sm text-muted-foreground">Gutachten</div>
              </div>
            </div>
          </div>

          {/* Right Column - CTA */}
          <div>
            <div className="bg-card p-8 rounded-md border sticky top-24">
              <h3 className="text-2xl font-bold font-heading mb-6">Jetzt Gutachten anfordern</h3>
              <p className="text-muted-foreground mb-6">
                Kontaktieren Sie uns für eine schnelle Terminvereinbarung. 
                Wir sind innerhalb von 24 Stunden bei Ihnen.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unabhängiges Gutachten</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Von allen Versicherungen anerkannt</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Schnelle Abwicklung</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/kontakt">
                  <Button className="w-full" size="lg" data-testid="button-request-gutachten">
                    Gutachten anfragen
                  </Button>
                </Link>
                <a href="tel:017683458274">
                  <Button variant="outline" className="w-full" size="lg" data-testid="button-call-gutachten">
                    Jetzt Anrufen
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-heading mb-8">Ihre Vorteile</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-md border">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="bg-card p-8 md:p-12 rounded-md border">
          <h2 className="text-3xl font-bold font-heading mb-8">Unser Ablauf</h2>
          <div className="space-y-6">
            {process.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-lg">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
