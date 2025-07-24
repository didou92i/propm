import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTypewriter } from '@/hooks/useTypewriter';

interface MarkdownRendererProps {
  content: string;
  isAssistant?: boolean;
  enableTypewriter?: boolean;
  onTypingComplete?: () => void;
}

export const MarkdownRenderer = ({ 
  content, 
  isAssistant = false, 
  enableTypewriter = false,
  onTypingComplete 
}: MarkdownRendererProps) => {
  const [copied, setCopied] = useState(false);
  
  const { displayedText, isTyping, skipAnimation } = useTypewriter({
    text: content,
    speed: 15,
    delay: 0,
    onComplete: onTypingComplete
  });

  const textToRender = enableTypewriter && isAssistant ? displayedText : content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="group relative">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-foreground mb-4 mt-6 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-foreground mb-3 mt-5 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium text-foreground mb-2 mt-4 first:mt-0">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-foreground mb-3 last:mb-0 leading-relaxed">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">
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
              <li className="text-foreground leading-relaxed">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block bg-muted p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-lg mb-3">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
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

      {/* Skip animation button for typewriter */}
      {enableTypewriter && isAssistant && isTyping && (
        <div className="flex items-center justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipAnimation}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Zap className="h-3 w-3 mr-1" />
            Afficher instantanément
          </Button>
        </div>
      )}

      {/* Typing indicator */}
      {enableTypewriter && isAssistant && isTyping && (
        <div className="flex items-center gap-1 mt-2 text-muted-foreground text-xs">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
          <span>L'assistant tape...</span>
        </div>
      )}
    </div>
  );
};