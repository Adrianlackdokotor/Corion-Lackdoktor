import { useState } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHubI18n } from "@/lib/hubI18n";

type Msg = { role: "user" | "ai"; text: string };

export function HubFloatingAssistant() {
  const { t } = useHubI18n();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: t("fab.greeting") },
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [
      ...m,
      { role: "user", text },
      { role: "ai", text: t("fab.demo_reply") },
    ]);
    setDraft("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#E53935] text-white shadow-[0_0_40px_rgba(229,57,53,0.5)] transition-transform hover:scale-105 active:scale-95"
          aria-label={t("fab.title")}
          data-testid="button-fab-assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 flex h-[480px] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-md border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          data-testid="panel-fab-assistant"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E53935]/15 ring-1 ring-[#E53935]/30">
                <Sparkles className="h-4 w-4 text-[#E53935]" />
              </div>
              <span className="text-sm font-semibold text-white">
                {t("fab.title")}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
              data-testid="button-fab-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[#E53935] text-white"
                    : "bg-white/5 text-white/90"
                }`}
                data-testid={`fab-msg-${m.role}-${i}`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("fab.placeholder")}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              data-testid="input-fab-draft"
            />
            <Button
              size="icon"
              onClick={send}
              className="bg-[#E53935] hover:bg-[#E53935]/90"
              data-testid="button-fab-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
