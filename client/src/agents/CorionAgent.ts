import { getUserContext } from '../lib/appStorage';

export interface AIResponse {
  reply: string;
  suggestions?: string[];
  action?: 'redirect' | 'show_form' | 'call_phone' | 'open_whatsapp';
  actionData?: any;
}

export type AgentType = 'assistant' | 'business' | 'learning';

export async function askCorionAgent(
  prompt: string,
  agentType: AgentType = 'assistant',
  includeContext: boolean = true
): Promise<AIResponse> {
  try {
    const userContext = includeContext ? getUserContext() : null;

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        agentType,
        userContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Corion Agent:', error);
    return {
      reply: 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.',
    };
  }
}

export class AssistantAgent {
  async respond(userMessage: string): Promise<AIResponse> {
    return askCorionAgent(userMessage, 'assistant');
  }

  async handleGreeting(): Promise<AIResponse> {
    const greetingPrompts = [
      'Der Kunde hat gerade den Chat geöffnet. Begrüße ihn freundlich auf Deutsch.',
    ];
    return askCorionAgent(greetingPrompts[0], 'assistant');
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
    return askCorionAgent(
      `Schätze die Bearbeitungszeit für: ${serviceType}`,
      'business'
    );
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
