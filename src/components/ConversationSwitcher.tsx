import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Clock, ArrowRight, Share2 } from "lucide-react";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Message } from "@/types/chat";

interface ConversationSwitcherProps {
  currentAgent: string;
  onAgentSwitch: (agentId: string, shareContext?: boolean) => void;
  onContextShare: (sourceAgent: string, targetAgent: string, messages: Message[]) => void;
  children: React.ReactNode;
}

const agentNames = {
  redacpro: "RedacPro",
  cdspro: "CDS Pro", 
  arrete: "Arrêté Territorial"
};

export function ConversationSwitcher({ 
  currentAgent, 
  onAgentSwitch, 
  onContextShare,
  children 
}: ConversationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSourceAgent, setSelectedSourceAgent] = useState<string | null>(null);
  const { conversationHistory, getConversationSummary } = useConversationHistory();

  const agentsWithHistory = Object.keys(conversationHistory).filter(
    agentId => conversationHistory[agentId].messageCount > 0
  );

  const handleAgentSwitch = (agentId: string) => {
    onAgentSwitch(agentId);
    setIsOpen(false);
  };

  const handleContextShare = (sourceAgent: string, targetAgent: string) => {
    const sourceMessages = conversationHistory[sourceAgent]?.messages || [];
    onContextShare(sourceAgent, targetAgent, sourceMessages);
    onAgentSwitch(targetAgent);
    setIsOpen(false);
    setSelectedSourceAgent(null);
  };

  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion des conversations</DialogTitle>
          <DialogDescription>
            Basculez entre vos assistants ou partagez le contexte d'une conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current agent */}
          <div>
            <h3 className="text-sm font-medium mb-3">Assistant actuel</h3>
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="font-medium">{agentNames[currentAgent as keyof typeof agentNames]}</span>
              <Badge variant="secondary">Actif</Badge>
            </div>
          </div>

          <Separator />

          {/* Conversations with history */}
          {agentsWithHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Conversations existantes</h3>
              <div className="space-y-2">
                {agentsWithHistory.map(agentId => {
                  const summary = getConversationSummary(agentId);
                  const isCurrentAgent = agentId === currentAgent;
                  
                  return (
                    <div key={agentId} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {agentNames[agentId as keyof typeof agentNames]}
                          </span>
                          {isCurrentAgent && <Badge variant="secondary" className="text-xs">Actuel</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(summary.lastActivity)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {summary.messageCount} message{summary.messageCount > 1 ? 's' : ''}
                          {summary.lastMessage && (
                            <div className="text-xs mt-1 italic">
                              "{summary.lastMessage}"
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {!isCurrentAgent && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSourceAgent(agentId)}
                                className="text-xs"
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                Partager
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAgentSwitch(agentId)}
                                className="text-xs"
                              >
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Basculer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Context sharing */}
          {selectedSourceAgent && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Partager le contexte de {agentNames[selectedSourceAgent as keyof typeof agentNames]}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Choisissez l'assistant qui recevra le contexte de la conversation :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(agentNames).filter(id => id !== selectedSourceAgent).map(agentId => (
                    <Button
                      key={agentId}
                      variant="outline"
                      onClick={() => handleContextShare(selectedSourceAgent, agentId)}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {agentNames[agentId as keyof typeof agentNames]}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSourceAgent(null)}
                  className="mt-2 text-xs"
                >
                  Annuler
                </Button>
              </div>
            </>
          )}

          {/* All agents quick access */}
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3">Tous les assistants</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(agentNames).map(agentId => {
                const isCurrentAgent = agentId === currentAgent;
                const hasHistory = agentsWithHistory.includes(agentId);
                
                return (
                  <Button
                    key={agentId}
                    variant={isCurrentAgent ? "default" : "outline"}
                    disabled={isCurrentAgent}
                    onClick={() => handleAgentSwitch(agentId)}
                    className="justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {agentNames[agentId as keyof typeof agentNames]}
                    {hasHistory && !isCurrentAgent && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {getConversationSummary(agentId).messageCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}