export default function Datenschutz() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Datenschutzerklärung</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold font-heading mb-4">1. Datenschutz auf einen Blick</h2>
          
          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Allgemeine Hinweise</h3>
          <p className="mb-6">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
            Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>

          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Datenerfassung auf dieser Website</h3>
          <p className="mb-4">
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
          </p>
          <p className="mb-6">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
            Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">2. Hosting</h2>
          <p className="mb-6">
            Wir hosten die Inhalte unserer Website bei folgendem Anbieter:<br />
            [Hosting-Anbieter wird vom Kunden eingefügt]
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">3. Allgemeine Hinweise und Pflichtinformationen</h2>
          
          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Datenschutz</h3>
          <p className="mb-6">
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
            Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der 
            gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">4. Datenerfassung auf dieser Website</h2>
          
          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Kontaktformular</h3>
          <p className="mb-6">
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus 
            dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks 
            Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
          </p>

          <h3 className="text-xl font-semibold font-heading mb-3 mt-6">Anfrage per E-Mail, Telefon oder Telefax</h3>
          <p className="mb-6">
            Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage 
            inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) 
            zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet.
          </p>

          <h2 className="text-2xl font-bold font-heading mb-4 mt-8">5. Ihre Rechte</h2>
          <p className="mb-4">Sie haben folgende Rechte:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Auskunft über Ihre gespeicherten Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung Ihrer Daten</li>
            <li>Einschränkung der Datenverarbeitung</li>
            <li>Datenübertragbarkeit</li>
            <li>Widerspruch gegen die Datenverarbeitung</li>
            <li>Beschwerde bei einer Aufsichtsbehörde</li>
          </ul>

          <p className="text-sm text-muted-foreground mt-12">
            Diese Datenschutzerklärung wurde zuletzt am {new Date().toLocaleDateString('de-DE')} aktualisiert.
          </p>
        </div>
      </div>
    </div>
  );
}
