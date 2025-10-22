import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

interface ServicePageProps {
  title: string;
  description: string;
  image: string;
  benefits: string[];
  process?: string[];
  pricing?: string;
}

export default function ServicePage({ 
  title, 
  description, 
  image, 
  benefits, 
  process,
  pricing 
}: ServicePageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Ihre Vorteile</h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Process */}
            {process && process.length > 0 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Unser Vorgehen</h2>
                <div className="space-y-4">
                  {process.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-lg">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-card p-6 rounded-md border sticky top-24">
              <h3 className="text-xl font-bold mb-4">Jetzt Angebot einholen</h3>
              {pricing && (
                <div className="mb-4 p-4 bg-accent rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Ab</p>
                  <p className="text-2xl font-bold font-mono">{pricing}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-6">
                Kostenloser Kostenvoranschlag ohne Verpflichtung
              </p>
              <div className="space-y-3">
                <Link href="/kontakt">
                  <Button className="w-full" size="lg" data-testid="button-request-quote">
                    Kostenvoranschlag anfordern
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="tel:017683458274" className="block">
                  <Button variant="outline" className="w-full" size="lg" data-testid="button-call-now">
                    Jetzt Anrufen
                  </Button>
                </a>
              </div>
            </div>

            {/* Free Services */}
            <div className="bg-card p-6 rounded-md border">
              <h3 className="font-semibold mb-4">Kostenlose Services</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Leihwagen während der Reparatur
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Abhol- und Bringservice
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Kostenloser Kostenvoranschlag
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
