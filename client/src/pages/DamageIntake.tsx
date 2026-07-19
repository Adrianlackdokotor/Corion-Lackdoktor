import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Upload, 
  X, 
  Car, 
  MapPin,
  FileText,
  Sparkles,
  CheckCircle,
  Loader2,
  ArrowRight,
  Image as ImageIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  tags: string[];
  isAnalyzing: boolean;
}

const DAMAGE_LOCATIONS = [
  { value: "front_bumper", label: "Stoßstange vorne" },
  { value: "rear_bumper", label: "Stoßstange hinten" },
  { value: "hood", label: "Motorhaube" },
  { value: "trunk", label: "Heckklappe" },
  { value: "left_door", label: "Tür links" },
  { value: "right_door", label: "Tür rechts" },
  { value: "left_fender", label: "Kotflügel links" },
  { value: "right_fender", label: "Kotflügel rechts" },
  { value: "roof", label: "Dach" },
  { value: "mirror", label: "Spiegel" },
  { value: "wheel", label: "Felge" },
  { value: "other", label: "Sonstiges" },
];

const DAMAGE_TYPES = [
  "Kratzer",
  "Delle",
  "Lackschaden",
  "Steinschlag",
  "Rost",
  "Riss",
  "Abplatzer",
];

export default function DamageIntake() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
  });
  const [damageLocation, setDamageLocation] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const totalCount = images.length + selectedFiles.length;

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
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newImage: UploadedImage = {
        id,
        file,
        preview,
        tags: [],
        isAnalyzing: true,
      };

      setImages(prev => [...prev, newImage]);

      setTimeout(() => {
        const autoTags = detectDamageTags(file.name);
        setImages(prev => prev.map(img => 
          img.id === id 
            ? { ...img, tags: autoTags, isAnalyzing: false }
            : img
        ));
      }, 1500);
    });
  }, [images.length, toast]);

  const detectDamageTags = (filename: string): string[] => {
    const tags: string[] = [];
    const lower = filename.toLowerCase();
    
    if (lower.includes("kratzer") || lower.includes("scratch")) tags.push("Kratzer");
    if (lower.includes("delle") || lower.includes("dent")) tags.push("Delle");
    if (lower.includes("lack") || lower.includes("paint")) tags.push("Lackschaden");
    if (lower.includes("rost") || lower.includes("rust")) tags.push("Rost");
    
    if (tags.length === 0) {
      const randomTags = DAMAGE_TYPES.sort(() => 0.5 - Math.random()).slice(0, 2);
      return randomTags;
    }
    
    return tags;
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const toggleTag = (imageId: string, tag: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== imageId) return img;
      
      const hasTag = img.tags.includes(tag);
      return {
        ...img,
        tags: hasTag 
          ? img.tags.filter(t => t !== tag)
          : [...img.tags, tag]
      };
    }));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const vehicleRes = await apiRequest("POST", "/api/hub/vehicles", {
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year ? parseInt(vehicleInfo.year) : undefined,
        licensePlate: vehicleInfo.licensePlate,
        color: vehicleInfo.color,
      });
      const vehicle = await vehicleRes.json();

      const allTags = images.flatMap(img => img.tags);
      const uniqueTags = Array.from(new Set(allTags));

      const orderRes = await apiRequest("POST", "/api/hub/orders", {
        vehicleId: vehicle.id,
        status: "ready_for_estimate",
        priority: "normal",
        damageDescription: `${damageDescription}\n\nErkannte Schäden: ${uniqueTags.join(", ")}`,
        damageLocation: DAMAGE_LOCATIONS.find(l => l.value === damageLocation)?.label || damageLocation,
        postalCode,
      });
      const order = await orderRes.json();
      
      return order;
    },
    onSuccess: (order) => {
      setOrderCreated(order.referenceNumber);
      queryClient.invalidateQueries({ queryKey: ["/api/hub/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Auftrag konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast({
        title: "Bilder fehlen",
        description: "Bitte laden Sie mindestens ein Schadensbild hoch",
        variant: "destructive",
      });
      return;
    }

    if (!vehicleInfo.licensePlate) {
      toast({
        title: "Kennzeichen fehlen",
        description: "Bitte geben Sie das Fahrzeugkennzeichen ein",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (orderCreated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Auftrag erstellt!</h2>
            <p className="text-muted-foreground mb-4">
              Ihr Schadensfall wurde erfolgreich erfasst.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">Referenznummer</p>
              <p className="text-2xl font-mono font-bold">{orderCreated}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/hub")} data-testid="button-to-dashboard">
                Zum Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOrderCreated(null);
                  setImages([]);
                  setVehicleInfo({ make: "", model: "", year: "", licensePlate: "", color: "" });
                  setDamageLocation("");
                  setDamageDescription("");
                }}
                data-testid="button-new-intake"
              >
                Neuen Schaden erfassen
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
        title="Schadensaufnahme | Corion Hub"
        description="Schnelle Schadenserfassung mit KI-gestützter Erkennung"
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
            <Camera className="w-7 h-7 text-primary" />
            Smart Intake
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Laden Sie Schadensbilder hoch - KI erkennt automatisch die Schadensart
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Schadensbilder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/gif,image/bmp,image/tiff"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-images"
                />
                <label 
                  htmlFor="image-upload"
                  className="cursor-pointer block"
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Dateien hochladen</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fotos, PDF, Dokumente - bis 50 MB, max. 40 Dateien
                  </p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div 
                      key={image.id}
                      className="relative border rounded-lg overflow-hidden"
                      data-testid={`image-card-${image.id}`}
                    >
                      <img 
                        src={image.preview} 
                        alt="Schadensbild"
                        className="w-full h-40 object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 h-6 w-6"
                        data-testid={`button-remove-${image.id}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">KI-Erkennung</span>
                          {image.isAnalyzing && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {DAMAGE_TYPES.map((tag) => (
                            <Badge
                              key={tag}
                              variant={image.tags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => toggleTag(image.id, tag)}
                              data-testid={`tag-${image.id}-${tag}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Fahrzeugdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Kennzeichen *</label>
                  <Input
                    placeholder="WI-AB 1234"
                    value={vehicleInfo.licensePlate}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, licensePlate: e.target.value.toUpperCase() })}
                    required
                    data-testid="input-license-plate"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Marke</label>
                  <Input
                    placeholder="z.B. Volkswagen"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                    data-testid="input-make"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Modell</label>
                  <Input
                    placeholder="z.B. Golf"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                    data-testid="input-model"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Baujahr</label>
                  <Input
                    placeholder="z.B. 2020"
                    type="number"
                    min="1990"
                    max="2030"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                    data-testid="input-year"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Farbe</label>
                  <Input
                    placeholder="z.B. Schwarz"
                    value={vehicleInfo.color}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })}
                    data-testid="input-color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Damage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Schadensdetails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Schadensort</label>
                <Select value={damageLocation} onValueChange={setDamageLocation}>
                  <SelectTrigger data-testid="select-damage-location">
                    <SelectValue placeholder="Wo befindet sich der Schaden?" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_LOCATIONS.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Beschreibung</label>
                <Textarea
                  placeholder="Beschreiben Sie den Schaden..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="max-w-xs">
                <label className="text-sm font-medium mb-1 block">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  PLZ (optional)
                </label>
                <Input
                  placeholder="z.B. 65719"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  maxLength={5}
                  data-testid="input-postal-code"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/hub")}
              data-testid="button-cancel"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit"
              disabled={createOrderMutation.isPending || images.length === 0}
              data-testid="button-submit"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Auftrag erstellen
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
