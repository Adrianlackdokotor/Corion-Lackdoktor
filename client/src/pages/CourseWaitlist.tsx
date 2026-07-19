import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";

const waitlistSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().optional(),
  experience: z.string().min(10, "Bitte erzählen Sie uns ein wenig über Ihre Erfahrung"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export default function CourseWaitlist() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/waitlist/polishing-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          experience: data.experience,
          course: "kratzerpolitur-kurs",
        }),
      });
      
      const result = await response.json();
      
      if (result.status === "success" || response.ok) {
        setIsSuccess(true);
        reset();
        toast({
          title: "Erfolgreich angemeldet!",
          description: "Sie erhalten in Kürze eine Bestätigungsmail. Wir informieren Sie, sobald der nächste Kurs startet!",
        });
      } else {
        throw new Error(result.message || "Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Waitlist submission error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Es gab ein Problem. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO 
        title="Warteliste - Kratzerpolitur Kurs | Corion Academy"
        description="Melden Sie sich zur Warteliste für den Online-Kurs 'Kratzerpolitur am Auto' an. Nur 39€. Professionelle Anleitung von Lackdoktor Adrian Apostol."
      />

      <main className="min-h-screen bg-background py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isSuccess ? (
            <>
              <div className="mb-8">
                <Link href="/academy/kratzerpolitur-kurs">
                  <Button variant="ghost" className="mb-6">
                    ← Zurück zum Kurs
                  </Button>
                </Link>

                <h1 className="text-4xl font-heading font-bold mb-4">
                  Warteliste für Kratzerpolitur Kurs
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Sichern Sie sich Ihren Platz für den nächsten Kurs. Sie erhalten eine E-Mail-Benachrichtigung, wenn der Kurs startet.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-8" data-testid="form-waitlist">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ihr vollständiger Name"
                    className="mt-1"
                    data-testid="input-waitlist-name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="ihre.email@beispiel.de"
                    className="mt-1"
                    data-testid="input-waitlist-email"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefon (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+49 123 456789"
                    className="mt-1"
                    data-testid="input-waitlist-phone"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Ihre Erfahrung mit Fahrzeugaufbereitung *</Label>
                  <Textarea
                    id="experience"
                    {...register("experience")}
                    placeholder="Z.B.: Anfänger, der seine Fähigkeiten verbessern möchte / Professionelle Werkstatt..."
                    className="mt-1 min-h-[100px]"
                    data-testid="input-waitlist-experience"
                    disabled={isSubmitting}
                  />
                  {errors.experience && (
                    <p className="text-sm text-destructive mt-1">{errors.experience.message}</p>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Kursdetails:</strong> Online • 4,5 Stunden • 39€ • Zugang zur Private Community
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  data-testid="button-submit-waitlist"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird angemeldet...
                    </>
                  ) : (
                    "Zur Warteliste hinzufügen"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="max-w-xl mx-auto text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
              </div>

              <h1 className="text-3xl font-heading font-bold mb-4">
                Erfolgreich angemeldet!
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Vielen Dank für Ihre Anmeldung zur Warteliste. Sie erhalten in Kürze eine Bestätigungsmail unter der angegebenen E-Mail-Adresse.
              </p>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                <p className="text-green-900 dark:text-green-100">
                  ✓ Wir informieren Sie per E-Mail, sobald der nächste Kurs startet
                </p>
                <p className="text-green-900 dark:text-green-100 mt-2">
                  ✓ Sie können später jederzeit den Kurs buchen
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/academy">
                  <Button variant="outline">
                    Zurück zur Academy
                  </Button>
                </Link>
                <Link href="/">
                  <Button>
                    Zur Startseite
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
