import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function SmartRepair() {
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
    <ServicePage
      title="Smart Repair (Spot Repair)"
      description="Schnelle und kostengünstige Reparatur kleiner Lackschäden ohne komplette Neulackierung"
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="ab 89€"
    />
  );
}
