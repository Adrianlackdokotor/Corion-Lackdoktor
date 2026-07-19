import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  X,
  Car,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic,.gif,.bmp,.tiff,.pdf,.doc,.docx";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif", "image/bmp", "image/tiff"];
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

function getLandingHomeUrl(): string {
  const hostname = window.location.hostname.toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  return isLocal ? "/" : "https://corion.app/";
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string | null;
  isImage: boolean;
}

const STEPS = [
  { number: 1, label: "Kontakt" },
  { number: 2, label: "Fahrzeug / Kontext" },
  { number: 3, label: "Fotos / Dokumente" },
  { number: 4, label: "Problem / Ziel" },
];

const JOURNEY_TYPES = [
  { value: "leasing_return", label: "Leasing-Rückgabe" },
  { value: "cosmetic_repair", label: "Kosmetische Reparatur" },
  { value: "sale_prep", label: "Vor Verkauf aufbereiten" },
  { value: "accident", label: "Unfallschaden / größerer Schaden" },
  { value: "fleet", label: "Flotte / Firmenfahrzeug" },
  { value: "inspection", label: "Ich brauche zuerst nur eine Einschätzung" },
  { value: "other", label: "Etwas anderes" },
] as const;

const CUSTOMER_PRIORITIES = [
  { value: "save_money", label: "Kosten sparen" },
  { value: "speed", label: "Schnell erledigen" },
  { value: "safe_return", label: "Sichere Rückgabe / wenig Risiko" },
  { value: "quality", label: "Saubere hochwertige Reparatur" },
  { value: "guidance", label: "Ich brauche erstmal Orientierung" },
] as const;

