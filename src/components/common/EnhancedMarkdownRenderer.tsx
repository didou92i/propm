import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Play, Pause, Zap, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNaturalTypewriter } from '@/hooks/useNaturalTypewriter';

interface EnhancedMarkdownRendererProps {
  content: string;
  isAssistant?: boolean;
  enableTypewriter?: boolean;
  onTypingComplete?: () => void;
  isStreaming?: boolean;
  naturalSpeed?: boolean;
}

export const EnhancedMarkdownRenderer = ({ 
  content, 
  isAssistant = false, 
  enableTypewriter = false,
  onTypingComplete,
  isStreaming = false,
  naturalSpeed = true
}: EnhancedMarkdownRendererProps) => {
  const [copied, setCopied] = useState(false);
  
  const { 
    displayedText, 
    isTyping, 
    skipAnimation, 
    pauseResume, 
    speedUp,
    progress,
    showBlinkingCursor 
  } = useNaturalTypewriter({
    text: content,
    delay: 300, // Small delay before starting
    onComplete: onTypingComplete,
    disabled: !enableTypewriter || !isAssistant || isStreaming,
    naturalPauses: naturalSpeed,
    showCursor: true
  });

  const textToRender = enableTypewriter && isAssistant && !isStreaming ? displayedText : content;
  const showControls = enableTypewriter && isAssistant && isTyping && !isStreaming;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Copy failed silently
    }
  };

  return (
    <div className="group relative">
      <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href as string} target="_blank" rel="noreferrer" className="story-link text-primary">
                {children}
              </a>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0 animate-fade-in">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0 animate-fade-in">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base md:text-lg font-medium text-foreground mb-2 mt-4 first:mt-0 animate-fade-in">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-foreground/95 mb-3 last:mb-0 leading-relaxed">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground animate-pulse">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-foreground">
                {children}
              </em>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-3 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-3 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-foreground leading-relaxed animate-fade-in">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded text-sm font-mono text-foreground animate-fade-in">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block glass-subtle border border-border/40 p-4 rounded-xl text-sm font-mono text-foreground overflow-x-auto animate-scale-in">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="glass-subtle border border-border/40 p-4 rounded-xl overflow-x-auto mb-3 animate-scale-in">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/60 pl-4 py-2 bg-muted/30 rounded-r-lg mb-3 animate-slide-in-right">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-6 border-border/40 animate-fade-in" />,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3 animate-scale-in">
                <table className="w-full border-collapse border border-border rounded-lg">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-3 py-2 text-left font-medium text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2 text-foreground">
                {children}
              </td>
            ),
          }}
        >
          {textToRender}
        </ReactMarkdown>
      </div>

      {/* Copy button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Enhanced typewriter controls */}
      {showControls && (
        <div className="flex items-center justify-between gap-3 mt-3 p-2 bg-muted/50 rounded-lg border border-border/30">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={pauseResume}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isTyping ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Reprendre
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={speedUp}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Zap className="h-3 w-3 mr-1" />
              Accélérer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipAnimation}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Terminer
            </Button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-200 ease-out" 
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      )}

      {/* Elegant typing indicator */}
      {enableTypewriter && isAssistant && isTyping && !isStreaming && (
        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs animate-fade-in">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
          <span className="font-medium">Rédaction en cours...</span>
          {showBlinkingCursor && (
            <div className="w-px h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>
      )}

      {/* Content analysis info (dev mode) */}
      {process.env.NODE_ENV === 'development' && enableTypewriter && (
        <div className="mt-2 text-xs text-muted-foreground/60">
          Longueur: {content.length} caractères • Mode naturel: {naturalSpeed ? 'Activé' : 'Désactivé'}
        </div>
      )}
    </div>
  );
};