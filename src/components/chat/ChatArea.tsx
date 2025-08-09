
// ChatArea component for handling chat interactions
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Download, MoreVertical } from "lucide-react";
import { getAgentById, AGENTS } from "@/config/agents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownRenderer, SkeletonMessage, VirtualizedMessageList } from "@/components/common";
import type { VirtualizedMessageListRef } from "@/components/common/VirtualizedMessageList";
import { EditableMessage, ChatAttachment, MessageWithAttachments, ArreteGenerationPrompt } from "@/components/chat";
import { PrepaCdsWelcome } from "@/components/chat/PrepaCdsWelcome";
import { ConversationExport } from "@/components/conversation";
import { useRipple } from "@/hooks/useRipple";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { StreamingProgress } from "@/components/common";
import { Message, MessageAttachment } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { usePrepaCdsChat } from "@/hooks/usePrepaCdsChat";
import { usePrepaCdsConfig } from "@/hooks/chat/usePrepaCdsConfig";
import { CdsProControls } from "@/components/chat/CdsProControls";
import { useCdsProEnhancements } from "@/hooks/chat/useCdsProEnhancements";
import { cdsProService } from "@/services/cdsProService";

interface ChatAreaProps {
  selectedAgent: string;
  sharedContext?: {
    sourceAgent: string;
    messages: Message[];
  };
}

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

const agentInfo = {
  redacpro: {
    name: "RedacPro",
    description: "Assistant IA pour les agents de police municipale",
    suggestions: [
      "Améliorer un rapport",
      "Rédiger un procès-verbal",
      "Rédiger une note de service",
      "Modifier un arrêté existant"
    ]
  },
  cdspro: {
    name: "CDS Pro",
    description: "Assistant spécialisé pour responsables de police municipale",
    suggestions: [
      "Rédiger une note de service",
      "Analyser la conformité juridique",
      "Organiser les cycles de travail",
      "Procédures de contrôle d'identité",
      "Systèmes de vidéoprotection",
      "Coordination avec forces de l'ordre"
    ]
  },
  arrete: {
    name: "ArreteTerritorial",
    description: "Spécialiste des arrêtés municipaux",
    suggestions: [
      "Rédiger un arrêté municipal",
      "Modifier un arrêté existant", 
      "Vérifier la conformité",
      "Consulter la jurisprudence"
    ]
  },
  prepacds: {
    name: "Prepa CDS",
    description: "Assistant personnalisé pour la préparation aux concours de la fonction publique",
    suggestions: [
      "🎯 Commencer un entraînement QCM",
      "📚 Générer un cas pratique",
      "📝 Créer un plan de révision",
      "🔍 Simulation d'oral",
      "📊 Voir mes statistiques",
      "🎓 Évaluer mes progrès",
      "📋 Fiche de révision personnalisée"
    ]
  }
};

