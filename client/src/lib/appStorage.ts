import { nanoid } from 'nanoid';

export interface UserSession {
  userId: string;
  timestamp: string;
  actions: string[];
  preferences: {
    language: string;
    interest?: string;
    location?: string;
  };
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  metadata?: {
    pagesVisited: string[];
    timeOnSite: number;
    lastVisit: string;
    isReturningUser: boolean;
  };
}

const STORAGE_KEY = 'corion_user_session';

export function saveUserSession(data: Partial<UserSession>): void {
  try {
    const existing = getUserSession();
    const updated: UserSession = {
      userId: existing?.userId || nanoid(),
      timestamp: new Date().toISOString(),
      actions: [...(existing?.actions || []), ...(data.actions || [])],
      preferences: {
        ...existing?.preferences,
        ...data.preferences,
        language: data.preferences?.language || existing?.preferences?.language || 'de',
      },
      chatHistory: [...(existing?.chatHistory || []), ...(data.chatHistory || [])],
      metadata: {
        pagesVisited: [
          ...(existing?.metadata?.pagesVisited || []),
          ...(data.metadata?.pagesVisited || []),
        ],
        timeOnSite: (existing?.metadata?.timeOnSite || 0) + (data.metadata?.timeOnSite || 0),
        lastVisit: data.metadata?.lastVisit || new Date().toISOString(),
        isReturningUser: data.metadata?.isReturningUser !== undefined 
          ? data.metadata.isReturningUser 
          : (existing?.metadata?.isReturningUser || false),
      },
    };

    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Error saving user session:', error);
  }
}

export function getUserSession(): UserSession | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;

    return JSON.parse(serialized) as UserSession;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

export function deleteUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error deleting user session:', error);
  }
}

export function updateUserAction(action: string): void {
  saveUserSession({ actions: [action] });
}

export function updateUserPreferences(preferences: Partial<UserSession['preferences']>): void {
  const session = getUserSession();
  saveUserSession({ 
    preferences: {
      language: session?.preferences?.language || 'de',
      ...preferences,
    }
  });
}

export function addChatMessage(role: 'user' | 'assistant', content: string): void {
  saveUserSession({
    chatHistory: [
      {
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function trackPageVisit(page: string): void {
  const session = getUserSession();
  saveUserSession({
    metadata: {
      pagesVisited: [page],
      timeOnSite: 0,
      lastVisit: new Date().toISOString(),
      isReturningUser: session?.metadata?.isReturningUser || false,
    },
  });
}

export function markReturningUser(): void {
  const session = getUserSession();
  if (session) {
    saveUserSession({
      metadata: {
        pagesVisited: session.metadata?.pagesVisited || [],
        timeOnSite: session.metadata?.timeOnSite || 0,
        lastVisit: new Date().toISOString(),
        isReturningUser: true,
      },
    });
  }
}

export function getUserContext(): string {
  const session = getUserSession();
  if (!session) return 'Neuer Besucher';

  const context = {
    isReturning: session.metadata?.isReturningUser,
    pagesVisited: session.metadata?.pagesVisited?.length || 0,
    interest: session.preferences?.interest,
    recentActions: session.actions.slice(-5),
  };

  return JSON.stringify(context);
}
