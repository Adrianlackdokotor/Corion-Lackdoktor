import { useState } from "react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { ImageModal } from "@/components/ImageModal";
import { allGalleryPhotos, galleryCategories, type GalleryPhoto } from "@/data/galleryPhotos";

export default function Gallery() {
  const [filter, setFilter] = useState("Alle");
  const [selectedImage, setSelectedImage] = useState<GalleryPhoto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredPhotos = filter === "Alle" 
    ? allGalleryPhotos 
    : allGalleryPhotos.filter(photo => photo.category === filter);

  const handleImageClick = (photo: GalleryPhoto, index: number) => {
    setSelectedImage(photo);
    setSelectedIndex(index);
  };

  const handleNavigate = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < filteredPhotos.length) {
      setSelectedImage(filteredPhotos[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Galerie | Corion Lackdoktor - Instagram-Style Portfolio"
        description="Entdecken Sie unsere Arbeit in einer modernen Instagram-Style Galerie mit AI-generierten Beschreibungen. Über 70 Projekte aus Lackierung, Oldtimer, Smart Repair und mehr."
        canonical="https://www.corion-lackdoktor.de/galerie"
      />
      
      {/* Header Section */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                Galerie
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Entdecken Sie unsere <span className="text-primary font-semibold">professionelle Arbeit</span> in über 70 Projekten. 
                Klicken Sie auf ein Bild für AI-generierte Beschreibungen.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-2xl font-bold text-primary">{filteredPhotos.length}</span>
              <span className="text-sm text-muted-foreground">Fotos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="border-b bg-background/50 backdrop-blur-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
              Filter:
            </span>
            <div className="flex gap-2">
              {galleryCategories.map((category) => (
                <Button
                  key={category}
                  variant={filter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(category)}
                  className="whitespace-nowrap"
                  data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instagram-Style Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPhotos.map((photo, index) => (
            <button
              key={`${photo.category}-${index}`}
              type="button"
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 w-full"
              onClick={() => handleImageClick(photo, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleImageClick(photo, index);
                }
              }}
              aria-label={`${photo.title} - ${photo.category} ansehen`}
              data-testid={`gallery-item-${index}`}
            >
              {/* Image */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                  {/* Category Badge */}
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground border border-primary">
                      {photo.category}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-white font-bold font-heading text-lg md:text-xl leading-tight">
                    {photo.title}
                  </h3>
                  
                  {/* Click Hint */}
                  <p className="text-white/80 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Klicken für AI-Beschreibung
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Keine Fotos in dieser Kategorie gefunden.
            </p>
            <Button
              variant="outline"
              onClick={() => setFilter("Alle")}
              className="mt-4"
              data-testid="button-reset-filter"
            >
              Alle Fotos anzeigen
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Photo Count */}
      <div className="md:hidden fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg border border-primary">
        <span className="text-sm font-semibold">{filteredPhotos.length} Fotos</span>
      </div>

      {/* Image Modal with AI Description */}
      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => !open && setSelectedImage(null)}
          image={selectedImage}
          allImages={filteredPhotos}
          currentIndex={selectedIndex}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
