export default function Cookies() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Cookie-Richtlinie</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold font-heading mb-4">Was sind Cookies?</h2>
          <p className="mb-6">
            Cookies sind kleine Textdateien, die von Ihrem Browser auf Ihrem Gerät gespeichert 
            werden. Sie helfen dabei, unsere Website funktionsfähig zu machen und Ihr 
            Nutzererlebnis zu verbessern.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Welche Cookies verwenden wir?</h2>
          
          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Notwendige Cookies</h3>
          <p className="mb-6">
            Diese Cookies sind für den Betrieb der Website unbedingt erforderlich und 
            können in unseren Systemen nicht deaktiviert werden. Sie werden in der Regel 
            nur als Reaktion auf von Ihnen getätigte Aktionen gesetzt.
          </p>

          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Funktionale Cookies</h3>
          <p className="mb-6">
            Diese Cookies ermöglichen es der Website, erweiterte Funktionalität und 
            Personalisierung zu bieten. Sie können von uns oder von Drittanbietern gesetzt 
            werden, deren Dienste wir auf unseren Seiten verwenden.
          </p>

          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Analyse-Cookies</h3>
          <p className="mb-6">
            Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website 
            interagieren, indem Informationen anonym gesammelt und gemeldet werden.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Cookie-Kontrolle</h2>
          <p className="mb-6">
            Sie können Cookies über Ihre Browser-Einstellungen kontrollieren und löschen. 
            Bitte beachten Sie, dass das Löschen oder Blockieren von Cookies die Funktionalität 
            unserer Website beeinträchtigen kann.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Aktualisierungen dieser Richtlinie</h2>
          <p className="mb-6">
            Wir können diese Cookie-Richtlinie von Zeit zu Zeit aktualisieren. Änderungen 
            werden auf dieser Seite veröffentlicht.
          </p>

          <p className="text-sm text-muted-foreground mt-12">
            Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>
    </div>
  );
}
