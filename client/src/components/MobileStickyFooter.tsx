import { Camera, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function MobileStickyFooter() {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/client") || location.startsWith("/hub");

  if (isDashboard) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A]/95 backdrop-blur border-t border-white/10 p-2 safe-area-inset-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <div className="flex gap-2">
        {/* Primary - Photo Upload (75%) */}
        <Link href="/kontakt" className="flex-[7]">
          <Button
            size="lg"
            className="w-full font-bold gap-2 shadow-lg"
            data-testid="button-mobile-photo-upload"
          >
            <Camera className="w-5 h-5" />
            <span className="truncate">Foto hochladen &amp; analysieren</span>
          </Button>
        </Link>

        {/* Secondary - Call (25%) */}
        <Button
          asChild
          variant="secondary"
          size="lg"
          className="flex-[3] font-bold"
          data-testid="button-mobile-call"
        >
          <a href="tel:+4917683458274">
            <Phone className="w-5 h-5" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
