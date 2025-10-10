import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentMetadata {
  filename: string;
  type: 'legal' | 'reference' | 'case_study';
  category: 'police_municipale' | 'droit_administratif' | 'securite_publique' | 'reglementation';
  source?: string;
  reference?: string;
}

interface UploadStatus {
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export const LegalDocumentImporter = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Partial<DocumentMetadata>>({
    type: 'legal',
    category: 'police_municipale'
  });
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un PDF, TXT ou DOC`,
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 20MB`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    setFiles(validFiles);
    setUploadStatuses(validFiles.map(f => ({
      filename: f.name,
      status: 'pending',
      progress: 0
    })));
  };

  const processDocument = async (file: File, index: number) => {
    const updateStatus = (status: Partial<UploadStatus>) => {
      setUploadStatuses(prev => prev.map((s, i) => 
        i === index ? { ...s, ...status } : s
      ));
    };

    updateStatus({ status: 'processing', progress: 30 });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        filename: file.name,
        type: metadata.type || 'legal',
        category: metadata.category || 'police_municipale',
        source: metadata.source || '',
        reference: metadata.reference || '',
        processed_at: new Date().toISOString(),
        police_municipale: metadata.category === 'police_municipale',
        droit_administratif: metadata.category === 'droit_administratif' || metadata.type === 'legal'
      }));

      updateStatus({ progress: 50 });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `https://yulhsufpnjkiozkrgyoq.supabase.co/functions/v1/process-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      updateStatus({ progress: 80 });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur de traitement');
      }

      const result = await response.json();
      
      updateStatus({ 
        status: 'completed', 
        progress: 100 
      });

      return result;
    } catch (error) {
      updateStatus({ 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez sélectionner des fichiers à importer",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        files.map((file, index) => processDocument(file, index))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      toast({
        title: "Import terminé",
        description: `${successCount} document(s) importé(s), ${errorCount} erreur(s)`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      if (successCount > 0) {
        setFiles([]);
        setUploadStatuses([]);
      }
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Import de Documents Juridiques</h2>
        <p className="text-muted-foreground mb-6">
          Importez des documents juridiques (PDF, TXT, DOC) pour alimenter la base de connaissances CDS Pro
        </p>

        <div className="space-y-4">
          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select 
                value={metadata.type} 
                onValueChange={(value: any) => setMetadata(m => ({ ...m, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Texte juridique</SelectItem>
                  <SelectItem value="reference">Document de référence</SelectItem>
                  <SelectItem value="case_study">Cas pratique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select 
                value={metadata.category} 
                onValueChange={(value: any) => setMetadata(m => ({ ...m, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="police_municipale">Police municipale</SelectItem>
                  <SelectItem value="droit_administratif">Droit administratif</SelectItem>
                  <SelectItem value="securite_publique">Sécurité publique</SelectItem>
                  <SelectItem value="reglementation">Réglementation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source (optionnel)</Label>
              <Input 
                placeholder="Ex: CGCT, CSI, Légifrance..."
                value={metadata.source || ''}
                onChange={e => setMetadata(m => ({ ...m, source: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Référence (optionnel)</Label>
              <Input 
                placeholder="Ex: Article L.2212-1"
                value={metadata.reference || ''}
                onChange={e => setMetadata(m => ({ ...m, reference: e.target.value }))}
              />
            </div>
          </div>

          {/* Zone de drop */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Input
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Cliquez pour sélectionner des fichiers
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, TXT, DOC/DOCX (max 20MB par fichier)
              </p>
            </label>
          </div>

          {/* Liste des fichiers */}
          {uploadStatuses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Fichiers à traiter ({uploadStatuses.length})</h3>
              {uploadStatuses.map((status, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">{status.filename}</span>
                    </div>
                    {status.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {status.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  {status.status === 'processing' && (
                    <Progress value={status.progress} className="h-2" />
                  )}
                  {status.error && (
                    <p className="text-sm text-destructive mt-2">{status.error}</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Traitement en cours...' : `Importer ${files.length} document(s)`}
            </Button>
            {files.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiles([]);
                  setUploadStatuses([]);
                }}
                disabled={isProcessing}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Guide */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-bold mb-2">📚 Documents recommandés à importer</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Code de la Sécurité Intérieure (CSI) - Livre V</li>
          <li>• Code Général des Collectivités Territoriales (CGCT) - Articles L.2212-1 à L.2214-5</li>
          <li>• Arrêtés municipaux types (stationnement, circulation, sécurité)</li>
          <li>• Guides CNFPT pour policiers municipaux</li>
          <li>• Jurisprudence du Conseil d'État sur les pouvoirs du maire</li>
        </ul>
      </Card>
    </div>
  );
};
