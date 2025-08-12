import React, { useState, useRef } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface LogoUploadProps {
  onLogoChange: (logoData: string | null) => void;
  currentLogo?: string | null;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ onLogoChange, currentLogo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image (PNG, JPG, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Le fichier est trop volumineux (maximum 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onLogoChange(result);
      toast.success('Logo uploadé avec succès');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo supprimé');
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">Logo de la commune</div>
      
      {currentLogo ? (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={currentLogo} 
                alt="Logo de la commune" 
                className="w-16 h-16 object-contain border border-border rounded"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Logo chargé</div>
              <div className="text-xs text-muted-foreground">Prêt pour la génération du document</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                <FileImage className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">
                  Glissez-déposez votre logo ici
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Formats acceptés: PNG, JPG, SVG (max 5MB)
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};