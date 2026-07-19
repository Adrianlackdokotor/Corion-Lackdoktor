import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { oldtimerPhotos, type OldtimerPhoto } from "@/data/oldtimerGallery";

interface OldtimerGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function OldtimerGalleryModal({ open, onOpenChange, initialIndex = 0 }: OldtimerGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentPhoto = oldtimerPhotos[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? oldtimerPhotos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === oldtimerPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl w-[95vw] h-[95vh] p-0 gap-0"
        onKeyDown={handleKeyDown}
        data-testid="modal-oldtimer-gallery"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Oldtimer Restaurierung Galerie</DialogTitle>
          <DialogDescription>
            Durchsuchen Sie unsere Sammlung von {oldtimerPhotos.length} Oldtimer-Restaurierungsprojekten
          </DialogDescription>
        </DialogHeader>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 rounded-full bg-background/80 backdrop-blur hover-elevate active-elevate-2"
          onClick={() => onOpenChange(false)}
          data-testid="button-close-gallery"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Main Image Container */}
        <div className="relative flex items-center justify-center h-full p-4 md:p-8 bg-black/5 dark:bg-black/20">
          <img
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            data-testid={`img-gallery-${currentIndex}`}
          />

          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur hover-elevate active-elevate-2"
            onClick={goToPrevious}
            data-testid="button-previous-image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur hover-elevate active-elevate-2"
            onClick={goToNext}
            data-testid="button-next-image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Photo Info & Thumbnails */}
        <div className="border-t bg-background p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-lg" data-testid="text-photo-title">
                {currentPhoto.title}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-photo-counter">
                Foto {currentIndex + 1} von {oldtimerPhotos.length}
              </p>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {oldtimerPhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all hover-elevate ${
                  index === currentIndex
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                data-testid={`button-thumbnail-${index}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
