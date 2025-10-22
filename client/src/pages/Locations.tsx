import LocationCard from "@/components/LocationCard";
import { MapPin } from "lucide-react";

export default function Locations() {
  const locations = [
    {
      title: "Wiesbaden",
      address: "Standort Wiesbaden",
      city: "65xxx Wiesbaden",
      phone: "0176 834 582 74",
      hours: "Mo-Fr: 8:00 - 18:00, Sa: 9:00 - 13:00",
    },
    {
      title: "Hofheim-Wallau",
      address: "Wiesbadener Straße",
      city: "65719 Hofheim-Wallau",
      phone: "0176 834 582 74",
      hours: "Mo-Fr: 8:00 - 18:00, Sa: 9:00 - 13:00",
    },
    {
      title: "Mainz-Kastel",
      address: "Wiesbadener Strasse 30",
      city: "55252 Mainz-Kastel",
      phone: "0176 834 582 74",
      hours: "Mo-Fr: 8:00 - 18:00, Sa: 9:00 - 13:00",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-heading">Unsere Standorte</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Wir sind an drei Standorten für Sie da - in Wiesbaden, Hofheim-Wallau und Mainz-Kastel
          </p>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {locations.map((location) => (
            <LocationCard key={location.title} {...location} />
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-md text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
            Kostenloser Abhol- und Bringservice
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Wir holen Ihr Fahrzeug kostenlos ab und bringen es nach der Reparatur zurück - 
            in ganz Wiesbaden und Umgebung!
          </p>
          <a href="tel:017683458274">
            <button className="px-8 py-3 bg-primary-foreground text-primary rounded-md font-semibold hover-elevate active-elevate-2" data-testid="button-call-location">
              Jetzt Anrufen: 0176 834 582 74
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
