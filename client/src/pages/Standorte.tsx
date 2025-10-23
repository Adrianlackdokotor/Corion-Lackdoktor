import TestimonialCard from "@/components/TestimonialCard";
import StatsDisplay from "@/components/StatsDisplay";
import SEO from "@/components/SEO";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Standorte() {
  const locations = [
    {
      title: "Hofheim-Wallau",
      subtitle: "Hauptstandort",
      address: "Nassau Str. 41, 65719 Hofheim am Taunus",
      url: "https://www.google.com/maps/place/%2B1+Corion+Lackdoktor/@50.0722447,8.3788688,622m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47bda31d6038322b:0xce9d33b9de0114c0!8m2!3d50.0722447!4d8.3814437!16s%2Fg%2F11ptz_8kfg?authuser=0",
    },
    {
      title: "Mainz-Kastel",
      address: "Wiesbadener Str. 30, 55252 Wiesbaden",
      url: "https://www.google.com/maps/place/Lackdoktor+Wiesbaden/@50.0152337,8.2745749,622m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47bd97a96f1e0bcb:0xb1d20f540e987e11!8m2!3d50.0152337!4d8.2771498!16s%2Fg%2F1hc2c4693",
    },
    {
      title: "Frankfurt",
      address: "Frankfurt am Main",
      url: "https://www.main-lackdoktor.de/",
    },
    {
      title: "Wiesbaden",
      address: "Wiesbaden",
      url: "https://www.lackdoktor-wiesbaden.de/",
    },
    {
      title: "Mainz",
      address: "Mainz",
      url: "https://lackdoktor-mainz.de/",
    },
  ];

  const stats = [
    { value: "4.6/5", label: "Durchschnitt", description: "Kundenbewertung" },
    { value: "642", label: "Bewertungen", description: "Gesamt" },
    { value: "98%", label: "Empfehlung", description: "Weiterempfehlung" },
    { value: "5★", label: "Häufigste", description: "Bewertung" },
  ];

  const testimonials = [
    {
      name: "Thomas Müller",
      rating: 5,
      text: "Hervorragender Service! Mein Auto sieht aus wie neu. Die Reparatur war schnell und der Preis fair. Absolut empfehlenswert!",
      date: "Vor 2 Wochen",
      source: "Google",
    },
    {
      name: "Anna Schmidt",
      rating: 5,
      text: "Sehr professionell und freundlich. Die Lackierung ist perfekt geworden. Danke für die tolle Arbeit!",
      date: "Vor 1 Monat",
      source: "Google",
    },
    {
      name: "Michael Weber",
      rating: 5,
      text: "Kompetente Beratung und schnelle Abwicklung. Preis-Leistung stimmt absolut. Gerne wieder!",
      date: "Vor 3 Wochen",
      source: "Google",
    },
    {
      name: "Sarah Fischer",
      rating: 5,
      text: "Toller Service vom ersten Kontakt bis zur Abholung. Das Auto wurde pünktlich fertig und sieht fantastisch aus.",
      date: "Vor 1 Woche",
      source: "Facebook",
    },
    {
      name: "Klaus Becker",
      rating: 5,
      text: "Nach einem Unfall war ich sehr besorgt. Das Team hat mich super beraten und alles perfekt repariert. Vielen Dank!",
      date: "Vor 2 Monaten",
      source: "Google",
    },
    {
      name: "Lisa Hoffmann",
      rating: 4,
      text: "Gute Arbeit zu fairem Preis. Die Wartezeit war etwas länger als geplant, aber das Ergebnis ist sehr gut.",
      date: "Vor 3 Wochen",
      source: "Google",
    },
    {
      name: "Peter Schulz",
      rating: 5,
      text: "Ich bringe mein Auto seit Jahren hier hin. Immer zuverlässig, immer top Qualität. Kann ich nur empfehlen!",
      date: "Vor 1 Monat",
      source: "Google",
    },
    {
      name: "Julia Wagner",
      rating: 5,
      text: "Smart Repair für einen kleinen Kratzer - schnell, günstig und man sieht nichts mehr. Perfekt!",
      date: "Vor 4 Tagen",
      source: "Google",
    },
    {
      name: "Martin Koch",
      rating: 5,
      text: "Oldtimer-Restaurierung vom Feinsten. Die Liebe zum Detail ist beeindruckend. Danke!",
      date: "Vor 2 Monaten",
      source: "Facebook",
    },
  ];

  // LocalBusiness Schema for SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": "Corion Lackdoktor",
    "image": "https://www.corion-lackdoktor.de/logo.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.6",
      "reviewCount": "642"
    },
    "location": [
      {
        "@type": "Place",
        "name": "Hofheim-Wallau",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Nassau Str. 41",
          "addressLocality": "Hofheim am Taunus",
          "postalCode": "65719",
          "addressCountry": "DE"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "50.0722447",
          "longitude": "8.3814437"
        }
      },
      {
        "@type": "Place",
        "name": "Mainz-Kastel",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Wiesbadener Str. 30",
          "addressLocality": "Wiesbaden",
          "postalCode": "55252",
          "addressCountry": "DE"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "50.0152337",
          "longitude": "8.2771498"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Corion Lackdoktor Standorte & Kundenbewertungen"
        description="Finden Sie unsere Standorte in Hofheim-Wallau, Wiesbaden, Mainz und Frankfurt. Lesen Sie echte Kundenbewertungen über Corion Lackdoktor - 4.6/5 Sterne."
        canonical="https://www.corion-lackdoktor.de/standorte"
      />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>

      {/* Standorte Section */}
      <section className="w-full bg-background py-12 px-6 md:px-16 border-b" data-testid="section-standorte">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <MapPin className="w-10 h-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary" data-testid="heading-standorte">
              Unsere Standorte
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations.map((location, index) => (
              <div
                key={index}
                className="bg-card rounded-md p-6 shadow-lg border hover-elevate transition-all"
                data-testid={`card-location-${location.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <h2 className="text-xl font-semibold mb-2">
                  {location.title}
                  {location.subtitle && (
                    <span className="text-primary text-sm ml-2" data-testid="badge-hauptstandort">
                      {location.subtitle}
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground mb-4 text-sm" data-testid={`text-address-${location.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {location.address}
                </p>
                <Button
                  asChild
                  className="w-full"
                  data-testid={`button-view-location-${location.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <a
                    href={location.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    Standort ansehen
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12" data-testid="heading-reviews">
          Kundenbewertungen
        </h2>

        {/* Stats */}
        <div className="mb-12">
          <StatsDisplay stats={stats} />
        </div>

        {/* Rating Distribution */}
        <div className="bg-card py-12 md:py-16 rounded-md border mb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold mb-8 text-center" data-testid="heading-rating-distribution">
              Bewertungsverteilung
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${rating === 5 ? 85 : rating === 4 ? 12 : rating === 3 ? 2 : rating === 2 ? 1 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground w-12 text-right">
                    {rating === 5 ? "85%" : rating === 4 ? "12%" : rating === 3 ? "2%" : rating === 2 ? "1%" : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
}
