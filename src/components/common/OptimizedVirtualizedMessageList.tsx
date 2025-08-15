import React, { useRef, useEffect, forwardRef, useImperativeHandle, memo, useMemo, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Message } from '@/types/chat';
import { MessageWithAttachments } from '@/components/chat';
import { SkeletonMessage } from './SkeletonMessage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Bot, User } from 'lucide-react';
import { getAgentById } from '@/config/agents';

interface OptimizedVirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  height: number;
  selectedAgent: string;
  typingMessageId: string | null;
  onTypingComplete: (messageId: string) => void;
}

interface OptimizedVirtualizedMessageListRef {
  scrollToBottom: () => void;
}

// Cache des hauteurs des messages
const messageHeights = new Map<string, number>();
const DEFAULT_MESSAGE_HEIGHT = 120;

// Composant MessageItem optimisé avec memo
const MessageItem = memo(({ 
  message, 
  selectedAgent, 
  typingMessageId, 
  onTypingComplete,
  style,
  setItemHeight
}: {
  message: Message;
  selectedAgent: string;
  typingMessageId: string | null;
  onTypingComplete: (messageId: string) => void;
  style: React.CSSProperties;
  setItemHeight: (index: number, height: number) => void;
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messageRef.current) {
      const height = messageRef.current.offsetHeight;
      messageHeights.set(message.id, height);
      setItemHeight(parseInt(message.id), height);
    }
  }, [message.content, message.id, setItemHeight]);

  const agent = useMemo(() => getAgentById(selectedAgent), [selectedAgent]);

  return (
    <div style={style} className="px-6 py-3">
      <div
        ref={messageRef}
        className={`flex gap-4 ${message.role === "user" ? "justify-end message-enter" : "justify-start message-enter-assistant"}`}
      >
        {message.role === "assistant" && (
          <div className="w-8 h-8 rounded-full gradient-agent-animated flex items-center justify-center flex-shrink-0 hover-lift neomorphism-hover overflow-hidden">
            {agent && 'avatar' in agent && typeof agent.avatar === 'string' ? (
              <img 
                src={agent.avatar}
                alt={`${agent.name} Avatar`} 
                className="w-6 h-6 object-cover rounded-full"
                loading="lazy"
                decoding="async"
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
});

MessageItem.displayName = 'MessageItem';

const OptimizedVirtualizedMessageList = forwardRef<OptimizedVirtualizedMessageListRef, OptimizedVirtualizedMessageListProps>(
  ({ messages, isLoading, height, selectedAgent, typingMessageId, onTypingComplete }, ref) => {
    const listRef = useRef<List>(null);
    const heightsRef = useRef<number[]>([]);

    const scrollToBottom = useCallback(() => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      }
    }, [messages.length]);

    useImperativeHandle(ref, () => ({
      scrollToBottom
    }), [scrollToBottom]);

    useEffect(() => {
      scrollToBottom();
    }, [messages.length, scrollToBottom]);

    const getItemHeight = useCallback((index: number) => {
      if (index === messages.length && isLoading) {
        return 80; // Hauteur du skeleton
      }
      
      const message = messages[index];
      if (!message) return DEFAULT_MESSAGE_HEIGHT;
      
      const cachedHeight = messageHeights.get(message.id);
      if (cachedHeight) return cachedHeight;
      
      // Estimation basée sur la longueur du contenu
      const estimatedHeight = Math.max(
        DEFAULT_MESSAGE_HEIGHT,
        Math.min(500, message.content.length * 0.5 + 100)
      );
      
      return estimatedHeight;
    }, [messages, isLoading]);

    const setItemHeight = useCallback((index: number, height: number) => {
      heightsRef.current[index] = height;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }, []);

    const itemCount = messages.length + (isLoading ? 1 : 0);

    const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
      if (index === messages.length && isLoading) {
        return (
          <div style={style} className="px-6 py-3">
            <SkeletonMessage />
          </div>
        );
      }
      
      const message = messages[index];
      if (!message) return null;

      return (
        <MessageItem
          message={message}
          selectedAgent={selectedAgent}
          typingMessageId={typingMessageId}
          onTypingComplete={onTypingComplete}
          style={style}
          setItemHeight={setItemHeight}
        />
      );
    }, [messages, isLoading, selectedAgent, typingMessageId, onTypingComplete, setItemHeight]);

    return (
      <div className="flex-1">
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={itemCount}
          itemSize={getItemHeight}
          className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          overscanCount={2}
        >
          {ItemRenderer}
        </List>
      </div>
    );
  }
);

OptimizedVirtualizedMessageList.displayName = 'OptimizedVirtualizedMessageList';

export { OptimizedVirtualizedMessageList, type OptimizedVirtualizedMessageListRef };