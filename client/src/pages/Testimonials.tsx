import TestimonialCard from "@/components/TestimonialCard";
import StatsDisplay from "@/components/StatsDisplay";
import SEO from "@/components/SEO";
import { Star } from "lucide-react";

export default function Testimonials() {
  // todo: remove mock data
  const stats = [
    { value: "4.6/5", label: "Durchschnitt", description: "Kundenbewertung" },
    { value: "642", label: "Bewertungen", description: "Gesamt" },
    { value: "98%", label: "Empfehlung", description: "Weiterempfehlung" },
    { value: "5★", label: "Häufigste", description: "Bewertung" },
  ];

  // todo: remove mock data
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

  return (
    <div className="min-h-screen">
      <SEO
        title="Kundenbewertungen | Corion Lackdoktor - 4.6/5 Sterne"
        description="642+ zufriedene Kunden bewerten uns mit 4.6/5 Sternen. Lesen Sie echte Erfahrungen mit unserem Smart Repair Service in Hofheim, Mainz-Kastel & Wiesbaden."
        canonical="https://www.corion-lackdoktor.de/bewertungen"
      />
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kundenbewertungen</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Das sagen unsere zufriedenen Kunden über unseren Service
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <StatsDisplay stats={stats} />
      </div>

      {/* Rating Distribution */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Bewertungsverteilung</h2>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
}
