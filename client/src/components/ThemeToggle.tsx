import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const isDashboard = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/client") || location.startsWith("/hub");

  if (isDashboard) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="fixed top-5 right-5 z-50 bg-card/80 backdrop-blur-sm hover:bg-card"
      aria-label="Toggle theme"
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-foreground" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" />
      )}
    </Button>
  );
}
