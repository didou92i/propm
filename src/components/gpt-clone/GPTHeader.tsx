import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu, Sparkles } from "lucide-react";
import { useGPTAgents } from "@/hooks/gpt-clone/useGPTAgents";

interface GPTHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function GPTHeader({
  isSidebarOpen,
  onToggleSidebar,
  selectedAgentId,
  onAgentChange,
}: GPTHeaderProps) {
  const { agents, isLoading } = useGPTAgents();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-gray-600 dark:text-gray-400"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            GPT Clone
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedAgentId}
          onValueChange={onAgentChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-64 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="Sélectionner un agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  {agent.icon && <span>{agent.icon}</span>}
                  <div className="flex flex-col">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {agent.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAgent && (
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
            {selectedAgent.model}
          </div>
        )}
      </div>
    </div>
  );
}
