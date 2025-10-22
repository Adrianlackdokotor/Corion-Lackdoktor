import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  // todo: remove mock data
  const faqs = [
    {
      question: "Wie lange dauert eine typische Reparatur?",
      answer: "Die Dauer hängt vom Umfang der Schäden ab. Kleinere Reparaturen wie Smart Repair können oft am selben Tag durchgeführt werden. Größere Unfallschäden benötigen in der Regel 3-7 Werktage. Wir informieren Sie vorab über die voraussichtliche Reparaturdauer.",
    },
    {
      question: "Bieten Sie einen Leihwagen an?",
      answer: "Ja, wir bieten einen kostenlosen Leihwagen während der Reparaturzeit an. Dies ist besonders praktisch bei längeren Reparaturen. Bitte teilen Sie uns bei der Terminvereinbarung mit, wenn Sie einen Leihwagen benötigen.",
    },
    {
      question: "Wie funktioniert die Abrechnung mit der Versicherung?",
      answer: "Wir arbeiten mit allen Versicherungen zusammen und übernehmen die komplette Schadensabwicklung für Sie. Sie müssen sich um nichts kümmern - wir kommunizieren direkt mit Ihrer Versicherung und rechnen die Kosten ab.",
    },
    {
      question: "Erhalte ich eine Garantie auf die Reparatur?",
      answer: "Ja, wir bieten eine umfassende Garantie auf alle durchgeführten Arbeiten und verwendeten Materialien. Die genauen Garantiebedingungen hängen von der Art der Reparatur ab und werden in Ihrem Kostenvoranschlag aufgeführt.",
    },
    {
      question: "Verwenden Sie Original-Ersatzteile?",
      answer: "Wir bieten sowohl Original-Ersatzteile als auch hochwertige Alternativen an. Bei der Kostenvoranschlag-Erstellung besprechen wir mit Ihnen die verschiedenen Optionen und deren Preisunterschiede.",
    },
    {
      question: "Kann ich auch ohne Termin vorbeikommen?",
      answer: "Für eine Besichtigung und Beratung können Sie gerne ohne Termin vorbeikommen. Für die eigentliche Reparatur empfehlen wir jedoch eine Terminvereinbarung, um Wartezeiten zu vermeiden und eine optimale Betreuung zu gewährleisten.",
    },
    {
      question: "Was kostet eine Smart Repair?",
      answer: "Der Preis für Smart Repair hängt von Größe und Umfang des Schadens ab. Senden Sie uns einfach ein Foto vom Schaden per WhatsApp, Formular oder E-Mail und wir erstellen Ihnen ein kostenloses, individuelles Angebot.",
    },
    {
      question: "Bieten Sie auch einen Abhol- und Bringservice an?",
      answer: "Ja, wir bieten einen kostenlosen Abhol- und Bringservice in Wiesbaden und Umgebung an. Ihr Fahrzeug wird bei Ihnen abgeholt und nach der Reparatur wieder zurückgebracht.",
    },
    {
      question: "Welche Zahlungsmethoden akzeptieren Sie?",
      answer: "Wir akzeptieren Barzahlung, EC-Karte und Überweisung. Bei Versicherungsschäden rechnen wir direkt mit Ihrer Versicherung ab.",
    },
    {
      question: "Wie vereinbare ich einen Termin?",
      answer: "Sie können telefonisch unter 0176 834 582 74, per WhatsApp, E-Mail oder über unser Kontaktformular einen Termin vereinbaren. Wir melden uns schnellstmöglich bei Ihnen zurück.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Häufig gestellte Fragen</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Finden Sie Antworten auf die wichtigsten Fragen zu unseren Leistungen
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-6">
              <AccordionTrigger className="text-left hover:no-underline" data-testid={`faq-question-${index}`}>
                <span className="font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-12 p-8 bg-card rounded-md border text-center">
          <h2 className="text-2xl font-bold mb-4">Weitere Fragen?</h2>
          <p className="text-muted-foreground mb-6">
            Wenn Sie weitere Fragen haben, zögern Sie nicht, uns zu kontaktieren. 
            Wir helfen Ihnen gerne weiter!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:017683458274" className="inline-block">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 font-medium" data-testid="button-call-faq">
                Jetzt Anrufen
              </button>
            </a>
            <a href="/kontakt" className="inline-block">
              <button className="px-6 py-3 border rounded-md hover-elevate active-elevate-2 font-medium" data-testid="button-contact-faq">
                Kontakt aufnehmen
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
