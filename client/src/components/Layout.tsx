import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileStickyFooter from "./MobileStickyFooter";
import { FloatingUserAvatarMenu } from "./UserAvatarMenu";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AIChatWidget from "./AIChatWidget";

interface LayoutProps {
  children: ReactNode;
}

const FLOATING_AVATAR_EXCLUDED_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/reception",
  "/repair-order",
  "/partner-hub",
  "/onboarding",
  "/landing",
  "/hub",
  "/portal",
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // CORI mobile PWA — full-screen, zero chrome. No header/footer/avatar/widget;
  // it owns its own head tags (manifest, apple meta) via usePwaHeadTags().
  if (location.startsWith("/cori")) {
    return <>{children}</>;
  }

  const isDashboard = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/client") || location.startsWith("/hub") || location.startsWith("/repair-order") || location.startsWith("/reception") || location.startsWith("/auftraege") || location.startsWith("/partner-hub") || location.startsWith("/finanzen") || location.startsWith("/login") || location.startsWith("/forgot-password") || location.startsWith("/reset-password") || location.startsWith("/onboarding") || location.startsWith("/cfo-inbox") || location.startsWith("/contabil-ai") || location.startsWith("/agent-hub") || location.startsWith("/privacy-admin") || location.startsWith("/landing") || location.startsWith("/wallet") || location.startsWith("/tasks");

  const showFloatingAvatar =
    isDashboard &&
    !FLOATING_AVATAR_EXCLUDED_PATHS.some((p) => location.startsWith(p));
  const avatarVariant: "light" | "dark" =
    location.startsWith("/agent-hub") ? "dark" : "light";

  if (isDashboard) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          {children}
        </main>
        {showFloatingAvatar && (
          <div className="fixed right-4 top-20 z-40 md:right-6 md:top-24">
            <FloatingUserAvatarMenu variant={avatarVariant} context="hub" />
          </div>
        )}
        <AIChatWidget />
      </div>
    );
  }

  // If user is logged in, but somehow ended up on a public page (e.g. Home),
  // we still want to hide the commercial headers/footers.
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      {!user && location !== "/login" && location !== "/" && <Header />}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {!user && location !== "/login" && location !== "/" && <Footer />}
      {!user && <MobileStickyFooter />}
    </div>
  );
}
