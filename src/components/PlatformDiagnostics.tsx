
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Upload, MessageSquare, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export const PlatformDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateDiagnostic = (name: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setDiagnostics(prev => {
      const existing = prev.find(d => d.name === name);
      const newDiagnostic = { name, status, message, details };
      
      if (existing) {
        return prev.map(d => d.name === name ? newDiagnostic : d);
      } else {
        return [...prev, newDiagnostic];
      }
    });
  };

  const testSupabaseConnection = async () => {
    updateDiagnostic('supabase', 'loading', 'Test de connexion Supabase...');
    
    try {
      const { data, error } = await supabase.from('documents').select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      updateDiagnostic('supabase', 'success', 'Connexion Supabase OK', `${data?.length || 0} documents en base`);
    } catch (error) {
      updateDiagnostic('supabase', 'error', 'Erreur connexion Supabase', error.message);
    }
  };

  const testDocumentProcessing = async () => {
    updateDiagnostic('documents', 'loading', 'Test du traitement de documents...');
    
    try {
      // Create a test text file
      const testContent = "Ceci est un test de traitement de document par la plateforme.";
      const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', testFile);

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData
      });

      if (error) throw error;
      
      if (data && data.success) {
        updateDiagnostic('documents', 'success', 'Traitement de documents OK', 
          `Texte extrait: ${data.extractedTextLength} caractères, ${data.chunksCount} chunks générés`);
      } else {
        throw new Error(data?.error || 'Échec du traitement');
      }
    } catch (error) {
      updateDiagnostic('documents', 'error', 'Erreur traitement documents', error.message);
    }
  };

  const testChatFunction = async () => {
    updateDiagnostic('chat', 'loading', 'Test de la fonction chat...');
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-openai', {
        body: {
          messages: [{ role: 'user', content: 'Test de connectivité' }],
          selectedAgent: 'redacpro',
          userSession: 'test-session'
        }
      });

      if (error) throw error;
      
      if (data && data.success) {
        updateDiagnostic('chat', 'success', 'Fonction chat OK', 'Réponse reçue de l\'assistant');
      } else {
        throw new Error(data?.error || 'Pas de réponse');
      }
    } catch (error) {
      updateDiagnostic('chat', 'error', 'Erreur fonction chat', error.message);
    }
  };

  const testSemanticSearch = async () => {
    updateDiagnostic('search', 'loading', 'Test de recherche sémantique...');
    
    try {
      const { data: documents } = await supabase.from('documents').select('*').limit(5);
      
      if (!documents || documents.length === 0) {
        updateDiagnostic('search', 'warning', 'Pas de documents pour tester la recherche', 
          'Ajoutez des documents pour tester la recherche sémantique');
        return;
      }

      // Test embedding generation
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text: 'test de recherche sémantique' }
      });

      if (error) throw error;
      
      if (data && data.embedding) {
        updateDiagnostic('search', 'success', 'Recherche sémantique OK', 
          `${documents.length} documents trouvés, embeddings générés`);
      } else {
        throw new Error('Pas d\'embedding généré');
      }
    } catch (error) {
      updateDiagnostic('search', 'error', 'Erreur recherche sémantique', error.message);
    }
  };

  const runAllDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    
    
    await testSupabaseConnection();
    await testDocumentProcessing();
    await testChatFunction();
    await testSemanticSearch();
    
    setIsRunning(false);
    
    const errors = diagnostics.filter(d => d.status === 'error');
    const warnings = diagnostics.filter(d => d.status === 'warning');
    
    if (errors.length === 0 && warnings.length === 0) {
      toast({
        title: "Diagnostics terminés",
        description: "Toutes les fonctionnalités sont opérationnelles",
      });
    } else {
      toast({
        title: "Diagnostics terminés",
        description: `${errors.length} erreurs, ${warnings.length} avertissements`,
        variant: errors.length > 0 ? "destructive" : "default"
      });
    }
    
    
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'loading': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      loading: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Card className="p-6 glass neomorphism">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Diagnostics de la Plateforme</h2>
        </div>
        <Button 
          onClick={runAllDiagnostics} 
          disabled={isRunning}
          className="gradient-agent-animated text-white"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            'Lancer les tests'
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {diagnostics.map((diagnostic, index) => (
          <div key={diagnostic.name} className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border">
            {getStatusIcon(diagnostic.status)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium capitalize">{diagnostic.name}</h3>
                {getStatusBadge(diagnostic.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">
                {diagnostic.message}
              </p>
              
              {diagnostic.details && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  {diagnostic.details}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {diagnostics.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Cliquez sur "Lancer les tests" pour vérifier les fonctionnalités</p>
          </div>
        )}
      </div>

      {diagnostics.length > 0 && (
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h3 className="font-medium mb-2">Résumé</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">
              ✅ {diagnostics.filter(d => d.status === 'success').length} succès
            </span>
            <span className="text-yellow-600">
              ⚠️ {diagnostics.filter(d => d.status === 'warning').length} avertissements
            </span>
            <span className="text-red-600">
              ❌ {diagnostics.filter(d => d.status === 'error').length} erreurs
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
