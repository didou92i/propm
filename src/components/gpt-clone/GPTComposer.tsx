import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface GPTComposerProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
}

export function GPTComposer({ onSendMessage, isDisabled }: GPTComposerProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-10 w-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          disabled={isDisabled}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Envoyez un message..."
          className="flex-1 min-h-[24px] max-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          disabled={isDisabled}
          rows={1}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isDisabled}
          className={cn(
            "flex-shrink-0 h-10 w-10 rounded-lg transition-all",
            message.trim() && !isDisabled
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
        Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
      </div>
    </form>
  );
}
