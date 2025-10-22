export default function Impressum() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4" data-testid="heading-impressum">
            Impressum
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="space-y-8">
          {/* Company Information */}
          <section data-testid="section-company-info">
            <h2 className="text-2xl font-bold font-heading mb-4">Angaben gemäß § 5 TMG</h2>
            <div className="mb-6">
              <p className="font-semibold mb-2">Corion GmbH</p>
              <p>Nassaustraße 41</p>
              <p>65719 Hofheim am Taunus</p>
              <p className="mt-2">Deutschland</p>
            </div>
          </section>

          {/* Contact Information */}
          <section data-testid="section-contact">
            <h2 className="text-2xl font-bold font-heading mb-4">Kontakt</h2>
            <div className="mb-6">
              <p>
                Telefon: <a href="tel:+4917683458274" className="text-primary hover:underline" data-testid="link-phone">+49 176 83458274</a>
              </p>
              <p>
                E-Mail: <a href="mailto:info@corion.de" className="text-primary hover:underline" data-testid="link-email">info@corion.de</a>
              </p>
            </div>
          </section>

          {/* Managing Director */}
          <section data-testid="section-director">
            <h2 className="text-2xl font-bold font-heading mb-4">Geschäftsführer</h2>
            <p className="mb-6">Adrian Apostol</p>
          </section>

          {/* Commercial Register */}
          <section data-testid="section-register">
            <h2 className="text-2xl font-bold font-heading mb-4">Handelsregister</h2>
            <div className="mb-6">
              <p>Registernummer: HRB 128302</p>
              <p>Registergericht: Amtsgericht Frankfurt am Main</p>
            </div>
          </section>

          {/* Legal Form */}
          <section data-testid="section-legal-form">
            <h2 className="text-2xl font-bold font-heading mb-4">Rechtsform</h2>
            <p className="mb-6">Gesellschaft mit beschränkter Haftung (GmbH)</p>
          </section>

          {/* VAT ID */}
          <section data-testid="section-vat">
            <h2 className="text-2xl font-bold font-heading mb-4">Umsatzsteuer-ID</h2>
            <p className="mb-6">
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
              <span className="text-muted-foreground italic">[Wird vom Kunden eingefügt]</span>
            </p>
          </section>

          {/* AGB - Terms and Conditions */}
          <section data-testid="section-agb">
            <h2 className="text-2xl font-bold font-heading mb-4">
              AGB – Allgemeine Geschäftsbedingungen
            </h2>
            <p className="mb-4">
              Die Nutzung unserer Webseite unterliegt den folgenden Bedingungen. Bitte lesen Sie diese sorgfältig durch:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Die Inhalte unserer Seite sind ausschließlich für den persönlichen Gebrauch bestimmt.</li>
              <li>Alle Informationen und Inhalte werden ohne Gewähr bereitgestellt.</li>
              <li>Wir behalten uns das Recht vor, die Seite jederzeit zu ändern oder zu entfernen.</li>
              <li>
                Haftungsausschluss: Wir übernehmen keine Verantwortung für die Richtigkeit der Inhalte, insbesondere für Informationen, die von unseren AI-Agenten bereitgestellt werden.
              </li>
              <li>Verantwortlich für die Inhalte und deren Nutzung ist ausschließlich der Benutzer.</li>
            </ul>
          </section>

          {/* AI Agent Disclaimer */}
          <section data-testid="section-ai-disclaimer">
            <h2 className="text-2xl font-bold font-heading mb-4">
              Wichtiger Hinweis zu KI-Assistenten
            </h2>
            <div className="bg-card border-l-4 border-primary p-6 rounded-lg">
              <p className="mb-4">
                Unsere Website verwendet KI-gestützte Assistenten (künstliche Intelligenz), die Ihnen Informationen zu unseren Dienstleistungen, Standorten und Angeboten bereitstellen können.
              </p>
              <p className="mb-4">
                <strong>Bitte beachten Sie:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Die von den KI-Assistenten bereitgestellten Informationen basieren auf automatisierter Datenverarbeitung und können möglicherweise nicht immer vollständig korrekt oder aktuell sein.
                </li>
                <li>
                  KI-generierte Antworten dienen ausschließlich zu Informationszwecken und ersetzen keine verbindliche Beratung oder vertragliche Vereinbarung.
                </li>
                <li>
                  Für verbindliche Angebote, Kostenvoranschläge und Terminvereinbarungen kontaktieren Sie uns bitte direkt telefonisch oder per E-Mail.
                </li>
                <li>
                  Wir empfehlen dringend, alle von den KI-Assistenten gelieferten Informationen zu überprüfen, bevor Sie Entscheidungen treffen.
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Die Nutzung unserer KI-Assistenten erfolgt auf eigene Verantwortung. Wir übernehmen keine Haftung für Schäden, die durch die Nutzung der von den KI-Assistenten bereitgestellten Informationen entstehen.
              </p>
            </div>
          </section>

          {/* EU Dispute Resolution */}
          <section data-testid="section-eu-dispute">
            <h2 className="text-2xl font-bold font-heading mb-4">EU-Streitschlichtung</h2>
            <p className="mb-6">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-eu-odr"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              .<br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          {/* Consumer Arbitration */}
          <section data-testid="section-consumer-arbitration">
            <h2 className="text-2xl font-bold font-heading mb-4">
              Verbraucherstreitbeilegung/Universalschlichtungsstelle
            </h2>
            <p className="mb-6">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          {/* Content Responsibility */}
          <section data-testid="section-content-responsibility">
            <h2 className="text-2xl font-bold font-heading mb-4">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="mb-6">
              <p>Adrian Apostol</p>
              <p>Nassaustraße 41</p>
              <p>65719 Hofheim am Taunus</p>
            </div>
          </section>

          {/* General Disclaimer */}
          <section data-testid="section-disclaimer">
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="text-lg font-semibold font-heading mb-3">Haftungsausschluss</h3>
              <p className="text-sm text-muted-foreground">
                Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
