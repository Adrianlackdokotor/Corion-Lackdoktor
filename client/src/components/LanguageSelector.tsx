import { useLanguage, Language } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star } from "lucide-react";

const languages: { code: Language; name: string; short: string }[] = [
  { code: "de", name: "Deutsch", short: "DE" },
  { code: "en", name: "English", short: "EN" },
  { code: "ro", name: "Rom\u00e2n\u0103", short: "RO" },
  { code: "es", name: "Espa\u00f1ol", short: "ES" },
  { code: "tr", name: "T\u00fcrk\u00e7e", short: "TR" },
  { code: "el", name: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", short: "EL" },
];

interface LanguageSelectorProps {
  variant?: "desktop" | "mobile";
}

export default function LanguageSelector({ variant = "desktop" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  
  const currentLang = languages.find(l => l.code === language);

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1 w-full">
        <p className="text-sm text-muted-foreground px-3 py-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Sprache / Language
        </p>
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setLanguage(lang.code)}
            data-testid={`button-lang-mobile-${lang.code}`}
          >
            <span className="text-xs font-bold w-6">{lang.short}</span>
            <span>{lang.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 px-2"
          data-testid="button-language-selector"
        >
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-xs font-medium uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`gap-2 cursor-pointer ${language === lang.code ? "bg-accent" : ""}`}
            data-testid={`button-lang-${lang.code}`}
          >
            <span className="text-xs font-bold w-6 text-primary">{lang.short}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
