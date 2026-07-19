import { MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationCardProps {
  title: string;
  address: string;
  city: string;
  phone: string;
  hours?: string;
  mapsUrl?: string;
}

export default function LocationCard({ title, address, city, phone, hours, mapsUrl }: LocationCardProps) {
  return (
    <Card data-testid={`card-location-${title.toLowerCase()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Adresse</p>
          <p className="text-sm text-muted-foreground">
            {address}<br />
            {city}
          </p>
          {mapsUrl && (
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              data-testid={`link-maps-${title.toLowerCase()}`}
            >
              <MapPin className="w-3 h-3" />
              Auf Google Maps ansehen
            </a>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Telefon</p>
          <a 
            href={`tel:${phone.replace(/\s/g, '')}`} 
            className="text-sm text-primary hover:underline font-mono"
            data-testid={`link-phone-${title.toLowerCase()}`}
          >
            <Phone className="inline w-4 h-4 mr-1" />
            {phone}
          </a>
        </div>

        {hours && (
          <div>
            <p className="text-sm font-medium mb-1">Öffnungszeiten</p>
            <p className="text-sm text-muted-foreground">
              <Clock className="inline w-4 h-4 mr-1" />
              {hours}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
