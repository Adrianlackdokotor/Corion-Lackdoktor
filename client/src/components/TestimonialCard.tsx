import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TestimonialCardProps {
  name: string;
  rating: number;
  text: string;
  date: string;
  source?: string;
}

export default function TestimonialCard({ name, rating, text, date, source = "Google" }: TestimonialCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="h-full" data-testid={`card-testimonial-${name.toLowerCase()}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">{date}</div>
          </div>
          {source && (
            <div className="text-xs bg-accent px-2 py-1 rounded-md">{source}</div>
          )}
        </div>
        
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          "{text}"
        </p>
      </CardContent>
    </Card>
  );
}
