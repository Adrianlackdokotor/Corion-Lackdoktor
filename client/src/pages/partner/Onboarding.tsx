
import React from "react";
import { CheckCircle, Circle, FileText, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tasks = [
  { id: 1, title: "Anmeldung (Bürgeramt)", desc: "Înregistrarea adresei de domiciliu.", status: "done", cost: 0 },
  { id: 2, title: "Gewerbeanmeldung", desc: "Deschiderea PFA-ului (Gewerbe). Taxă de consultanță Corion.", status: "in_progress", cost: 90 },
  { id: 3, title: "Steuernummer (Finanzamt)", desc: "Obținerea codului fiscal pentru facturare.", status: "pending", cost: 90 },
  { id: 4, title: "Asigurare Medicală", desc: "Obligatorie în Germania.", status: "pending", cost: 0 },
];

export default function Onboarding() {
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const progress = (completedTasks / tasks.length) * 100;
  
  const currentDebt = tasks
    .filter(t => t.status !== "pending" && t.cost > 0)
    .reduce((acc, t) => acc + t.cost, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Bun venit în Germania! 🇩🇪</h1>
        <p className="text-gray-400">Hai să te punem pe picioare legal. Urmează pașii de mai jos.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
            <span>Progres Onboarding</span>
            <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-zinc-800" indicatorClassName="bg-red-600" />
      </div>

      <Card className="bg-red-950/20 border border-red-900 mb-8">
        <CardContent className="flex items-start gap-4 p-4">
            <Euro className="w-6 h-6 text-red-500 mt-1" />
            <div>
                <h3 className="font-bold text-red-400">Costuri de Start: {currentDebt}€</h3>
                <p className="text-sm text-gray-400">
                    Aceste costuri pentru asistență (90€/oră) se vor retrage automat din primele tale încasări. 
                </p>
            </div>
        </CardContent>
      </Card>

      <div className="space-y-6 relative border-l border-zinc-800 ml-4 pl-8">
        {tasks.map((task, index) => (
            <div key={task.id} className="relative">
                <div className="absolute -left-[41px] top-1 bg-black p-1">
                    {task.status === "done" ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : task.status === "in_progress" ? (
                        <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <Circle className="w-6 h-6 text-zinc-600" />
                    )}
                </div>

                <Card className={`border ${task.status === 'in_progress' ? 'border-yellow-600/50 bg-yellow-950/10' : 'border-zinc-800 bg-zinc-900'}`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <CardTitle className="text-lg text-white">{task.title}</CardTitle>
                            {task.cost > 0 && (
                                <Badge variant="outline" className="border-red-900 text-red-400">
                                    + {task.cost}€ (Retinere)
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-400 mb-4">{task.desc}</p>
                        
                        {task.status === "in_progress" && (
                            <div className="flex gap-3">
                                <Button className="bg-white text-black hover:bg-gray-200">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Upload Document
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        ))}
      </div>
    </div>
  );
}
