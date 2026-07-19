import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Baulackierung() {
  const benefits = [
    "Komplettlackierung in Wunschfarbe",
    "Modernste Lackiertechnik und -kabine",
    "Hochwertige Lacksysteme",
    "Perfekte Oberfläche garantiert",
    "Farbberatung inklusive",
    "Langlebiger Korrosionsschutz",
  ];

  const process = [
    "Farbauswahl und Beratung",
    "Komplette Demontage aller Anbauteile",
    "Vorbereitung und Grundierung",
    "Mehrschichtige Lackierung",
    "Trocknung in Lackierkabine",
    "Montage und Übergabe",
  ];

  return (
    <ServicePage
      title="Baulackierung"
      description="Professionelle Komplettlackierung Ihres Fahrzeugs in höchster Qualität. Modernste Lackiertechnik und langlebiger Korrosionsschutz."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
      slug="baulackierung"
      keywords="baulackierung hofheim, auto komplett lackieren wiesbaden, fahrzeug lackierung mainz, neulackierung auto, farbwechsel, corion lackdoktor"
      priceRange="€€€"
    />
  );
}
