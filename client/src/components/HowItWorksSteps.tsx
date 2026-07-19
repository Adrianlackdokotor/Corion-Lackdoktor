import { motion } from "framer-motion";
import { Camera, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorksSteps() {
  const steps = [
    {
      icon: Camera,
      title: "Schaden fotografieren",
      description: "Machen Sie einfach ein Foto vom Schaden mit Ihrem Smartphone.",
      delay: 0
    },
    {
      icon: Send,
      title: "Senden",
      description: "Senden Sie das Foto via WhatsApp oder unser Online-Formular.",
      delay: 0.2
    },
    {
      icon: MessageSquare,
      title: "Angebot erhalten",
      description: "Erhalten Sie Ihr kostenloses, individuelles Angebot innerhalb von Minuten.",
      delay: 0.4
    }
  ];

  return (
    <div className="bg-background border-2 border-primary/20 rounded-lg p-6 md:p-8 shadow-lg" data-testid="section-how-it-works">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold font-heading mb-2">
          So einfach geht's
        </h2>
        <p className="text-muted-foreground">
          In 3 Schritten zum Angebot
        </p>
      </motion.div>

      {/* Steps - Horizontal on Desktop, Vertical on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.6, 
              delay: step.delay,
              ease: "easeOut"
            }}
            className="relative bg-card border border-border rounded-lg p-6 text-center hover-elevate transition-all"
            data-testid={`step-${index + 1}`}
          >
            {/* Step Number Badge */}
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold font-heading mb-2">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <a 
          href="https://wa.me/4917683458274" 
          target="_blank" 
          rel="noopener noreferrer"
          className="sm:flex-1 sm:max-w-xs"
        >
          <Button 
            size="lg" 
            className="w-full font-heading font-bold shadow-lg"
            data-testid="button-whatsapp-cta"
          >
            <Camera className="mr-2 w-5 h-5" />
            Foto per WhatsApp senden
          </Button>
        </a>
        <Link href="/kontakt" className="sm:flex-1 sm:max-w-xs">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full font-heading font-bold"
            data-testid="button-contact-form-cta"
          >
            <Send className="mr-2 w-5 h-5" />
            Online-Formular nutzen
          </Button>
        </Link>
      </motion.div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Kostenlos & unverbindlich • Antwort innerhalb von 30 Minuten • Über 5000 zufriedene Kunden
        </p>
      </motion.div>
    </div>
  );
}
