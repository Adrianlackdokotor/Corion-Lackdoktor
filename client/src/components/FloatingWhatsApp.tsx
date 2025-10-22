import { Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingWhatsApp() {
  return (
    <motion.a
      href="https://wa.me/4917683458274"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-24 z-40 bg-primary text-white px-6 py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center gap-3 font-heading font-bold hover:bg-red-700 transition-all duration-300"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      data-testid="button-floating-whatsapp"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      >
        <Camera className="w-6 h-6" />
      </motion.div>
      <span className="hidden sm:inline">Foto schicken für Angebot</span>
      <span className="sm:hidden">Angebot</span>
    </motion.a>
  );
}
