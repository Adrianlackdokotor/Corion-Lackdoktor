import ServicePage from "../ServicePage";
import detailImage from "@assets/generated_images/Auto_detailing_service_image_222c746b.png";

export default function Autoaufbereitung() {
  const benefits = [
    "Professionelle Innen- und Außenreinigung",
    "Lackpflege und Versiegelung",
    "Polsterreinigung und Lederpflege",
    "Motorwäsche auf Wunsch",
    "Geruchsentfernung und Desinfektion",
    "Werterhalt und Wertsteigerung",
  ];

  const process = [
    "Vorreinigung und Inspektion",
    "Intensive Innenraumreinigung",
    "Außenwäsche und Lackpflege",
    "Polieren und Versiegeln",
    "Felgen- und Reifenpflege",
    "Endkontrolle und Übergabe",
  ];

  return (
    <ServicePage
      title="Autoaufbereitung"
      description="Professionelle Fahrzeugaufbereitung innen und außen für ein perfektes Erscheinungsbild"
      image={detailImage}
      benefits={benefits}
      process={process}
      pricing="ab 149€"
    />
  );
}
