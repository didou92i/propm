import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGPTAgents } from "@/hooks/gpt-clone/useGPTAgents";
import { GPTAgentCard } from "@/components/gpt-clone/GPTAgentCard";
import { GPTAgentDialog } from "@/components/gpt-clone/GPTAgentDialog";
import { GPTAgent } from "@/types/gpt-clone";
import { ArrowLeft, Plus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GPTSettings() {
  const navigate = useNavigate();
  const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useGPTAgents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<GPTAgent | null>(null);

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setDialogOpen(true);
  };

  const handleEditAgent = (agent: GPTAgent) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleSaveAgent = async (agent: Partial<GPTAgent>) => {
    if (editingAgent) {
      await updateAgent(editingAgent.id, agent);
    } else {
      await createAgent(agent as Omit<GPTAgent, "id" | "createdAt" | "updatedAt">);
    }
    setDialogOpen(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet agent?")) {
      await deleteAgent(agentId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/gpt-clone")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au chat
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Configuration des Agents
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gérez vos agents IA personnalisés
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateAgent}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un agent
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Configurez vos propres agents IA
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Créez des agents personnalisés en configurant différents modèles (OpenAI, Anthropic, Mistral ou votre propre API).
                Chaque agent peut avoir ses propres paramètres, prompts système et comportements.
              </p>
            </div>
          </div>
        </Card>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Chargement des agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun agent configuré
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Commencez par créer votre premier agent IA personnalisé
            </p>
            <Button
              onClick={handleCreateAgent}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier agent
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <GPTAgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}

        {/* API Keys Info */}
        <Card className="p-6 mt-8 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-4">
            <div className="text-4xl">🔑</div>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Configuration des clés API
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                Vous pouvez configurer des clés API globales dans vos variables d'environnement ou
                spécifier des clés individuelles pour chaque agent.
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">VITE_OPENAI_API_KEY</code> - Pour les modèles OpenAI</li>
                <li>• <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">VITE_ANTHROPIC_API_KEY</code> - Pour les modèles Claude</li>
                <li>• <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">VITE_MISTRAL_API_KEY</code> - Pour les modèles Mistral</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Dialog */}
      <GPTAgentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />
    </div>
  );
}
