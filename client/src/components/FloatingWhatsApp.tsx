import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function FloatingWhatsApp() {
  const [location] = useLocation();
  const isGalleryPage = location === "/galerie";
  const isDashboard = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/client") || location.startsWith("/hub");

  if (isDashboard) return null;

  return (
    <motion.div
      className="fixed bottom-4 md:bottom-6 left-4 md:left-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      style={{ pointerEvents: isGalleryPage ? 'none' : 'auto' }}
    >
      <motion.a
        href="https://wa.me/4917683458274"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Foto per WhatsApp senden"
        className="h-11 min-w-11 bg-[#1f9d55] hover:bg-[#188747] text-white px-3 rounded-full shadow-md shadow-black/15 flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-floating-whatsapp"
        style={{ pointerEvents: 'auto' }}
      >
        <FaWhatsapp className="w-5 h-5 shrink-0" />
        <span className="hidden xl:inline">Foto per WhatsApp senden</span>
      </motion.a>
    </motion.div>
  );
}
