import { Link } from "wouter";
import { ArrowRight, Camera } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
  onImageClick?: () => void;
  clickableTitle?: boolean;
  price?: string;
  quickCtaHref?: string;
}

export default function ServiceCard({
  title,
  description,
  image,
  href,
  onImageClick,
  clickableTitle = false,
  price,
  quickCtaHref,
}: ServiceCardProps) {
  const handleImageClick = (e: React.MouseEvent) => {
    if (onImageClick) {
      e.preventDefault();
      onImageClick();
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (onImageClick && clickableTitle) {
      e.preventDefault();
      onImageClick();
    }
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 flex flex-col h-full" data-testid={`card-service-${title.toLowerCase()}`}>
      <CardHeader className="p-0">
        <div
          className={`aspect-[4/3] overflow-hidden relative ${onImageClick ? 'cursor-pointer' : ''}`}
          onClick={handleImageClick}
          data-testid={onImageClick ? `button-service-image-${title.toLowerCase()}` : undefined}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {price && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-primary-foreground border-transparent shadow-md font-semibold text-xs sm:text-sm" data-testid={`badge-price-${title.toLowerCase()}`}>
                {price}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 flex-1">
        <h3
          className={`text-lg md:text-xl font-semibold mb-2 ${onImageClick && clickableTitle ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
          onClick={handleTitleClick}
          data-testid={onImageClick && clickableTitle ? `button-service-title-${title.toLowerCase()}` : undefined}
        >
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
      <CardFooter className="p-4 md:p-6 pt-0 flex flex-col gap-2">
        {quickCtaHref && (
          <Link href={quickCtaHref} className="w-full">
            <Button className="w-full font-bold text-sm md:text-base gap-2" size="default" data-testid={`button-check-damage-${title.toLowerCase()}`}>
              <Camera className="w-4 h-4" />
              Schaden prüfen
            </Button>
          </Link>
        )}
        <Link href={href} className="w-full">
          <Button variant="outline" className="w-full group text-sm md:text-base" size="default" data-testid={`button-learn-more-${title.toLowerCase()}`}>
            Mehr erfahren
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
