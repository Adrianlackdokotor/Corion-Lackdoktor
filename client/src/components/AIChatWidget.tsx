import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, RotateCcw, Mic, Square, Paperclip, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { askAdminCora, askCorionAgent, clearConversation } from '@/agents/CorionAgent';
import { addChatMessage, getUserSession, setPersonalAgentProfile } from '@/lib/appStorage';
import { aiEngine } from '@/lib/DynamicAIEngine';
import chatIconImage from '@assets/cori-floating-head-v2.png';
import { useLocation } from 'wouter';
import { setCoriLauncherVisible, useOnCoriOpen } from '@/lib/coriWidgetState';

const FLOATING_BUTTON_SIZE = 96;
const FLOATING_BUTTON_MARGIN = 24;

function getDefaultButtonPosition() {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.max(FLOATING_BUTTON_MARGIN, window.innerWidth - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_MARGIN),
    y: Math.max(FLOATING_BUTTON_MARGIN, window.innerHeight - FLOATING_BUTTON_SIZE - 140),
  };
}

function clampButtonPosition(position: { x: number; y: number }) {
  if (typeof window === 'undefined') return position;

  return {
    x: Math.max(FLOATING_BUTTON_MARGIN, Math.min(window.innerWidth - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_MARGIN, position.x)),
    y: Math.max(FLOATING_BUTTON_MARGIN, Math.min(window.innerHeight - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_MARGIN, position.y)),
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIChatWidgetProps {
  embeddedLauncher?: React.ReactNode;
}

export default function AIChatWidget({ embeddedLauncher }: AIChatWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const isDashboard = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/client") || location.startsWith("/hub");
  const authUserId = user?.id || null;
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'there';
  const personalAgentName = authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user?.email === 'adrianlackdoktor@gmail.com' ? 'CORI' : 'Corion AI';
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTopLauncher, setShowTopLauncher] = useState(false);
  const [buttonPos, setButtonPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('cori-floating-position');
      return saved ? clampButtonPosition(JSON.parse(saved)) : getDefaultButtonPosition();
    } catch {
      return getDefaultButtonPosition();
    }
  });
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({ dragging: false, offsetX: 0, offsetY: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const text = "Audio transcris cu succes (Simulare Local Whisper). Poti scrie mai departe.";
        setInput(text);
      }, 2000);
    } else {
      setIsRecording(true);
    }
  };

  // Load per-user chat history from storage
  useEffect(() => {
    if (!authUserId) return;
    const session = getUserSession(authUserId);
    if (session?.chatHistory) {
      setMessages(session.chatHistory);
    } else {
      setMessages([]);
    }
  }, [authUserId]);

  useEffect(() => {
    if (!authUserId || !isAuthenticated || !user) return;
    setPersonalAgentProfile({
      agentId: `personal-agent-${authUserId}`,
      agentName: personalAgentName,
      userLabel: displayName,
      tone: authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user.email === 'adrianlackdoktor@gmail.com' ? 'warm, sharp, founder copilot' : 'helpful, calm, practical',
      mission: authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user.email === 'adrianlackdoktor@gmail.com'
        ? 'Act as the personal execution agent for Adrian, reduce friction, remember relevant context, and proactively handle digital work.'
        : `Act as the personal AI assistant for ${displayName}, adapt to their workflow, and help with relevant digital tasks.`,
    }, authUserId);
  }, [authUserId, isAuthenticated, user, displayName, personalAgentName]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('cori-floating-position', JSON.stringify(buttonPos));
    } catch {}
  }, [buttonPos]);

  useEffect(() => {
    const handleResize = () => {
      setButtonPos((current) => clampButtonPosition(current));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrag = (e: React.MouseEvent<HTMLButtonElement>) => {
    dragRef.current.dragging = true;
    dragRef.current.offsetX = e.clientX - buttonPos.x;
    dragRef.current.offsetY = e.clientY - buttonPos.y;
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      setButtonPos(clampButtonPosition({
        x: e.clientX - dragRef.current.offsetX,
        y: e.clientY - dragRef.current.offsetY,
      }));
    };
    const onUp = () => {
      dragRef.current.dragging = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [buttonPos]);

  // Send initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user?.email === 'adrianlackdoktor@gmail.com'
        ? `Bună Adrian, sunt ${personalAgentName}. Sunt asistenta ta operațională în Corion. Pot căuta canonic clienți, vehicule și Aufträge, pot deschide dosarul potrivit, pot crea taskuri și pot arăta semnale operaționale calculate din Aufträge și Task Board. Pentru mutații sensibile cer date structurate și confirmare. Spune-mi direct obiectivul.`
        : aiEngine.getPersonalizedGreeting();
      const greetingMessage: Message = {
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      };
      setMessages([greetingMessage]);
      addChatMessage('assistant', greeting, authUserId);
      
      // Set initial suggestions
      setSuggestions(
        authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user?.email === 'adrianlackdoktor@gmail.com'
          ? [
              'Caută clientul Müller și deschide dosarul',
              'Creează un task de follow-up pentru azi',
              'Rezuma-mi ce e important azi',
            ]
          : [
              'Was kostet eine Lackreparatur?',
              'Leasing-Rückgabe vorbereiten',
              'Smart Repair - was ist das?',
            ]
      );
    }
  }, [isOpen, messages.length, authUserId, user, personalAgentName]);

  // Handle ESC key to close chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsDismissed(true);
        setShowTopLauncher(true);
        setCoriLauncherVisible(true);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Reopen when the top-bar launcher in AdminDashboard is clicked
  useOnCoriOpen(() => {
    setIsOpen(true);
    setShowTopLauncher(false);
    setCoriLauncherVisible(false);
  });

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    addChatMessage('user', text, authUserId);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const isAdminCora = isAuthenticated && user?.role === 'admin';
      const response = isAdminCora
        ? await askAdminCora(text, messages.slice(-12).map((message) => ({
            role: message.role,
            content: message.content,
          })))
        : await askCorionAgent(text, 'assistant', true, authUserId);
      let replyText = response.reply;

      if (response.action === 'navigate' && typeof response.actionData?.route === 'string') {
        navigate(response.actionData.route);
      }

      if (response.action === 'created' && typeof response.actionData?.route === 'string') {
        replyText = `${replyText}\n\nErgebnis: ${response.actionData.route}`;
      }

      if (response.action === 'redirect' && response.knowledge?.pages?.length) {
        const pageList = response.knowledge.pages
          .map((page) => `• ${page.label} (${page.route})${page.description ? ` - ${page.description}` : ''}`)
          .join('\n');
        replyText = `${replyText}\n\nȘtiu acum aceste zone din aplicație:\n${pageList}`;
      }

      if (response.action === 'delegate') {
        replyText = `${replyText}\n\nPot delega mai departe prin Agent Hub / Claude când vrei.`;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      addChatMessage('assistant', replyText, authUserId);

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

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || isUploading) return;

    const selectedFiles = Array.from(files).slice(0, 5);
    const uploadNotice: Message = {
      role: 'user',
      content: `📎 ${selectedFiles.length} Datei(en) für ${personalAgentName} hochgeladen: ${selectedFiles.map((file) => file.name).join(', ')}`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, uploadNotice]);
    setIsUploading(true);
    setIsLoading(true);
    setSuggestions([]);

    try {
      const payload = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await fileToBase64(file),
        })),
      );

      const uploadResponse = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category: 'generic', files: payload }),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload fehlgeschlagen (HTTP ${uploadResponse.status})`);
      }

      const uploadData = await uploadResponse.json();
      const uploads = uploadData?.uploads || [];
      const analysisPrompt = [
        `Du bist ${personalAgentName}, persönlicher Agent im Corion Hub.`,
        `Analysiere diese hochgeladenen Dateien für ${displayName}.`,
        'Gib zurück:',
        '1. Kurz-Zusammenfassung',
        '2. Welche Daten oder Signale du erkannt hast',
        '3. Welche Aktionen du im Corion Hub als nächstes empfiehlst (Task, Kalender, Finance, CRM, Drive etc.)',
        `Dateien: ${uploads.map((upload: any) => `${upload.name} (${upload.mimeType || 'unknown'})`).join(', ')}`,
      ].join('\n');

      const analysisResponse = await askCorionAgent(analysisPrompt, 'assistant', true, authUserId);
      const assistantMessage: Message = {
        role: 'assistant',
        content: `Am analizat fișierele încărcate.\n\n${analysisResponse.reply}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      addChatMessage('assistant', assistantMessage.content, authUserId);
      setSuggestions(
        analysisResponse.suggestions && analysisResponse.suggestions.length > 0
          ? analysisResponse.suggestions
          : [
              'Erstelle daraus einen Task',
              'Lege dafür einen Kalendereintrag an',
              'Prüfe, ob das zu Finance gehört',
            ],
      );
    } catch (error) {
      console.error('Error uploading files for CORI:', error);
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Upload oder Analyse ist fehlgeschlagen. Versuch es bitte nochmal mit kleineren Dateien oder einem einzelnen Dokument.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsUploading(false);
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const isAdrian = isAuthenticated && user?.email === 'adrianlackdoktor@gmail.com';
  if (!isAdrian) return null;

  return (
    <>
      {/* Mobile fallback launcher — only below sm breakpoint, sits bottom-right outside the crowded header */}
      {showTopLauncher && !isOpen && (
        <button
          type="button"
          onClick={() => { setIsOpen(true); setShowTopLauncher(false); setCoriLauncherVisible(false); }}
          className="sm:hidden fixed bottom-4 right-4 z-[99998] h-12 w-12 rounded-full border border-primary/30 bg-card shadow-lg hover:bg-muted transition-colors flex items-center justify-center"
          aria-label="CORI öffnen"
        >
          <img src={chatIconImage} alt="CORI" className="h-9 w-9 rounded-full object-contain" />
        </button>
      )}

      {/* Chat Toggle Button — only shown when not dismissed to top bar */}
      <AnimatePresence>
        {!isOpen && !showTopLauncher && (
          <motion.div
            className="fixed z-[99999]"
            style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              delay: 1, 
              duration: 0.5,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              onMouseDown={startDrag}
              data-cori-open-button="true"
              className="relative h-24 w-24 rounded-full overflow-visible cursor-grab active:cursor-grabbing bg-transparent border-0 p-0"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              data-testid="button-ai-chat-open"
            >
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(255,64,160,.95), rgba(120,120,255,.95), rgba(90,220,255,.9), rgba(255,64,160,.95))',
                  padding: '4px',
                  boxShadow: '0 0 26px rgba(180,120,255,.45)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-full h-full rounded-full bg-transparent" />
              </motion.div>
              <motion.div
                className="absolute inset-[10px] rounded-full pointer-events-none"
                animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ boxShadow: '0 0 18px rgba(255,120,220,.28), 0 0 24px rgba(80,180,255,.2)' }}
              />
              <img
                src={chatIconImage}
                alt="CORI AI"
                className="absolute z-10 left-1/2 top-[45%] h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(255,120,220,0.18)]"
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99998] w-[95%] max-w-[380px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
              className="h-[600px] max-h-[calc(100vh-8rem)] bg-card border-2 border-primary/30 rounded-lg shadow-2xl flex flex-col backdrop-blur-sm"
              data-testid="container-ai-chat"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-visible">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(255,64,160,.95), rgba(120,120,255,.95), rgba(90,220,255,.9), rgba(255,64,160,.95))', padding: '2px' }}>
                    <div className="w-full h-full rounded-full bg-transparent" />
                  </div>
                  <img
                    src={chatIconImage}
                    alt="AI Assistant"
                    className="absolute left-1/2 top-[50%] w-[34px] h-[34px] -translate-x-1/2 -translate-y-1/2 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm" data-testid="text-chat-title">{personalAgentName} · Personal Agent</h3>
                  <p className="text-xs opacity-90">{isAdrian ? 'Agentul personal al lui Adrian' : `Persönlicher Agent für ${displayName}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      clearConversation();
                      setMessages([]);
                      setSuggestions(
                        authUserId === '9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5' || user?.email === 'adrianlackdoktor@gmail.com'
                          ? [
                              'Erstelle mir einen neuen Follow-up Task',
                              'Zeig mir, was heute wichtig ist',
                              'Lege einen Drive-Ordner für einen Kunden an',
                            ]
                          : [
                              'Was kostet eine Lackreparatur?',
                              'Leasing-Rückgabe vorbereiten',
                              'Smart Repair - was ist das?',
                            ]
                      );
                    }}
                    className="text-primary-foreground"
                    data-testid="button-reset-chat"
                    aria-label="Neues Gespräch"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setIsOpen(false); setShowTopLauncher(true); setCoriLauncherVisible(true); }}
                  className="text-primary-foreground"
                  data-testid="button-close-chat"
                  aria-label="Chat schließen"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  data-testid="button-attach-file"
                  aria-label="Datei anhängen"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "secondary"}
                  size="icon"
                  onClick={handleVoiceRecord}
                  disabled={isLoading || isUploading}
                  data-testid="button-voice-record"
                  className={isRecording ? "animate-pulse" : ""}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isUploading ? 'Dateien werden analysiert...' : 'Schreiben Sie Ihre Nachricht...'}
                  disabled={isLoading || isUploading}
                  className="flex-1"
                  data-testid="input-ai-chat-message"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading || isUploading}
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
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