export function ChatArea({ selectedAgent, sharedContext }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [processingAttachment, setProcessingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [userSession] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [contextShared, setContextShared] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [bottomPadding, setBottomPadding] = useState<number>(200);
  const createRipple = useRipple('intense');
  const { toast } = useToast();
  const { updateConversation, getConversation } = useConversationHistory();
  const { streamingState, sendStreamingMessage, cancelStream } = useStreamingChat();
  const { optimizeMessages } = usePerformanceOptimization();
  const { generateContent: generatePrepaContent } = usePrepaCdsChat();
  const { config: prepaConfig } = usePrepaCdsConfig();
  const cdsPro = useCdsProEnhancements();

  // Ensure content never scrolls under the fixed composer and legal footer
  useEffect(() => {
    const updateOffsets = () => {
      const composerH = composerRef.current?.getBoundingClientRect().height ?? 0;
      const footerEl = document.querySelector('footer') as HTMLElement | null;
      const footerH = footerEl?.getBoundingClientRect().height ?? 0;
      const bottomOffset = 48; // tailwind bottom-12 => 3rem => 48px
      const extra = 24; // extra breathing space
      setBottomPadding(composerH + footerH + bottomOffset + extra);
    };

    updateOffsets();
    window.addEventListener('resize', updateOffsets);
    const ro = new ResizeObserver(updateOffsets);
    if (composerRef.current) ro.observe(composerRef.current);
    const footerNode = document.querySelector('footer');
    if (footerNode) ro.observe(footerNode);
    return () => {
      window.removeEventListener('resize', updateOffsets);
      ro.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversation history when agent changes
  useEffect(() => {
    const savedMessages = getConversation(selectedAgent);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      setMessages([]);
    }
    setContextShared(false);
  }, [selectedAgent, getConversation]);

  // Handle shared context
  useEffect(() => {
    if (sharedContext && !contextShared) {
      const contextMessage: Message = {
        id: `context_${Date.now()}`,
        content: `**Contexte partagé depuis ${sharedContext.sourceAgent}:**\n\n${sharedContext.messages.map(msg => 
          `**${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}:** ${msg.content}`
        ).join('\n\n')}\n\n---\n\n*Ce contexte vous aide à comprendre la discussion précédente. Comment puis-je vous aider maintenant ?*`,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages(prev => [contextMessage]);
      setContextShared(true);
      
      toast({
        title: "Contexte partagé",
        description: `Le contexte de votre conversation avec ${sharedContext.sourceAgent} a été importé.`,
      });
    }
  }, [sharedContext, contextShared, toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, streamingState.currentContent]);

  // Save messages to conversation history
  useEffect(() => {
    if (messages.length > 0 && !contextShared) {
      updateConversation(selectedAgent, messages);
    }
  }, [messages, selectedAgent, updateConversation, contextShared]);

  const processAttachments = async (): Promise<MessageAttachment[]> => {
    const processedAttachments: MessageAttachment[] = [];
    setProcessingAttachment(true);
    setAttachmentError(null);

    

    for (const attachment of attachments) {
      try {
        
        
        const formData = new FormData();
        formData.append('file', attachment.file);

        const { data, error } = await supabase.functions.invoke('process-document', {
          body: formData
        });

        if (error) {
          logger.error('Supabase function error', error, 'ChatArea');
          throw new Error(`Erreur de traitement: ${error.message}`);
        }

        if (!data || !data.success) {
          logger.error('Document processing failed', data, 'ChatArea');
          throw new Error(data?.error || 'Échec du traitement du document');
        }

        
        
        // Store successful processing in documents table
        toast({
          title: "Document traité avec succès",
          description: `${attachment.file.name} est maintenant prêt pour l'analyse`,
        });
        
        processedAttachments.push({
          id: attachment.id,
          name: attachment.file.name,
          type: attachment.file.type,
          size: attachment.file.size,
          content: data.extractedText || '',
          documentIds: data.documentIds || []
        });
      } catch (error) {
        logger.error('Error processing attachment', error, 'ChatArea');
        const errorMsg = `Erreur lors du traitement de ${attachment.file.name}: ${error.message}`;
        setAttachmentError(errorMsg);
        
        toast({
          title: "Erreur de traitement",
          description: errorMsg,
          variant: "destructive"
        });
        
        // Still add the attachment but mark it as failed
        processedAttachments.push({
          id: attachment.id,
          name: attachment.file.name,
          type: attachment.file.type,
          size: attachment.file.size,
          content: `[Erreur de traitement: ${error.message}]`,
          error: error.message
        });
      }
    }

    setProcessingAttachment(false);
    
    return processedAttachments;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return;

    setAttachmentError(null);

    // Process attachments first
    const processedAttachments = await processAttachments();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    // Prepare optimized message history
    const optimizedMessages = optimizeMessages([...messages, userMessage]);

    // Create temporary assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setTypingMessageId(assistantMessageId);

    try {
      // Prepare the message with attachment context
      let messageContent = content;
      if (processedAttachments.length > 0) {
        const attachmentContext = processedAttachments
          .filter(att => att.content && !att.content.startsWith('[Erreur') && !att.error)
          .map(att => `[Document: ${att.name}]\n${att.content}`)
          .join('\n\n');
        
        if (attachmentContext) {
          messageContent = `Contexte des documents joints:\n${attachmentContext}\n\nQuestion: ${content}`;
        }
      }

      // If PrepaCDS agent, use the dedicated edge function (non-streaming)
      if (selectedAgent === "prepacds") {
        try {
          const result = await generatePrepaContent(
            messageContent,
            prepaConfig.trainingType ?? 'question_ouverte',
            prepaConfig.level ?? 'intermediaire',
            prepaConfig.domain ?? 'droit_administratif'
          );

          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: result }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
        } catch (err: any) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `Désolé, une erreur s'est produite: ${err?.message || 'Erreur inconnue'}. Veuillez réessayer.` }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          toast({
            title: "Erreur Prepa CDS",
            description: err?.message || 'Erreur inconnue',
            variant: "destructive"
          });
        }
        return;
      }

      // Prépare le contenu final et les messages à envoyer (enrichissement CDS Pro)
      const buildMessagesForSend = async () => {
        let finalUserContent = messageContent;
        if (selectedAgent === 'cdspro') {
          const isValid = cdsPro.validateSecurityRequest(messageContent);
          if (!isValid) {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: cdsPro.getSecurityResponse() }
                : msg
            ));
            setTypingMessageId(null);
            setIsLoading(false);
            return null;
          }

          const enriched = cdsPro.enrichPrompt(messageContent);
          const vec = await cdsProService.searchVectorialDatabase(content, cdsPro.configuration.context);
          let vecCtx = '';
          if (vec && vec.length > 0) {
            vecCtx = '\n\nRéférences (extraits):\n' + vec.slice(0, 3).map((r: any, i: number) => `[$${'{'}i+1${'}'}] ${'$'}{r.content?.slice(0, 280)}...`).join('\n');
            toast({ title: 'Références juridiques incluses', description: `${Math.min(3, vec.length)} extraits ajoutés.`});
          }
          finalUserContent = enriched + vecCtx;
        }
        const replaced = optimizedMessages.map((m, i, arr) => (i === arr.length - 1 && m.role === 'user' ? { ...m, content: finalUserContent } : m));
        return replaced;
      };

      const messagesToSend = await buildMessagesForSend();
      if (!messagesToSend) return;

      await sendStreamingMessage(
        messagesToSend,
        selectedAgent,
        userSession,
        // onMessageUpdate
        (content: string, isComplete: boolean) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content }
              : msg
          ));
        },
        // onComplete
        (finalContent: string, threadId?: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: finalContent }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          
          // Update user session with threadId if provided
          if (threadId) {
            try {
              localStorage.setItem(`threadId_${selectedAgent}`, threadId);
            } catch {}
          }
        },
        // onError
        (error: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `Désolé, une erreur s'est produite: ${error}. Veuillez réessayer.` }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          
          toast({
            title: "Erreur de conversation",
            description: error,
            variant: "destructive"
          });
        }
      );

    } catch (error) {
      logger.error("Erreur", error, 'ChatArea');
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `Désolé, une erreur s'est produite: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.` }
          : msg
      ));
      setTypingMessageId(null);
      setIsLoading(false);
      
      toast({
        title: "Erreur de conversation",
        description: error.message || 'Erreur inconnue',
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSendClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
  };

  // Fonction pour modifier le contenu d'un message
  const handleMessageEdit = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, content: newContent }
        : message
    ));
  };


  const currentAgent = agentInfo[selectedAgent as keyof typeof agentInfo];

  // Format timestamp for messages (HH:MM)
  const formatTime = (t: Date | string) => {
    const d = typeof t === 'string' ? new Date(t) : t;
    try {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {selectedAgent === 'cdspro' && (
        <div className="px-6 pt-3">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Références juridiques activées
          </span>
        </div>
      )}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 animate-fade-in" style={{ paddingBottom: bottomPadding }}>
          <div className="text-center max-w-4xl w-full">
            {selectedAgent === "prepacds" ? (
              <PrepaCdsWelcome 
                onSuggestionClick={(suggestion) => {
                  sendMessage(suggestion);
                }}
                onSendMessage={(message) => {
                  setMessages(prev => [...prev, message]);
                }}
              />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-6 float pulse-glow neomorphism overflow-hidden">
                  {(() => {
                    const agent = AGENTS.find(a => a.id === selectedAgent);
                    return agent?.avatar ? (
                      <img 
                        src={agent.avatar}
                        alt={`${agent.name} Avatar`} 
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    ) : (
                      <Bot className="w-16 h-16 text-primary" />
                    );
                  })()}
                </div>
                <h1 className="text-2xl font-bold mb-2 animate-scale-in">
                  {currentAgent?.name || "Assistant IA"}
                </h1>
                <p className="text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {currentAgent?.description || "Comment puis-je vous aider ?"}
                </p>

                {selectedAgent === 'cdspro' && (
                  <div className="mb-6 max-w-2xl mx-auto">
                    <CdsProControls
                      onContextChange={cdsPro.updateContext}
                      onPriorityChange={cdsPro.updatePriority}
                      onTemplateSelect={async (template) => {
                        const generated = await cdsPro.generateDocumentTemplate(template);
                        setInput(prev => (prev ? prev + '\n\n' : '') + generated);
                        toast({ title: 'Modèle inséré', description: 'Le template a été ajouté dans l’éditeur.' });
                      }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAgent?.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        createRipple(e);
                        sendMessage(suggestion);
                      }}
                      className="p-4 rounded-xl glass neomorphism-subtle hover-lift ripple-container text-left group animate-fade-in transform-3d hover-tilt glass-hover"
                      style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                    >
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {suggestion}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ paddingBottom: bottomPadding }}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end message-enter" : "justify-start message-enter-assistant"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full gradient-agent-animated flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover overflow-hidden">
                  {(() => {
                    const agent = AGENTS.find(a => a.id === selectedAgent);
                    return agent?.avatar ? (
                      <img 
                        src={agent.avatar}
                        alt={`${agent.name} Avatar`} 
                        className="w-6 h-6 object-cover rounded-full"
                      />
                    ) : (
                      <Bot className="w-6 h-6 text-primary" />
                    );
                  })()}
                </div>
              )}
              <div
                className={`max-w-3xl p-4 rounded-2xl hover-lift transform-3d ${
                  message.role === "user"
                    ? "gradient-agent-animated text-white neomorphism-inset"
                    : "glass neomorphism hover-glow glass-hover"
                }`}
              >
                {message.attachments && (
                  <MessageWithAttachments 
                    attachments={message.attachments} 
                    className="mb-3"
                  />
                )}
                <EditableMessage
                  content={message.content}
                  onContentChange={(newContent) => handleMessageEdit(message.id, newContent)}
                  isAssistant={message.role === "assistant"}
                  enableTypewriter={message.role === "assistant" && message.id === typingMessageId}
                  onTypingComplete={() => {}}
                  isStreaming={streamingState.isStreaming && message.id === typingMessageId}
                />
                 <div className={`mt-1 text-[11px] ${message.role === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70"}`}>
                   {formatTime(message.timestamp)}
                 </div>
                 
                 {/* Prompt de génération d'arrêté pour ArreteTerritorial */}
                 {message.role === "assistant" && selectedAgent === "arrete" && (
                   <ArreteGenerationPrompt messageContent={message.content} />
                 )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full neomorphism flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div ref={composerRef} className="fixed bottom-12 left-0 md:left-64 right-0 z-30 p-6 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        {attachmentError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{attachmentError}</p>
            <button 
              onClick={() => setAttachmentError(null)}
              className="text-xs text-destructive/70 hover:text-destructive mt-1"
            >
              Fermer
            </button>
          </div>
        )}
        
        {processingAttachment && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-sm text-primary">Traitement des documents en cours...</p>
            </div>
          </div>
        )}
        
        {/* Affichage des pièces jointes au-dessus de la zone de saisie */}
        {attachments.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-border/20 bg-background/50 backdrop-blur-sm">
            <ChatAttachment
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              disabled={isLoading || processingAttachment}
            />
          </div>
        )}
        
        {/* Zone de saisie unifiée avec actions intégrées */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 p-3 rounded-xl glass neomorphism-subtle border border-border/20 backdrop-blur-sm hover:border-border/40 transition-all duration-300">
            {/* Actions à gauche : Attachment et Export */}
            <div className="flex items-center gap-2 pb-1">
              <ChatAttachment
                attachments={[]}
                onAttachmentsChange={setAttachments}
                disabled={isLoading || processingAttachment}
              />
              {messages.length > 0 && (
                <ConversationExport 
                  messages={messages}
                  agentName={currentAgent?.name || selectedAgent}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 hover:scale-105 group"
                    title="Exporter la conversation"
                  >
                    <Download className="w-4 h-4 group-hover:text-primary transition-colors" />
                  </Button>
                </ConversationExport>
              )}
            </div>
            
            {/* Zone de texte principale */}
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachments.length > 0 ? "Posez votre question sur les documents..." : "Écrivez un message..."}
                className="min-h-[60px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                disabled={isLoading || processingAttachment}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
            </div>
            
            {/* Bouton d'envoi */}
            <Button 
              type="submit" 
              disabled={(!input.trim() && attachments.length === 0) || isLoading || processingAttachment}
              className="h-10 w-10 p-0 rounded-lg gradient-agent-animated text-white hover-lift neomorphism-hover ripple-container transform-3d glass-hover shadow-glow transition-all duration-200 hover:scale-105"
              onClick={handleSendClick}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {attachments.length > 0 
            ? `${attachments.length} document${attachments.length > 1 ? 's' : ''} joint${attachments.length > 1 ? 's' : ''} • Notre assistant conversationnel peut faire des erreurs.`
            : "Notre assistant conversationnel peut faire des erreurs. Vérifiez les informations importantes."
          }
        </p>
      </div>
    </div>
  );
}
