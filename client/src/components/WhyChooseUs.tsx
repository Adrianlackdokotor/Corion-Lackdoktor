import { Check, Heart, Shield, Clock, ThumbsUp, Users, Smile } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WhyChooseUs() {
  const benefits = [
    {
      icon: Heart,
      title: "Mit Leidenschaft & Präzision",
      description: "Jedes Fahrzeug behandeln wir wie unser eigenes - mit höchster Sorgfalt und Liebe zum Detail."
    },
    {
      icon: Shield,
      title: "Faire & transparente Preise",
      description: "Keine versteckten Kosten! Sie erhalten ein klares Angebot und zahlen nur, was vereinbart wurde."
    },
    {
      icon: Clock,
      title: "Schnelle Terminvergabe",
      description: "Wir wissen, dass Ihre Zeit wertvoll ist. Kostenlose Erstberatung innerhalb von 24 Stunden!"
    },
    {
      icon: ThumbsUp,
      title: "Zufriedene Kunden",
      description: "Über 500+ 5-Sterne Google-Bewertungen sprechen für unsere Qualität und Zuverlässigkeit."
    },
    {
      icon: Users,
      title: "Familiengeführtes Unternehmen",
      description: "Seit über 20 Jahren in der Region - Ihre Zufriedenheit ist unser Antrieb!"
    },
    {
      icon: Check,
      title: "AI-gestützte Abwicklung",
      description: "Moderne Technologie trifft traditionelles Handwerk - für optimale Ergebnisse."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Warum über 5.000 Kunden uns vertrauen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bei Corion Lackdoktor steht <span className="text-primary font-semibold">Ihre Zufriedenheit</span> an erster Stelle. 
            Wir verbinden <span className="text-primary font-semibold">traditionelles Handwerk</span> mit <span className="text-primary font-semibold">modernster Technologie</span>.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover-elevate transition-all duration-300 border-primary/10"
                data-testid={`card-whychooseus-${index}`}
              >
                <div className="flex flex-col items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-12 border-t border-primary/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div data-testid="stat-whychooseus-experience">
              <p className="text-4xl font-bold font-heading text-primary mb-2">20+</p>
              <p className="text-sm text-muted-foreground">Jahre Erfahrung</p>
            </div>
            <div data-testid="stat-whychooseus-customers">
              <p className="text-4xl font-bold font-heading text-primary mb-2">5.000+</p>
              <p className="text-sm text-muted-foreground">Zufriedene Kunden</p>
            </div>
            <div data-testid="stat-whychooseus-reviews">
              <p className="text-4xl font-bold font-heading text-primary mb-2">500+</p>
              <p className="text-sm text-muted-foreground">5-Sterne Bewertungen</p>
            </div>
            <div data-testid="stat-whychooseus-locations">
              <p className="text-4xl font-bold font-heading text-primary mb-2">3</p>
              <p className="text-sm text-muted-foreground">Standorte</p>
            </div>
          </div>
        </div>

        {/* Friendly Message */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 p-6 rounded-2xl bg-primary/5 border border-primary/20" data-testid="message-whychooseus-welcome">
            <Smile className="w-8 h-8 text-primary flex-shrink-0" />
            <p className="text-lg md:text-xl font-heading">
              Wir freuen uns darauf, <span className="text-primary font-bold">Ihr Fahrzeug</span> wieder in <span className="text-primary font-bold">neuem Glanz</span> erstrahlen zu lassen!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
