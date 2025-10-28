import { GPTMessage } from "@/types/gpt-clone";
import { cn } from "@/lib/utils";
import { User, Bot, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface GPTMessageItemProps {
  message: GPTMessage;
}

export function GPTMessageItem({ message }: GPTMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg transition-colors",
        isUser
          ? "bg-transparent"
          : "bg-gray-50 dark:bg-gray-800/50"
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-br from-purple-500 to-blue-600 text-white"
          )}
        >
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {isUser ? "Vous" : "Assistant"}
          </span>
          {message.metadata?.model && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {message.metadata.model}
            </span>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copier
                </>
              )}
            </Button>

            {message.metadata?.tokens && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {message.metadata.tokens} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
