import { useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      
      setTimeout(() => {
        setIsProcessing(false);
        const mockupTranscript = "[AI Transcript]: " + (Math.random() > 0.5 ? "Clientul confirmă că mașina va ajunge mâine. Actele sunt în torpedou." : "Asigurarea vinovatului este HUK Coburg. Aștept raportul de poliție pe WhatsApp.");
        onTranscript(mockupTranscript);
      }, 3000);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button 
        type="button"
        variant={isRecording ? "destructive" : "secondary"}
        size="sm" 
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className="w-full flex justify-center gap-2 relative overflow-hidden"
      >
        {isRecording && (
          <span className="absolute inset-0 bg-red-500/20 animate-pulse"></span>
        )}
        {isProcessing ? (
          <><div className="flex gap-1 items-center">
              <span className="text-xl leading-none animate-[pulse_1.5s_ease-in-out_infinite] tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">∞</span>
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">+1</span>
            </div> 
            <span className="text-purple-500 animate-pulse font-medium">AI gândește...</span></>
        ) : isRecording ? (
          <><Square className="w-4 h-4" /> 🔴 Oprește Înregistrarea</>
        ) : (
          <><Mic className="w-4 h-4" /> Înregistrează Apel (Transcriere AI)</>
        )}
      </Button>
    </div>
  );
}
