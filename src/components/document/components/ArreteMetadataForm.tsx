import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { LogoUpload } from '../LogoUpload';
import { ArreteMetadata } from '../services/ArretePDFGenerator';

interface ArreteMetadataFormProps {
  metadata: ArreteMetadata;
  onMetadataChange: (metadata: ArreteMetadata) => void;
  onGeneratePDF: () => void;
  isGenerating: boolean;
}

export const ArreteMetadataForm: React.FC<ArreteMetadataFormProps> = ({
  metadata,
  onMetadataChange,
  onGeneratePDF,
  isGenerating
}) => {
  const updateMetadata = (field: keyof ArreteMetadata, value: string | null) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="commune">Commune *</Label>
          <Input
            id="commune"
            value={metadata.commune}
            onChange={(e) => updateMetadata('commune', e.target.value)}
            placeholder="Nom de la commune"
          />
        </div>
        
        <div>
          <Label htmlFor="numero">Numéro d'arrêté *</Label>
          <Input
            id="numero"
            value={metadata.numero}
            onChange={(e) => updateMetadata('numero', e.target.value)}
            placeholder="Ex: 2024-001"
          />
        </div>
        
        <div>
          <Label htmlFor="maire">Nom du Maire</Label>
          <Input
            id="maire"
            value={metadata.maire}
            onChange={(e) => updateMetadata('maire', e.target.value)}
            placeholder="Nom et prénom du maire"
          />
        </div>
        
        <Separator />
        
        <LogoUpload
          currentLogo={metadata.logo}
          onLogoChange={(logo) => updateMetadata('logo', logo)}
        />
        
        <Separator />
        
        <div className="flex gap-2">
          <Button onClick={onGeneratePDF} disabled={isGenerating} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Télécharger PDF'}
          </Button>
        </div>
      </div>
    </Card>
  );
};