import {
  Bot,
  Hammer,
  Calculator,
  Megaphone,
  HeadphonesIcon,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { deductHubTokens } from "./HubTokensCounter";

interface AiAgent {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  color: string;
  costTkn: number;
}

const AGENTS: AiAgent[] = [
  {
    id: "meister",
    name: "Meister AI",
    description: "Verkauf · Angebote · Battle Cards",
    icon: Hammer,
    color: "text-red-400",
    costTkn: 0.15,
  },
  {
    id: "contabil",
    name: "Contabil AI",
    description: "BWA · Profit First · Cashflow",
    icon: Calculator,
    color: "text-emerald-400",
    costTkn: 0.12,
  },
  {
    id: "marketing",
    name: "Marketing AI",
    description: "SEO · Social · Kampagnen",
    icon: Megaphone,
    color: "text-purple-400",
    costTkn: 0.18,
  },
  {
    id: "cora",
    name: "CORA Orchestrator",
    description: "Routing · Szenarien · Memory",
    icon: Brain,
    color: "text-blue-400",
    costTkn: 0.20,
  },
  {
    id: "reception",
    name: "Reception AI",
    description: "Annahme · Kalender · Kunden",
    icon: HeadphonesIcon,
    color: "text-amber-400",
    costTkn: 0.10,
  },
];

interface AiAgentHubMenuProps {
  /** Optional callback fired after the user picks an agent (after deduction). */
  onAgentSelect?: (agentId: string) => void;
}

export default function AiAgentHubMenu({ onAgentSelect }: AiAgentHubMenuProps) {
  const { toast } = useToast();

  const handleSelect = (agent: AiAgent) => {
    // Mock token deduction with floating animation in the counter
    deductHubTokens(agent.costTkn, `agent:${agent.id}`);
    toast({
      title: `${agent.name} aktiviert`,
      description: `Kosten: ${agent.costTkn.toFixed(2)} TKN · ${agent.description}`,
    });
    onAgentSelect?.(agent.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-red-600/50 bg-red-600/10 text-white hover:bg-red-600/20"
          data-testid="button-ai-agent-hub"
          aria-label="AI Agent Hub öffnen"
        >
          <Bot className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline font-semibold">AI Agent Hub</span>
          <span className="sm:hidden font-semibold">AI</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 bg-zinc-950 border-zinc-800 text-white"
        data-testid="menu-ai-agent-hub"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          AI Agent auswählen
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {AGENTS.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onSelect={() => handleSelect(agent)}
            className="flex items-start gap-3 px-3 py-2.5 cursor-pointer focus:bg-zinc-900 focus:text-white"
            data-testid={`item-agent-${agent.id}`}
          >
            <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              <agent.icon className={`w-4 h-4 ${agent.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">
                {agent.name}
              </div>
              <div className="text-[11px] text-zinc-400 leading-tight mt-0.5 truncate">
                {agent.description}
              </div>
            </div>
            <span className="text-[10px] font-bold tabular-nums text-zinc-500 flex-shrink-0 mt-1">
              {agent.costTkn.toFixed(2)} TKN
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-zinc-800" />
        <div className="px-3 py-2 text-[10px] text-zinc-500 leading-relaxed">
          Tokens werden bei jeder AI-Anfrage automatisch abgerechnet. 1 TKN ≈
          1 € Cloud-Kosten.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
