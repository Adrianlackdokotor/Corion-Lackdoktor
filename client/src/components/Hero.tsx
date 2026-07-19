import { Link } from "wouter";
import { Camera, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import heroImage from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";
import logoImage from "@assets/logo-final-white_1-8_1761397399511.png";

export default function Hero() {
  const { t } = useLanguage();
  return (
    <div className="relative min-h-[640px] md:min-h-[760px] flex items-center overflow-hidden bg-[#0A0A0A]">
      {/* Background Image with strong contrast wash */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional Lackdoktor Workshop"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Strong dark wash for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-16">
        <div className="flex flex-col items-center justify-center text-center">

          {/* Logo with sparkle effect */}
          <div className="relative inline-block mb-6">
            <motion.img
              src={logoImage}
              alt="+1 Corion Lackdoktor Logo"
              className="mx-auto h-[4.5rem] sm:h-[5.5rem] md:h-[6.5rem] lg:h-[7.5rem] w-auto"
              style={{
                filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.25))"
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              data-testid="img-logo-overlay"
            />
            <div className="absolute top-[20%] right-[25%] logo-sparkle-container">
              <div className="logo-sparkle">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              </div>
            </div>
          </div>

          {/* AI Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E60000]" />
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              {t("home.heroAiBadge")}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 max-w-4xl leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="heading-hero"
          >
            {t("home.heroHeadlineLead")} <span className="text-[#E60000]">{t("home.heroHeadlineAccent")}</span> {t("home.heroHeadlineTail")}
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-white/85 mb-8 max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            data-testid="text-hero-subtitle"
          >
            {t("home.heroSubtitle")}
          </motion.p>

          {/* Primary + Secondary CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/kontakt" className="w-full sm:flex-1">
              <Button
                size="lg"
                className="w-full h-14 bg-[#E60000] text-white font-bold text-base shadow-xl shadow-red-900/40"
                data-testid="button-hero-primary-cta"
              >
                <Camera className="w-5 h-5 mr-2" />
                {t("home.heroPrimaryCta")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#ablauf" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 sm:w-auto px-6 bg-white/10 backdrop-blur-md border-white/30 text-white font-semibold text-base"
                data-testid="button-hero-secondary-cta"
              >
                {t("home.heroSecondaryCta")}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </a>
          </motion.div>

          {/* Discreet Partner Link */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/franchise">
              <span
                className="text-white/50 hover:text-white/80 text-xs sm:text-sm underline underline-offset-4 transition-colors cursor-pointer"
                data-testid="link-partner-werden"
              >
                {t("home.heroPartnerLink")}
              </span>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="grid grid-cols-3 gap-6 md:gap-12 mt-10 md:mt-12 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E60000] mb-1">20+</div>
              <div className="text-xs sm:text-sm font-medium text-white/70">{t("home.trustYears")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E60000] mb-1">4.6/5</div>
              <div className="text-xs sm:text-sm font-medium text-white/70">{t("home.trustReviews")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E60000] mb-1">100%</div>
              <div className="text-xs sm:text-sm font-medium text-white/70">{t("home.trustGuarantee")}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subtle gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
