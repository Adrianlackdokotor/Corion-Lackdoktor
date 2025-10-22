import { motion } from "framer-motion";
import { MessageCircle, Mail, Send, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import smartphoneImage from "@assets/generated_images/Smartphone_showing_car_damage_photo_2895b3f4.png";

export default function AngebotEinholen() {
  const handleScrollToKontakt = (e: React.MouseEvent) => {
    e.preventDefault();
    const kontaktSection = document.getElementById('kontakt');
    if (kontaktSection) {
      kontaktSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#F2F2F2] py-20 px-6" data-testid="section-angebot-einholen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          {/* Animated Smartphone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.img
              src={smartphoneImage}
              alt="Smartphone mit Lackschaden-Foto"
              className="w-64 md:w-80 lg:w-96 h-auto mx-auto drop-shadow-2xl"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              data-testid="img-smartphone-damage"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <Camera className="w-10 h-10 md:w-12 md:h-12 text-primary flex-shrink-0" data-testid="icon-camera-angebot" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-primary" data-testid="heading-angebot">
              Senden Sie uns einfach ein Foto vom Schaden!
            </h2>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10"
            data-testid="text-angebot-subtitle"
          >
            Wir erstellen Ihnen ein kostenloses Angebot – schnell und unverbindlich.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
            data-testid="container-cta-buttons"
          >
            {/* WhatsApp Button */}
            <Button
              asChild
              size="lg"
              className="font-heading font-bold shadow-cta"
              data-testid="button-whatsapp"
            >
              <a
                href="https://wa.me/4917683458274"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp senden</span>
              </a>
            </Button>

            {/* Form Button */}
            <Button
              size="lg"
              onClick={handleScrollToKontakt}
              className="font-heading font-bold shadow-cta"
              data-testid="button-form"
            >
              <Send className="w-5 h-5" />
              <span>Formular ausfüllen</span>
            </Button>

            {/* Email Button */}
            <Button
              asChild
              size="lg"
              className="font-heading font-bold shadow-cta"
              data-testid="button-email"
            >
              <a
                href="mailto:info@corion-lackdoktor.de"
                className="flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span>E-Mail senden</span>
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
