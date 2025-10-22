import {
  getUserSession,
  updateUserAction,
  trackPageVisit,
  markReturningUser,
  getUserContext,
} from './appStorage';

export type UserIntent = 
  | 'browsing'
  | 'seeking_quote'
  | 'returning_customer'
  | 'interested_service'
  | 'ready_to_contact';

export interface AIEngineConfig {
  enableTracking: boolean;
  enableSuggestions: boolean;
  confidenceThreshold: number;
}

class DynamicAIEngine {
  private config: AIEngineConfig;
  private sessionStartTime: number;

  constructor(config: Partial<AIEngineConfig> = {}) {
    this.config = {
      enableTracking: true,
      enableSuggestions: true,
      confidenceThreshold: 0.6,
      ...config,
    };
    this.sessionStartTime = Date.now();
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getUserSession();
    if (session) {
      markReturningUser();
    }
  }

  public trackEvent(eventType: string, data?: any): void {
    if (!this.config.enableTracking) return;

    const event = `${eventType}${data ? `:${JSON.stringify(data)}` : ''}`;
    updateUserAction(event);
  }

  public trackPageView(path: string): void {
    trackPageVisit(path);
    this.trackEvent('page_view', { path });
  }

  public trackClick(element: string, context?: string): void {
    this.trackEvent('click', { element, context });
  }

  public trackScroll(depth: number): void {
    if (depth > 75) {
      this.trackEvent('deep_scroll', { depth });
    }
  }

  public trackFormInteraction(formName: string, action: 'started' | 'completed'): void {
    this.trackEvent(`form_${action}`, { formName });
  }

  public detectUserIntent(): UserIntent {
    const session = getUserSession();
    if (!session) return 'browsing';

    const actions = session.actions || [];
    const recentActions = actions.slice(-10);

    if (recentActions.some(a => a.includes('whatsapp') || a.includes('phone'))) {
      return 'ready_to_contact';
    }

    if (recentActions.some(a => a.includes('kontakt') || a.includes('offer'))) {
      return 'seeking_quote';
    }

    if (session.metadata?.isReturningUser) {
      return 'returning_customer';
    }

    if (recentActions.filter(a => a.includes('leistungen')).length > 2) {
      return 'interested_service';
    }

    return 'browsing';
  }

  public getContextualSuggestion(): string | null {
    if (!this.config.enableSuggestions) return null;

    const intent = this.detectUserIntent();
    const session = getUserSession();
    const timeOnSite = (Date.now() - this.sessionStartTime) / 1000;

    switch (intent) {
      case 'seeking_quote':
        return '📸 Möchten Sie schnell ein Angebot erhalten? Senden Sie uns ein Foto!';
      
      case 'returning_customer':
        return '👋 Willkommen zurück! Können wir Ihnen heute wieder helfen?';
      
      case 'interested_service':
        const interest = session?.preferences?.interest;
        return interest 
          ? `Interessieren Sie sich für ${interest}? Wir beraten Sie gerne!`
          : '💡 Haben Sie Fragen zu unseren Dienstleistungen?';
      
      case 'ready_to_contact':
        return '✨ Großartig! Wir freuen uns auf Ihre Nachricht!';
      
      case 'browsing':
        if (timeOnSite > 30) {
          return '🤔 Suchen Sie etwas Bestimmtes? Unser AI-Assistent hilft gerne!';
        }
        return null;
      
      default:
        return null;
    }
  }

  public getUserContextForAI(): string {
    const session = getUserSession();
    const intent = this.detectUserIntent();
    const suggestion = this.getContextualSuggestion();

    return `
User Context:
- Intent: ${intent}
- Is Returning User: ${session?.metadata?.isReturningUser || false}
- Pages Visited: ${session?.metadata?.pagesVisited?.length || 0}
- Recent Actions: ${session?.actions.slice(-5).join(', ') || 'none'}
- Interest: ${session?.preferences?.interest || 'unknown'}
- Current Suggestion: ${suggestion || 'none'}
    `.trim();
  }

  public shouldShowAIChat(): boolean {
    const session = getUserSession();
    const timeOnSite = (Date.now() - this.sessionStartTime) / 1000;
    
    if (timeOnSite < 10) return false;
    
    const intent = this.detectUserIntent();
    return ['seeking_quote', 'interested_service', 'ready_to_contact'].includes(intent);
  }

  public getPersonalizedGreeting(): string {
    const session = getUserSession();
    const intent = this.detectUserIntent();

    if (session?.metadata?.isReturningUser) {
      return 'Willkommen zurück! Wie kann ich Ihnen heute helfen?';
    }

    switch (intent) {
      case 'seeking_quote':
        return 'Hallo! Ich sehe, Sie interessieren sich für ein Angebot. Wie kann ich helfen?';
      case 'interested_service':
        return 'Guten Tag! Haben Sie Fragen zu unseren Dienstleistungen?';
      default:
        return 'Hallo! Ich bin Ihr AI-Assistent von +1 Corion Lackdoktor. Wie kann ich helfen?';
    }
  }
}

export const aiEngine = new DynamicAIEngine();
export default DynamicAIEngine;
