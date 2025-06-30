
import { useState } from "react";
import { Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const handleSave = () => {
    onApiKeyChange(tempKey);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setTempKey(apiKey);
    setIsEditing(true);
  };

  if (!isEditing && apiKey) {
    return (
      <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border/40">
        <Key className="w-4 h-4 text-green-500" />
        <span className="text-sm text-muted-foreground">
          Clé API configurée
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="ml-auto"
        >
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-card rounded-lg border border-border/40">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-primary" />
        <Label htmlFor="apikey" className="text-sm font-medium">
          Clé API OpenAI
        </Label>
      </div>
      <div className="relative">
        <Input
          id="apikey"
          type={showKey ? "text" : "password"}
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          placeholder="sk-..."
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            className="p-1 h-auto"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!tempKey.trim()}
          size="sm"
          className="gradient-primary"
        >
          Sauvegarder
        </Button>
        {apiKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Annuler
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Votre clé API est stockée localement et n'est jamais partagée.
      </p>
    </div>
  );
}
