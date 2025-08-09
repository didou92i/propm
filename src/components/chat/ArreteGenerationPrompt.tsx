import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArreteDocumentGenerator } from '@/components/document/ArreteDocumentGenerator';

interface ArreteGenerationPromptProps {
  messageContent: string;
  onGenerate?: () => void;
}

export const ArreteGenerationPrompt: React.FC<ArreteGenerationPromptProps> = ({
  messageContent,
  onGenerate
}) => {
  // Vérifier si le message contient un arrêté
  const isArreteContent = (content: string): boolean => {
    const indicators = [
      /arrêt[ée]/i,
      /commune/i,
      /article\s+\d+/i,
      /considérant/i,
      /vu\s+/i,
      /le maire/i
    ];
    
    return indicators.some(indicator => indicator.test(content));
  };

  if (!isArreteContent(messageContent)) {
    return null;
  }

  return (
    <Card className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <div className="flex-1">
          <div className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
            Arrêté prêt à finaliser
          </div>
          <div className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
            Générez un document PDF professionnel avec le logo de votre commune et une mise en page officielle.
          </div>
          
          <ArreteDocumentGenerator arreteContent={messageContent}>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/50 hover:bg-white/80 border-emerald-300 text-emerald-700 hover:text-emerald-800"
              onClick={onGenerate}
            >
              <Download className="w-4 h-4 mr-2" />
              Générer le document final
            </Button>
          </ArreteDocumentGenerator>
        </div>
      </div>
    </Card>
  );
};