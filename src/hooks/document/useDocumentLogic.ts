import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

export const useDocumentLogic = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'cluster'>('list');
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('metadata->>processed_at', { ascending: false });

      if (error) throw error;
      const docs = data || [];
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    filteredDocuments,
    loading,
    viewMode,
    searchTerm,
    setViewMode,
    setSearchTerm,
    setFilteredDocuments,
    loadDocuments
  };
};