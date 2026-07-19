import { Camera, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function SoFunktionierts() {
  const steps = [
    {
      number: "1",
      icon: Camera,
      title: "Foto vom Schaden senden",
      description: "Einfach per WhatsApp oder Kontaktformular",
    },
    {
      number: "2",
      icon: FileText,
      title: "Kostenloses Angebot erhalten",
      description: "Schnelle Rückmeldung innerhalb von 24h",
    },
    {
      number: "3",
      icon: CheckCircle,
      title: "Repariert & zufrieden abholen",
      description: "Termin vereinbaren und abholen",
    },
  ];

  return (
    <section className="py-16 md:py-24" data-testid="section-so-funktionierts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4" data-testid="heading-so-funktionierts">
            So funktioniert's
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In nur 3 einfachen Schritten zu Ihrer professionellen Autoreparatur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="text-center"
                data-testid={`card-step-${index}`}
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <Icon className="w-10 h-10 text-white" data-testid={`icon-step-${index}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-heading font-bold text-lg">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-heading font-bold mb-3" data-testid={`text-step-title-${index}`}>
                  {step.title}
                </h3>
                <p className="text-muted-foreground" data-testid={`text-step-desc-${index}`}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/kontakt">
            <Button size="lg" className="shadow-cta" data-testid="button-angebot-anfordern">
              Jetzt kostenloses Angebot anfordern
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
