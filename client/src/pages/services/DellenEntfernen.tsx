import ServicePage from "../ServicePage";
import dentImage from "@assets/generated_images/Dent_removal_service_image_b9ce6b23.png";

export default function DellenEntfernen() {
  const benefits = [
    "Dellen ohne Lackierung entfernen",
    "Keine Wertminderung des Fahrzeugs",
    "Schnelle Reparatur innerhalb weniger Stunden",
    "Kosteneffiziente Alternative zur Blechreparatur",
    "Original-Lack bleibt erhalten",
    "Ideal für Hagel-, Park- und Transportschäden",
  ];

  const process = [
    "Schadensanalyse und Machbarkeitsprüfung",
    "Zugang zur beschädigten Stelle schaffen",
    "Professionelles Ausmassieren der Delle",
    "Feinarbeiten für perfekte Oberfläche",
    "Qualitätskontrolle",
    "Sofortige Übergabe",
  ];

  return (
    <ServicePage
      title="Dellen Entfernen (Beulendoktor)"
      description="Professionelle Dellenentfernung ohne Lackierung - schnell, günstig und werterhaltend. PDR Technik für Hagel-, Park- und Transportschäden."
      image={dentImage}
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
      slug="dellen-entfernen"
      keywords="dellen entfernen hofheim, beulendoktor wiesbaden, hagelschaden reparatur, pdr technik, dellen ausbeulen mainz, delle ohne lackieren, corion lackdoktor"
      priceRange="€-€€"
    />
  );
}
