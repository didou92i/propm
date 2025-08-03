import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  FileText, 
  Search, 
  Download,
  X,
  Sparkles
} from 'lucide-react';

interface Suggestion {
  id: string;
  icon: React.ComponentType<any>;
  text: string;
  action: () => void;
  badge?: string;
  color: string;
}

interface ContextualSuggestionsProps {
  hasMessages: boolean;
  hasDocuments: boolean;
  currentAgent: string;
  onSemanticSearch: () => void;
  onShowTemplates: () => void;
  onExportConversation: () => void;
  onSendMessage: (message: string) => void;
}

export const ContextualSuggestions: React.FC<ContextualSuggestionsProps> = ({
  hasMessages,
  hasDocuments,
  currentAgent,
  onSemanticSearch,
  onShowTemplates,
  onExportConversation,
  onSendMessage
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const newSuggestions: Suggestion[] = [];

    // Suggestions basées sur le contexte
    if (!hasMessages) {
      // Utilisateur n'a pas encore de messages
      newSuggestions.push({
        id: 'first-message',
        icon: Sparkles,
        text: `Demandez au ${currentAgent} de vous aider avec votre projet`,
        action: () => onSendMessage(`Salut ! Peux-tu m'expliquer comment tu peux m'aider en tant que ${currentAgent} ?`),
        badge: 'Commencer',
        color: 'text-blue-500'
      });

      newSuggestions.push({
        id: 'templates',
        icon: FileText,
        text: 'Découvrez les modèles prêts à l\'emploi',
        action: onShowTemplates,
        badge: 'Nouveau',
        color: 'text-green-500'
      });
    }

    if (hasDocuments && !hasMessages) {
      // Utilisateur a des documents mais pas de conversation
      newSuggestions.push({
        id: 'ask-about-docs',
        icon: Search,
        text: 'Posez une question sur vos documents',
        action: () => onSendMessage('Peux-tu analyser mes documents uploadés et me faire un résumé ?'),
        badge: 'Intelligent',
        color: 'text-purple-500'
      });
    }

    if (hasMessages && hasDocuments) {
      // Utilisateur actif avec documents
      newSuggestions.push({
        id: 'semantic-search',
        icon: Search,
        text: 'Retrouvez rapidement une information dans vos documents',
        action: onSemanticSearch,
        badge: 'Rapide',
        color: 'text-orange-500'
      });
    }

    if (hasMessages) {
      // Utilisateur a une conversation
      newSuggestions.push({
        id: 'export',
        icon: Download,
        text: 'Exportez cette conversation en PDF',
        action: onExportConversation,
        color: 'text-indigo-500'
      });
    }

    // Suggestions spécifiques par agent
    switch (currentAgent) {
      case 'Développeur':
        if (hasMessages) {
          newSuggestions.push({
            id: 'code-review',
            icon: FileText,
            text: 'Demandez une revue de code',
            action: () => onSendMessage('Peux-tu examiner mon code et suggérer des améliorations ?'),
            color: 'text-cyan-500'
          });
        }
        break;
      case 'Marketing':
        if (hasMessages) {
          newSuggestions.push({
            id: 'strategy',
            icon: Lightbulb,
            text: 'Développez une stratégie marketing',
            action: () => onSendMessage('Aide-moi à créer une stratégie marketing pour mon produit'),
            color: 'text-pink-500'
          });
        }
        break;
    }

    setSuggestions(newSuggestions.slice(0, 3)); // Limiter à 3 suggestions
  }, [hasMessages, hasDocuments, currentAgent, onSemanticSearch, onShowTemplates, onExportConversation, onSendMessage]);

  if (isDismissed || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="glass neomorphism border-primary/20 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Suggestions</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <Button
                key={suggestion.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2 text-left hover:bg-muted/50"
                onClick={suggestion.action}
              >
                <Icon className={`h-4 w-4 mr-2 ${suggestion.color}`} />
                <span className="text-sm flex-1">{suggestion.text}</span>
                {suggestion.badge && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {suggestion.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};