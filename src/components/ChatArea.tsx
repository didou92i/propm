
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SkeletonTyping } from "@/components/SkeletonMessage";
import { useRipple } from "@/hooks/useRipple";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatAreaProps {
  selectedAgent: string;
}

const agentInfo = {
  redacpro: {
    name: "RedacPro",
    description: "Assistant IA pour les agents de police municipale",
    suggestions: [
      "Améliorer un rapport",
      "Rédiger un procès-verbal",
      "Rédiger une note de service",
      "Modifier un arrêté existant"
    ]
  },
  cdspro: {
    name: "CDS Pro",
    description: "Assistant pour la gestion des événements",
    suggestions: [
      "Planifier un événement",
      "Organiser une réunion",
      "Créer un planning",
      "Gérer les ressources"
    ]
  },
  arrete: {
    name: "ArreteForritorial", 
    description: "Spécialiste des arrêtés municipaux",
    suggestions: [
      "Rédiger un arrêté municipal",
      "Modifier un arrêté existant", 
      "Vérifier la conformité",
      "Consulter la jurisprudence"
    ]
  }
};

export function ChatArea({ selectedAgent }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [userSession] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createRipple = useRipple();
  
  console.log("ChatArea component loaded - userSession:", userSession);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-openai', {
        body: {
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: content }
          ],
          selectedAgent,
          userSession
        }
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'appel à l'API");
      }

      if (!data.success) {
        throw new Error(data.error || "Erreur inconnue");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTypingMessageId(assistantMessage.id);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, une erreur s'est produite lors de la communication avec l'assistant IA.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSendClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
  };

  const currentAgent = agentInfo[selectedAgent as keyof typeof agentInfo];


  return (
    <div className="flex-1 flex flex-col">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
          <div className="text-center max-w-2xl">
            <div className="w-16 h-16 rounded-full gradient-agent flex items-center justify-center mx-auto mb-6 float pulse-glow">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 animate-scale-in">
              {currentAgent?.name || "Assistant IA"}
            </h1>
            <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {currentAgent?.description || "Comment puis-je vous aider ?"}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAgent?.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    createRipple(e);
                    sendMessage(suggestion);
                  }}
                  className="p-4 rounded-xl gradient-card hover-lift ripple-container text-left group animate-fade-in transform-3d hover-tilt"
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end message-enter" : "justify-start message-enter-assistant"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full gradient-agent flex items-center justify-center flex-shrink-0 hover-lift">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-3xl p-4 rounded-2xl hover-lift transform-3d ${
                  message.role === "user"
                    ? "gradient-agent text-white"
                    : "gradient-card hover-glow"
                }`}
              >
                <MarkdownRenderer
                  content={message.content}
                  isAssistant={message.role === "assistant"}
                  enableTypewriter={message.role === "assistant" && message.id === typingMessageId}
                  onTypingComplete={() => {
                    if (message.id === typingMessageId) {
                      setTypingMessageId(null);
                    }
                  }}
                />
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 hover-lift">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && <SkeletonTyping />}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="p-6 border-t border-border/40">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 min-h-[60px] max-h-32 resize-none bg-card border-border/40 focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="gradient-agent hover-lift ripple-container px-6 border-0 text-white"
            onClick={handleSendClick}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Notre assistant conversationnel peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}
