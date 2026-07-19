import { useState } from "react";
import ServicePage from "../ServicePage";
import { SmartRepairGalleryModal } from "@/components/SmartRepairGalleryModal";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function SmartRepair() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // todo: remove mock data
  const benefits = [
    "Kostengünstige Alternative zur Komplettlackierung",
    "Schnelle Durchführung in wenigen Stunden",
    "Keine Demontage von Fahrzeugteilen erforderlich",
    "Perfekte Farbabstimmung auf Originallack",
    "Umweltfreundlich durch minimalen Materialeinsatz",
    "Ideal für kleinere Lackschäden und Kratzer",
  ];

  // todo: remove mock data
  const process = [
    "Schadensbegutachtung und Kostenvoranschlag",
    "Vorbereitung der beschädigten Stelle",
    "Farbabstimmung mit Originallack",
    "Professionelle Spot-Reparatur",
    "Polieren und Versiegeln",
    "Qualitätskontrolle und Übergabe",
  ];

  return (
    <>
      <ServicePage
        title="Smart Repair (Spot Repair)"
        description="Schnelle und kostengünstige Reparatur kleiner Lackschäden ohne komplette Neulackierung. Express-Service oft am selben Tag. Bis zu 60% günstiger als Komplettlackierung."
        image={paintImage}
        benefits={benefits}
        process={process}
        pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
        slug="smart-repair"
        keywords="smart repair hofheim, spot repair wiesbaden, kratzer reparieren, steinschlag reparatur, lack ausbessern, kleine lackschäden, schnelle reparatur, corion lackdoktor"
        priceRange="€-€€"
        additionalContent={
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
            <h3 className="text-2xl font-bold mb-4">Unsere Smart Repair Projekte</h3>
            <p className="text-muted-foreground mb-6">
              Entdecken Sie 24 Fotos unserer professionellen Smart Repair Arbeiten. Von kleinen Kratzern 
              bis zu präzisen Spot-Reparaturen – sehen Sie die Qualität unserer schnellen und kostengünstigen Lösungen.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsGalleryOpen(true)}
              data-testid="button-view-gallery"
            >
              <Images className="mr-2 w-5 h-5" />
              Galerie ansehen (24 Fotos)
            </Button>
          </div>
        }
      />
      
      <SmartRepairGalleryModal 
        open={isGalleryOpen} 
        onOpenChange={setIsGalleryOpen}
      />
    </>
  );
}
