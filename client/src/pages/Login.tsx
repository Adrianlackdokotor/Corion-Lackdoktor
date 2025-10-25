import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import logoImage from "@assets/image007 (1)_1761130943207.png";
import { Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mailadresse"),
  password: z.string().min(1, "Passwort erforderlich"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Auto-redirect to admin if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Erfolgreich eingeloggt",
        description: "Willkommen zurück!",
      });
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Anmeldung fehlgeschlagen",
        description: error.message || "E-Mailadresse oder Passwort ist falsch",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <SEO
        title="Log In | Corion Lackdoktor Management"
        description="Melden Sie sich bei Ihrem Corion Lackdoktor Management-Konto an"
      />

      {/* Logo */}
      <img
        src={logoImage}
        alt="Corion Lackdoktor Logo"
        className="w-40 mb-8"
        data-testid="img-logo"
      />

      {/* Welcome Text */}
      <h1 className="text-3xl font-bold font-heading mb-8 text-center text-[#C00020]">
        Willkommen bei +1 Corion Management
      </h1>

      {/* Login Form */}
      <div className="bg-card rounded-2xl shadow-lg border p-8 w-full max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">E-Mailadresse</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                      className="bg-muted"
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Passwort</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                        className="bg-muted pl-10"
                        autoComplete="current-password"
                        data-testid="input-password"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="accent-[#C00020]"
                        data-testid="checkbox-remember"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal cursor-pointer">
                      Angemeldet bleiben
                    </FormLabel>
                  </FormItem>
                )}
              />
              <a
                href="#"
                className="text-[#C00020] hover:underline"
                data-testid="link-forgot-password"
              >
                Passwort vergessen?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#C00020] hover:bg-[#e31536] text-white font-heading font-semibold"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Wird eingeloggt..." : "Einloggen"}
            </Button>

            <p className="text-center text-muted-foreground text-sm mt-4">
              Noch kein Konto?{" "}
              <a href="/register" className="text-[#C00020] hover:underline" data-testid="link-register">
                Jetzt registrieren
              </a>
            </p>
          </form>
        </Form>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 opacity-5 pointer-events-none hidden md:block">
        <div className="w-full h-full bg-[#C00020] rounded-tl-full"></div>
      </div>
    </div>
  );
}
