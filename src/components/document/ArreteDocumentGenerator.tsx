import React, { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArreteContentParser, ArretePDFGenerator, ArreteMetadata } from './services';
import { ArretePreview, ArreteMetadataForm } from './components';

interface ArreteDocumentGeneratorProps {
  arreteContent: string;
  children: React.ReactNode;
}

export const ArreteDocumentGenerator: React.FC<ArreteDocumentGeneratorProps> = ({
  arreteContent,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metadata, setMetadata] = useState<ArreteMetadata>({
    commune: '',
    numero: '',
    maire: '',
    logo: null
  });

  const generatePDF = async () => {
    if (!metadata.commune || !metadata.numero) {
      toast.error('Veuillez remplir les champs obligatoires (commune et numéro)');
      return;
    }

    setIsGenerating(true);
    
    try {
      const sections = ArreteContentParser.parseArreteContent(arreteContent);
      await ArretePDFGenerator.generatePDF(metadata, sections);
      
      toast.success('Arrêté généré avec succès !');
      setIsOpen(false);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du document');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Générer l'arrêté finalisé
          </DialogTitle>
          <DialogDescription>
            Renseignez les métadonnées de l’arrêté puis prévisualisez et téléchargez le PDF généré.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-6">
            <ArreteMetadataForm
              metadata={metadata}
              onMetadataChange={setMetadata}
              onGeneratePDF={generatePDF}
              isGenerating={isGenerating}
            />
          </div>
          
          {/* Prévisualisation */}
          <div>
            <div className="text-sm font-medium mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Prévisualisation
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <ArretePreview 
                metadata={metadata} 
                sections={ArreteContentParser.parseArreteContent(arreteContent)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};