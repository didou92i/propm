import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Message, MessageAttachment } from '@/types/chat';
import { MessageWithAttachments } from '@/components/chat';
import { SkeletonMessage } from './SkeletonMessage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Bot, User } from 'lucide-react';
import { getAgentById } from '@/config/agents';

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  height: number;
  selectedAgent: string;
  typingMessageId: string | null;
  onTypingComplete: (messageId: string) => void;
}

interface VirtualizedMessageListRef {
  scrollToBottom: () => void;
}

const ITEM_HEIGHT = 200; // Estimated height per message

const VirtualizedMessageList = forwardRef<VirtualizedMessageListRef, VirtualizedMessageListProps>(
  ({ messages, isLoading, height, selectedAgent, typingMessageId, onTypingComplete }, ref) => {
    const listRef = useRef<List>(null);

    const scrollToBottom = () => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToBottom
    }));

    useEffect(() => {
      scrollToBottom();
    }, [messages.length]);

    const MessageItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const message = messages[index];

      return (
        <div style={style} className="px-6 py-3">
          <div
            className={`flex gap-4 ${message.role === "user" ? "justify-end message-enter" : "justify-start message-enter-assistant"}`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full gradient-agent-animated flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover overflow-hidden">
                {(() => {
                  const agent = getAgentById(selectedAgent);
                  if (agent && 'avatar' in agent && typeof agent.avatar === 'string') {
                    return (
                      <img 
                        src={agent.avatar}
                        alt={`${agent.name} Avatar`} 
                        className="w-6 h-6 object-cover rounded-full"
                      />
                    );
                  }
                  return <Bot className="w-6 h-6 text-primary" />;
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
              <MarkdownRenderer
                content={message.content}
                isAssistant={message.role === "assistant"}
                enableTypewriter={message.role === "assistant" && message.id === typingMessageId}
                onTypingComplete={() => onTypingComplete(message.id)}
              />
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full neomorphism flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      );
    };

    const itemCount = messages.length + (isLoading ? 1 : 0);

    const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      if (index === messages.length && isLoading) {
        return (
          <div style={style} className="px-6 py-3">
            <SkeletonMessage />
          </div>
        );
      }
      return <MessageItem index={index} style={style} />;
    };

    return (
      <div className="flex-1">
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={itemCount}
          itemSize={ITEM_HEIGHT}
          className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {ItemRenderer}
        </List>
      </div>
    );
  }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export { VirtualizedMessageList, type VirtualizedMessageListRef };