import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2, Sparkles, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { askCorionAgent } from "@/agents/CorionAgent";

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: {
    src: string;
    alt: string;
    title: string;
    category: string;
  };
  allImages?: Array<{
    src: string;
    alt: string;
    title: string;
    category: string;
  }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function ImageModal({ open, onOpenChange, image, allImages = [], currentIndex = 0, onNavigate }: ImageModalProps) {
  const [aiDescription, setAiDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [descriptionCache, setDescriptionCache] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasNavigation = allImages.length > 1 && onNavigate;
  const canGoPrevious = hasNavigation && currentIndex > 0;
  const canGoNext = hasNavigation && currentIndex < allImages.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, hasNavigation]);

  useEffect(() => {
    if (!open || !image) return;

    if (descriptionCache[image.title]) {
      setAiDescription(descriptionCache[image.title]);
      return;
    }

    const generateDescription = async () => {
      setIsGenerating(true);
      try {
        const prompt = `Schreibe eine kurze, kreative und ansprechende Beschreibung (2-3 Sätze) auf Deutsch für ein Foto aus der Kategorie "${image.category}" mit dem Titel "${image.title}". Beschreibe die Qualität der Arbeit, die Liebe zum Detail und den Professionalismus des Corion Lackdoktor Teams. Verwende einen freundlichen und professionellen Ton.`;
        
        const response = await askCorionAgent(prompt, 'assistant', false);
        
        if (response.reply) {
          setAiDescription(response.reply);
          setDescriptionCache(prev => ({
            ...prev,
            [image.title]: response.reply
          }));
        }
      } catch (error) {
        console.error("Error generating AI description:", error);
        setAiDescription("Eine professionelle Arbeit unseres Teams, die höchste Qualität und Präzision zeigt.");
      } finally {
        setIsGenerating(false);
      }
    };

    generateDescription();
  }, [open, image, descriptionCache]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-full w-screen h-screen' : 'max-w-5xl w-[95vw]'} p-0 gap-0 bg-black/95 border-primary/20 transition-all duration-300`}
        data-testid="modal-image-gallery"
      >
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20 hover-elevate active-elevate-2"
            onClick={() => setIsFullscreen(!isFullscreen)}
            data-testid="button-fullscreen"
            aria-label={isFullscreen ? "Vollbild verlassen" : "Vollbild"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-primary/80 text-primary-foreground hover:bg-primary backdrop-blur hover-elevate active-elevate-2"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col">
          {/* Image Container */}
          <div className="relative flex items-center justify-center p-8 md:p-12 bg-black">
            {/* Previous Button */}
            {canGoPrevious && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20 hover-elevate active-elevate-2"
                onClick={handlePrevious}
                data-testid="button-prev"
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            <img
              src={image.src}
              alt={image.alt}
              className={`${isFullscreen ? 'max-h-[95vh]' : 'max-h-[70vh]'} w-auto object-contain rounded-2xl shadow-2xl transition-all duration-300`}
              data-testid="img-modal-display"
            />

            {/* Next Button */}
            {canGoNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20 hover-elevate active-elevate-2"
                onClick={handleNext}
                data-testid="button-next"
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Photo Counter */}
            {hasNavigation && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-sm font-semibold">
                {currentIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="bg-gradient-to-b from-black to-background p-6 md:p-8 border-t border-primary/10">
            <div className="max-w-3xl mx-auto">
              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                  {image.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-white mb-4">
                {image.title}
              </h3>

              {/* AI Generated Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary/80">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    AI-generierte Beschreibung
                  </span>
                </div>
                
                {isGenerating ? (
                  <div className="flex items-center gap-3 text-muted-foreground py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <p className="text-sm">Beschreibung wird generiert...</p>
                  </div>
                ) : (
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-white/10">
                    {aiDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
