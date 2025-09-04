import { useState, useRef, useEffect } from "react";
import { getAgentById } from "@/config/agents";
import { useAgent } from "@/hooks/useAgent";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { useChatLogic } from "@/hooks/chat/useChatLogic";
import { useCdsProEnhancements } from "@/hooks/chat/useCdsProEnhancements";
import { Message } from "@/types/chat";
import { toast } from "sonner";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { ArreteGenerationPrompt } from "./ArreteGenerationPrompt";
import { agentInfo } from "./utils/chatUtils";
import { AgentAvatar } from "@/components/common/AgentAvatar";
import { AgentSuggestions } from "./AgentSuggestions";

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
  const [bottomPadding, setBottomPadding] = useState<number>(200);
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
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };
  const currentAgent = useAgent(selectedAgent);
  const agentInfoData = agentInfo[selectedAgent as keyof typeof agentInfo];

  return (
    <div className="flex flex-col h-full">
      {/* Header avec avatar de l'agent */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40">
        <div className="flex items-center gap-4">
          <AgentAvatar 
            agentId={selectedAgent}
            agentName={currentAgent?.name}
            avatarUrl={currentAgent?.avatar}
            fallbackIcon={currentAgent?.icon}
            size="xl"
          />
          <div>
            <h2 className="text-xl font-semibold">{currentAgent?.name}</h2>
            <p className="text-sm text-muted-foreground">{agentInfoData?.description || currentAgent?.description}</p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col relative">
        {/* Zone spéciale pour Arrêté Territorial */}
        {selectedAgent === "arrete" && messages.length === 0 && (
          <div className="p-6">
            <ArreteGenerationPrompt messageContent="" />
          </div>
        )}

        {/* Suggestions de l'assistant */}
        {messages.length === 0 && selectedAgent !== "arrete" && (
          <AgentSuggestions
            agentId={selectedAgent}
            onSuggestionClick={(suggestion) => setInput(suggestion)}
          />
        )}

        {/* Liste des messages */}
        <div className="flex-1 overflow-hidden">
          <ChatMessageList
            messages={messages}
            selectedAgent={selectedAgent}
            typingMessageId={typingMessageId}
            streamingContent={streamingState.currentContent}
            onMessageEdit={handleMessageEdit}
            bottomPadding={bottomPadding}
            isStreaming={streamingState.isStreaming}
          />
        </div>

        {/* Compositeur de message fixe en bas */}
        <div ref={composerRef} className="border-t border-border/40 bg-background/95 backdrop-blur-sm">
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