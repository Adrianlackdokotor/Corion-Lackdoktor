import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Rostschaeden() {
  const benefits = [
    "Professionelle Rostentfernung und Versiegelung",
    "Verhinderung weiterer Korrosion",
    "Blecharbeiten bei starker Durchrostung",
    "Langlebiger Korrosionsschutz",
    "Werterhaltung Ihres Fahrzeugs",
    "Garantie auf durchgeführte Arbeiten",
  ];

  const process = [
    "Analyse des Rostschadens",
    "Entfernung des Rostes bis zum gesunden Blech",
    "Blecharbeiten bei Bedarf",
    "Grundierung mit Rostschutz",
    "Spachtel- und Lackierarbeiten",
    "Versiegelung zum Korrosionsschutz",
  ];

  return (
    <ServicePage
      title="Rostschäden"
      description="Fachgerechte Beseitigung von Rostschäden und professioneller Korrosionsschutz. Langlebiger Schutz und Werterhaltung für Ihr Fahrzeug."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
      slug="rostschaeden"
      keywords="rostschaden reparatur hofheim, rost entfernen wiesbaden, korrosionsschutz auto, durchrostung reparieren mainz, rostschutz, corion lackdoktor"
      priceRange="€€"
    />
  );
}
