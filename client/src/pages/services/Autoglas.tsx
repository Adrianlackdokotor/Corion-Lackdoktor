import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Autoglas() {
  const benefits = [
    "Reparatur von Steinschlägen in der Scheibe",
    "Austausch beschädigter Scheiben",
    "Direkte Abrechnung mit Versicherung",
    "Original-Qualitätsglas",
    "Schneller Service oft am selben Tag",
    "Kalibrierung von Fahrassistenzsystemen",
  ];

  const process = [
    "Schadensbegutachtung",
    "Reparatur oder Austausch entscheiden",
    "Ausbau der beschädigten Scheibe",
    "Einbau der neuen Scheibe",
    "Kalibrierung bei Bedarf",
    "Dichtigkeitsprüfung und Freigabe",
  ];

  return (
    <ServicePage
      title="Autoglas"
      description="Professionelle Reparatur und Austausch von Autoscheiben mit Versicherungsabwicklung"
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
    />
  );
}
