import LocationCard from '../LocationCard';

export default function LocationCardExample() {
  return (
    <div className="p-8 max-w-md">
      <LocationCard
        title="Wiesbaden"
        address="Nassaustraße 41"
        city="65719 Hofheim am Taunus"
        phone="06122 596 29 39"
        hours="Mo-Fr: 8:00 - 18:00"
      />
    </div>
  );
}
