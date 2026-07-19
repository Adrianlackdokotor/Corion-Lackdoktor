import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";
import { useDynamicIntelligence } from "@/hooks/useDynamicIntelligence";
import { useLanguage } from "@/i18n/LanguageContext";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().optional(),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [hasInteractedWithForm, setHasInteractedWithForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const { toast } = useToast();
  const { trackFormStart, trackFormComplete, triggerAIAction, trackClick } = useDynamicIntelligence();
  const { t } = useLanguage();
  
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
      const base64Files = await Promise.all(files.map(f => {
        return new Promise<{ name: string; type: string; data: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            resolve({ name: f.name, type: f.type, data: base64, size: f.size });
          };
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      }));
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          telefon: data.phone || '',
          nachricht: data.message,
          files: base64Files.length > 0 ? base64Files : undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        trackFormComplete('contact');
        trackClick('submit_contact_form', files.length > 0 ? 'with_files' : 'without_files');
        
        toast({
          title: t("common.success"),
          description: result.message || t("contact.form.successMessage"),
        });
        
        reset();
        setFiles([]);
        setHasInteractedWithForm(false);
      } else {
        throw new Error(result.message || t("common.error"));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("contact.form.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      const totalFiles = [...files, ...selectedFiles];
      if (totalFiles.length > 40) {
        toast({
          title: t("common.error"),
          description: "Maximal 40 Dateien erlaubt.",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      const maxSize = 50 * 1024 * 1024;
      const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast({
          title: t("common.error"),
          description: `${t("contact.form.fileTooLarge")}: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="form-contact">
      {/* Quick CTA - Photo Option */}
      {!showFullForm && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center mb-6">
          <p className="font-semibold mb-4">{t("contact.form.quickMethod")}</p>
          <a href="https://wa.me/4917683458274?text=Hallo!%20Ich%20möchte%20ein%20Angebot%20für%20mein%20Auto%20erhalten." target="_blank" rel="noopener noreferrer" className="block">
            <Button size="lg" className="w-full mb-4" data-testid="button-whatsapp-quick">
              {t("contact.form.whatsappQuick")}
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mb-4">{t("contact.form.orFillForm")}</p>
        </div>
      )}

      <div>
        <Label htmlFor="name">{t("contact.form.name")}</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder={t("contact.form.namePlaceholder")}
          className="mt-1"
          data-testid="input-name"
          onFocus={() => {
            handleFormInteraction();
            setShowFullForm(true);
          }}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">{t("contact.form.email")}</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder={t("contact.form.emailPlaceholder")}
          className="mt-1"
          data-testid="input-email"
          onFocus={() => {
            handleFormInteraction();
            setShowFullForm(true);
          }}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      {showFullForm && (
        <>
          <div>
            <Label htmlFor="phone">{t("contact.form.phone")}</Label>
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
            <Label htmlFor="message">{t("contact.form.message")}</Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder={t("contact.form.messagePlaceholder")}
              className="mt-1 min-h-[80px]"
              data-testid="input-message"
              onFocus={handleFormInteraction}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
            )}
          </div>
        </>
      )}

      {showFullForm && (
        <div>
          <Label htmlFor="files">{t("contact.form.files")}</Label>
          <div className="mt-1 border-2 border-dashed rounded-md p-6 text-center hover-elevate transition-colors">
            <input
              id="files"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/gif,image/bmp,image/tiff,image/svg+xml,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt,.ods,.ppt,.pptx,.zip,.rar,.7z"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file"
              disabled={isSubmitting}
            />
            <label htmlFor="files" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("contact.form.uploadClick")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("contact.form.uploadFormats")}
              </p>
              {files.length > 0 && (
                <p className="text-sm text-primary mt-2">
                  {files.length} {t("contact.form.filesSelected")} (max. 40)
                </p>
              )}
            </label>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-1" data-testid="container-file-list">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-sm p-1.5 rounded bg-muted/50">
                  <span className="truncate flex-1 text-muted-foreground" data-testid={`text-filename-${idx}`}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground shrink-0"
                    data-testid={`button-remove-file-${idx}`}
                    aria-label={`${file.name} entfernen`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            {t("contact.form.sending")}
          </>
        ) : (
          t("contact.form.submit")
        )}
      </Button>
    </form>
  );
}
