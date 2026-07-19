import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import logoImage from "@assets/image007 (1)_1761130943207.png";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <SEO
          title="E-Mail gesendet | Corion Lackdoktor"
          description="Prufen Sie Ihre E-Mails fur den Link zum Zurucksetzen des Passworts"
        />
        
        <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-4">E-Mail gesendet!</h1>
          <p className="text-muted-foreground mb-6">
            Falls ein Konto mit dieser E-Mail existiert, erhalten Sie in Kurze einen Link zum Zurucksetzen Ihres Passworts.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Prufen Sie auch Ihren Spam-Ordner.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full" data-testid="button-back-to-login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zuruck zur Anmeldung
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <SEO
        title="Passwort vergessen | Corion Lackdoktor"
        description="Setzen Sie Ihr Passwort fur das Corion Portal zuruck"
      />

      <img
        src={logoImage}
        alt="Corion Lackdoktor Logo"
        className="w-40 mb-8"
        data-testid="img-logo"
      />

      <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold font-heading mb-2 text-center">
          Passwort vergessen?
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurucksetzen Ihres Passworts.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">E-Mail-Adresse</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="max@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                data-testid="input-email"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? "Wird gesendet..." : "Link senden"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login">
            <Button variant="ghost" className="text-sm" data-testid="link-back-login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zuruck zur Anmeldung
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
