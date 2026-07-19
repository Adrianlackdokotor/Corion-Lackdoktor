import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Sonderlackierung() {
  const benefits = [
    "Individuelle Farbgestaltung nach Wunsch",
    "Mattlackierungen professionell durchgeführt",
    "Effektlacke und Metallic-Finishes",
    "Design-Beratung inklusive",
    "Hochwertige Speziallacke",
    "Einzigartige Optik garantiert",
  ];

  const process = [
    "Beratung und Farbauswahl",
    "Vorbereitung der Oberflächen",
    "Spezielle Grundierung bei Bedarf",
    "Mehrschichtige Sonderlackierung",
    "Versiegelung und Schutz",
    "Qualitätskontrolle und Übergabe",
  ];

  return (
    <ServicePage
      title="Sonderlackierung"
      description="Individuelle Fahrzeuglackierung mit Effektlacken, Mattlackierungen und besonderen Finishes. Einzigartige Optik nach Ihren Wünschen."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
      slug="sonderlackierung"
      keywords="sonderlackierung hofheim, mattlackierung auto wiesbaden, effektlack mainz, metallic lackierung, individuelle autofarbe, custom lack, corion lackdoktor"
      priceRange="€€-€€€"
    />
  );
}
