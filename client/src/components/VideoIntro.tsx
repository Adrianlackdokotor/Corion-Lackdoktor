import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function VideoIntro() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("video.title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              {t("video.subtitle")}
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <span>{t("video.step1")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <span>{t("video.step2")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
                <span>{t("video.step3")}</span>
              </li>
            </ul>
            <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer">
              <Button size="lg" data-testid="button-video-cta">
                {t("video.sendPhoto")}
              </Button>
            </a>
          </motion.div>

          {/* Right: YouTube Video */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-primary/20">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/XVpQXfBV3-c"
                title="Smart Repair Erklarvideo - Corion Lackdoktor"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                data-testid="iframe-youtube-video"
              ></iframe>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg text-center text-sm text-muted-foreground">
              <p>
                {t("video.infoBox")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
