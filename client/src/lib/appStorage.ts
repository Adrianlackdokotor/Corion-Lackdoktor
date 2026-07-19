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
  personalAgent?: {
    agentId: string;
    agentName: string;
    userLabel: string;
    tone: string;
    mission: string;
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

const STORAGE_PREFIX = 'corion_user_session';

function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function saveUserSession(data: Partial<UserSession>, userId?: string | null): void {
  try {
    const existing = getUserSession(userId);
    const updated: UserSession = {
      userId: existing?.userId || userId || nanoid(),
      timestamp: new Date().toISOString(),
      actions: [...(existing?.actions || []), ...(data.actions || [])],
      preferences: {
        ...existing?.preferences,
        ...data.preferences,
        language: data.preferences?.language || existing?.preferences?.language || 'de',
      },
      chatHistory: [...(existing?.chatHistory || []), ...(data.chatHistory || [])],
      personalAgent: data.personalAgent || existing?.personalAgent,
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
    localStorage.setItem(getStorageKey(updated.userId), serialized);
  } catch (error) {
    console.error('Error saving user session:', error);
  }
}

export function getUserSession(userId?: string | null): UserSession | null {
  try {
    const serialized = localStorage.getItem(getStorageKey(userId));
    if (!serialized) return null;

    return JSON.parse(serialized) as UserSession;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

export function deleteUserSession(userId?: string | null): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch (error) {
    console.error('Error deleting user session:', error);
  }
}

export function updateUserAction(action: string, userId?: string | null): void {
  saveUserSession({ actions: [action] }, userId);
}

export function updateUserPreferences(preferences: Partial<UserSession['preferences']>, userId?: string | null): void {
  const session = getUserSession(userId);
  saveUserSession({ 
    preferences: {
      language: session?.preferences?.language || 'de',
      ...preferences,
    }
  }, userId);
}

export function setPersonalAgentProfile(personalAgent: UserSession['personalAgent'], userId?: string | null): void {
  saveUserSession({ personalAgent }, userId);
}

export function addChatMessage(role: 'user' | 'assistant', content: string, userId?: string | null): void {
  saveUserSession({
    chatHistory: [
      {
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ],
  }, userId);
}

export function trackPageVisit(page: string, userId?: string | null): void {
  const session = getUserSession(userId);
  saveUserSession({
    metadata: {
      pagesVisited: [page],
      timeOnSite: 0,
      lastVisit: new Date().toISOString(),
      isReturningUser: session?.metadata?.isReturningUser || false,
    },
  }, userId);
}

export function markReturningUser(userId?: string | null): void {
  const session = getUserSession(userId);
  if (session) {
    saveUserSession({
      metadata: {
        pagesVisited: session.metadata?.pagesVisited || [],
        timeOnSite: session.metadata?.timeOnSite || 0,
        lastVisit: new Date().toISOString(),
        isReturningUser: true,
      },
    }, userId);
  }
}

export function getUserContext(userId?: string | null): string {
  const session = getUserSession(userId);
  if (!session) return 'Neuer Besucher';

  const context = {
    isReturning: session.metadata?.isReturningUser,
    pagesVisited: session.metadata?.pagesVisited?.length || 0,
    interest: session.preferences?.interest,
    recentActions: session.actions.slice(-5),
    personalAgent: session.personalAgent,
  };

  return JSON.stringify(context);
}
