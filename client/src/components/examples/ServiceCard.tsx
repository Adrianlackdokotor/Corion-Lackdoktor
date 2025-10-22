import ServiceCard from '../ServiceCard';
import dentImage from '@assets/generated_images/Dent_removal_service_image_b9ce6b23.png';

export default function ServiceCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ServiceCard
        title="Smart Repair"
        description="Schnelle und kostengünstige Reparatur kleiner Lackschäden ohne komplette Neulackierung."
        image={dentImage}
        href="/leistungen/smart-repair"
      />
    </div>
  );
}
