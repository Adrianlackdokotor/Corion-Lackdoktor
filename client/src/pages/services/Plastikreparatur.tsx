import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Plastikreparatur() {
  const benefits = [
    "Reparatur von Kunststoff-Stoßfängern",
    "Kostengünstige Alternative zum Austausch",
    "Professionelle Schweißtechnik",
    "Lackierung in Originalfarbe",
    "Schnelle Durchführung",
    "Umweltfreundlich durch Reparatur statt Neukauf",
  ];

  const process = [
    "Schadensbegutachtung",
    "Ausbau des Kunststoffteils",
    "Schweißen und Verstärken",
    "Schleifen und Spachteln",
    "Grundierung und Lackierung",
    "Montage und Qualitätskontrolle",
  ];

  return (
    <ServicePage
      title="Plastikreparatur"
      description="Professionelle Reparatur von Kunststoff-Stoßfängern und Verkleidungen"
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
    />
  );
}
