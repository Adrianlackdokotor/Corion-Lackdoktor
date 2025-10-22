import { Wrench, Zap, MessageCircle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WarumCorion() {
  const benefits = [
    {
      icon: Wrench,
      title: "In Ausbildung zum Meister",
      description: "Qualität mit Erfahrung",
    },
    {
      icon: Zap,
      title: "Schnelle Abwicklung",
      description: "Soforttermine verfügbar",
    },
    {
      icon: MessageCircle,
      title: "Kostenlose Beratung",
      description: "Per WhatsApp",
    },
    {
      icon: Shield,
      title: "Versicherung?",
      description: "Wir regeln das für Sie!",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-card" data-testid="section-warum-corion">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4" data-testid="heading-warum-corion">
            Warum +1 Corion Lackdoktor?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Wir sind Ihr zuverlässiger Partner für alle Autoreparaturen in Wiesbaden und Umgebung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index} 
                className="text-center hover-elevate transform transition-all duration-300"
                data-testid={`card-benefit-${index}`}
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" data-testid={`icon-benefit-${index}`} />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2" data-testid={`text-benefit-title-${index}`}>
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`text-benefit-desc-${index}`}>
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
