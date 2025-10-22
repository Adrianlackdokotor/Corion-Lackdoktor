import { useState } from "react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import paintImage from "@assets/generated_images/Paint_service_image_68d4cdbf.png";
import dentImage from "@assets/generated_images/Dent_removal_service_image_b9ce6b23.png";
import wheelImage from "@assets/generated_images/Wheel_repair_service_image_878b7e9d.png";
import detailImage from "@assets/generated_images/Auto_detailing_service_image_222c746b.png";
import oldtimerImage from "@assets/generated_images/Classic_car_restoration_image_360d4f59.png";
import workshopImage from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";

export default function Gallery() {
  const [filter, setFilter] = useState("Alle");

  const categories = ["Alle", "Lackierung", "Unfallschäden", "Smart Repair", "Oldtimer", "Felgen", "Aufbereitung"];

  const galleryItems = [
    { image: paintImage, category: "Lackierung", title: "Professionelle Lackierung" },
    { image: dentImage, category: "Smart Repair", title: "Dellen Reparatur" },
    { image: wheelImage, category: "Felgen", title: "Felgenreparatur" },
    { image: detailImage, category: "Aufbereitung", title: "Autoaufbereitung" },
    { image: oldtimerImage, category: "Oldtimer", title: "Oldtimer Restaurierung" },
    { image: workshopImage, category: "Unfallschäden", title: "Unfallreparatur" },
    { image: paintImage, category: "Lackierung", title: "Komplettlackierung" },
    { image: dentImage, category: "Smart Repair", title: "Spot Repair" },
    { image: wheelImage, category: "Felgen", title: "Felgen Lackierung" },
  ];

  const filteredItems = filter === "Alle" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

  return (
    <div className="min-h-screen">
      <SEO
        title="Galerie | Corion Lackdoktor - Vorher/Nachher Bilder"
        description="Überzeugen Sie sich von der Qualität unserer Arbeit. Sehen Sie Beispiele unserer Lackierungen, Smart Repairs, Oldtimer-Restaurierungen und mehr."
        canonical="https://www.corion-lackdoktor.de/galerie"
      />
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Galerie</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Überzeugen Sie sich von der Qualität unserer Arbeit
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              onClick={() => setFilter(category)}
              data-testid={`button-filter-${category.toLowerCase()}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div 
              key={index} 
              className="group relative aspect-[4/3] overflow-hidden rounded-md border hover-elevate transition-all"
              data-testid={`gallery-item-${index}`}
            >
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-sm font-semibold">{item.category}</p>
                  <p className="text-lg font-bold font-heading">{item.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
