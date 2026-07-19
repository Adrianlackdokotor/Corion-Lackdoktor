import { Link } from "wouter";
import { Phone, Mail, MapPin, Camera, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { FooterGallerySlider } from "@/components/FooterGallerySlider";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  const services = [
    { name: t("services.accidentDamage"), href: "/leistungen/unfallschaeden" },
    { name: t("services.paintDamage"), href: "/leistungen/lackschaeden" },
    { name: t("services.smartRepair"), href: "/leistungen/smart-repair" },
    { name: "Dellen Entfernen", href: "/leistungen/dellen-entfernen" },
    { name: t("services.wheelRepair"), href: "/leistungen/felgenreparaturen" },
    { name: t("services.oldtimer"), href: "/leistungen/oldtimer" },
  ];

  const company = [
    { name: t("nav.about"), href: "/uber-uns" },
    { name: "Gutachter", href: "/gutachter" },
    { name: t("nav.gallery"), href: "/galerie" },
    { name: t("nav.locations"), href: "/standorte" },
    { name: t("nav.franchise"), href: "/franchise" },
    { name: "Partner-Rekrutierung", href: "/partner-flyer" },
  ];

  const legal = [
    { name: t("footer.imprint"), href: "/impressum" },
    { name: t("footer.privacy"), href: "/datenschutz" },
    { name: "Cookie-Richtlinie", href: "/cookies" },
  ];

  return (
    <footer className="bg-card border-t mt-auto">
      {/* Dual CTA Block: B2C primary + Partner secondary */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border" data-testid="section-footer-cta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold font-heading mb-1">Bereit für ein Angebot?</h3>
              <p className="text-sm md:text-base text-muted-foreground">Foto senden – persönliches Angebot vom Lackdoktor erhalten.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link href="/kontakt" className="w-full sm:w-auto">
                <Button size="lg" className="w-full font-bold gap-2 shadow-lg" data-testid="button-footer-photo-cta">
                  <Camera className="w-5 h-5" />
                  Jetzt Foto senden
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/franchise" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full font-semibold gap-2" data-testid="button-footer-partner-cta">
                  <Briefcase className="w-5 h-5" />
                  Partner werden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Logo className="h-12 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {t("footer.description")}
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="tel:017683458274" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-phone-footer">
                <Phone className="w-4 h-4" />
                <span className="font-sans">0176 834 582 74</span>
              </a>
              <a href="mailto:coriongmbh@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-email-footer">
                <Mail className="w-4 h-4" />
                coriongmbh@gmail.com
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold font-heading mb-4">{t("nav.services")}</h3>
            <ul className="space-y-2 text-sm">
              {services.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid={`link-footer-${item.name.toLowerCase()}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold font-heading mb-4">{t("footer.company")}</h3>
            <ul className="space-y-2 text-sm">
              {company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid={`link-footer-${item.name.toLowerCase()}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold font-heading mb-4">{t("nav.locations")}</h3>
            <div className="space-y-4 text-sm">
              <a 
                href="https://www.google.com/maps/place/%2B1+Corion+Lackdoktor/@50.0722447,8.3788688,622m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47bda31d6038322b:0xce9d33b9de0114c0!8m2!3d50.0722447!4d8.3814437!16s%2Fg%2F11ptz_8kfg?authuser=0&entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex gap-2 hover:text-foreground transition-colors"
                data-testid="link-location-hofheim"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground hover:text-foreground transition-colors">
                  Hofheim-Wallau<br />
                  Nassau Str. 41
                </div>
              </a>
              <a 
                href="https://www.google.com/maps/place/Lackdoktor+Wiesbaden/@50.0152337,8.2745749,622m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47bd97a96f1e0bcb:0xb1d20f540e987e11!8m2!3d50.0152337!4d8.2771498!16s%2Fg%2F1hc2c4693?authuser=0&entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex gap-2 hover:text-foreground transition-colors"
                data-testid="link-location-mainz"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground hover:text-foreground transition-colors">
                  Mainz-Kastel<br />
                  Wiesbadener Str. 30
                </div>
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=50.0826,8.2400" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex gap-2 hover:text-foreground transition-colors"
                data-testid="link-location-wiesbaden"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground hover:text-foreground transition-colors">
                  Wiesbaden
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Gallery Slider */}
        <div className="mt-12 pt-8 border-t">
          <FooterGallerySlider />
        </div>

        {/* Service Areas */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-center text-muted-foreground" data-testid="text-service-areas">
            <span className="font-heading font-semibold">{t("footer.serviceAreas")}:</span> Hofheim · Wiesbaden · Mainz-Kastel · Frankfurt Umgebung
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} +1 Corion Lackdoktor. {t("footer.rights")}.</p>
          <div className="flex gap-4">
            {legal.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer" data-testid={`link-footer-${item.name.toLowerCase()}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
