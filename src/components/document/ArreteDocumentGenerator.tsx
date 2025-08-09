import React, { useState } from 'react';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { LogoUpload } from './LogoUpload';

interface ArreteDocumentGeneratorProps {
  arreteContent: string;
  children: React.ReactNode;
}

interface ArreteMetadata {
  commune: string;
  numero: string;
  maire: string;
  logo: string | null;
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

  const parseArreteContent = (content: string) => {
    // Parse le contenu de l'arrêté pour extraire les différentes sections
    const lines = content.split('\n').filter(line => line.trim());
    
    const visas: string[] = [];
    const considerants: string[] = [];
    const articles: string[] = [];
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('vu') || trimmed.toLowerCase().includes('visa')) {
        currentSection = 'visas';
        visas.push(trimmed);
      } else if (trimmed.toLowerCase().includes('considérant')) {
        currentSection = 'considerants';
        considerants.push(trimmed);
      } else if (trimmed.toLowerCase().includes('article') || /^(ARTICLE|Art\.|Article)\s+\d+/.test(trimmed)) {
        currentSection = 'articles';
        articles.push(trimmed);
      } else if (currentSection && trimmed) {
        switch (currentSection) {
          case 'visas':
            visas.push(trimmed);
            break;
          case 'considerants':
            considerants.push(trimmed);
            break;
          case 'articles':
            articles.push(trimmed);
            break;
        }
      }
    });

    return { visas, considerants, articles };
  };

  const generatePDF = async () => {
    if (!metadata.commune || !metadata.numero) {
      toast.error('Veuillez remplir les champs obligatoires (commune et numéro)');
      return;
    }

    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const { visas, considerants, articles } = parseArreteContent(arreteContent);
      
      let yPosition = 20;
      const leftMargin = 20;
      const rightMargin = 190;
      const lineHeight = 6;
      
      // En-tête avec logo
      if (metadata.logo) {
        try {
          pdf.addImage(metadata.logo, 'JPEG', leftMargin, yPosition, 30, 20);
          yPosition += 25;
        } catch (error) {
          console.warn('Erreur lors de l\'ajout du logo:', error);
        }
      }
      
      // Informations de la commune
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`COMMUNE DE ${metadata.commune.toUpperCase()}`, leftMargin, yPosition);
      yPosition += 10;
      
      // Titre de l'arrêté
      pdf.setFontSize(14);
      pdf.text(`ARRÊTÉ N° ${metadata.numero}`, leftMargin, yPosition);
      yPosition += 15;
      
      // Visas
      if (visas.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        visas.forEach(visa => {
          const splitText = pdf.splitTextToSize(visa, rightMargin - leftMargin);
          pdf.text(splitText, leftMargin, yPosition);
          yPosition += splitText.length * lineHeight;
        });
        yPosition += 5;
      }
      
      // Considérants
      if (considerants.length > 0) {
        considerants.forEach(considerant => {
          const splitText = pdf.splitTextToSize(considerant, rightMargin - leftMargin);
          pdf.text(splitText, leftMargin, yPosition);
          yPosition += splitText.length * lineHeight;
        });
        yPosition += 5;
      }
      
      // Partie décisionnelle
      pdf.setFont('helvetica', 'bold');
      pdf.text('ARRÊTE :', leftMargin, yPosition);
      yPosition += 10;
      
      // Articles
      pdf.setFont('helvetica', 'normal');
      articles.forEach(article => {
        const splitText = pdf.splitTextToSize(article, rightMargin - leftMargin);
        pdf.text(splitText, leftMargin, yPosition);
        yPosition += splitText.length * lineHeight + 3;
        
        // Nouvelle page si nécessaire
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      
      // Signature
      yPosition += 10;
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(`Fait à ${metadata.commune}, le ${new Date().toLocaleDateString('fr-FR')}`, leftMargin, yPosition);
      yPosition += 10;
      pdf.text('Le Maire,', leftMargin, yPosition);
      
      if (metadata.maire) {
        yPosition += 20;
        pdf.setFont('helvetica', 'bold');
        pdf.text(metadata.maire, leftMargin, yPosition);
      }
      
      // Télécharger le PDF
      const fileName = `arrete_${metadata.numero}_${metadata.commune.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success('Arrêté généré avec succès !');
      setIsOpen(false);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du document');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreview = () => {
    const { visas, considerants, articles } = parseArreteContent(arreteContent);
    
    return (
      <div className="bg-white p-8 text-black min-h-[400px] border border-border">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="font-bold text-lg mb-2">COMMUNE DE {metadata.commune.toUpperCase()}</div>
          <div className="font-bold text-base">ARRÊTÉ N° {metadata.numero}</div>
        </div>
        
        {/* Visas */}
        {visas.length > 0 && (
          <div className="mb-6">
            {visas.map((visa, index) => (
              <div key={index} className="mb-2 text-sm">{visa}</div>
            ))}
          </div>
        )}
        
        {/* Considérants */}
        {considerants.length > 0 && (
          <div className="mb-6">
            {considerants.map((considerant, index) => (
              <div key={index} className="mb-2 text-sm">{considerant}</div>
            ))}
          </div>
        )}
        
        {/* Partie décisionnelle */}
        <div className="mb-6">
          <div className="font-bold mb-4">ARRÊTE :</div>
          {articles.map((article, index) => (
            <div key={index} className="mb-3 text-sm">{article}</div>
          ))}
        </div>
        
        {/* Signature */}
        <div className="mt-8">
          <div className="text-sm">Fait à {metadata.commune}, le {new Date().toLocaleDateString('fr-FR')}</div>
          <div className="text-sm mt-2">Le Maire,</div>
          {metadata.maire && (
            <div className="font-bold mt-4">{metadata.maire}</div>
          )}
        </div>
      </div>
    );
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
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commune">Commune *</Label>
                  <Input
                    id="commune"
                    value={metadata.commune}
                    onChange={(e) => setMetadata(prev => ({ ...prev, commune: e.target.value }))}
                    placeholder="Nom de la commune"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numero">Numéro d'arrêté *</Label>
                  <Input
                    id="numero"
                    value={metadata.numero}
                    onChange={(e) => setMetadata(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Ex: 2024-001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maire">Nom du Maire</Label>
                  <Input
                    id="maire"
                    value={metadata.maire}
                    onChange={(e) => setMetadata(prev => ({ ...prev, maire: e.target.value }))}
                    placeholder="Nom et prénom du maire"
                  />
                </div>
                
                <Separator />
                
                <LogoUpload
                  currentLogo={metadata.logo}
                  onLogoChange={(logo) => setMetadata(prev => ({ ...prev, logo }))}
                />
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={generatePDF} disabled={isGenerating} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Prévisualisation */}
          <div>
            <div className="text-sm font-medium mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Prévisualisation
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              {metadata.commune && metadata.numero ? (
                generatePreview()
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Remplissez les champs obligatoires pour voir la prévisualisation
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};