import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { askCorionAgent } from '@/agents/CorionAgent';
import { addChatMessage, getUserSession } from '@/lib/appStorage';
import { aiEngine } from '@/lib/DynamicAIEngine';
import chatIconImage from '@assets/chat-icon_1761147332590.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage
  useEffect(() => {
    const session = getUserSession();
    if (session?.chatHistory) {
      setMessages(session.chatHistory);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = aiEngine.getPersonalizedGreeting();
      const greetingMessage: Message = {
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      };
      setMessages([greetingMessage]);
      addChatMessage('assistant', greeting);
      
      // Set initial suggestions
      setSuggestions([
        'Ich möchte ein Angebot',
        'Welche Dienstleistungen bieten Sie an?',
        'Wo sind Ihre Standorte?',
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    addChatMessage('user', text);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await askCorionAgent(text);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      addChatMessage('assistant', response.reply);

      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-24 z-40"
          >
            <div className="relative">
              {/* Pulsing glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <button
                onClick={() => setIsOpen(true)}
                className="relative h-16 w-16 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200 overflow-hidden border-2 border-primary/40 hover:border-primary/60"
                data-testid="button-ai-chat-open"
              >
                <img 
                  src={chatIconImage} 
                  alt="AI Chat Assistant" 
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-card border-2 border-primary/30 rounded-lg shadow-2xl flex flex-col backdrop-blur-sm"
            data-testid="container-ai-chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-foreground/30">
                  <img 
                    src={chatIconImage} 
                    alt="AI Assistant" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm">Corion AI-Assistent</h3>
                  <p className="text-xs opacity-90">Powered by GPT-4o-mini</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                data-testid="button-ai-chat-close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && !isLoading && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Vorschläge:</p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left text-sm p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        data-testid={`button-suggestion-${index}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Schreiben Sie Ihre Nachricht..."
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="input-ai-chat-message"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  data-testid="button-ai-chat-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                KI-gestützte Antworten. Für verbindliche Auskünfte kontaktieren Sie uns direkt.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
