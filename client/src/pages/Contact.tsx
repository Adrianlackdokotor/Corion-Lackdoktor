import ContactForm from "@/components/ContactForm";
import LocationCard from "@/components/LocationCard";
import SEO from "@/components/SEO";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  // todo: remove mock data
  const locations = [
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

  const freeServices = [
    { name: "Individuelles Preisangebot", asterisk: false },
    { name: "Kostenloser Leihwagen", asterisk: true },
    { name: "Abhol- und Bringservice innerhalb 30 Km", asterisk: true },
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Kontakt | Corion Lackdoktor Hofheim"
        description="Kontaktieren Sie uns für professionelle Auto-Reparaturen in Hofheim, Mainz-Kastel & Wiesbaden. ☎ 0176 834 582 74 | ✉ coriongmbh@gmail.com"
        canonical="https://www.corion-lackdoktor.de/kontakt"
      />
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakt</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Haben Sie Fragen oder möchten Sie einen Termin vereinbaren? 
            Wir sind für Sie da!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <a href="tel:017683458274" className="block">
            <div className="text-center p-6 border rounded-md hover-elevate transition-all" data-testid="card-contact-phone">
              <Phone className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Telefon</h3>
              <p className="text-sm text-muted-foreground mb-2">Rufen Sie uns an</p>
              <p className="font-mono text-sm">0176 834 582 74</p>
            </div>
          </a>

          <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer" className="block">
            <div className="text-center p-6 border rounded-md hover-elevate transition-all" data-testid="card-contact-whatsapp">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-2">Schreiben Sie uns</p>
              <p className="font-mono text-sm">0176 834 582 74</p>
            </div>
          </a>

          <a href="mailto:coriongmbh@gmail.com" className="block">
            <div className="text-center p-6 border rounded-md hover-elevate transition-all" data-testid="card-contact-email">
              <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">E-Mail</h3>
              <p className="text-sm text-muted-foreground mb-2">Senden Sie uns eine E-Mail</p>
              <p className="text-sm">coriongmbh@gmail.com</p>
            </div>
          </a>
        </div>

        {/* Form and Info */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">Kontaktformular</h2>
            <ContactForm />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Kostenlose Services</h2>
            <div className="bg-card p-6 rounded-md border mb-8">
              <ul className="space-y-4">
                {freeServices.map((service, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-lg">
                      {service.name}
                      {service.asterisk && <sup className="text-primary">*</sup>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-6 pt-4 border-t">
                <sup className="text-primary">*</sup> ab 1000€ Rechnung Betrag
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-4">Öffnungszeiten</h3>
            <div className="bg-card p-6 rounded-md border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montag - Freitag</span>
                  <span className="font-mono">8:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Samstag</span>
                  <span className="font-mono">9:00 - 13:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sonntag</span>
                  <span className="font-mono">Geschlossen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Unsere Standorte</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {locations.map((location) => (
              <LocationCard key={location.title} {...location} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
