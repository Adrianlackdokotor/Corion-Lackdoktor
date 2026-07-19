import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import logoImage from "@assets/image007 (1)_1761130943207.png";
import { Lock, CheckCircle, XCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);

    if (tokenParam) {
      verifyToken(tokenParam);
    } else {
      setIsVerifying(false);
      setIsValidToken(false);
    }
  }, []);

  const verifyToken = async (tokenValue: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${tokenValue}`);
      const data = await response.json();
      setIsValidToken(data.valid);
    } catch (error) {
      setIsValidToken(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passworter stimmen nicht uberein",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 8 Zeichen lang sein",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        toast({
          title: "Fehler",
          description: data.message || "Ein Fehler ist aufgetreten",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es spater erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Link wird uberpruft...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <SEO
          title="Ungultiger Link | Corion Lackdoktor"
          description="Der Link zum Zurucksetzen des Passworts ist ungultig oder abgelaufen"
        />
        
        <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-4">Ungultiger Link</h1>
          <p className="text-muted-foreground mb-6">
            Dieser Link ist ungultig oder abgelaufen. Bitte fordern Sie einen neuen Link zum Zurucksetzen des Passworts an.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full mb-4" data-testid="button-request-new">
              Neuen Link anfordern
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full" data-testid="button-back-login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zuruck zur Anmeldung
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <SEO
          title="Passwort geandert | Corion Lackdoktor"
          description="Ihr Passwort wurde erfolgreich geandert"
        />
        
        <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-4">Passwort geandert!</h1>
          <p className="text-muted-foreground mb-6">
            Ihr Passwort wurde erfolgreich geandert. Sie konnen sich jetzt mit Ihrem neuen Passwort anmelden.
          </p>
          <Link href="/login">
            <Button className="w-full" data-testid="button-to-login">
              Zur Anmeldung
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <SEO
        title="Neues Passwort | Corion Lackdoktor"
        description="Legen Sie ein neues Passwort fur Ihr Corion Portal Konto fest"
      />

      <img
        src={logoImage}
        alt="Corion Lackdoktor Logo"
        className="w-40 mb-8"
        data-testid="img-logo"
      />

      <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold font-heading mb-2 text-center">
          Neues Passwort festlegen
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Geben Sie Ihr neues Passwort ein. Es muss mindestens 8 Zeichen lang sein.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Neues Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={8}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Passwort bestatigen</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
                data-testid="input-confirm-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? "Wird gespeichert..." : "Passwort speichern"}
          </Button>
        </form>
      </div>
    </div>
  );
}