export default function ClientSubmission() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [journeyType, setJourneyType] = useState<(typeof JOURNEY_TYPES)[number]["value"] | "">("");
  const [customerPriority, setCustomerPriority] = useState<(typeof CUSTOMER_PRIORITIES)[number]["value"] | "">("");
  const [preferredContact, setPreferredContact] = useState("whatsapp");
  const [desiredTiming, setDesiredTiming] = useState("");

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [damageDescription, setDamageDescription] = useState("");

  const [successData, setSuccessData] = useState<{
    referenceNumber: string;
  } | null>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles = Array.from(incoming);
      const totalCount = files.length + newFiles.length;

      if (totalCount > MAX_FILES) {
        toast({
          variant: "destructive",
          title: "Zu viele Dateien",
          description: `Maximal ${MAX_FILES} Dateien erlaubt. Sie haben bereits ${files.length}.`,
        });
        return;
      }

      const oversized = newFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        toast({
          variant: "destructive",
          title: "Datei zu gross",
          description: `Maximale Groesse: 10 MB pro Datei. Zu gross: ${oversized.map((f) => f.name).join(", ")}`,
        });
        return;
      }

      const totalSize = [...files.map((f) => f.file), ...newFiles]
        .reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        toast({
          variant: "destructive",
          title: "Upload zu gross",
          description: "Alle Dateien zusammen dürfen maximal 50 MB gross sein.",
        });
        return;
      }

      const mapped: UploadedFile[] = newFiles.map((file) => {
        const isImage = IMAGE_TYPES.includes(file.type);
        return {
          id: Math.random().toString(36).substring(2, 10),
          file,
          preview: isImage ? URL.createObjectURL(file) : null,
          isImage,
        };
      });

      setFiles((prev) => [...prev, ...mapped]);
    },
    [files.length, toast]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const hasReachableContact = customerEmail.trim().length > 0 || customerPhone.trim().length > 0;

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return hasReachableContact;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return damageDescription.trim().length > 0 && hasReachableContact;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!canProceed(currentStep)) {
      toast({
        variant: "destructive",
        title: "Pflichtfelder ausfuellen",
        description: "Bitte fuellen Sie alle Pflichtfelder aus.",
      });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!canProceed(4)) {
      toast({
        variant: "destructive",
        title: "Beschreibung fehlt",
        description: "Bitte beschreiben Sie den Schaden.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const base64Files = await Promise.all(files.map(f => {
        return new Promise<{ name: string; type: string; data: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            resolve({ name: f.file.name, type: f.file.type, data: base64, size: f.file.size });
          };
          reader.onerror = reject;
          reader.readAsDataURL(f.file);
        });
      }));

      const structuredDescription = [
        `Kontext: ${journeyType || "nicht angegeben"}`,
        `Priorität: ${customerPriority || "nicht angegeben"}`,
        `Bevorzugter Kontakt: ${preferredContact || "nicht angegeben"}`,
        desiredTiming.trim() ? `Wunschtermin / Timing: ${desiredTiming.trim()}` : null,
        "",
        "Kundenbeschreibung:",
        damageDescription.trim(),
      ].filter(Boolean).join("\n");

      const res = await fetch("/api/client/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || "Unbekannt",
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          damageDescription: structuredDescription,
          journeyType: journeyType || undefined,
          customerPriority: customerPriority || undefined,
          preferredContact: preferredContact || undefined,
          desiredTiming: desiredTiming.trim() || undefined,
          vehicleMake: vehicleMake.trim() || undefined,
          vehicleModel: vehicleModel.trim() || undefined,
          vehiclePlate: vehiclePlate.trim(),
          vehicleColor: vehicleColor.trim() || undefined,
          files: base64Files,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Unbekannter Fehler" }));
        throw new Error(err.message);
      }

      const data = await res.json();

      setSuccessData({
        referenceNumber: data.order?.referenceNumber || data.intakeResult?.referenceNumber || "---",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message || "Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SEO
          title="Anfrage gesendet | Corion Lackdoktor"
          description="Ihre Reparaturanfrage wurde erfolgreich gesendet."
        />
        <Card className="max-w-lg w-full text-center" data-testid="card-success">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold heading" data-testid="text-success-title">
              Anfrage erfolgreich gesendet!
            </h2>
            <p className="text-muted-foreground" data-testid="text-success-message">
              Wir melden uns in Kuerze bei Ihnen.
            </p>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Referenznummer</p>
              <p className="text-2xl font-mono font-bold" data-testid="text-reference-number">
                {successData.referenceNumber}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessData(null);
                  setCurrentStep(1);
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                  setVehiclePlate("");
                  setVehicleMake("");
                  setVehicleModel("");
                  setVehicleColor("");
                  setJourneyType("");
                  setCustomerPriority("");
                  setPreferredContact("whatsapp");
                  setDesiredTiming("");
                  setFiles([]);
                  setDamageDescription("");
                }}
                data-testid="button-new-request"
              >
                Neue Anfrage stellen
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.assign(getLandingHomeUrl())}
                data-testid="button-to-home"
              >
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Reparaturanfrage stellen | Corion Lackdoktor"
        description="Stellen Sie eine Reparaturanfrage mit Fotos und Schadensbeschreibung. Schnell, einfach und unverbindlich."
      />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold heading flex items-center gap-3" data-testid="text-page-title">
            <Camera className="w-7 h-7 text-primary" />
            Reparatur anfragen
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Schicken Sie uns einfach kurz Ihr Problem und gern ein paar Fotos. Kein Login nötig. Ihre Kontaktdaten brauchen wir nur, damit wir Ihnen antworten können.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8" data-testid="progress-indicator">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step) => (
              <div key={step.number} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground border-primary"
                      : currentStep > step.number
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-muted text-muted-foreground border-muted-foreground/30"
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  currentStep >= step.number ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Contact info */}
        {currentStep === 1 && (
          <Card className="hover-elevate" data-testid="card-step-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                So erreichen wir Sie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name (optional)</label>
                <Input
                  placeholder="Wie dürfen wir Sie ansprechen?"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-Mail (optional)
                </label>
                <Input
                  type="email"
                  placeholder="Falls Sie lieber per E-Mail antworten möchten"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  data-testid="input-customer-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon / WhatsApp (optional)
                </label>
                <Input
                  type="tel"
                  placeholder="Am besten die Nummer, unter der wir Ihnen kurz antworten können"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  data-testid="input-customer-phone"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mindestens E-Mail oder Telefon/WhatsApp reicht. Den Rest können wir später klären.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Vehicle info */}
        {currentStep === 2 && (
          <Card className="hover-elevate" data-testid="card-step-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Fahrzeug und Kontext
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Kennzeichen (optional)</label>
                  <Input
                    placeholder="z.B. WI-AB 1234"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    data-testid="input-vehicle-plate"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Worum geht es? (optional)</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={journeyType}
                    onChange={(e) => setJourneyType(e.target.value as any)}
                    data-testid="select-journey-type"
                  >
                    <option value="">Bitte wählen</option>
                    {JOURNEY_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Marke (optional)</label>
                  <Input
                    placeholder="z.B. Volkswagen"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    data-testid="input-vehicle-make"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Modell (optional)</label>
                  <Input
                    placeholder="z.B. Golf"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    data-testid="input-vehicle-model"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Farbe (optional)</label>
                  <Input
                    placeholder="z.B. Schwarz"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    data-testid="input-vehicle-color"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Was ist Ihnen am wichtigsten?</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={customerPriority}
                    onChange={(e) => setCustomerPriority(e.target.value as any)}
                    data-testid="select-customer-priority"
                  >
                    <option value="">Bitte wählen</option>
                    {CUSTOMER_PRIORITIES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bevorzugter Kontakt</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    data-testid="select-preferred-contact"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Telefon</option>
                    <option value="email">E-Mail</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Wann brauchen Sie Hilfe?</label>
                  <Input
                    placeholder="z.B. diese Woche / vor Leasing-Rückgabe / so schnell wie möglich"
                    value={desiredTiming}
                    onChange={(e) => setDesiredTiming(e.target.value)}
                    data-testid="input-desired-timing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: File upload */}
        {currentStep === 3 && (
          <Card className="hover-elevate" data-testid="card-step-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Fotos und Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                data-testid="dropzone-files"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Fotos oder Dokumente hochladen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Am besten Übersicht + Nahaufnahme. Auch PDFs/Dokumente sind möglich. Max. {MAX_FILES} Dateien, max. 10 MB pro Datei und 50 MB insgesamt.
                </p>
              </div>

              {files.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2" data-testid="text-file-count">
                    {files.length} / {MAX_FILES} Dateien hochgeladen
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className="relative border rounded-lg overflow-visible group"
                        data-testid={`file-card-${f.id}`}
                      >
                        {f.isImage && f.preview ? (
                          <img
                            src={f.preview}
                            alt={f.file.name}
                            className="w-full h-24 object-cover rounded-t-lg"
                            data-testid={`file-preview-${f.id}`}
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted flex items-center justify-center rounded-t-lg">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2">
                          <p
                            className="text-xs truncate text-muted-foreground"
                            title={f.file.name}
                            data-testid={`file-name-${f.id}`}
                          >
                            {f.file.name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          onClick={() => removeFile(f.id)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          data-testid={`button-remove-file-${f.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Damage description */}
        {currentStep === 4 && (
          <Card className="hover-elevate" data-testid="card-step-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Problem und Ziel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Beschreiben Sie kurz Ihr Problem *
                </label>
                <Textarea
                  placeholder="Beschreiben Sie kurz, was passiert ist, was Sie befürchten oder was Sie erreichen möchten. Zum Beispiel: Leasing-Rückgabe in 10 Tagen, kleine Schramme hinten rechts, ich möchte wissen ob man das günstig reparieren kann."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={6}
                  data-testid="input-damage-description"
                />
              </div>

              {/* Summary before submit */}
              <div className="bg-muted p-4 rounded-lg space-y-2" data-testid="card-summary">
                <p className="font-semibold text-sm">Zusammenfassung</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span data-testid="summary-name">{customerName || "-"}</span>
                  <span className="text-muted-foreground">E-Mail:</span>
                  <span data-testid="summary-email">{customerEmail || "-"}</span>
                  {customerPhone && (
                    <>
                      <span className="text-muted-foreground">Telefon:</span>
                      <span data-testid="summary-phone">{customerPhone}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Kennzeichen:</span>
                  <span data-testid="summary-plate">{vehiclePlate}</span>
                  <span className="text-muted-foreground">Anliegen:</span>
                  <span data-testid="summary-journey-type">{JOURNEY_TYPES.find((x) => x.value === journeyType)?.label || "-"}</span>
                  {vehicleMake && (
                    <>
                      <span className="text-muted-foreground">Fahrzeug:</span>
                      <span data-testid="summary-vehicle">
                        {[vehicleMake, vehicleModel].filter(Boolean).join(" ")}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">Priorität:</span>
                  <span data-testid="summary-priority">{CUSTOMER_PRIORITIES.find((x) => x.value === customerPriority)?.label || "-"}</span>
                  <span className="text-muted-foreground">Kontakt:</span>
                  <span data-testid="summary-contact">{preferredContact}</span>
                  <span className="text-muted-foreground">Dateien:</span>
                  <span data-testid="summary-files">{files.length} Datei(en)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4 mt-6" data-testid="navigation-buttons">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={prevStep} data-testid="button-prev-step">
              Zurueck
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={!canProceed(currentStep)} data-testid="button-next-step">
              Weiter
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed(4)}
              data-testid="button-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Kostenfrei anfragen
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
