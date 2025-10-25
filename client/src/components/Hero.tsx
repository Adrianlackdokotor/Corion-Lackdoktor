import { Link } from "wouter";
import { Phone, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";
import logoImage from "@assets/image007 (1)_1761130943207.png";

export default function Hero() {
  return (
    <div className="relative h-[700px] md:h-[800px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional Lackdoktor Workshop" 
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Enhanced dark overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60" />
        
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>

      {/* Header Logo Overlay - Centered at Top */}
      <motion.div
        className="absolute top-8 md:top-12 left-0 right-0 z-20 flex justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <img
          src={logoImage}
          alt="Corion Lackdoktor Logo"
          className="w-32 md:w-48 lg:w-56 h-auto"
          style={{
            filter: "drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(0, 0, 0, 0.5))"
          }}
          data-testid="img-logo-overlay"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl">
          {/* Main Title with Poppins ExtraBold and highlighted keywords */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            data-testid="heading-hero"
          >
            <span className="text-primary">Präzision</span> trifft{" "}
            <span className="text-primary">Innovation</span> –{" "}
            Ihr Lackdoktor für{" "}
            <span className="text-primary">Smart Repair</span> &{" "}
            <span className="text-primary">Gutachten</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            data-testid="text-hero-subtitle"
          >
            Perfekte Ergebnisse durch <span className="text-white font-bold">Erfahrung</span>, <span className="text-white font-bold">Leidenschaft</span> und{" "}
            <span className="text-white font-bold">modernste Technologie</span>.
            Jetzt Angebot sichern – kostenlos und unverbindlich.
          </motion.p>

          {/* Dual-CTA Layout with enhanced styling */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            {/* Primary CTA - Red button with camera icon */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer" className="block w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto font-heading font-bold shadow-cta hover:shadow-xl transition-all duration-300" 
                  data-testid="button-hero-photo"
                >
                  <Camera className="mr-2 w-5 h-5" />
                  Foto schicken für Angebot
                </Button>
              </a>
            </motion.div>

            {/* Secondary CTA - Outlined button with phone */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <a href="tel:017683458274" className="block w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 font-heading font-bold transition-all duration-300" 
                  data-testid="button-hero-call"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Jetzt Anrufen
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Trust Indicators with enhanced animations */}
          <motion.div 
            className="grid grid-cols-3 gap-6 md:gap-12 text-white/90"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-5xl font-extrabold font-heading text-primary mb-2">20+</div>
              <div className="text-sm md:text-base font-medium">Jahre Erfahrung</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-5xl font-extrabold font-heading text-primary mb-2">4.6/5</div>
              <div className="text-sm md:text-base font-medium">642 Bewertungen</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-5xl font-extrabold font-heading text-primary mb-2">100%</div>
              <div className="text-sm md:text-base font-medium">Garantie</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Subtle light beam effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
    </div>
  );
}
