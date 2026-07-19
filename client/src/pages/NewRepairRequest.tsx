import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { 
  ArrowLeft, 
  Car, 
  Upload, 
  X, 
  Camera,
  AlertCircle,
  MapPin,
  FileText
} from "lucide-react";
import DamageAnalyzer from "@/components/DamageAnalyzer";

const repairRequestSchema = z.object({
  title: z.string().min(5, "Titel muss mindestens 5 Zeichen haben"),
  description: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen haben"),
  vehicleMake: z.string().min(1, "Fahrzeugmarke ist erforderlich"),
  vehicleModel: z.string().min(1, "Fahrzeugmodell ist erforderlich"),
  vehicleYear: z.string().optional(),
  licensePlate: z.string().optional(),
  damageType: z.string().min(1, "Schadensart ist erforderlich"),
  locationId: z.string().optional(),
  priority: z.string().default("normal"),
});

type RepairRequestForm = z.infer<typeof repairRequestSchema>;

const damageTypes = [
  { value: "smart-repair", label: "Smart Repair (Kratzer, Dellen)" },
  { value: "unfallschaden", label: "Unfallschaden" },
  { value: "lackschaden", label: "Lackschäden" },
  { value: "dellenentfernung", label: "Dellenentfernung (PDR)" },
  { value: "felgenreparatur", label: "Felgenreparatur" },
  { value: "rostschaden", label: "Rostschaden" },
  { value: "oldtimer", label: "Oldtimer Restauration" },
  { value: "aufbereitung", label: "Autoaufbereitung" },
  { value: "autoglas", label: "Autoglas" },
  { value: "sonstiges", label: "Sonstiges" },
];

const locations = [
  { value: "hofheim-wallau", label: "Hofheim-Wallau" },
  { value: "mainz-kastel", label: "Mainz-Kastel" },
  { value: "wiesbaden", label: "Wiesbaden" },
];

const carMakes = [
  "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Porsche", "Ford", "Opel",
  "Skoda", "Seat", "Fiat", "Renault", "Peugeot", "Citroën", "Toyota",
  "Honda", "Mazda", "Nissan", "Hyundai", "Kia", "Volvo", "Tesla", "Andere"
];

interface AttachedDocument {
  name: string;
  size: number;
  type: string;
}

export default function NewRepairRequest() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [analysisPerformed, setAnalysisPerformed] = useState(false);

  const form = useForm<RepairRequestForm>({
    resolver: zodResolver(repairRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      licensePlate: "",
      damageType: "",
      locationId: "",
      priority: "normal",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RepairRequestForm) => {
      const res = await apiRequest("POST", "/api/client/repair-requests", {
        ...data,
        photos: uploadedPhotos,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/repair-requests"] });
      toast({
        title: "Anfrage erstellt",
        description: "Ihre Reparaturanfrage wurde erfolgreich übermittelt.",
      });
      navigate("/client");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Anfrage konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const totalCount = uploadedPhotos.length + attachedDocs.length + selectedFiles.length;

    if (totalCount > 40) {
      toast({
        variant: "destructive",
        title: "Zu viele Dateien",
        description: "Maximal 40 Dateien erlaubt.",
      });
      e.target.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    const oversized = selectedFiles.filter(f => f.size > maxSize);
    if (oversized.length > 0) {
      toast({
        variant: "destructive",
        title: "Datei zu groß",
        description: `Max. 50 MB pro Datei. Zu groß: ${oversized.map(f => f.name).join(', ')}`,
      });
      e.target.value = '';
      return;
    }

    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setUploadedPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedDocs((prev) => [...prev, { name: file.name, size: file.size, type: file.type }]);
      }
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDoc = (index: number) => {
    setAttachedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalysisComplete = (result: any) => {
    if (result.suggestedDamageType) {
      form.setValue("damageType", result.suggestedDamageType);
    }
    if (result.suggestedPriority) {
      form.setValue("priority", result.suggestedPriority);
    }
    setAnalysisPerformed(true);
    toast({
      title: "Analyse abgeschlossen",
      description: "Formularfelder wurden mit den erkannten Werten aktualisiert.",
    });
  };

  const onSubmit = (data: RepairRequestForm) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
        title="Neue Reparaturanfrage | Corion Lackdoktor"
        description="Erstellen Sie eine neue Reparaturanfrage für Ihr Fahrzeug"
      />

      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/client">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-heading text-primary" data-testid="text-title">
                Neue Reparaturanfrage
              </h1>
              <p className="text-sm text-muted-foreground">
                Beschreiben Sie den Schaden an Ihrem Fahrzeug
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Fahrzeuginformationen
                </CardTitle>
                <CardDescription>
                  Geben Sie die Details Ihres Fahrzeugs ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleMake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marke *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-make">
                              <SelectValue placeholder="Marke wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carMakes.map((make) => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modell *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. A4, 3er, Golf" {...field} data-testid="input-model" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baujahr</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. 2020" {...field} data-testid="input-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kennzeichen</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. WI-AB 1234" {...field} data-testid="input-plate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Schadensinformationen
                </CardTitle>
                <CardDescription>
                  Beschreiben Sie den Schaden so detailliert wie möglich
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="z.B. Kratzer an der Fahrertür" 
                          {...field} 
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormDescription>Eine kurze Zusammenfassung des Schadens</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="damageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schadensart *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-damage-type">
                            <SelectValue placeholder="Schadensart wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {damageTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ausführliche Beschreibung *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Beschreiben Sie den Schaden möglichst genau. Wo befindet sich der Schaden? Wie ist er entstanden? Welche Größe hat er ungefähr?"
                          className="min-h-32"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dringlichkeit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Dringlichkeit wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Niedrig - Keine Eile</SelectItem>
                          <SelectItem value="normal">Normal - Innerhalb von 2 Wochen</SelectItem>
                          <SelectItem value="high">Hoch - Innerhalb einer Woche</SelectItem>
                          <SelectItem value="urgent">Dringend - So schnell wie möglich</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Fotos hochladen
                </CardTitle>
                <CardDescription>
                  Laden Sie Fotos des Schadens hoch, um eine genauere Einschätzung zu erhalten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/gif,image/bmp,image/tiff,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.zip,.rar"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    data-testid="input-photos"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Klicken Sie hier oder ziehen Sie Dateien hierher
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fotos, PDF, Dokumente - bis 50 MB pro Datei, max. 40 Dateien
                    </p>
                  </label>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-photo-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <DamageAnalyzer
                      photos={uploadedPhotos}
                      damageDescription={form.getValues("description")}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </div>
                )}

                {attachedDocs.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Angehängte Dokumente:</p>
                    {attachedDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">{doc.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">({(doc.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(index)}
                          className="text-destructive hover:text-destructive/80 shrink-0 ml-2"
                          data-testid={`button-remove-doc-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Bevorzugter Standort
                </CardTitle>
                <CardDescription>
                  Wählen Sie den Corion Standort, den Sie bevorzugen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Standort wählen (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Link href="/client">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  Abbrechen
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Wird gesendet..." : "Anfrage senden"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
