import { Button } from "@/components/ui/button";
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
    <div className="px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-medium text-center mb-6 text-muted-foreground">
          Suggestions pour vous aider à commencer
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start whitespace-normal transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-border/60 hover:border-primary/40"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <span className="text-sm leading-relaxed">{suggestion}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}