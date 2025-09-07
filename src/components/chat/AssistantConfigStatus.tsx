import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, Settings, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
import { AGENTS } from '@/config/agents';

export function AssistantConfigStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    configurations, 
    isLoading, 
    error, 
    hasConfigurations, 
    refreshConfigurations,
    lastUpdated 
  } = useAssistantConfig();

  const getStatusForAgent = (agentId: string) => {
    const config = configurations.find(c => c.agentId === agentId);
    const agent = AGENTS.find(a => a.id === agentId);
    
    return {
      agent,
      config,
      hasConfig: !!config,
      model: config?.model || 'Non configuré',
      promptLength: config?.systemPrompt?.length || 0
    };
  };

  const agentStatuses = AGENTS.map(agent => getStatusForAgent(agent.id));
  const configuredCount = agentStatuses.filter(s => s.hasConfig).length;

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-sm">Configurations Assistants OpenAI</CardTitle>
                  <CardDescription className="text-xs">
                    {hasConfigurations 
                      ? `${configuredCount}/${AGENTS.length} agents configurés` 
                      : 'Aucune configuration trouvée'
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasConfigurations && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {hasConfigurations && lastUpdated && (
                <div className="text-xs text-muted-foreground">
                  Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR')}
                </div>
              )}

              <div className="space-y-2">
                {agentStatuses.map(({ agent, config, hasConfig, model, promptLength }) => (
                  <div key={agent?.id} className="flex items-center justify-between p-2 rounded border border-border/30">
                    <div className="flex items-center gap-2">
                      {agent?.icon && <agent.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{agent?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasConfig ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {model}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {promptLength} chars
                          </Badge>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive" className="text-xs">
                            Non configuré
                          </Badge>
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshConfigurations}
                  disabled={isLoading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Récupération...' : 'Recharger les configurations'}
                </Button>
              </div>

              {!hasConfigurations && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Aucune configuration d'Assistant OpenAI trouvée. Le système utilisera les prompts par défaut optimisés.
                    Cliquez sur "Recharger" pour récupérer vos configurations OpenAI.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}