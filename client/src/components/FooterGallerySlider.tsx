import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allGalleryPhotos } from "@/data/galleryPhotos";

export function FooterGallerySlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Select featured photos (every 5th photo for variety)
  const featuredPhotos = allGalleryPhotos.filter((_photo, index: number) => index % 5 === 0).slice(0, 12);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredPhotos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredPhotos.length]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + featuredPhotos.length) % featuredPhotos.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % featuredPhotos.length);
  };

  const visiblePhotos = [
    featuredPhotos[(currentIndex - 1 + featuredPhotos.length) % featuredPhotos.length],
    featuredPhotos[currentIndex],
    featuredPhotos[(currentIndex + 1) % featuredPhotos.length],
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold">Unsere Arbeiten</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="h-8 w-8 rounded-full hover-elevate active-elevate-2"
            data-testid="button-slider-prev"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8 rounded-full hover-elevate active-elevate-2"
            data-testid="button-slider-next"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative h-40 flex items-center justify-center gap-2">
        <AnimatePresence mode="popLayout">
          {visiblePhotos.map((photo, index) => (
            <motion.div
              key={`${photo.src}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: index === 1 ? 1 : 0.4,
                scale: index === 1 ? 1 : 0.85,
                zIndex: index === 1 ? 10 : 5,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute"
              style={{
                left: `${(index - 1) * 35 + 50}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <a
                href="/galerie"
                className="block relative group"
                data-testid={`link-gallery-slider-${index}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-32 h-32 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105 border-2 border-primary/20"
                  loading="lazy"
                />
                {index === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-semibold line-clamp-2">
                        {photo.title}
                      </p>
                    </div>
                  </div>
                )}
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-1 mt-6">
        {featuredPhotos.map((_photo, index: number) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(index);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            data-testid={`button-slider-dot-${index}`}
            aria-label={`Gehe zu Bild ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
