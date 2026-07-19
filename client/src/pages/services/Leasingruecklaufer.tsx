import ServicePage from "../ServicePage";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";

export default function Leasingruecklaufer() {
  const benefits = [
    "Kostengünstige Aufbereitung vor Rückgabe",
    "Vermeidung von Nachzahlungen",
    "Professionelle Beseitigung von Gebrauchsspuren",
    "Faire und transparente Preisgestaltung",
    "Schnelle Terminvergabe vor Rückgabetermin",
    "Expertise in Leasingvertragsbedingungen",
  ];

  const process = [
    "Begutachtung aller Schäden und Mängel",
    "Kostenvoranschlag erstellen",
    "Abstimmung der notwendigen Arbeiten",
    "Professionelle Reparatur aller Schäden",
    "Aufbereitung und Reinigung",
    "Dokumentation für Leasinggeber",
  ];

  return (
    <ServicePage
      title="Leasingrückläufer"
      description="Professionelle Aufbereitung von Leasingfahrzeugen vor der Rückgabe. Vermeiden Sie teure Nachzahlungen und sparen Sie bei der Leasingrückgabe."
      image={paintImage}
      benefits={benefits}
      process={process}
      pricing="Individuell"
      slug="leasingruecklaufer"
      keywords="leasingrückläufer hofheim, leasing rückgabe wiesbaden, leasing auto aufbereiten, nachzahlung vermeiden, leasingfahrzeug reparieren mainz, corion lackdoktor"
      priceRange="€€"
    />
  );
}
