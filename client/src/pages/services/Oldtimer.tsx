import { useState } from "react";
import ServicePage from "../ServicePage";
import { OldtimerGalleryModal } from "@/components/OldtimerGalleryModal";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import oldtimerImage from "@assets/generated_images/Classic_car_restoration_image_360d4f59.png";

export default function Oldtimer() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const benefits = [
    "Liebevolle Restaurierung klassischer Fahrzeuge",
    "Erfahrung mit historischen Lackierungen",
    "Originalgetreue Farbabstimmung",
    "Blecharbeiten nach klassischem Handwerk",
    "Beratung für werterhaltende Maßnahmen",
    "Leidenschaft für Oldtimer seit über 20 Jahren",
  ];

  const process = [
    "Begutachtung und Beratung",
    "Demontage und Dokumentation",
    "Blecharbeiten und Entrostung",
    "Grundierung und Aufbau",
    "Lackierung in Originaltechnik",
    "Montage und Detailarbeiten",
  ];

  return (
    <>
      <ServicePage
        title="Oldtimer Restaurierung"
        description="Professionelle und liebevolle Restaurierung klassischer Fahrzeuge mit Expertise und Leidenschaft. Über 20 Jahre Erfahrung und 41+ dokumentierte Projekte."
        image={oldtimerImage}
        benefits={benefits}
        process={process}
        pricing="Individuell"
        slug="oldtimer"
        keywords="oldtimer restaurierung hofheim, klassiker lackieren wiesbaden, youngtimer aufarbeiten, oldtimer lackierung mainz, vintage auto reparatur, corion lackdoktor"
        priceRange="€€€"
        additionalContent={
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
            <h3 className="text-2xl font-bold mb-4">Unsere Oldtimer-Projekte</h3>
            <p className="text-muted-foreground mb-6">
              Entdecken Sie 41 Fotos unserer liebevoll restaurierten Klassiker. Von der ersten Begutachtung 
              bis zum fertigen Meisterwerk – sehen Sie unsere Leidenschaft für historische Fahrzeuge.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsGalleryOpen(true)}
              data-testid="button-view-gallery"
            >
              <Images className="mr-2 w-5 h-5" />
              Galerie ansehen (41 Fotos)
            </Button>
          </div>
        }
      />
      
      <OldtimerGalleryModal 
        open={isGalleryOpen} 
        onOpenChange={setIsGalleryOpen}
      />
    </>
  );
}
