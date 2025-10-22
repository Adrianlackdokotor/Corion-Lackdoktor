import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import logoImage from "@assets/image007 (1)_1761130943207.png";

export default function Footer() {
  const services = [
    { name: "Unfallschäden", href: "/leistungen/unfallschaeden" },
    { name: "Lackschäden", href: "/leistungen/lackschaeden" },
    { name: "Smart Repair", href: "/leistungen/smart-repair" },
    { name: "Dellen Entfernen", href: "/leistungen/dellen-entfernen" },
    { name: "Felgenreparaturen", href: "/leistungen/felgenreparaturen" },
    { name: "Oldtimer", href: "/leistungen/oldtimer" },
  ];

  const company = [
    { name: "Über Uns", href: "/uber-uns" },
    { name: "Gutachter", href: "/gutachter" },
    { name: "Galerie", href: "/galerie" },
    { name: "Standorte", href: "/standorte" },
  ];

  const legal = [
    { name: "Impressum", href: "/impressum" },
    { name: "Datenschutz", href: "/datenschutz" },
    { name: "Cookie-Richtlinie", href: "/cookies" },
  ];

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img src={logoImage} alt="+1 Corion Lackdoktor" className="h-12 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Professionelle Autoreparatur seit über 20 Jahren in Wiesbaden und Umgebung.
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
            <h3 className="font-semibold font-heading mb-4">Leistungen</h3>
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
            <h3 className="font-semibold font-heading mb-4">Unternehmen</h3>
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
            <h3 className="font-semibold font-heading mb-4">Standorte</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground">
                  Hofheim-Wallau<br />
                  Nassau Str. 41
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground">
                  Mainz-Kastel<br />
                  Wiesbadener Str. 30
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground">
                  Wiesbaden
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-center text-muted-foreground" data-testid="text-service-areas">
            <span className="font-heading font-semibold">Servicegebiete:</span> Hofheim · Wiesbaden · Mainz-Kastel · Frankfurt Umgebung
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} +1 Corion Lackdoktor. Alle Rechte vorbehalten.</p>
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
