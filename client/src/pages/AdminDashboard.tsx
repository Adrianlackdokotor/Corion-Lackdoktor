import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { LogOut, User, Settings, BarChart } from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Auf Wiedersehen!",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler beim Abmelden",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C00020] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Admin Dashboard | Corion Lackdoktor"
        description="Corion Lackdoktor Management Dashboard"
      />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-[#C00020]" data-testid="text-title">
                Corion Management Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Willkommen zurück, <span className="font-semibold" data-testid="text-user-email">{user?.email}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card data-testid="card-user-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#C00020]" />
                Benutzerinformationen
              </CardTitle>
              <CardDescription>Ihre Kontodetails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rolle</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-Mail verifiziert</p>
                <p className="font-medium">{user?.emailVerified ? "Ja" : "Nein"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card data-testid="card-analytics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-[#C00020]" />
                Statistiken
              </CardTitle>
              <CardDescription>Übersicht Ihrer Daten</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Statistiken und Berichte werden hier angezeigt.
              </p>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card data-testid="card-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C00020]" />
                Einstellungen
              </CardTitle>
              <CardDescription>Konto-Einstellungen verwalten</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-change-password">
                Passwort ändern
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mt-6" data-testid="card-welcome">
          <CardHeader>
            <CardTitle>Willkommen im Corion CRM System</CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Kunden, Aufträge und Geschäftsprozesse effizient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Dieses Dashboard befindet sich derzeit im Aufbau. Weitere Funktionen werden in Kürze verfügbar sein.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Hinweis:</strong> Ihr Administrator-Konto wurde erfolgreich eingerichtet.
                Bitte ändern Sie Ihr temporäres Passwort bei nächster Gelegenheit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
