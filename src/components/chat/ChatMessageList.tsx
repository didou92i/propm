import { User } from "lucide-react";
import { AgentAvatar } from "@/components/common";
import { useAgentSafe } from "@/hooks/ui";
import { VirtualizedMessageList } from "@/components/common";
import type { VirtualizedMessageListRef } from "@/components/common/VirtualizedMessageList";
import { EditableMessage, MessageWithAttachments } from "@/components/chat";
import { StreamingProgress } from "@/components/common";
import { StreamingPerformanceIndicator } from "./StreamingPerformanceIndicator";
import { Message } from "@/types/chat";
import { formatTime } from "./utils/chatUtils";

interface ChatMessageListProps {
  messages: Message[];
  selectedAgent: string;
  typingMessageId: string | null;
  streamingContent: string;
  isStreaming: boolean;
  onMessageEdit: (messageId: string, newContent: string) => void;
  messagesListRef?: React.RefObject<VirtualizedMessageListRef>;
  streamingPerformance?: {
    firstTokenLatency: number;
    tokenCount: number;
    tokensPerSecond: number;
  };
}

export function ChatMessageList({ 
  messages, 
  selectedAgent, 
  typingMessageId, 
  streamingContent, 
  isStreaming,
  onMessageEdit,
  messagesListRef,
  streamingPerformance
}: ChatMessageListProps) {
  const { agent: currentAgent, name: agentName, avatar: agentAvatar, icon: agentIcon } = useAgentSafe(selectedAgent);

  return (
    <div className="flex-1 h-full">
      <div className="h-full overflow-y-auto scroll-smooth px-4 py-6 space-y-6">
        {messages.map((message, index) => (
          <div key={message.id} className="group">
            <div className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* Simple message display without bubbles */}
              <div className={`max-w-[85%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                {/* Author and timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {message.role === "user" ? "Vous" : agentName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                {/* Message content - simple text without background */}
                <div className={`
                  text-sm leading-relaxed
                  ${message.id === typingMessageId ? "animate-pulse" : ""}
                `}>
                  {message.attachments && message.attachments.length > 0 ? (
                    <div className="space-y-3">
                      <MessageWithAttachments 
                        attachments={message.attachments}
                        className="mb-2"
                      />
                      <EditableMessage 
                        content={message.content}
                        onContentChange={(newContent) => onMessageEdit(message.id, newContent)}
                        isAssistant={message.role === "assistant"}
                      />
                    </div>
                  ) : (
                    <EditableMessage 
                      content={message.content}
                      onContentChange={(newContent) => onMessageEdit(message.id, newContent)}
                      isAssistant={message.role === "assistant"}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}