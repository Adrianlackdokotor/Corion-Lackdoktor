
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Flame, Star, Zap, Calendar as CalendarIcon, Wallet, ShieldCheck } from "lucide-react";

export default function GamifiedDashboard() {
  const [activeTab, setActiveTab] = useState("tasks");

  const partnerLevel = "Meister-Lackierer";
  const xpCurrent = 1250;
  const xpNextLevel = 1500;
  const streakDays = 5;
  const monthlyGoal = 5000;
  const currentRevenue = 3200;
  const securityDepositCurrent = 250;
  const securityDepositTarget = 3000;

  const orders = [
    { id: 1, car: "Fiat Ducato (DA-WO-8011)", client: "Indie Campers", status: "late", stage: "painting" },
    { id: 2, car: "VW Golf (WI-ZZ-12)", client: "Privat", status: "scheduled", stage: "pending" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-6xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">Partner Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück! Hier ist dein Tagesüberblick.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card data-testid="card-level">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-bold text-lg">{partnerLevel}</p>
              </div>
            </div>
            <Progress value={(xpCurrent / xpNextLevel) * 100} className="h-2" indicatorClassName="bg-yellow-500" />
            <p className="text-xs text-muted-foreground mt-1">{xpCurrent} / {xpNextLevel} XP</p>
          </CardContent>
        </Card>

        <Card data-testid="card-streak">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="font-bold text-lg">{streakDays} Tage</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    i < streakDays ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < streakDays ? <Star className="w-3 h-3" /> : ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-revenue">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Monatsumsatz</p>
                <p className="font-bold text-lg">{currentRevenue} / {monthlyGoal} EUR</p>
              </div>
            </div>
            <Progress value={(currentRevenue / monthlyGoal) * 100} className="h-2" indicatorClassName="bg-green-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8" data-testid="card-security-deposit">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Kaution</p>
              <p className="font-bold">{securityDepositCurrent} / {securityDepositTarget} EUR</p>
            </div>
          </div>
          <Progress value={(securityDepositCurrent / securityDepositTarget) * 100} className="h-2" indicatorClassName="bg-blue-500" />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" data-testid="tab-tasks">Aufgaben</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Aufträge</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="space-y-3">
            {[
              { label: "Fotos hochladen: Fiat Ducato", xp: 50, done: false },
              { label: "Rechnung erstellen: VW Golf", xp: 30, done: false },
              { label: "Academy-Kurs abschließen", xp: 100, done: true },
            ].map((task, idx) => (
              <Card key={idx} data-testid={`card-task-${idx}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${task.done ? "text-green-500" : "text-yellow-500"}`} />
                    <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.label}</span>
                  </div>
                  <Badge variant="outline">+{task.xp} XP</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} data-testid={`card-order-${order.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{order.car}</p>
                    <p className="text-sm text-muted-foreground">{order.client}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{order.stage}</Badge>
                    <Badge className={order.status === "late" ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"}>
                      {order.status === "late" ? "Verspätet" : "Geplant"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
