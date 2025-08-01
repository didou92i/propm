
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SkeletonTyping } from "@/components/SkeletonMessage";
import { ChatAttachment } from "@/components/ChatAttachment";
import { MessageWithAttachments } from "@/components/MessageWithAttachments";
import { useRipple } from "@/hooks/useRipple";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Message, MessageAttachment } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

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
    description: "Assistant pour la gestion des événements",
    suggestions: [
      "Planifier un événement",
      "Organiser une réunion",
      "Créer un planning",
      "Gérer les ressources"
    ]
  },
  arrete: {
    name: "ArreteForritorial", 
    description: "Spécialiste des arrêtés municipaux",
    suggestions: [
      "Rédiger un arrêté municipal",
      "Modifier un arrêté existant", 
      "Vérifier la conformité",
      "Consulter la jurisprudence"
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
  const createRipple = useRipple('intense');
  const { toast } = useToast();
  const { updateConversation, getConversation } = useConversationHistory();
  
  console.log("ChatArea component loaded - userSession:", userSession);

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
    scrollToBottom();
  }, [messages]);

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

    console.log(`Processing ${attachments.length} attachments...`);

    for (const attachment of attachments) {
      try {
        console.log(`Processing attachment: ${attachment.file.name} (${attachment.file.type}, ${attachment.file.size} bytes)`);
        
        const formData = new FormData();
        formData.append('file', attachment.file);

        const { data, error } = await supabase.functions.invoke('process-document', {
          body: formData
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Erreur de traitement: ${error.message}`);
        }

        if (!data || !data.success) {
          console.error('Document processing failed:', data);
          throw new Error(data?.error || 'Échec du traitement du document');
        }

        console.log(`Successfully processed: ${attachment.file.name}, extracted ${data.extractedTextLength} characters`);
        
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
        console.error('Error processing attachment:', error);
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
    console.log(`Processed ${processedAttachments.length} attachments total`);
    return processedAttachments;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return;

    console.log(`Sending message with ${attachments.length} attachments`);
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
          console.log(`Added context from ${processedAttachments.filter(att => !att.error).length} successfully processed documents`);
        }
      }

      console.log('Sending message to chat-openai function...');
      
      console.log('🚀 CLIENT: Sending message to chat-openai...', {
        selectedAgent,
        userSession,
        hasAttachments: processedAttachments.length > 0,
        messageCount: messages.length + 1
      });

      const { data, error } = await supabase.functions.invoke('chat-openai', {
        body: {
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: messageContent }
          ],
          selectedAgent,
          userSession,
          hasAttachments: processedAttachments.length > 0,
          documentIds: processedAttachments.flatMap(att => att.documentIds || [])
        }
      });

      console.log('📡 CLIENT: Received response from chat-openai:', { 
        success: data?.success, 
        hasMessage: !!data?.message,
        error: error,
        fullData: data 
      });

      if (error) {
        console.error('❌ CLIENT: Supabase function error:', error);
        console.error('❌ CLIENT: Full error object:', JSON.stringify(error, null, 2));
        throw new Error(error.message || "Erreur lors de l'appel à l'API");
      }

      if (!data || !data.success) {
        console.error('❌ CLIENT: Chat function failed:', data);
        console.error('❌ CLIENT: Full data object:', JSON.stringify(data, null, 2));
        throw new Error(data?.error || "Erreur inconnue");
      }

      console.log('✅ CLIENT: Message sent successfully');

      console.log('Received response from assistant');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTypingMessageId(assistantMessage.id);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Désolé, une erreur s'est produite: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur de conversation",
        description: error.message || 'Erreur inconnue',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSendClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
  };

  const currentAgent = agentInfo[selectedAgent as keyof typeof agentInfo];

  return (
    <div className="flex-1 flex flex-col">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
          <div className="text-center max-w-2xl">
            <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-6 float pulse-glow neomorphism overflow-hidden">
              {selectedAgent === 'redacpro' ? (
                <img 
                  src="/lovable-uploads/7500d95b-42e9-406d-89e9-55de70aea1ae.png" 
                  alt="RedacPro Avatar" 
                  className="w-12 h-12 object-cover rounded-full"
                />
              ) : selectedAgent === 'cdspro' ? (
                <img 
                  src="/lovable-uploads/cds-pro-avatar.png" 
                  alt="CDS Pro Avatar" 
                  className="w-12 h-12 object-cover rounded-full"
                />
              ) : (
                <Bot className="w-12 h-12 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2 animate-scale-in">
              {currentAgent?.name || "Assistant IA"}
            </h1>
            <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {currentAgent?.description || "Comment puis-je vous aider ?"}
            </p>
            
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
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end message-enter" : "justify-start message-enter-assistant"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full gradient-agent-animated flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover overflow-hidden">
                  {selectedAgent === 'redacpro' ? (
                    <img 
                      src="/lovable-uploads/7500d95b-42e9-406d-89e9-55de70aea1ae.png" 
                      alt="RedacPro Avatar" 
                      className="w-6 h-6 object-cover rounded-full"
                    />
                  ) : selectedAgent === 'cdspro' ? (
                    <img 
                      src="/lovable-uploads/cds-pro-avatar.png" 
                      alt="CDS Pro Avatar" 
                      className="w-6 h-6 object-cover rounded-full"
                    />
                  ) : (
                    <Bot className="w-6 h-6 text-primary" />
                  )}
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
                <MarkdownRenderer
                  content={message.content}
                  isAssistant={message.role === "assistant"}
                  enableTypewriter={message.role === "assistant" && message.id === typingMessageId}
                  onTypingComplete={() => {
                    // Use setTimeout to avoid setState during render
                    setTimeout(() => {
                      if (message.id === typingMessageId) {
                        setTypingMessageId(null);
                      }
                    }, 0);
                  }}
                />
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full neomorphism flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && <SkeletonTyping />}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="p-6 border-t border-border/40">
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
        
        <ChatAttachment
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          disabled={isLoading || processingAttachment}
        />
        <form onSubmit={handleSubmit} className="flex gap-4 mt-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={attachments.length > 0 ? "Posez votre question sur les documents..." : "Écrivez un message..."}
            className="flex-1 min-h-[60px] max-h-32 resize-none bg-card border-border/40 focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || isLoading || processingAttachment}
            className="gradient-agent-animated hover-lift ripple-container px-6 border-0 text-white neomorphism-subtle"
            onClick={handleSendClick}
          >
            <Send className="w-4 h-4" />
          </Button>
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
