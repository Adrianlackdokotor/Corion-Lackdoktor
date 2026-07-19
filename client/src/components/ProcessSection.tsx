import { Camera, Brain, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const steps = [
  {
    icon: Camera,
    number: "1",
    title: "Foto senden",
    description: "Schaden fotografieren und per Formular oder WhatsApp an uns übermitteln – in 30 Sekunden erledigt."
  },
  {
    icon: Brain,
    number: "2",
    title: "KI-Ersteinschätzung",
    description: "Unsere KI bewertet das Foto, erkennt den Schaden und liefert eine schnelle Vorab-Analyse."
  },
  {
    icon: Calendar,
    number: "3",
    title: "Angebot & Termin",
    description: "Sie erhalten ein persönliches Angebot von Corion Lackdoktor – inklusive freiem Werkstatttermin."
  }
];

export default function ProcessSection() {
  return (
    <section id="ablauf" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            So funktioniert's
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In 3 einfachen Schritten zum reparierten Fahrzeug – kein Aufwand, keine Wartezeit.
          </p>
        </motion.div>

        {/* Process Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-card rounded-md p-8 h-full border border-card-border hover-elevate">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-md bg-primary/10">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  {/* Step Number + Title */}
                  <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                    <span className="text-4xl font-bold text-primary/30">{step.number}.</span>
                    <h3 className="text-xl font-bold text-card-foreground">{step.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-primary/40" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA below cards */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/kontakt">
            <Button
              size="lg"
              className="font-bold gap-2 shadow-lg"
              data-testid="button-process-cta"
            >
              <Camera className="w-5 h-5" />
              Foto hochladen &amp; Schaden analysieren
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
