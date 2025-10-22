import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  maxReviews = 10, 
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

  return (
    <div className="py-12 md:py-16 bg-[#F2F2F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading text-primary mb-4">
            Kundenbewertungen
          </h2>
          <div className="flex items-center justify-center gap-2 text-lg md:text-xl">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <span className="font-heading font-bold">{averageRating} / 5</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Basierend auf über {totalReviews} Google-Bewertungen
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reviews.map((review, index) => (
            <Card 
              key={index} 
              className="bg-white rounded-2xl shadow-md hover-elevate hover:scale-105 transform transition-all duration-300 h-full"
              data-testid={`card-google-review-${index}`}
            >
              <CardContent className="p-6">
                {/* Avatar and Name */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold">
                      {getInitials(review.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-base truncate" data-testid={`text-reviewer-name-${index}`}>
                      {review.name}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`text-review-date-${index}`}>
                      {formatDate(review.date)}
                    </div>
                  </div>
                </div>
                
                {/* Rating Stars */}
                <div className="flex gap-1 mb-3" data-testid={`rating-stars-${index}`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Review Text */}
                <p className="text-sm font-sans text-muted-foreground leading-relaxed" data-testid={`text-review-content-${index}`}>
                  "{review.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Google CTA Button */}
        <div className="text-center">
          <a
            href="https://www.google.com/search?q=+1%20Corion%20Lackdoktor%20Recenzii&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxIxNLGwsDA0NLIwNDM1MTY2MLM0MdnAyPiKUVbbUME5vygzP0_BJzE5OyU_uyS_SCEoNTk1ryozcxErfnkAcTddblsAAAA&rldimm=14888112816543306944&tbm=lcl&hl=ro&sa=X#lkt=LocalPoiReviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-heading font-semibold hover-elevate active-elevate-2 transition-all duration-300 text-lg"
            data-testid="button-view-google-reviews"
          >
            Mehr auf Google ansehen
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
