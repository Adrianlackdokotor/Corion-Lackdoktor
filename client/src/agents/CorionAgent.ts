import { getUserContext } from '../lib/appStorage';

export interface AIResponse {
  reply: string;
  suggestions?: string[];
  action?: 'redirect' | 'show_form' | 'call_phone' | 'open_whatsapp' | 'delegate' | 'navigate' | 'created' | 'show_results';
  actionData?: any;
  scenario?: string;
  knowledge?: {
    pages?: { label: string; route: string; description?: string }[];
    capabilities?: string[];
  };
}

export async function askAdminCora(
  message: string,
  conversationHistory: ConversationMessage[] = [],
): Promise<AIResponse & { intent?: string; status?: string }> {
  const response = await fetch('/api/admin/cora/operate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, conversationHistory: conversationHistory.slice(-12) }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Admin Cora API error: ${response.status}`);
  }
  return response.json();
}

export type AgentType = 'assistant' | 'business' | 'learning';
export type UserRole = 'client' | 'partner';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

let conversationHistory: ConversationMessage[] = [];
let currentRole: UserRole = 'client';
let activeScenario: string | null = null;

function classifyIntent(prompt: string): 'app_ui' | 'delegate' | 'general' {
  const lower = prompt.toLowerCase();
  const uiHints = [
    'unde gasesc', 'unde găsesc', 'deschide', 'mergi la', 'du-mă', 'du ma', 'navighează', 'navigheaza',
    'buton', 'pagina', 'page', 'dashboard', 'auftrag', 'calendar', 'task', 'crm', 'client', 'partner', 'admin',
    'în aplicație', 'in aplicatie', 'in app', 'în app', 'bara de sus', 'meniul', 'tabul'
  ];
  const delegateHints = [
    'scrie email', 'send email', 'trimite email', 'deleg', 'deleagă', 'fa un task pentru claude', 'claude',
    'cauta pe web', 'search web', 'telegram', 'whatsapp', 'mesaj', 'document separat', 'în afara aplicației', 'in afara aplicatiei'
  ];
  if (delegateHints.some((hint) => lower.includes(hint))) return 'delegate';
  if (uiHints.some((hint) => lower.includes(hint))) return 'app_ui';
  return 'general';
}

const APP_LIBRARY = {
  pages: [
    { label: 'Aufträge', route: '/admin', description: 'pipeline și order board' },
    { label: 'Calendar', route: '/admin/calendar', description: 'planificare și appointments' },
    { label: 'Task Board', route: '/tasks', description: 'taskuri și backlog' },
    { label: 'Agent Hub', route: '/admin/agent-tasks', description: 'delegare și review pentru agenți' },
    { label: 'BikuBook / Agent Feed', route: '/admin/agents', description: 'activity feed pentru agenți' },
    { label: 'Partner Dashboard', route: '/partner/dashboard', description: 'shell-ul principal pentru parteneri' },
  ],
  capabilities: [
    'navigation inside Corion app',
    'explain pages already in the UI',
    'use app and DB context already available in Corion',
  ],
};

function pickContextualReply(prompt: string): { reply: string; suggestions: string[] } {
  const lower = prompt.toLowerCase();

  if (lower.includes('auftrag')) {
    return {
      reply: 'Pentru Aufträge intră în /admin. Acolo vezi pipeline-ul principal, comenzile active și poți deschide rapid dosarul fiecărei lucrări.',
      suggestions: ['Deschide Aufträge', 'Arată-mi comenzile active', 'Cum ajung la dosarul unei comenzi?'],
    };
  }

  if (lower.includes('calendar') || lower.includes('program') || lower.includes('planific')) {
    return {
      reply: 'Pentru planificare mergi în /admin/calendar. Acolo gestionezi appointments, scheduling și legătura cu ordinele din workshop.',
      suggestions: ['Deschide calendarul', 'Cum leg appointmentul de Auftrag?', 'Ce comenzi așteaptă scheduling?'],
    };
  }

  if (lower.includes('task')) {
    return {
      reply: 'Pentru taskuri și backlog mergi în /tasks. Acolo vezi lucrările deschise, follow-up-urile și backlogul pentru agenți sau oameni.',
      suggestions: ['Deschide task board', 'Arată backlogul', 'Ce taskuri sunt urgente?'],
    };
  }

  if (lower.includes('agent') || lower.includes('claude') || lower.includes('deleg')) {
    return {
      reply: 'Pentru delegare și urmărirea agenților ai două zone: /admin/agent-tasks pentru taskuri delegate și /admin/agents pentru feedul de activitate BikuBook.',
      suggestions: ['Deschide Agent Hub', 'Deschide Agent Feed', 'Ce poate fi delegat?'],
    };
  }

  if (lower.includes('partener') || lower.includes('partner')) {
    return {
      reply: 'Pentru parteneri, shell-ul principal este /partner/dashboard. De acolo mergi spre comenzile atribuite, uploaduri și calendarul relevant pentru partener.',
      suggestions: ['Deschide dashboard partener', 'Arată comenzile partenerului', 'Unde urcă poze partenerul?'],
    };
  }

  return {
    reply: 'Sunt CORI, ghidul local al aplicației. Pot să te ajut să găsești rapid zona corectă din Corion, să-ți explic modulele și să te orientez pe workflows reale.',
    suggestions: ['Deschide Aufträge', 'Arată-mi calendarul', 'Unde e Agent Hub?'],
  };
}

