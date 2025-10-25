import ServicePage from "../ServicePage";

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
      image="/assets/felgenreparatur-vorher-nachher.png"
      benefits={benefits}
      process={process}
      pricing="Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
    />
  );
}
