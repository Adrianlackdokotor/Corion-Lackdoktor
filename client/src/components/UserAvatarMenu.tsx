import { useLocation } from "wouter";
import {
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Settings,
  CreditCard,
  Sparkles,
  Globe,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, type Language } from "@/i18n/LanguageContext";
import { queryClient } from "@/lib/queryClient";

interface UserAvatarMenuProps {
  /** Visual tone of the trigger */
  variant?: "light" | "dark";
  /**
   * - `public`: clean header on landing pages (no email/role/tokens leak).
   * - `hub`: internal dashboards may show role + tokens inside the menu.
   */
  context?: "public" | "hub";
  /** Optional override of the dashboard target. */
  dashboardHref?: string;
  /** Hide tokens info in hub context (defaults to show). */
  showTokens?: boolean;
}

const AUTH_KEYS = [
  "auth_token",
  "authToken",
  "token",
  "user",
  "currentUser",
  "session",
];

const LANGS: Array<{ code: Language; label: string; flag: string }> = [
  { code: "ro", label: "Română", flag: "RO" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "en", label: "English", flag: "EN" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "tr", label: "Türkçe", flag: "TR" },
  { code: "el", label: "Ελληνικά", flag: "GR" },
];

function dashboardForRole(role?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "partner":
      return "/partner";
    case "client":
      return "/client";
    default:
      return "/portal";
  }
}

export default function UserAvatarMenu({
  variant = "light",
  context = "public",
  dashboardHref,
  showTokens = true,
}: UserAvatarMenuProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const isDark = variant === "dark";
  const isHub = context === "hub";

  const first = user?.firstName?.trim() ?? "";
  const last = user?.lastName?.trim() ?? "";
  const fullName =
    [first, last].filter(Boolean).join(" ") || user?.email || "Konto";
  const initial =
    (first[0] ?? user?.email?.[0] ?? "U").toUpperCase();
  const avatarUrl = user?.profileImageUrl ?? undefined;
  const roleLabel =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "partner"
        ? "Partner"
        : user?.role === "client"
          ? "Kunde"
          : user?.role ?? "";

  const target = dashboardHref ?? dashboardForRole(user?.role);

  const handleLogout = async () => {
    try {
      AUTH_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch {
          /* noop */
        }
      });
      if (isAuthenticated) {
        try {
          await authLogout();
        } catch {
          /* noop */
        }
      }
      queryClient.clear();
    } finally {
      toast({
        title: t("account.logoutSuccess"),
        description: t("account.logoutDescription"),
      });
      navigate("/");
    }
  };

  const triggerRing = isDark
    ? "ring-1 ring-white/15 hover:ring-white/30"
    : "ring-1 ring-slate-200 hover:ring-slate-300";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={isAuthenticated ? t("account.menuOpen") : t("account.anonymousMenuOpen")}
          className={`relative inline-flex items-center justify-center rounded-full p-0 ${triggerRing} hover-elevate active-elevate-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow`}
          data-testid="button-user-avatar"
        >
          {isAuthenticated ? (
            <Avatar className="w-9 h-9">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={fullName} />
              )}
              <AvatarFallback
                className={`text-sm font-bold ${isDark ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"}`}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={`w-9 h-9 inline-flex items-center justify-center rounded-full ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"}`}
              data-testid="icon-account-anonymous"
            >
              <UserIcon className="w-4 h-4" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 p-0 overflow-hidden"
        data-testid="menu-user-dropdown"
      >
        {isAuthenticated ? (
          <>
            {/* Header — minimal on public, full on hub */}
            {isHub ? (
              <div className="bg-gradient-to-br from-zinc-900 via-black to-red-900 text-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-white/30">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-bold truncate"
                      data-testid="text-user-name"
                    >
                      {fullName}
                    </p>
                    <p
                      className="text-[11px] text-white/70 truncate"
                      data-testid="text-user-email"
                    >
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider">
                  <span
                    className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 font-semibold"
                    data-testid="badge-user-role"
                  >
                    {roleLabel}
                  </span>
                  {showTokens && (
                    <span className="inline-flex items-center gap-1 text-white/80 normal-case tracking-normal">
                      <Sparkles className="w-3 h-3" />
                      HUB+1 · 1 240
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-b">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("account.signedInAs")}
                </p>
                <p
                  className="text-sm font-semibold truncate mt-0.5"
                  data-testid="text-user-name"
                >
                  {fullName}
                </p>
              </div>
            )}

            <DropdownMenuItem
              onSelect={() => navigate(target)}
              className="gap-3 px-3 py-2.5 cursor-pointer"
              data-testid="menu-item-dashboard"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t("account.openHub")}</span>
            </DropdownMenuItem>

            {isHub && (
              <>
                <DropdownMenuItem
                  onSelect={() => navigate("/admin?tab=profil")}
                  className="gap-3 px-3 py-2.5 cursor-pointer"
                  data-testid="menu-item-profile"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm">{t("account.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/admin?tab=einstellungen")}
                  className="gap-3 px-3 py-2.5 cursor-pointer"
                  data-testid="menu-item-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">{t("account.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/hub/billing")}
                  className="gap-3 px-3 py-2.5 cursor-pointer"
                  data-testid="menu-item-billing"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">{t("account.billing")}</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className="gap-3 px-3 py-2.5 cursor-pointer"
                data-testid="menu-item-language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{t("account.language")} · {language.toUpperCase()}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {LANGS.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => setLanguage(l.code)}
                    className="gap-2 cursor-pointer"
                    data-testid={`menu-lang-${l.code}`}
                  >
                    <span className="text-[10px] font-mono w-6 text-muted-foreground">
                      {l.flag}
                    </span>
                    <span className="text-sm flex-1">{l.label}</span>
                    {language === l.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
              className="gap-3 px-3 py-2.5 cursor-pointer text-rose-600 focus:text-rose-700"
              data-testid="menu-item-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{t("account.logout")}</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground px-3 pt-3 pb-1">
              {t("account.corionHub")}
            </DropdownMenuLabel>

            <DropdownMenuItem
              onSelect={() => navigate("/login")}
              className="gap-3 px-3 py-2.5 cursor-pointer"
              data-testid="menu-item-login"
            >
              <LogIn className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{t("account.signin")}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t("account.signinDescription")}
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => navigate("/franchise")}
              className="gap-3 px-3 py-2.5 cursor-pointer"
              data-testid="menu-item-register"
            >
              <UserPlus className="w-4 h-4" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{t("account.becomePartner")}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t("account.becomePartnerDescription")}
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className="gap-3 px-3 py-2.5 cursor-pointer"
                data-testid="menu-item-language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{t("account.language")} · {language.toUpperCase()}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {LANGS.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => setLanguage(l.code)}
                    className="gap-2 cursor-pointer"
                    data-testid={`menu-lang-${l.code}`}
                  >
                    <span className="text-[10px] font-mono w-6 text-muted-foreground">
                      {l.flag}
                    </span>
                    <span className="text-sm flex-1">{l.label}</span>
                    {language === l.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FloatingUserAvatarMenu({
  variant = "light",
  context = "hub",
}: UserAvatarMenuProps) {
  return (
    <div
      className="fixed top-3 right-3 z-50"
      data-testid="floating-user-menu"
    >
      <UserAvatarMenu variant={variant} context={context} />
    </div>
  );
}
