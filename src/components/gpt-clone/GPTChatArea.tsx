import { ScrollArea } from "@/components/ui/scroll-area";
import { GPTMessage } from "@/types/gpt-clone";
import { GPTMessageItem } from "./GPTMessageItem";
import { GPTComposer } from "./GPTComposer";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface GPTChatAreaProps {
  messages: GPTMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  selectedAgentId: string;
}

export function GPTChatArea({
  messages,
  isStreaming,
  onSendMessage,
  selectedAgentId,
}: GPTChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Comment puis-je vous aider aujourd'hui?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Commencez une conversation avec votre agent IA. Posez des questions, demandez de l'aide ou explorez de nouvelles idées.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                <button
                  onClick={() => onSendMessage("Explique-moi un concept complexe de manière simple")}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Expliquer un concept
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Demandez une explication claire et simple
                  </div>
                </button>

                <button
                  onClick={() => onSendMessage("Aide-moi à écrire du code")}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Écrire du code
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Obtenez de l'aide pour programmer
                  </div>
                </button>

                <button
                  onClick={() => onSendMessage("Donne-moi des idées créatives")}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Brainstorming
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Générez des idées créatives
                  </div>
                </button>

                <button
                  onClick={() => onSendMessage("Analyse ce texte pour moi")}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Analyser du texte
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Obtenez une analyse détaillée
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <GPTMessageItem key={message.id} message={message} />
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">L'agent réfléchit...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <GPTComposer
            onSendMessage={onSendMessage}
            isDisabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
