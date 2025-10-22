import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";

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
    { name: "Bewertungen", href: "/bewertungen" },
    { name: "Galerie", href: "/galerie" },
    { name: "FAQ", href: "/faq" },
    { name: "Preise", href: "/preise" },
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
            <div className="text-2xl font-bold mb-4">
              <span className="text-primary">+1</span> Corion Lackdoktor
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Professionelle Autoreparatur seit über 20 Jahren in Wiesbaden und Umgebung.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="tel:061225962939" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-phone-footer">
                <Phone className="w-4 h-4" />
                <span className="font-mono">06122 596 29 39</span>
              </a>
              <a href="mailto:info@lackdoktor.de" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-email-footer">
                <Mail className="w-4 h-4" />
                info@lackdoktor.de
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Leistungen</h3>
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
            <h3 className="font-semibold mb-4">Unternehmen</h3>
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
            <h3 className="font-semibold mb-4">Standorte</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground">
                  Nassaustraße 41<br />
                  65719 Hofheim am Taunus
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div className="text-muted-foreground">
                  Wiesbadener Strasse 30<br />
                  55252 Mainz-Kastel
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
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
