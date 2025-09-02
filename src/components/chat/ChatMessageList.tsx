import { Bot, User } from "lucide-react";
import { getAgentById } from "@/config/agents";
import { VirtualizedMessageList } from "@/components/common";
import type { VirtualizedMessageListRef } from "@/components/common/VirtualizedMessageList";
import { EditableMessage, MessageWithAttachments } from "@/components/chat";
import { StreamingProgress } from "@/components/common";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Message } from "@/types/chat";
import { formatTime } from "./utils/chatUtils";

interface ChatMessageListProps {
  messages: Message[];
  selectedAgent: string;
  typingMessageId: string | null;
  streamingContent: string;
  isStreaming: boolean;
  bottomPadding: number;
  onMessageEdit: (messageId: string, newContent: string) => void;
  messagesListRef?: React.RefObject<VirtualizedMessageListRef>;
}

export function ChatMessageList({ 
  messages, 
  selectedAgent, 
  typingMessageId, 
  streamingContent, 
  isStreaming,
  bottomPadding,
  onMessageEdit,
  messagesListRef
}: ChatMessageListProps) {
  const currentAgent = getAgentById(selectedAgent);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full relative">
        <div className="h-full relative" style={{ paddingBottom: `${bottomPadding}px` }}>
          <div className="h-full overflow-auto">
            {messages.map((message, index) => (
              <div key={message.id} className="mb-6 group animate-message-in px-6">
                <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={(currentAgent as any)?.avatar} 
                          alt={currentAgent?.name || "Assistant"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                          {currentAgent?.icon ? (
                            <currentAgent.icon className="w-5 h-5 text-primary" />
                          ) : (
                            <Bot className="w-5 h-5 text-primary" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "ml-12" : "mr-12"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {message.role === "user" ? "Vous" : currentAgent?.name || "Assistant"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <div className={`
                      rounded-2xl px-4 py-3 
                      ${message.role === "user" 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-card border border-border"
                      }
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
                      
                      {message.id === typingMessageId && isStreaming && streamingContent && (
                        <div className="mt-2 text-sm opacity-70">
                          {streamingContent}...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}