export default function Impressum() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Impressum</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold font-heading mb-4">Angaben gemäß § 5 TMG</h2>
          <p className="mb-6">
            +1 Corion Lackdoktor<br />
            Wiesbadener Strasse 30<br />
            55252 Mainz-Kastel
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Kontakt</h2>
          <p className="mb-6">
            Telefon: 0176 834 582 74<br />
            E-Mail: info@lackdoktor.de
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Umsatzsteuer-ID</h2>
          <p className="mb-6">
            Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
            [Wird vom Kunden eingefügt]
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p className="mb-6">
            [Name und Anschrift werden vom Kunden eingefügt]
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">EU-Streitschlichtung</h2>
          <p className="mb-6">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            https://ec.europa.eu/consumers/odr.<br />
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
          <p className="mb-6">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <p className="text-sm text-muted-foreground mt-12">
            Haftungsausschluss: Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. 
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch 
            keine Gewähr übernehmen.
          </p>
        </div>
      </div>
    </div>
  );
}
