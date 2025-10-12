import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-mobile-support";
import { agentInfo } from "./utils/chatUtils";

interface AgentSuggestionsProps {
  agentId: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function AgentSuggestions({ agentId, onSuggestionClick }: AgentSuggestionsProps) {
  const suggestions = agentInfo[agentId as keyof typeof agentInfo]?.suggestions || [];

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 w-full">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium text-center mb-3 sm:mb-4 lg:mb-6 text-muted-foreground px-2">
          Suggestions pour vous aider à commencer
        </h3>
        <div className="grid gap-2 sm:gap-3 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion, index) => (
            <EnhancedButton
              key={index}
              variant="outline"
              withRipple
              className="h-auto p-3 sm:p-4 text-left justify-start whitespace-normal text-wrap transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-border/60 hover:border-primary/40 glass-subtle"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <span className="text-xs sm:text-sm leading-relaxed break-words">
                {suggestion}
              </span>
            </EnhancedButton>
          ))}
        </div>
      </div>
    </div>
  );
}