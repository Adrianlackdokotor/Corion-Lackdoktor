import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/image007 (1)_1761130943207.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLeistungenOpen, setMobileLeistungenOpen] = useState(false);
  const [location] = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { 
      name: "Leistungen", 
      href: "#",
      submenu: [
        { name: "Smart Repair", href: "/leistungen/smart-repair" },
        { name: "Lackierung", href: "/leistungen/lackschaeden" },
        { name: "Felgenreparatur", href: "/leistungen/felgenreparaturen" },
        { name: "Gutachter Service", href: "/gutachter" },
        { name: "Autoaufbereitung", href: "/leistungen/autoaufbereitung" },
      ]
    },
    { name: "Gutachter", href: "/gutachter" },
    { name: "Bewertungen", href: "/bewertungen" },
    { name: "Academy", href: "/academy" },
    { name: "FAQ", href: "/faq" },
    { name: "Kontakt", href: "/kontakt" },
    { name: "Impressum", href: "/impressum" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Always links to homepage */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center cursor-pointer hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
              <img 
                src={logoImage} 
                alt="+1 Corion Lackdoktor Logo" 
                className="h-10 md:h-12 w-auto" 
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                {item.submenu ? (
                  <>
                    <Button
                      variant="ghost"
                      className="gap-1"
                      data-testid={`link-${item.name.toLowerCase()}`}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <div className="absolute left-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border rounded-md shadow-lg">
                      <div className="py-2">
                        {item.submenu.map((subitem) => (
                          <Link key={subitem.name} href={subitem.href}>
                            <div 
                              className="px-4 py-2 hover-elevate text-sm" 
                              data-testid={`link-${subitem.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {subitem.name}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={`${location === item.href ? 'bg-accent' : ''}`}
                      data-testid={`link-${item.name.toLowerCase()}`}
                    >
                      {item.name}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a 
              href="tel:017683458274" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" 
              data-testid="link-phone-header"
            >
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
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col gap-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-between"
                        onClick={() => setMobileLeistungenOpen(!mobileLeistungenOpen)}
                        data-testid="button-mobile-leistungen"
                      >
                        {item.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileLeistungenOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      {mobileLeistungenOpen && (
                        <div className="ml-4 mt-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                          {item.submenu.map((subitem) => (
                            <Link key={subitem.name} href={subitem.href}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-muted-foreground"
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setMobileLeistungenOpen(false);
                                }}
                                data-testid={`link-mobile-${subitem.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {subitem.name}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`link-mobile-${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile CTA Buttons */}
              <div className="mt-4 flex flex-col gap-2 pt-4 border-t">
                <a href="tel:017683458274">
                  <Button variant="outline" className="w-full" data-testid="button-call-mobile">
                    <Phone className="w-4 h-4 mr-2" />
                    Jetzt Anrufen
                  </Button>
                </a>
                <Link href="/kontakt">
                  <Button 
                    className="w-full" 
                    onClick={() => setMobileMenuOpen(false)} 
                    data-testid="button-get-quote-mobile"
                  >
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
