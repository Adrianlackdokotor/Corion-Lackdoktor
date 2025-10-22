import ServicePage from "../ServicePage";
import wheelImage from "@assets/generated_images/Wheel_repair_service_image_878b7e9d.png";

export default function Felgenreparaturen() {
  const benefits = [
    "Reparatur von Bordsteinschäden",
    "Kratzer und Schrammen professionell beseitigen",
    "Felgen-Lackierung in Originalfarbe",
    "Korrosionsschäden fachgerecht reparieren",
    "Günstige Alternative zu neuen Felgen",
    "Schnelle Durchführung möglich",
  ];

  const process = [
    "Schadensbegutachtung der Felgen",
    "Reinigung und Vorbereitung",
    "Spachtelarbeiten bei Beschädigungen",
    "Schleifen und Grundieren",
    "Lackierung in Wunschfarbe",
    "Versiegelung und Politur",
  ];

  return (
    <ServicePage
      title="Felgenreparaturen"
      description="Professionelle Reparatur und Lackierung von beschädigten Felgen"
      image={wheelImage}
      benefits={benefits}
      process={process}
      pricing="ab 89€ pro Felge"
    />
  );
}
