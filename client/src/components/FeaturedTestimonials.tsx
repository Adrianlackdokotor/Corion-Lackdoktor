import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";

interface Testimonial {
  name: string;
  service: string;
  quote: string;
  rating: number;
  image: string;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Thomas Weber",
    service: "Smart Repair - Kratzer entfernt",
    quote: "Unglaublich schnell und professionell! Der Kratzer an meinem BMW war nach 2 Tagen weg. Hätte mit 2 Wochen Werkstattzeit gerechnet!",
    rating: 5,
    image: "TW",
    initials: "TW"
  },
  {
    name: "Maria Schneider",
    service: "Leasingrückgabe - 65% Ersparnis",
    quote: "Mit Corion habe ich bei meiner Leasingrückgabe massiv gespart. Statt €3.500 bei anderen Werkstätten nur €1.200. Sehr empfohlen!",
    rating: 5,
    image: "MS",
    initials: "MS"
  },
  {
    name: "Klaus Hoffmann",
    service: "Unfallschaden - Komplette Reparatur",
    quote: "Nach dem Unfall war ich verzweifelt. Corion hat alles perfekt repariert und die Versicherung hat alles übernommen. Top Service!",
    rating: 5,
    image: "KH",
    initials: "KH"
  }
];

export default function FeaturedTestimonials() {
  const { t } = useLanguage();
  
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover-elevate transition-all duration-300" data-testid={`card-testimonial-${index + 1}`}>
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4" data-testid={`rating-testimonial-${index + 1}`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>

                  {/* Quote Icon */}
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />

                  {/* Quote */}
                  <p className="text-muted-foreground mb-6 flex-1">
                    "{testimonial.quote}"
                  </p>

                  {/* Service Badge */}
                  <div className="bg-primary/10 text-primary text-xs font-semibold px-3 py-2 rounded-full mb-4 w-fit">
                    {testimonial.service}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{t("testimonials.verified")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicator */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            ⭐ <span className="font-semibold text-foreground">4.6/5 Sterne</span> {t("testimonials.basedOn")}
          </p>
        </div>
      </div>
    </section>
  );
}
