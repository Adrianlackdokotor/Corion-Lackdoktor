import TestimonialCard from '../TestimonialCard';

export default function TestimonialCardExample() {
  return (
    <div className="p-8 max-w-md">
      <TestimonialCard
        name="Thomas Müller"
        rating={5}
        text="Hervorragender Service! Mein Auto sieht aus wie neu. Die Reparatur war schnell und der Preis fair. Absolut empfehlenswert!"
        date="Vor 2 Wochen"
        source="Google"
      />
    </div>
  );
}
