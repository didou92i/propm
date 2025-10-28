import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GPTAgent } from "@/types/gpt-clone";
import { Edit, Trash2, Check, X } from "lucide-react";

interface GPTAgentCardProps {
  agent: GPTAgent;
  onEdit: (agent: GPTAgent) => void;
  onDelete: (agentId: string) => void;
}

export function GPTAgentCard({ agent, onEdit, onDelete }: GPTAgentCardProps) {
  const providerLabels = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    mistral: "Mistral AI",
    custom: "Personnalisé",
  };

  const providerColors = {
    openai: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    anthropic: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    mistral: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    custom: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: agent.color || "#6366f1" }}
        >
          {agent.icon || "🤖"}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(agent)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onDelete(agent.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {agent.name}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Provider:</span>
          <Badge className={providerColors[agent.provider]}>
            {providerLabels[agent.provider]}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Modèle:</span>
          <span className="text-gray-900 dark:text-white font-mono text-xs">
            {agent.model}
          </span>
        </div>

        {agent.temperature !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Température:</span>
            <span className="text-gray-900 dark:text-white">{agent.temperature}</span>
          </div>
        )}

        {agent.maxTokens !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Max tokens:</span>
            <span className="text-gray-900 dark:text-white">{agent.maxTokens}</span>
          </div>
        )}
      </div>

      {agent.capabilities && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.streaming && (
              <Badge variant="outline" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Streaming
              </Badge>
            )}
            {agent.capabilities.functionCalling && (
              <Badge variant="outline" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Functions
              </Badge>
            )}
            {agent.capabilities.vision && (
              <Badge variant="outline" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Vision
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {agent.isActive ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Check className="w-3 h-3 mr-1" />
            Actif
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
            <X className="w-3 h-3 mr-1" />
            Inactif
          </Badge>
        )}
      </div>
    </Card>
  );
}
