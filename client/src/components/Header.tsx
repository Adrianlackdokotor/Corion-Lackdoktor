import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Phone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/image007 (1)_1761130943207.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { 
      name: "Leistungen", 
      href: "/leistungen/unfallschaeden",
      submenu: [
        { name: "Unfallschäden", href: "/leistungen/unfallschaeden" },
        { name: "Lackschäden", href: "/leistungen/lackschaeden" },
        { name: "Smart Repair", href: "/leistungen/smart-repair" },
        { name: "Dellen Entfernen", href: "/leistungen/dellen-entfernen" },
        { name: "Leasingrückläufer", href: "/leistungen/leasingruecklaufer" },
        { name: "Felgenreparaturen", href: "/leistungen/felgenreparaturen" },
        { name: "Rostschäden", href: "/leistungen/rostschaeden" },
        { name: "Oldtimer", href: "/leistungen/oldtimer" },
        { name: "Autoaufbereitung", href: "/leistungen/autoaufbereitung" },
        { name: "Baulackierung", href: "/leistungen/baulackierung" },
        { name: "Autoglas", href: "/leistungen/autoglas" },
        { name: "Sonderlackierung", href: "/leistungen/sonderlackierung" },
        { name: "Plastikreparatur", href: "/leistungen/plastikreparatur" },
      ]
    },
    { name: "Gutachter", href: "/gutachter" },
    { name: "Galerie", href: "/galerie" },
    { name: "Kontakt", href: "/kontakt" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center cursor-pointer hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
              <img src={logoImage} alt="+1 Corion Lackdoktor" className="h-10 md:h-12" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`${location === item.href ? 'bg-accent' : ''}`}
                    data-testid={`link-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Button>
                </Link>
                {item.submenu && (
                  <div className="absolute left-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border rounded-md shadow-lg">
                    <div className="py-2">
                      {item.submenu.map((subitem) => (
                        <Link key={subitem.name} href={subitem.href}>
                          <div className="px-4 py-2 hover-elevate text-sm" data-testid={`link-${subitem.name.toLowerCase()}`}>
                            {subitem.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:017683458274" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="link-phone-header">
              <Phone className="inline w-4 h-4 mr-1" />
              0176 834 582 74
            </a>
            <Link href="/kontakt">
              <Button data-testid="button-get-quote">Angebot einholen</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Button>
                  </Link>
                  {item.submenu && (
                    <div className="ml-4 mt-2 flex flex-col gap-1">
                      {item.submenu.map((subitem) => (
                        <Link key={subitem.name} href={subitem.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-muted-foreground"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subitem.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <a href="tel:017683458274">
                  <Button variant="outline" className="w-full" data-testid="button-call-mobile">
                    <Phone className="w-4 h-4 mr-2" />
                    Jetzt Anrufen
                  </Button>
                </a>
                <Link href="/kontakt">
                  <Button className="w-full" onClick={() => setMobileMenuOpen(false)} data-testid="button-get-quote-mobile">
                    Angebot einholen
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
