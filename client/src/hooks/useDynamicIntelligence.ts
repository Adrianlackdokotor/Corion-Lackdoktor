import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { aiEngine } from '../lib/DynamicAIEngine';
import { updateUserAction, trackPageVisit } from '../lib/appStorage';

export type AIAction = 
  | 'user_returned'
  | 'deep_scroll'
  | 'seeking_quote'
  | 'interested_service'
  | 'idle_detected'
  | 'page_exit';

export interface DynamicIntelligenceConfig {
  enableTracking?: boolean;
  trackScrollDepth?: boolean;
  trackIdleTime?: boolean;
  idleThreshold?: number; // seconds
}

export function useDynamicIntelligence(config: DynamicIntelligenceConfig = {}) {
  const [location] = useLocation();
  const {
    enableTracking = true,
    trackScrollDepth = true,
    trackIdleTime = true,
    idleThreshold = 30,
  } = config;

  // Track page views
  useEffect(() => {
    if (!enableTracking) return;

    aiEngine.trackPageView(location);
    trackPageVisit(location);
  }, [location, enableTracking]);

  // Track scroll depth
  useEffect(() => {
    if (!enableTracking || !trackScrollDepth) return;

    let lastScrollDepth = 0;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((window.scrollY / scrollHeight) * 100);

      if (scrollDepth > lastScrollDepth && scrollDepth % 25 === 0) {
        aiEngine.trackScroll(scrollDepth);
        lastScrollDepth = scrollDepth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableTracking, trackScrollDepth]);

  // Track idle time
  useEffect(() => {
    if (!enableTracking || !trackIdleTime) return;

    let idleTimer: NodeJS.Timeout;
    let isIdle = false;

    const resetIdleTimer = () => {
      if (isIdle) {
        updateUserAction('user_active_again');
        isIdle = false;
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        updateUserAction('user_idle');
        aiEngine.trackEvent('idle', { seconds: idleThreshold });
        isIdle = true;
      }, idleThreshold * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [enableTracking, trackIdleTime, idleThreshold]);

  // Trigger AI action
  const triggerAIAction = useCallback((action: AIAction, data?: any) => {
    if (!enableTracking) return;

    updateUserAction(action);
    aiEngine.trackEvent(action, data);

    // Additional logic based on action type
    switch (action) {
      case 'user_returned':
        console.log('Welcome back message could be triggered');
        break;
      case 'seeking_quote':
        console.log('Quote form could be highlighted');
        break;
      case 'interested_service':
        console.log('Service info could be expanded');
        break;
    }
  }, [enableTracking]);

  // Get contextual suggestion
  const getContextualSuggestion = useCallback(() => {
    return aiEngine.getContextualSuggestion();
  }, []);

  // Detect user intent
  const detectUserIntent = useCallback(() => {
    return aiEngine.detectUserIntent();
  }, []);

  // Check if AI chat should be shown
  const shouldShowAIChat = useCallback(() => {
    return aiEngine.shouldShowAIChat();
  }, []);

  return {
    triggerAIAction,
    getContextualSuggestion,
    detectUserIntent,
    shouldShowAIChat,
    trackClick: (element: string, context?: string) => {
      if (enableTracking) {
        aiEngine.trackClick(element, context);
      }
    },
    trackFormStart: (formName: string) => {
      if (enableTracking) {
        aiEngine.trackFormInteraction(formName, 'started');
      }
    },
    trackFormComplete: (formName: string) => {
      if (enableTracking) {
        aiEngine.trackFormInteraction(formName, 'completed');
      }
    },
  };
}
