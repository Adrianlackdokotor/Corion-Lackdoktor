// Gallery Photos - Combined collection from all services
import { oldtimerPhotos } from "./oldtimerGallery";
import { smartRepairPhotos } from "./smartRepairGallery";
import { unfallschaedenPhotos } from "./unfallschaedenGallery";
import { sportwagenPhotos } from "./sportwagenGallery";

// Import additional service images
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";
import dentImage from "@assets/generated_images/Dent_removal_service_image_b9ce6b23.png";
import wheelImage from "@assets/felgenreparatur-vorher-nachher-corion-lackdoktor-hofheim_1761382288902.png";
import detailImage from "@assets/generated_images/Auto_detailing_service_image_222c746b.png";
import workshopImage from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";

export interface GalleryPhoto {
  src: string;
  alt: string;
  title: string;
  category: string;
}

// Convert oldtimer photos to gallery format
const oldtimerGalleryPhotos: GalleryPhoto[] = oldtimerPhotos.map((photo, index) => ({
  src: photo.src,
  alt: photo.alt,
  title: photo.title || `Oldtimer Projekt ${index + 1}`,
  category: "Oldtimer"
}));

// Convert smart repair photos to gallery format
const smartRepairGalleryPhotos: GalleryPhoto[] = smartRepairPhotos.map((photo, index) => ({
  src: photo.src,
  alt: photo.alt,
  title: photo.title,
  category: "Smart Repair"
}));

// Convert unfallschaeden photos to gallery format
const unfallschaedenGalleryPhotos: GalleryPhoto[] = unfallschaedenPhotos.map((photo, index) => ({
  src: photo.src,
  alt: photo.alt,
  title: photo.title || `Unfallreparatur ${index + 1}`,
  category: "Unfallschäden"
}));

// Convert sportwagen photos to gallery format
const sportwagenGalleryPhotos: GalleryPhoto[] = sportwagenPhotos.map((photo, index) => ({
  src: photo.src,
  alt: photo.alt,
  title: photo.title || `Performance Line ${index + 1}`,
  category: "Sportwagen"
}));

// Additional service photos
const servicePhotos: GalleryPhoto[] = [
  {
    src: paintImage,
    alt: "Professionelle Lackierung",
    title: "Hochwertige Lackierung",
    category: "Lackierung"
  },
  {
    src: dentImage,
    alt: "Dellen Reparatur ohne Lackierung",
    title: "Dellen Entfernung",
    category: "Dellen"
  },
  {
    src: wheelImage,
    alt: "Felgenreparatur Vorher-Nachher",
    title: "Felgen Restaurierung",
    category: "Felgen"
  },
  {
    src: detailImage,
    alt: "Professionelle Autoaufbereitung",
    title: "Premium Aufbereitung",
    category: "Aufbereitung"
  },
  {
    src: workshopImage,
    alt: "Professionelle Werkstatt",
    title: "Unfallreparatur",
    category: "Unfallschäden"
  },
  {
    src: paintImage,
    alt: "Komplettlackierung Fahrzeug",
    title: "Komplettlackierung",
    category: "Lackierung"
  },
  {
    src: wheelImage,
    alt: "Felgen Neulackierung",
    title: "Felgen Lackierung",
    category: "Felgen"
  }
];

// Combine all photos
export const allGalleryPhotos: GalleryPhoto[] = [
  ...servicePhotos,
  ...oldtimerGalleryPhotos,
  ...smartRepairGalleryPhotos,
  ...unfallschaedenGalleryPhotos,
  ...sportwagenGalleryPhotos,
];

// Available categories
export const galleryCategories = [
  "Alle",
  "Oldtimer",
  "Smart Repair",
  "Sportwagen",
  "Lackierung",
  "Felgen",
  "Dellen",
  "Unfallschäden",
  "Aufbereitung"
];