function buildLocalUiReply(prompt: string): AIResponse {
  const contextual = pickContextualReply(prompt);
  return {
    reply: contextual.reply,
    suggestions: contextual.suggestions,
    action: 'redirect',
    actionData: { scope: 'app_ui', originalPrompt: prompt },
    knowledge: APP_LIBRARY,
  };
}

function buildDelegateReply(prompt: string): AIResponse {
  return {
    reply: 'Asta iese din UI-ul sau cunoașterea locală a aplicației. Pentru așa ceva trebuie să delegăm către alt agent, bus sau workflow extern.',
    suggestions: [
      'Delegă către Claude',
      'Rămâi în aplicație și arată-mi datele locale',
    ],
    action: 'delegate',
    actionData: { scope: 'external_delegate', originalPrompt: prompt },
  };
}


export function setAgentRole(role: UserRole) {
  currentRole = role;
}

export function getAgentRole(): UserRole {
  return currentRole;
}

export function clearConversation() {
  conversationHistory = [];
  activeScenario = null;
}

export async function askCorionAgent(
  prompt: string,
  agentType: AgentType = 'assistant',
  includeContext: boolean = true,
  userId?: string | null
): Promise<AIResponse> {
  try {
    const intent = classifyIntent(prompt);
    if (intent === 'app_ui') {
      return buildLocalUiReply(prompt);
    }
    if (intent === 'delegate') {
      return buildDelegateReply(prompt);
    }
    const userContext = includeContext ? getUserContext(userId) : undefined;

    const historyForRequest = conversationHistory.slice(-6);

    conversationHistory.push({ role: 'user', content: prompt });

    const requestBody: any = {
      prompt,
      agentType,
      role: currentRole,
      conversationHistory: historyForRequest,
    };

    if (activeScenario) {
      requestBody.scenario = activeScenario;
    }

    if (userContext !== undefined && userContext !== null) {
      requestBody.userContext = userContext;
    }

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();

    conversationHistory.push({ role: 'assistant', content: data.reply });

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-12);
    }

    if (data.scenario) {
      activeScenario = data.scenario;
    }

    return data;
  } catch (error) {
    console.error('Error calling Corion Agent:', error);
    return {
      reply: 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt unter 0176 834 582 74.',
    };
  }
}

export class AssistantAgent {
  async respond(userMessage: string): Promise<AIResponse> {
    return askCorionAgent(userMessage, 'assistant');
  }

  async handleGreeting(): Promise<AIResponse> {
    return askCorionAgent('Der Kunde hat gerade den Chat geöffnet. Begrüße ihn freundlich auf Deutsch.', 'assistant');
  }

  async handleServiceInquiry(service: string): Promise<AIResponse> {
    return askCorionAgent(
      `Der Kunde fragt nach ${service}. Erkläre den Service kurz und biete Hilfe an.`,
      'assistant'
    );
  }

  async handlePhotoUpload(): Promise<AIResponse> {
    return askCorionAgent(
      'Der Kunde hat ein Foto hochgeladen. Bestätige den Empfang und erkläre die nächsten Schritte.',
      'assistant'
    );
  }

  async handleLeasingInquiry(): Promise<AIResponse> {
    return askCorionAgent(
      'Der Kunde fragt wegen Leasing-Rückgabe. Erkläre unseren Leasing-Service und den Kostenvorteil.',
      'assistant'
    );
  }
}

export class BusinessAgent {
  async generateQuote(description: string, photoUrl?: string): Promise<AIResponse> {
    const prompt = photoUrl
      ? `Erstelle ein Angebot basierend auf: ${description}. Foto verfügbar: ${photoUrl}`
      : `Erstelle ein Angebot basierend auf: ${description}`;
    return askCorionAgent(prompt, 'business');
  }

  async suggestServices(userNeeds: string): Promise<AIResponse> {
    return askCorionAgent(
      `Basierend auf diesen Bedürfnissen: "${userNeeds}", schlage passende Dienstleistungen vor.`,
      'business'
    );
  }

  async estimateTimeframe(serviceType: string): Promise<AIResponse> {
    return askCorionAgent(`Schätze die Bearbeitungszeit für: ${serviceType}`, 'business');
  }
}

export class LearningAgent {
  async analyzeUserBehavior(actions: string[]): Promise<AIResponse> {
    return askCorionAgent(
      `Analysiere das Nutzerverhalten: ${actions.join(', ')}. Was ist die Intention?`,
      'learning',
      false
    );
  }

  async suggestImprovements(feedback: string): Promise<AIResponse> {
    return askCorionAgent(
      `Feedback vom Nutzer: "${feedback}". Schlage Verbesserungen vor.`,
      'learning',
      false
    );
  }

  async predictNextAction(currentPath: string, history: string[]): Promise<AIResponse> {
    return askCorionAgent(
      `Aktueller Pfad: ${currentPath}. Verlauf: ${history.join(' → ')}. Was könnte der Nutzer als nächstes tun?`,
      'learning',
      false
    );
  }
}

export const assistantAgent = new AssistantAgent();
export const businessAgent = new BusinessAgent();
export const learningAgent = new LearningAgent();
