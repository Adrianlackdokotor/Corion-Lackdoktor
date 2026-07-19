import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Lackschaeden() {
  const benefits = [
    "Professionelle Beseitigung von Kratzern und Schrammen",
    "Steinschlagschäden fachgerecht repariert",
    "Perfekte Farbabstimmung auf Originallack",
    "Moderne Lackiertechnik für beste Ergebnisse",
    "Langlebige Lackversiegelung inklusive",
    "Garantie auf alle Lackierarbeiten",
  ];

  const process = [
    "Schadensbegutachtung und Kostenvoranschlag",
    "Vorbereitung und Reinigung der Oberfläche",
    "Grundierung und Spachtelarbeiten",
    "Mehrschichtige Lackierung",
    "Polieren und Versiegeln",
    "Qualitätskontrolle und Übergabe",
  ];

  return (
    <ServicePage
      title="Lackschäden"
      description="Professionelle Reparatur von Lackschäden, Kratzern und Steinschlägen mit modernster Lackiertechnik. Perfekte Farbabstimmung und langlebige Versiegelung."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
      slug="lackschaeden"
      keywords="lackschaden reparatur hofheim, kratzer ausbessern wiesbaden, steinschlag reparieren, auto lackieren mainz, lackierung auto, corion lackdoktor"
      priceRange="€€"
    />
  );
}
