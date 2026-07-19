import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sparkles,
  Home,
  LogIn,
  Wand2,
  LayoutGrid,
  Languages,
} from "lucide-react";
import { useHubI18n, HubLang } from "@/lib/hubI18n";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function HubCommandPalette({ open, onOpenChange }: Props) {
  const [, setLocation] = useLocation();
  const { t, setLang } = useHubI18n();

  const go = (path: string) => {
    onOpenChange(false);
    setLocation(path);
  };

  const switchLang = (l: HubLang) => {
    setLang(l);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t("cmd.placeholder")}
        data-testid="input-cmd-palette"
      />
      <CommandList>
        <CommandEmpty>—</CommandEmpty>
        <CommandGroup heading={t("cmd.group.nav")}>
          <CommandItem onSelect={() => go("/hub")} data-testid="cmd-landing">
            <Home className="mr-2 h-4 w-4 text-[#E53935]" />
            {t("cmd.open_landing")}
          </CommandItem>
          <CommandItem onSelect={() => go("/hub/portal")} data-testid="cmd-portal">
            <LogIn className="mr-2 h-4 w-4 text-[#E53935]" />
            {t("cmd.open_portal")}
          </CommandItem>
          <CommandItem
            onSelect={() => go("/hub/onboarding")}
            data-testid="cmd-onboarding"
          >
            <Wand2 className="mr-2 h-4 w-4 text-[#E53935]" />
            {t("cmd.open_onboarding")}
          </CommandItem>
          <CommandItem onSelect={() => go("/hub/app")} data-testid="cmd-app">
            <LayoutGrid className="mr-2 h-4 w-4 text-[#E53935]" />
            {t("cmd.open_app")}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={t("cmd.group.actions")}>
          <CommandItem onSelect={() => switchLang("de")} data-testid="cmd-lang-de">
            <Languages className="mr-2 h-4 w-4" />
            {t("cmd.lang_de")}
          </CommandItem>
          <CommandItem onSelect={() => switchLang("ro")} data-testid="cmd-lang-ro">
            <Languages className="mr-2 h-4 w-4" />
            {t("cmd.lang_ro")}
          </CommandItem>
          <CommandItem onSelect={() => switchLang("en")} data-testid="cmd-lang-en">
            <Languages className="mr-2 h-4 w-4" />
            {t("cmd.lang_en")}
          </CommandItem>
          <CommandItem
            onSelect={() => go("/hub/dashboard")}
            data-testid="cmd-legacy-dashboard"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Hub Dashboard (Werkstatt)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
