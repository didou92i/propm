import React from 'react';

interface SkeletonMessageProps {
  isUser?: boolean;
}

export const SkeletonMessage: React.FC<SkeletonMessageProps> = ({ isUser = false }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar skeleton */}
        <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
        
        {/* Message content skeleton */}
        <div className={`p-4 rounded-2xl space-y-2 ${
          isUser 
            ? 'bg-primary/10 rounded-br-md' 
            : 'bg-muted rounded-bl-md'
        }`}>
          {/* Text lines with varying widths */}
          <div className="skeleton-text w-48" />
          <div className="skeleton-text w-32" />
          <div className="skeleton-text w-40" />
          
          {/* Typing indicator for assistant */}
          {!isUser && (
            <div className="flex gap-1 items-center mt-3">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SkeletonTyping: React.FC = () => {
  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full gradient-agent pulse-glow flex-shrink-0" />
        <div className="p-4 bg-muted rounded-2xl rounded-bl-md">
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" />
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};