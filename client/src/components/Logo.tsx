import logoImage from "@assets/image007 (1)_1761130943207.png";
import { Sparkles } from "lucide-react";

interface LogoProps {
  className?: string;
  showSparkle?: boolean;
}

export default function Logo({ className = "h-10 md:h-12 w-auto", showSparkle = true }: LogoProps) {
  return (
    <div className="relative inline-block">
      <img 
        src={logoImage} 
        alt="+1 Corion Lackdoktor Logo" 
        className={className}
      />
      {showSparkle && (
        <>
          {/* Animated star/sparkle on the car - positioned near the front/roof */}
          <div className="absolute top-[20%] right-[25%] logo-sparkle-container">
            <div className="logo-sparkle">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
          
          {/* Additional subtle sparkle for enhanced effect */}
          <div className="absolute top-[35%] right-[15%] logo-sparkle-container-delayed">
            <div className="logo-sparkle-secondary">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
