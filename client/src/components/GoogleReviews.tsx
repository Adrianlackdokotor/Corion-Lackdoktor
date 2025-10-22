import { Star, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import reviewsData from "../../../data/reviews.json";

interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
}

interface GoogleReviewsProps {
  maxReviews?: number;
  averageRating?: number;
  totalReviews?: number;
}

export default function GoogleReviews({ 
  maxReviews = 9, 
  averageRating = 4.6, 
  totalReviews = 642 
}: GoogleReviewsProps) {
  const reviews: Review[] = reviewsData.slice(0, maxReviews);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Vor ${weeks} Woche${weeks > 1 ? 'n' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Vor ${months} Monat${months > 1 ? 'en' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Vor ${years} Jahr${years > 1 ? 'en' : ''}`;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <section className="bg-black py-12 md:py-16 text-white overflow-hidden" data-testid="section-google-reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading text-primary mb-4" data-testid="heading-reviews">
            Kundenbewertungen
          </h2>
          <div className="flex items-center justify-center gap-2 text-lg md:text-xl" data-testid="rating-summary">
            <Star className="w-6 h-6 fill-[#FFD700] text-[#FFD700]" />
            <span className="font-heading font-bold text-primary">{averageRating} / 5</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-300">
              Basierend auf über {totalReviews} Google-Bewertungen
            </span>
          </div>
        </div>

        {/* Horizontal Slider */}
        <div className="relative mb-10 overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -100 * reviews.length],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 60,
                ease: "linear",
              },
            }}
            style={{ width: "max-content" }}
          >
            {duplicatedReviews.map((review, index) => (
              <div
                key={`review-${index}`}
                className="min-w-[320px] max-w-[380px] bg-neutral-900 rounded-2xl shadow-md shadow-red-900/30 p-6 flex-shrink-0"
                data-testid={`card-review-slider-${index % reviews.length}`}
              >
                {/* Avatar and Name */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary font-heading font-bold">
                      {getInitials(review.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-base text-white truncate" data-testid={`text-reviewer-name-${index % reviews.length}`}>
                      {review.name}
                    </div>
                    <div className="text-xs text-gray-400" data-testid={`text-review-date-${index % reviews.length}`}>
                      {formatDate(review.date)}
                    </div>
                  </div>
                </div>
                
                {/* Rating Stars */}
                <div className="flex gap-1 mb-3" data-testid={`rating-stars-${index % reviews.length}`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating 
                          ? 'fill-[#FFD700] text-[#FFD700]' 
                          : 'fill-gray-700 text-gray-700'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Review Text */}
                <p className="text-sm font-sans text-gray-300 leading-relaxed" data-testid={`text-review-content-${index % reviews.length}`}>
                  "{review.text}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Google CTA Button */}
        <div className="text-center">
          <a
            href="https://www.google.com/search?q=+1%20Corion%20Lackdoktor%20Recenzii&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxIxNLGwsDA0NLIwNDM1MTY2MLM0MdnAyPiKUVbbUME5vygzP0_BJzE5OyU_uyS_SCEoNTk1ryozcxErfnkAcTddblsAAAA&rldimm=14888112816543306944&tbm=lcl&hl=ro&sa=X#lkt=LocalPoiReviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-heading font-semibold hover:bg-red-700 transition-all duration-300 text-lg"
            data-testid="button-view-google-reviews"
          >
            Mehr auf Google ansehen
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
