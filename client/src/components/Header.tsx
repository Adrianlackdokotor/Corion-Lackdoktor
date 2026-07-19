import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import UserAvatarMenu from "@/components/UserAvatarMenu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLeistungenOpen, setMobileLeistungenOpen] = useState(false);
  const [mobileMehrOpen, setMobileMehrOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();

  const mainNavigation = [
    {
      key: "services",
      name: t("nav.services"),
      href: "#",
      submenu: [
        { key: "smart-repair", name: t("nav.smartRepair"), href: "/leistungen/smart-repair" },
        { key: "unfall", name: t("nav.unfall"), href: "/leistungen/unfallschaeden" },
        { key: "lack", name: t("nav.lack"), href: "/leistungen/lackschaeden" },
        { key: "felgen", name: t("nav.felgen"), href: "/leistungen/felgenreparaturen" },
        { key: "dellen", name: t("nav.dellen"), href: "/leistungen/dellen-entfernen" },
        { key: "leasing", name: t("nav.leasing"), href: "/leistungen/leasingruecklaufer" },
        { key: "detailing", name: t("nav.detailing"), href: "/leistungen/autoaufbereitung" },
        { key: "oldtimer", name: t("nav.oldtimer"), href: "/leistungen/oldtimer" },
        { key: "rost", name: t("nav.rost"), href: "/leistungen/rostschaeden" },
        { key: "autoglas", name: t("nav.autoglas"), href: "/leistungen/autoglas" },
      ],
    },
    { key: "ablauf", name: t("nav.ablauf"), href: "/#ablauf" },
    { key: "locations", name: t("nav.locations"), href: "/standorte" },
  ];

  const moreGroups: { label: string; items: { key: string; name: string; href: string }[] }[] = [
    {
      label: t("nav.aboutGroup") || "Über uns",
      items: [
        { key: "about", name: t("nav.about"), href: "/uber-uns" },
        { key: "academy", name: t("nav.academy"), href: "/academy" },
        { key: "franchise", name: t("nav.franchise"), href: "/franchise" },
        { key: "partner", name: t("nav.partnerSignup"), href: "/partner-flyer" },
      ],
    },
    {
      label: t("nav.proofGroup") || "Vertrauen",
      items: [
        { key: "reviews", name: t("nav.reviews"), href: "/bewertungen" },
        { key: "gallery", name: t("nav.gallery"), href: "/galerie" },
        { key: "blog", name: t("nav.blog"), href: "/blog" },
      ],
    },
    {
      label: t("nav.helpGroup") || "Service",
      items: [
        { key: "gutachter", name: t("nav.gutachter"), href: "/gutachter" },
        { key: "faq", name: t("nav.faq"), href: "/faq" },
        { key: "contact", name: t("nav.contact"), href: "/kontakt" },
      ],
    },
    {
      label: t("nav.legalGroup") || "Rechtliches",
      items: [
        { key: "legal", name: t("nav.legal"), href: "/impressum" },
      ],
    },
  ];
  const moreItems = moreGroups.flatMap(g => g.items);

  return (
    <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/90 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          
          {/* Left - Logo */}
          <Link href="/" data-testid="link-nav-logo">
            <div className="flex items-center cursor-pointer hover-elevate active-elevate-2 rounded-md px-2 py-1">
              <Logo className="h-9 w-auto" showSparkle={true} />
            </div>
          </Link>

          {/* Center - Main Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavigation.map((item) => (
              <div key={item.key} className="relative group">
                {item.submenu ? (
                  <>
                    <Button
                      variant="ghost"
                      className="gap-1 text-white/80"
                      data-testid={`link-${item.key}`}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <div className="absolute left-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[#1E1E1E] border border-white/10 rounded-md shadow-xl">
                      <div className="py-2">
                        {item.submenu.map((subitem) => (
                          <Link key={subitem.key} href={subitem.href}>
                            <div 
                              className="px-4 py-2 text-white/80 text-sm hover-elevate active-elevate-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                              data-testid={`link-${subitem.key}`}
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
                      className={`text-white/80 ${location === item.href ? 'text-white bg-white/10' : ''}`}
                      data-testid={`link-${item.key}`}
                    >
                      {item.name}
                    </Button>
                  </Link>
                )}
              </div>
            ))}

            {/* Mehr Dropdown */}
            <div className="relative group">
              <Button
                variant="ghost"
                className="gap-1 text-white/80"
                data-testid="link-mehr"
              >
                {t("nav.more")}
                <ChevronDown className="w-4 h-4" />
              </Button>
              <div className="absolute right-0 mt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[#1E1E1E] border border-white/10 rounded-md shadow-xl">
                <div className="py-2">
                  {moreGroups.map((group, gi) => (
                    <div key={group.label} className={gi > 0 ? "border-t border-white/5 mt-1 pt-1" : ""}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        {group.label}
                      </div>
                      {group.items.map((item) => (
                        <Link key={item.key} href={item.href}>
                          <div
                            className="px-4 py-2 text-white/80 text-sm hover-elevate active-elevate-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            data-testid={`link-${item.key}`}
                          >
                            {item.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right - User Avatar + Language + CTA (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSelector />
            <UserAvatarMenu variant="dark" context="public" />
            <Link href="/kontakt">
              <Button 
                className="bg-primary text-primary-foreground font-bold uppercase tracking-wide shadow-lg shadow-red-900/30"
                data-testid="button-get-quote"
              >
                {t("nav.getQuote")}
              </Button>
            </Link>
          </div>

          {/* Mobile - Logo already on left, Menu button on right */}
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/kontakt">
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground font-bold text-xs uppercase"
                data-testid="button-mobile-get-quote"
              >
                {t("nav.quote")}
              </Button>
            </Link>
            <UserAvatarMenu variant="dark" context="public" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {mainNavigation.map((item) => (
                <div key={item.key}>
                  {item.submenu ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-white/80"
                        onClick={() => setMobileLeistungenOpen(!mobileLeistungenOpen)}
                        data-testid="button-mobile-leistungen"
                      >
                        {item.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileLeistungenOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      {mobileLeistungenOpen && (
                        <div className="ml-4 mt-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                          {item.submenu.map((subitem) => (
                            <Link key={subitem.key} href={subitem.href}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-white/60"
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setMobileLeistungenOpen(false);
                                }}
                                data-testid={`link-mobile-${subitem.key}`}
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
                        className="w-full justify-start text-white/80"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`link-mobile-${item.key}`}
                      >
                        {item.name}
                      </Button>
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile More Menu */}
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-white/80"
                  onClick={() => setMobileMehrOpen(!mobileMehrOpen)}
                  data-testid="button-mobile-mehr"
                >
                  {t("nav.more")}
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileMehrOpen ? 'rotate-180' : ''}`} />
                </Button>
                {mobileMehrOpen && (
                  <div className="ml-4 mt-2 flex flex-col gap-1">
                    {moreItems.map((item) => (
                      <Link key={item.key} href={item.href}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white/60"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileMehrOpen(false);
                          }}
                          data-testid={`link-mobile-${item.key}`}
                        >
                          {item.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Mobile Language Selector */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <LanguageSelector variant="mobile" />
              </div>

              {/* Mobile CTA Buttons */}
              <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-white/10">
                <Link href="/kontakt">
                  <Button 
                    className="w-full bg-primary text-primary-foreground font-bold uppercase"
                    onClick={() => setMobileMenuOpen(false)} 
                    data-testid="button-get-quote-mobile"
                  >
                    {t("nav.getQuote")}
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
