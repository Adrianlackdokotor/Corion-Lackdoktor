
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Play, FileText, Headphones, Bot, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

const COURSES = [
  { id: 1, type: "video", title: "Smart Repair Basics", duration: "45 min", thumb: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80" },
  { id: 2, type: "pdf", title: "Manual Vopsitorie SATA", pages: "120 pag", thumb: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80" },
  { id: 3, type: "audio", title: "Podcast: Client Service", duration: "30 min", thumb: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?auto=format&fit=crop&q=80" },
  { id: 4, type: "video", title: "Estimare Daune cu AI", duration: "20 min", thumb: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80" },
  { id: 5, type: "pdf", title: "Ghid Onboarding Germania", pages: "15 pag", thumb: "https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80" },
  { id: 6, type: "video", title: "Masterclass Polish", duration: "60 min", thumb: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80" },
];

export default function Academy() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const aiSearch = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/academy/ask", { question: query });
      return res.json();
    },
    onSuccess: (data) => {
      setAiAnswer(data.answer);
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setAiAnswer(null);
    aiSearch.mutate(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white p-6 pb-24 font-sans">
      
      {/* Hero / Search */}
      <div className="max-w-4xl mx-auto text-center mb-16 pt-10">
        <h1 className="text-4xl font-bold mb-4">Corion Academy <span className="text-[#c00000]">AI</span></h1>
        <p className="text-gray-400 mb-8">Întreabă orice din cursurile noastre. AI-ul a văzut toate videourile pentru tine.</p>
        
        <div className="relative">
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Cum pregătesc suprafața pentru lac?" 
                className="bg-[#1f2937] border-gray-700 h-14 pl-12 text-lg rounded-full shadow-xl focus:ring-[#c00000] pr-32 text-white"
            />
            <Search className="absolute left-4 top-4 text-gray-500 w-6 h-6" />
            <Button 
                onClick={handleSearch}
                disabled={aiSearch.isPending}
                className="absolute right-2 top-2 h-10 rounded-full bg-[#c00000] hover:bg-[#a00000] min-w-[120px]"
            >
                {aiSearch.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : "Întreabă AI"}
            </Button>
        </div>

        {/* AI Answer Card */}
        {aiAnswer && (
            <div className="mt-6 bg-[#1f2937] border border-[#c00000]/30 p-6 rounded-xl text-left animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 text-[#c00000]">
                    <Bot className="w-6 h-6" />
                    <span className="font-bold text-lg">Răspuns Meister AI:</span>
                </div>
                <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
                    {aiAnswer.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2 items-center">
                    <span className="text-xs text-gray-500 uppercase font-bold">Surse identificate:</span>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-blue-400 cursor-pointer hover:underline border border-gray-700">Video: Smart Repair Basics (min 12:30)</span>
                </div>
            </div>
        )}
      </div>

      {/* Library Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Play className="text-[#c00000] w-6 h-6" /> Cursuri Recente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map(course => (
                <Card key={course.id} className="bg-[#1f2937] border-gray-700 overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group shadow-lg">
                    <div className="relative h-48">
                        <img src={course.thumb} alt={course.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-[#c00000] p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                <Play className="fill-white text-white ml-1 w-6 h-6" />
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                            {course.type === 'video' ? course.duration : course.pages}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                            {course.type === 'video' && <Play className="w-3 h-3 text-white" />}
                            {course.type === 'pdf' && <FileText className="w-3 h-3 text-white" />}
                            {course.type === 'audio' && <Headphones className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-[#c00000] uppercase font-bold tracking-wider">{course.type}</span>
                        </div>
                        <h3 className="font-bold text-lg leading-tight text-white group-hover:text-[#c00000] transition-colors">{course.title}</h3>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
