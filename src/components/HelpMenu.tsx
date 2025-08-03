import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  Search, 
  FileText, 
  Download, 
  BarChart3, 
  Sparkles,
  BookOpen,
  Video,
  MessageCircle
} from 'lucide-react';

interface HelpMenuProps {
  onSemanticSearch: () => void;
  onExportConversation: () => void;
  onShowMonitoring: () => void;
  onShowTemplates: () => void;
  onRestartTour: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({
  onSemanticSearch,
  onExportConversation,
  onShowMonitoring,
  onShowTemplates,
  onRestartTour
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="gap-2 glass"
      >
        <HelpCircle className="h-4 w-4" />
        Aide & Outils
      </Button>

      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <Card className="absolute top-full right-0 mt-2 w-80 z-50 glass neomorphism border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Centre d'aide
              </CardTitle>
              <CardDescription className="text-xs">
                Découvrez toutes les fonctionnalités disponibles
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Section Outils principaux */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Outils principaux</h4>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => handleAction(onSemanticSearch)}
                  >
                    <Search className="h-4 w-4 text-blue-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Retrouver mes documents</div>
                      <div className="text-xs text-muted-foreground">Recherche intelligente dans vos fichiers</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => handleAction(onShowTemplates)}
                  >
                    <FileText className="h-4 w-4 text-green-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Modèles prêts à l'emploi</div>
                      <div className="text-xs text-muted-foreground">Templates pour différents agents</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => handleAction(onExportConversation)}
                  >
                    <Download className="h-4 w-4 text-purple-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Exporter la conversation</div>
                      <div className="text-xs text-muted-foreground">PDF, TXT ou Markdown</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => handleAction(onShowMonitoring)}
                  >
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Tableau de bord</div>
                      <div className="text-xs text-muted-foreground">Statistiques et performances</div>
                    </div>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Section Aide */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Besoin d'aide ?</h4>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => handleAction(onRestartTour)}
                  >
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Reprendre le tour guidé</div>
                      <div className="text-xs text-muted-foreground">Revoir les fonctionnalités principales</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => window.open('https://docs.lovable.dev/', '_blank')}
                  >
                    <Video className="h-4 w-4 text-red-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Tutoriels vidéo</div>
                      <div className="text-xs text-muted-foreground">Guides pas à pas</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => window.open('https://discord.com/channels/1119885301872070706/1280461670979993613', '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 text-violet-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Communauté Discord</div>
                      <div className="text-xs text-muted-foreground">Posez vos questions</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Tips rapides */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Astuce du jour
                </h4>
                <p className="text-xs text-muted-foreground">
                  Uploadez plusieurs documents d'un coup en les sélectionnant ensemble. L'IA les analysera automatiquement !
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};