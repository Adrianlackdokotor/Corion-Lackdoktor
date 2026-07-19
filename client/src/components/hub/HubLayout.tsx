import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Infinity as InfinityIcon, Menu, X, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHubI18n, HubLang } from "@/lib/hubI18n";
import { HubCommandPalette } from "./HubCommandPalette";
import { HubFloatingAssistant } from "./HubFloatingAssistant";

type Props = {
  children: ReactNode;
  variant?: "marketing" | "minimal";
};

export function HubLayout({ children, variant = "marketing" }: Props) {
  const { t, lang, setLang } = useHubI18n();
  const [, setLocation] = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navLinks = [
    { href: "/hub#assistants", label: t("nav.assistants") },
    { href: "/hub#features", label: t("nav.features") },
    { href: "/hub#pricing", label: t("nav.pricing") },
  ];

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-[#E53935] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/hub"
            className="flex items-center gap-2"
            data-testid="link-hub-logo"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E53935]/10 ring-1 ring-[#E53935]/30">
              <InfinityIcon className="h-5 w-5 text-[#E53935]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Hub<span className="text-[#E53935]">+1</span>
            </span>
          </Link>

          {variant === "marketing" && (
            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                  data-testid={`link-nav-${l.label.toLowerCase()}`}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-white/70 hover:text-white md:inline-flex"
              onClick={() => setPaletteOpen(true)}
              data-testid="button-open-palette"
            >
              <Command className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs">⌘K</span>
            </Button>

            <Select value={lang} onValueChange={(v) => setLang(v as HubLang)}>
              <SelectTrigger
                className="h-9 w-[88px] border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 focus:ring-0"
                data-testid="select-language"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black text-white">
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="ro">RO</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="hidden border-white/15 bg-white/5 text-white hover:bg-white/10 md:inline-flex"
              onClick={() => setLocation("/hub/portal")}
              data-testid="button-nav-portal"
            >
              {t("nav.portal")}
            </Button>

            <Button
              size="sm"
              className="bg-[#E53935] text-white hover:bg-[#E53935]/90"
              onClick={() => setLocation("/hub/onboarding")}
              data-testid="button-nav-start"
            >
              {t("nav.start")}
            </Button>

            {variant === "marketing" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="border-l border-white/10 bg-black text-white"
                >
                  <div className="mt-8 flex flex-col gap-6">
                    {navLinks.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        className="text-lg font-medium text-white/80 hover:text-white"
                      >
                        {l.label}
                      </a>
                    ))}
                    <a
                      href="/hub/portal"
                      className="text-lg font-medium text-white/80 hover:text-white"
                    >
                      {t("nav.portal")}
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <InfinityIcon className="h-4 w-4 text-[#E53935]" />
              <span className="text-sm font-semibold">
                Hub<span className="text-[#E53935]">+1</span>
              </span>
            </div>
            <p className="mt-3 text-xs text-white/50">{t("footer.tagline")}</p>
          </div>
          <FooterCol
            title={t("footer.product")}
            items={[
              { href: "/hub#assistants", label: t("nav.assistants") },
              { href: "/hub#pricing", label: t("nav.pricing") },
              { href: "/hub/onboarding", label: t("nav.start") },
            ]}
          />
          <FooterCol
            title={t("footer.company")}
            items={[
              { href: "/uber-uns", label: "About" },
              { href: "/kontakt", label: "Contact" },
              { href: "/blog", label: "Blog" },
            ]}
          />
          <FooterCol
            title={t("footer.legal")}
            items={[
              { href: "/impressum", label: "Impressum" },
              { href: "/datenschutz", label: "Datenschutz" },
              { href: "/cookies", label: "Cookies" },
            ]}
          />
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-xs text-white/40 sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} Corion Hub+1</span>
            <span>v1.0 · Hub+1 Ecosystem</span>
          </div>
        </div>
      </footer>

      <HubCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <HubFloatingAssistant />
    </div>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <a
              href={i.href}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
