import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GPTAgent } from "@/types/gpt-clone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GPTAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: GPTAgent | null;
  onSave: (agent: Partial<GPTAgent>) => void;
}

export function GPTAgentDialog({
  open,
  onOpenChange,
  agent,
  onSave,
}: GPTAgentDialogProps) {
  const [formData, setFormData] = useState<Partial<GPTAgent>>({
    name: "",
    description: "",
    provider: "openai",
    model: "gpt-3.5-turbo",
    icon: "🤖",
    color: "#6366f1",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    isActive: true,
    capabilities: {
      streaming: true,
      functionCalling: false,
      vision: false,
      codeInterpreter: false,
    },
  });

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    } else {
      setFormData({
        name: "",
        description: "",
        provider: "openai",
        model: "gpt-3.5-turbo",
        icon: "🤖",
        color: "#6366f1",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: true,
        capabilities: {
          streaming: true,
          functionCalling: false,
          vision: false,
          codeInterpreter: false,
        },
      });
    }
  }, [agent, open]);

  const handleSave = () => {
    onSave(formData);
  };

  const updateField = <K extends keyof GPTAgent>(field: K, value: GPTAgent[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateCapability = (capability: keyof NonNullable<GPTAgent["capabilities"]>, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent ? "Modifier l'agent" : "Créer un nouvel agent"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="parameters">Paramètres</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Mon Agent IA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value: any) => updateField("provider", value)}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="mistral">Mistral AI</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Description de l'agent..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => updateField("icon", e.target.value)}
                  placeholder="🤖"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateField("isActive", checked)}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Agent actif
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Température ({formData.temperature})
                </Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    updateField("temperature", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-gray-500">
                  Contrôle la créativité (0 = déterministe, 2 = très créatif)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    updateField("maxTokens", parseInt(e.target.value))
                  }
                  min="100"
                  max="32000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topP">Top P ({formData.topP})</Label>
                <Input
                  id="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.topP}
                  onChange={(e) => updateField("topP", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequencyPenalty">
                  Frequency Penalty ({formData.frequencyPenalty})
                </Label>
                <Input
                  id="frequencyPenalty"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.frequencyPenalty}
                  onChange={(e) =>
                    updateField("frequencyPenalty", parseFloat(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">Prompt Système</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt || ""}
                onChange={(e) => updateField("systemPrompt", e.target.value)}
                placeholder="Vous êtes un assistant utile et serviable..."
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Instructions de base pour le comportement de l'agent
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API (optionnel)</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey || ""}
                onChange={(e) => updateField("apiKey", e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500">
                Laissez vide pour utiliser la clé globale des variables d'environnement
              </p>
            </div>

            {formData.provider === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL de base</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl || ""}
                  onChange={(e) => updateField("baseUrl", e.target.value)}
                  placeholder="https://api.example.com/v1"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Capacités</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="streaming" className="cursor-pointer">
                    Streaming
                  </Label>
                  <Switch
                    id="streaming"
                    checked={formData.capabilities?.streaming}
                    onCheckedChange={(checked) =>
                      updateCapability("streaming", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="functionCalling" className="cursor-pointer">
                    Appel de fonctions
                  </Label>
                  <Switch
                    id="functionCalling"
                    checked={formData.capabilities?.functionCalling}
                    onCheckedChange={(checked) =>
                      updateCapability("functionCalling", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vision" className="cursor-pointer">
                    Vision (images)
                  </Label>
                  <Switch
                    id="vision"
                    checked={formData.capabilities?.vision}
                    onCheckedChange={(checked) =>
                      updateCapability("vision", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="codeInterpreter" className="cursor-pointer">
                    Interpréteur de code
                  </Label>
                  <Switch
                    id="codeInterpreter"
                    checked={formData.capabilities?.codeInterpreter}
                    onCheckedChange={(checked) =>
                      updateCapability("codeInterpreter", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.provider || !formData.model}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {agent ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
