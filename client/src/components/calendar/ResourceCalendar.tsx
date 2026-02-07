
import React, { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns"; 
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const partners = [
  { id: 1, name: "Ion Popescu", avatar: "IP" },
  { id: 2, name: "Vasile Auto", avatar: "VA" },
  { id: 3, name: "Service Rapid SRL", avatar: "SR" },
];

const tasks = [
  { id: 101, partnerId: 1, title: "BMW X5 (B-123)", startDay: 1, duration: 2, color: "bg-red-600" },
  { id: 102, partnerId: 2, title: "Audi A4 (W-99)", startDay: 3, duration: 1, color: "bg-blue-600" },
  { id: 103, partnerId: 1, title: "Fiat Ducato", startDay: 4, duration: 3, color: "bg-yellow-600" },
];

export default function ResourceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-white font-bold text-lg">
            Programare Atelier • {format(startDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
            <button className="p-2 hover:bg-zinc-800 rounded text-white"><ChevronLeft /></button>
            <button className="p-2 hover:bg-zinc-800 rounded text-white"><ChevronRight /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
            <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-zinc-800 bg-zinc-900/50">
                <div className="p-3 text-gray-400 font-medium text-sm border-r border-zinc-800">PARTENER</div>
                {days.map((day) => (
                    <div key={day.toString()} className="p-3 text-center border-r border-zinc-800/50">
                        <div className="text-gray-500 text-xs uppercase">{format(day, "EEE")}</div>
                        <div className="text-white font-bold">{format(day, "d")}</div>
                    </div>
                ))}
            </div>

            {partners.map((partner) => (
                <div key={partner.id} className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <div className="p-3 flex items-center gap-3 border-r border-zinc-800">
                        <Avatar className="h-8 w-8 bg-zinc-700">
                            <AvatarFallback className="text-xs">{partner.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-200 font-medium truncate">{partner.name}</span>
                    </div>

                    <div className="col-span-7 relative h-16 bg-zinc-900/20">
                        <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                            {[0,1,2,3,4,5,6].map(i => (
                                <div key={i} className="border-r border-zinc-800/30 h-full"></div>
                            ))}
                        </div>

                        {tasks
                            .filter(t => t.partnerId === partner.id)
                            .map(task => {
                                const left = `${(task.startDay - 1) * 14.28}%`;
                                const width = `${task.duration * 14.28}%`;
                                
                                return (
                                    <div 
                                        key={task.id}
                                        className={`absolute top-2 h-10 rounded-md ${task.color} text-white text-xs p-2 flex items-center shadow-lg cursor-pointer hover:brightness-110 border border-white/10 z-10`}
                                        style={{ left, width: `calc(${width} - 8px)`, marginLeft: '4px' }}
                                        title={task.title}
                                    >
                                        <span className="truncate font-semibold">{task.title}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
