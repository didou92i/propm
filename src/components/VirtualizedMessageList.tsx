import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Message } from '@/types/chat';
import { SkeletonMessage } from './SkeletonMessage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading?: boolean;
  height: number;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    isLoading: boolean;
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, data }) => {
  const { messages, isLoading } = data;
  const message = messages[index];

  return (
    <div style={style} className="px-4 py-2">
      {message ? (
        <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {message.role === 'assistant' && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/redacpro-avatar.png" alt="RedacPro AI" />
              <AvatarFallback>RP</AvatarFallback>
            </Avatar>
          )}
          <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
            <div className={`rounded-2xl px-4 py-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {message.role === 'assistant' ? (
                <MarkdownRenderer content={message.content} />
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          </div>
          {message.role === 'user' && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          )}
        </div>
      ) : (
        isLoading && <SkeletonMessage />
      )}
    </div>
  );
};

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  isLoading,
  height
}) => {
  const itemData = useMemo(() => ({
    messages,
    isLoading: isLoading || false
  }), [messages, isLoading]);

  const itemCount = useMemo(() => {
    return messages.length + (isLoading ? 1 : 0);
  }, [messages.length, isLoading]);

  // Estimate item height based on content
  const getItemHeight = useMemo(() => {
    return (index: number) => {
      if (index >= messages.length) return 120; // Loading skeleton height
      
      const message = messages[index];
      const baseHeight = 60; // Base height for avatar and padding
      const contentHeight = Math.max(40, message.content.length * 0.5); // Estimate based on content length
      const attachmentHeight = message.attachments ? message.attachments.length * 60 : 0;
      
      return Math.min(baseHeight + contentHeight + attachmentHeight, 500); // Cap at 500px
    };
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={itemCount}
      itemSize={120} // Average item height
      itemData={itemData}
      overscanCount={5} // Render 5 extra items for smoother scrolling
    >
      {MessageItem}
    </List>
  );
};