import { useState, useRef, useEffect } from "react";
import { getAgentById } from "@/config/agents";
import { useAgent } from "@/hooks/useAgent";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { useChatLogic } from "@/hooks/chat/useChatLogic";
import { useCdsProEnhancements } from "@/hooks/chat/useCdsProEnhancements";
import { Message } from "@/types/chat";
import { logger } from '@/utils/logger';
import { toast } from "sonner";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { ArreteGenerationPrompt } from "./ArreteGenerationPrompt";
import { agentInfo } from "./utils/chatUtils";
import { AgentAvatar } from "@/components/common/AgentAvatar";
import { AgentSuggestions } from "./AgentSuggestions";
import { DocumentProcessingIndicator } from "@/components/document";
import { StreamingPerformanceIndicator } from "./StreamingPerformanceIndicator";

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
export function ChatArea({
  selectedAgent,
  sharedContext
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [userSession, setUserSession] = useState<{
    id: string;
    threadId?: string;
  }>({
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId: undefined
  });
  const [contextShared, setContextShared] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const {
    updateConversation,
    getConversation
  } = useConversationHistory();
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
      setUserSession(prev => ({
        ...prev,
        threadId: tid || undefined
      }));
    } catch {
      setUserSession(prev => ({
        ...prev,
        threadId: undefined
      }));
    }
  }, [selectedAgent]);

  // Handle shared context
  useEffect(() => {
    if (sharedContext && !contextShared) {
      const contextMessage: Message = {
        id: `context_${Date.now()}`,
        content: `**Contexte partagé depuis ${sharedContext.sourceAgent}:**\n\n${sharedContext.messages.map(msg => `**${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}:** ${msg.content}`).join('\n\n')}\n\n---\n\n*Ce contexte vous aide à comprendre la discussion précédente. Comment puis-je vous aider maintenant ?*`,
        role: "assistant",
        timestamp: new Date()
      };
      setMessages([contextMessage]);
      setContextShared(true);
      toast.success("Contexte partagé", {
        description: `Le contexte de votre conversation avec ${sharedContext.sourceAgent} a été importé.`
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
    
    // Debug log pour tracer les problèmes
    console.log('ChatArea handleSubmit called', {
      input: input.trim(),
      attachments: attachments.length,
      isLoading,
      processingAttachment
    });
    
    // Vérifications de sécurité
    if ((!input.trim() && attachments.length === 0) || isLoading || processingAttachment) {
      console.log('Submit blocked:', { 
        noInput: !input.trim() && attachments.length === 0,
        isLoading,
        processingAttachment
      });
      return;
    }
    
    sendMessage(input, attachments, messages, userSession, setMessages);
  };
  const handleMessageEdit = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(message => message.id === messageId ? {
      ...message,
      content: newContent
    } : message));
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
      logger.error('Erreur lors de la réinitialisation', error, 'ChatArea');
    }
  };
  const currentAgent = useAgent(selectedAgent);
  const agentInfoData = agentInfo[selectedAgent as keyof typeof agentInfo];

  return (
    <div className="flex flex-col h-full max-w-[min(90vw,4xl)] mx-auto w-full">
      {/* Contenu principal centré */}
      <div className="flex-1 flex flex-col h-full">
        {/* Suggestions de l'assistant pour tous les agents */}
        {messages.length === 0 && (
          <div className="px-6 py-8 flex-shrink-0">
            <AgentSuggestions
              agentId={selectedAgent}
              onSuggestionClick={(suggestion) => setInput(suggestion)}
            />
          </div>
        )}

        {/* Document Processing Indicator */}
        {processingAttachment && (
          <div className="px-6 py-4 flex-shrink-0">
            <DocumentProcessingIndicator
              isProcessing={processingAttachment}
              error={attachmentError}
              onRetry={() => {
                // Retry logic would be implemented in useChatLogic
                setAttachmentError(null);
              }}
              fileName={attachments[0]?.file.name}
            />
          </div>
        )}

        {/* Liste des messages avec scroll */}
        <div className="flex-1 min-h-0">
          <ChatMessageList
            messages={messages}
            selectedAgent={selectedAgent}
            typingMessageId={typingMessageId}
            streamingContent={streamingState.currentContent}
            onMessageEdit={handleMessageEdit}
            isStreaming={streamingState.isStreaming}
            streamingPerformance={streamingState.performance}
          />
        </div>

        {/* Compositeur de message fixé en bas */}
        <div ref={composerRef} className="flex-shrink-0">
          <ChatComposer
            input={input}
            setInput={setInput}
            attachments={attachments}
            setAttachments={setAttachments}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            processingAttachment={processingAttachment}
            attachmentError={attachmentError}
            setAttachmentError={setAttachmentError}
            selectedAgent={selectedAgent}
            onResetContext={handleResetContext}
            messages={messages}
          />
        </div>
      </div>
    </div>
  );
}