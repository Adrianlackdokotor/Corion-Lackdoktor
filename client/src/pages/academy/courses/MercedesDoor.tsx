
import { Link } from "wouter";
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    title: "1. Demontage der Türverkleidung",
    time: "15 Min",
    tools: "Torx T25, Kunststoffhebel, Handschuhe",
    warning: "Vorsicht: Kabelbaum nicht beschädigen!",
    description: "Entfernen Sie die Schrauben an der Unterseite und lösen Sie die Clips vorsichtig mit dem Kunststoffhebel."
  },
  {
    title: "2. Schleifen & Vorbereitung",
    time: "20 Min",
    tools: "P320 Schleifpapier, Silikonentferner, Abklebeband",
    description: "Schleifen Sie die beschädigte Stelle mit P320, reinigen Sie mit Silikonentferner und kleben Sie den Bereich ab."
  },
  {
    title: "3. Füller auftragen",
    time: "30 Min + Trocknungszeit",
    tools: "2K-Füller, Spritzpistole (1.4mm Düse)",
    description: "Tragen Sie zwei dünne Schichten 2K-Füller auf. Zwischen den Schichten 5 Minuten Ablüftzeit."
  },
  {
    title: "4. Decklack & Klarlack",
    time: "45 Min + Trocknungszeit",
    tools: "Basislack (Mercedes 890U), Klarlack, Spritzpistole",
    description: "2-3 Schichten Basislack, dann 2 Schichten Klarlack. Jede Schicht gut ablüften lassen."
  },
  {
    title: "5. Politur & Montage",
    time: "20 Min",
    tools: "Poliermaschine, P3000 Schleifpaste, Polierpaste",
    description: "Nach vollständiger Trocknung nassschleifen, polieren und Türverkleidung wieder montieren."
  }
];

export default function MercedesDoor() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/academy">
          <Button variant="ghost" className="pl-0 gap-2" data-testid="link-back-academy">
            <ArrowLeft className="w-4 h-4" /> Zurück zur Academy
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8 border-b border-border pb-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge className="bg-blue-600">Karosserie</Badge>
            <Badge variant="outline">Mercedes-Benz</Badge>
            <Badge variant="outline">Level: Profi</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-course-title">
            Mercedes C-Klasse (W205) - Türlackierung komplett
          </h1>
          <p className="text-muted-foreground text-lg">
            Schritt-für-Schritt Anleitung zur professionellen Türlackierung inkl. Demontage und Smart Repair Techniken.
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Geschätzte Dauer: 2-3 Stunden</span>
            <span className="flex items-center gap-1"><Wrench className="w-4 h-4" /> Werkzeug: Spritzpistole, Schleifmaterial</span>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <Card key={idx} data-testid={`card-step-${idx}`}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" /> {step.time}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wrench className="w-4 h-4" /> {step.tools}
                  </span>
                </div>
                {step.warning && (
                  <div className="mt-3 p-3 rounded-md bg-yellow-500/10 text-yellow-500 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {step.warning}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kurs abgeschlossen</h3>
            <p className="text-muted-foreground mb-4">
              Sie haben alle Schritte der Mercedes Türlackierung durchgearbeitet.
            </p>
            <Link href="/academy">
              <Button data-testid="button-back-to-academy">Zurück zur Academy</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
