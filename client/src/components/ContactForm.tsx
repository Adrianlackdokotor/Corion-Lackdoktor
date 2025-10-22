import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { useDynamicIntelligence } from "@/hooks/useDynamicIntelligence";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().min(5, "Bitte geben Sie eine gültige Telefonnummer ein"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [hasInteractedWithForm, setHasInteractedWithForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { trackFormStart, trackFormComplete, triggerAIAction, trackClick } = useDynamicIntelligence();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const handleFormInteraction = () => {
    if (!hasInteractedWithForm) {
      setHasInteractedWithForm(true);
      trackFormStart('contact');
      triggerAIAction('seeking_quote');
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData with PHP field names
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('telefon', data.phone);  // PHP expects 'telefon'
      formData.append('nachricht', data.message);  // PHP expects 'nachricht'
      
      // Add files if any
      files.forEach((file) => {
        formData.append('files[]', file);
      });
      
      // Submit to PHP endpoint
      const response = await fetch('/send_form.php', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        trackFormComplete('contact');
        trackClick('submit_contact_form', files.length > 0 ? 'with_files' : 'without_files');
        
        toast({
          title: "✅ Anfrage gesendet!",
          description: result.message || "Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.",
        });
        
        reset();
        setFiles([]);
        setHasInteractedWithForm(false);
      } else {
        throw new Error(result.message || 'Fehler beim Senden');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        title: "❌ Fehler",
        description: error instanceof Error ? error.message : "Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an: 0176 834 582 74",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="form-contact">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ihr Name"
          className="mt-1"
          data-testid="input-name"
          onFocus={handleFormInteraction}
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
          data-testid="input-email"
          onFocus={handleFormInteraction}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Telefon *</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+49 123 456789"
          className="mt-1"
          data-testid="input-phone"
          onFocus={handleFormInteraction}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message">Ihre Nachricht *</Label>
        <Textarea
          id="message"
          {...register("message")}
          placeholder="Beschreiben Sie Ihr Anliegen..."
          className="mt-1 min-h-[120px]"
          data-testid="input-message"
          onFocus={handleFormInteraction}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="files">Fotos anhängen (optional)</Label>
        <div className="mt-1 border-2 border-dashed rounded-md p-6 text-center hover-elevate transition-colors">
          <input
            id="files"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-file"
            disabled={isSubmitting}
          />
          <label htmlFor="files" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Klicken Sie hier, um Fotos hochzuladen
            </p>
            {files.length > 0 && (
              <p className="text-sm text-primary mt-2">
                {files.length} Datei(en) ausgewählt
              </p>
            )}
          </label>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        data-testid="button-submit-contact"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          "Anfrage senden"
        )}
      </Button>
    </form>
  );
}
