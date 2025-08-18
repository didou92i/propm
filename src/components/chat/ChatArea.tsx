import { useState, useRef, useEffect } from "react";
import { getAgentById } from "@/config/agents";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { useChatLogic } from "@/hooks/chat/useChatLogic";
import { useCdsProEnhancements } from "@/hooks/chat/useCdsProEnhancements";
import { Message } from "@/types/chat";
import { toast } from "sonner";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { CdsProControls } from "./CdsProControls";
import { PrepaCdsWelcome } from "./PrepaCdsWelcome";
import { ArreteGenerationPrompt } from "./ArreteGenerationPrompt";
import { agentInfo } from "./utils/chatUtils";

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

export function ChatArea({ selectedAgent, sharedContext }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [userSession, setUserSession] = useState<{ id: string; threadId?: string }>({
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId: undefined
  });
  const [contextShared, setContextShared] = useState(false);
  const [bottomPadding, setBottomPadding] = useState<number>(200);

  const composerRef = useRef<HTMLDivElement>(null);
  const { updateConversation, getConversation } = useConversationHistory();
  const cdsPro = useCdsProEnhancements();
  
  const {
    isLoading,
    processingAttachment,
    attachmentError,
    typingMessageId,
    streamingState,
    sendMessage,
    setAttachmentError
  } = useChatLogic(selectedAgent);

  // Calculate bottom padding for fixed composer
  useEffect(() => {
    const updateOffsets = () => {
      const composerH = composerRef.current?.getBoundingClientRect().height ?? 0;
      const footerEl = document.querySelector('footer') as HTMLElement | null;
      const footerH = footerEl?.getBoundingClientRect().height ?? 0;
      const bottomOffset = 48;
      const extra = 24;
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

  // Sync threadId from localStorage when agent changes
  useEffect(() => {
    try {
      const tid = localStorage.getItem(`openai.thread.${selectedAgent}`) || localStorage.getItem(`threadId_${selectedAgent}`);
      setUserSession(prev => ({ ...prev, threadId: tid || undefined }));
    } catch {
      setUserSession(prev => ({ ...prev, threadId: undefined }));
    }
  }, [selectedAgent]);

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
      
      setMessages([contextMessage]);
      setContextShared(true);
      
      toast.success("Contexte partagé", {
        description: `Le contexte de votre conversation avec ${sharedContext.sourceAgent} a été importé.`,
      });
    }
  }, [sharedContext, contextShared]);

  // Save messages to conversation history
  useEffect(() => {
    if (messages.length > 0 && !contextShared) {
      updateConversation(selectedAgent, messages);
    }
  }, [messages, selectedAgent, updateConversation, contextShared]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, attachments, messages, userSession, setMessages);
  };

  const handleMessageEdit = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, content: newContent }
        : message
    ));
  };

  const handleResetContext = () => {
    try {
      // Clear localStorage threads
      localStorage.removeItem(`openai.thread.${selectedAgent}`);
      localStorage.removeItem(`threadId_${selectedAgent}`);
      
      // Reset session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUserSession({
        id: newSessionId,
        threadId: undefined
      });
      
      // Clear messages
      setMessages([]);
      
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };

  const currentAgent = agentInfo[selectedAgent as keyof typeof agentInfo];

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
                  sendMessage(suggestion, [], messages, userSession, setMessages);
                }}
                onSendMessage={(message) => {
                  setMessages(prev => [...prev, message]);
                }}
              />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-6 float pulse-glow neomorphism overflow-hidden">
                  {(() => {
                    const agent = getAgentById(selectedAgent);
                    return agent?.icon ? (
                      <agent.icon className="w-8 h-8 text-primary" />
                    ) : null;
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
                        toast.success('Modèle inséré', { description: 'Le template a été ajouté dans l\'éditeur.' });
                      }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAgent?.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        sendMessage(suggestion, [], messages, userSession, setMessages);
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
        <ChatMessageList
          messages={messages}
          selectedAgent={selectedAgent}
          typingMessageId={typingMessageId}
          streamingContent={streamingState.currentContent}
          isStreaming={streamingState.isStreaming}
          bottomPadding={bottomPadding}
          onMessageEdit={handleMessageEdit}
        />
      )}

      <ChatComposer
        ref={composerRef}
        input={input}
        setInput={setInput}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={messages}
        selectedAgent={selectedAgent}
        isLoading={isLoading}
        processingAttachment={processingAttachment}
        attachmentError={attachmentError}
        onSubmit={handleSubmit}
        onResetContext={handleResetContext}
        setAttachmentError={setAttachmentError}
      />
    </div>
  );
}