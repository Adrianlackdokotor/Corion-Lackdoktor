import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setIsVisible(false);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500"
        data-testid="cookie-consent-banner"
      >
        <div className="bg-black border-t-2 border-primary/20 shadow-2xl backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Text Content */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-white text-sm sm:text-base">
                  Diese Website verwendet Cookies, um Ihre Benutzererfahrung zu verbessern.{" "}
                  <button
                    onClick={openModal}
                    className="text-primary hover:text-primary/80 underline font-semibold transition-colors"
                    data-testid="button-cookie-learn-more"
                  >
                    Mehr erfahren
                  </button>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAccept}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold border-none shadow-lg hover:shadow-xl transition-all duration-300"
                  size="default"
                  data-testid="button-cookie-accept"
                >
                  Akzeptieren
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  size="default"
                  data-testid="button-cookie-decline"
                >
                  Ablehnen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeModal}
          data-testid="modal-cookie-privacy"
        >
          <div 
            className="bg-card border border-card-border rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-card-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Cookie-Richtlinie & Datenschutz</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                data-testid="button-close-modal"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 space-y-4 text-foreground">
              <div>
                <h3 className="text-lg font-semibold mb-2">Was sind Cookies?</h3>
                <p className="text-muted-foreground">
                  Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen. 
                  Sie helfen uns, Ihre Präferenzen zu speichern und Ihre Benutzererfahrung zu verbessern.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Welche Cookies verwenden wir?</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Notwendige Cookies:</strong> Für grundlegende Funktionen der Website (z.B. Cookie-Einstellungen speichern)</li>
                  <li><strong>Präferenz-Cookies:</strong> Um Ihre bevorzugten Einstellungen zu speichern (z.B. Sprache, Standort)</li>
                  <li><strong>Analyse-Cookies:</strong> Um zu verstehen, wie Besucher unsere Website nutzen</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Ihre Rechte</h3>
                <p className="text-muted-foreground">
                  Sie haben jederzeit das Recht, Ihre Einwilligung zu widerrufen oder Ihre Cookie-Einstellungen zu ändern. 
                  Weitere Informationen zum Datenschutz finden Sie in unserer{" "}
                  <Link href="/datenschutz" className="text-primary hover:text-primary/80 underline font-semibold">
                    Datenschutzerklärung
                  </Link>.
                </p>
              </div>

              <div className="pt-4 border-t border-card-border">
                <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
                <p className="text-muted-foreground">
                  Bei Fragen zu unserer Cookie-Richtlinie oder Datenschutz können Sie uns jederzeit kontaktieren:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Corion GmbH</strong><br />
                  E-Mail: <a href="mailto:coriongmbh@gmail.com" className="text-primary hover:text-primary/80">coriongmbh@gmail.com</a><br />
                  Telefon: <a href="tel:+4917683458274" className="text-primary hover:text-primary/80">+49 176 834 582 74</a>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-card-border px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={closeModal}
                variant="outline"
                data-testid="button-modal-close"
              >
                Schließen
              </Button>
              <Link href="/datenschutz">
                <Button
                  onClick={closeModal}
                  data-testid="button-modal-privacy-page"
                >
                  Zur Datenschutzerklärung
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
