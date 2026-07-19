import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Unfallschaeden() {
  // todo: remove mock data
  const benefits = [
    "Komplette Unfallschadenabwicklung",
    "Direkte Abrechnung mit Versicherungen",
    "Kostenloser Gutachterservice",
    "Original-Ersatzteile oder günstige Alternativen",
    "Modernste Karosserie- und Lackiertechnik",
    "Kostenloser Leihwagen während der Reparatur",
  ];

  // todo: remove mock data
  const process = [
    "Schadensbegutachtung und Dokumentation",
    "Kostenvoranschlag und Versicherungsabwicklung",
    "Demontage beschädigter Teile",
    "Karosseriearbeiten und Richtarbeiten",
    "Lackierung in Originalfarbe",
    "Montage und Qualitätskontrolle",
  ];

  return (
    <ServicePage
      title="Unfallschäden"
      description="Professionelle Reparatur von Unfallschäden mit modernster Technik und Original-Ersatzteilen. Komplette Versicherungsabwicklung und kostenloser Leihwagen."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Individuell"
      slug="unfallschaeden"
      keywords="unfallschaden reparatur hofheim, karosserie reparatur wiesbaden, versicherung abrechnung, unfall auto reparieren, blechschaden, unfallreparatur mainz, corion lackdoktor"
      priceRange="€€-€€€"
    />
  );
}
