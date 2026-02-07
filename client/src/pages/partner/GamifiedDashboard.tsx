
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Flame, Star, Zap, Calendar as CalendarIcon, Wallet, ShieldCheck } from "lucide-react";

export default function GamifiedDashboard() {
  const [activeTab, setActiveTab] = useState("tasks");

  // Simulated Data
  const partnerLevel = "Maestru Vopsitor";
  const xpCurrent = 1250;
  const xpNextLevel = 1500;
  const streakDays = 5;
  const monthlyGoal = 5000;
  const currentRevenue = 3200;
  const securityDepositCurrent = 250;
  const securityDepositTarget = 3000;

  // Mock Orders
  const orders = [
    { id: 1, car: "Fiat Ducato (DA-WO-8011)", client: "Indie Campers", status: "late", stage: "painting" },
    { id: 2, car: "VW Golf (WI-ZZ-12)", client: "Privat", status: "scheduled", stage: "pending" }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      
      {/* 1. GAMIFICATION HEADER */}
      <div className="bg-gradient-to-b from-red-950/50 to-black p-4 border-b border-red-900/30">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center border-2 border-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 rounded-full border border-black">
                LVL 12
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{partnerLevel}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-yellow-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500" /> 4.9 Rating
                </span>
                <span>•</span>
                <span className="text-orange-500 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-orange-500" /> {streakDays} zile streak
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
             <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className="font-mono font-bold text-green-400">324 HUB</span>
             </div>
          </div>
        </div>

        <div className="relative pt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>XP: {xpCurrent}</span>
                <span>Next: {xpNextLevel}</span>
            </div>
            <Progress value={(xpCurrent / xpNextLevel) * 100} className="h-2 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-red-600 to-yellow-500" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-4">
          <TabsTrigger value="tasks">Sarcini</TabsTrigger>
          <TabsTrigger value="finance">Financiar</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex items-center gap-3">
             <div className="p-2 bg-green-900/30 rounded-full">
                <Zap className="w-5 h-5 text-green-400" />
             </div>
             <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Target Ianuarie</span>
                    <span className="text-white font-bold">{currentRevenue}€ / {monthlyGoal}€</span>
                </div>
                <Progress value={(currentRevenue / monthlyGoal) * 100} className="h-1.5 bg-zinc-800" indicatorClassName="bg-green-500" />
             </div>
          </div>

          {orders.map(order => (
            <Card key={order.id} className="bg-zinc-900 border-l-4 border-l-red-600 border-t-0 border-r-0 border-b-0 shadow-lg relative overflow-hidden group">
                <CardContent className="p-4 relative">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg">{order.car}</h3>
                        <p className="text-sm text-gray-400">{order.client}</p>
                    </div>
                    <Badge variant="outline" className="bg-red-950 text-red-400 border-red-900">
                        {order.status === 'late' ? 'În Întârziere' : 'Programat'}
                    </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                        Finalizează (+50 XP)
                    </Button>
                    <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-gray-300">
                        Detalii & Chat
                    </Button>
                </div>
                </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="finance">
            <Card className="bg-zinc-900 border border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    Fond de Garanție (Kaution)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Strâns: {securityDepositCurrent}€</span>
                    <span className="text-white font-bold">Țintă: {securityDepositTarget}€</span>
                    </div>
                    <Progress 
                    value={(securityDepositCurrent / securityDepositTarget) * 100} 
                    className="h-4 bg-zinc-800" 
                    indicatorClassName="bg-blue-600" 
                    />
                    <p className="text-xs text-gray-500 mt-2">
                    Se reține automat 5% din fiecare lucrare.
                    </p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
