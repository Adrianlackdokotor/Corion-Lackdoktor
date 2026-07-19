
import { CheckCircle, Circle, FileText, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tasks = [
  { id: 1, title: "Anmeldung (Bürgeramt)", desc: "Adressregistrierung am Wohnort.", status: "done", cost: 0 },
  { id: 2, title: "Gewerbeanmeldung", desc: "Eröffnung des Gewerbes (PFA). Corion-Beratungsgebühr.", status: "in_progress", cost: 90 },
  { id: 3, title: "Steuernummer (Finanzamt)", desc: "Steuernummer für die Rechnungsstellung beantragen.", status: "pending", cost: 90 },
  { id: 4, title: "Krankenversicherung", desc: "Pflichtversicherung in Deutschland.", status: "pending", cost: 0 },
];

export default function Onboarding() {
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const progress = (completedTasks / tasks.length) * 100;
  
  const currentDebt = tasks
    .filter(t => t.status !== "pending" && t.cost > 0)
    .reduce((acc, t) => acc + t.cost, 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2" data-testid="text-onboarding-title">Willkommen in Deutschland!</h1>
        <p className="text-muted-foreground">Folge den Schritten unten, um dich legal aufzustellen.</p>
      </div>

      <Card className="mb-6" data-testid="card-progress">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Fortschritt</span>
            <span className="text-sm text-muted-foreground">{completedTasks}/{tasks.length} erledigt</span>
          </div>
          <Progress value={progress} className="h-3" indicatorClassName="bg-green-500" />
        </CardContent>
      </Card>

      <div className="space-y-4 mb-8">
        {tasks.map((task) => (
          <Card key={task.id} data-testid={`card-onboarding-task-${task.id}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="mt-1">
                {task.status === "done" ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : task.status === "in_progress" ? (
                  <Circle className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold">{task.title}</h3>
                  {task.status === "done" && <Badge className="bg-green-500/20 text-green-500">Erledigt</Badge>}
                  {task.status === "in_progress" && <Badge className="bg-yellow-500/20 text-yellow-500">In Bearbeitung</Badge>}
                  {task.status === "pending" && <Badge variant="outline">Ausstehend</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{task.desc}</p>
                {task.cost > 0 && (
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Euro className="w-3 h-3" /> {task.cost} EUR
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-debt-summary">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Aktuelle Kosten</h3>
          </div>
          <p className="text-2xl font-bold">{currentDebt} EUR</p>
          <p className="text-sm text-muted-foreground mt-1">
            Wird automatisch von deinen zukünftigen Aufträgen abgezogen (max. 20% pro Auftrag).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
