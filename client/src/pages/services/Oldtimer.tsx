import ServicePage from "../ServicePage";
import oldtimerImage from "@assets/generated_images/Classic_car_restoration_image_360d4f59.png";

export default function Oldtimer() {
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
    <ServicePage
      title="Oldtimer Restaurierung"
      description="Professionelle und liebevolle Restaurierung klassischer Fahrzeuge mit Expertise und Leidenschaft"
      image={oldtimerImage}
      benefits={benefits}
      process={process}
      pricing="Individuell"
    />
  );
}
