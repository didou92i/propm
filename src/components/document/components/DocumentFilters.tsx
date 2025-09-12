import React from 'react';
import { DocumentSearchBar } from '../DocumentSearchBar';
import { DocumentViewModeSelector } from '../DocumentViewModeSelector';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

interface DocumentFiltersProps {
  searchTerm: string;
  viewMode: 'list' | 'grid' | 'cluster';
  documents: DocumentData[];
  onSemanticSearchResults: (results: DocumentData[]) => void;
  onTraditionalSearch: (term: string) => void;
  onViewModeChange: (mode: 'list' | 'grid' | 'cluster') => void;
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchTerm,
  viewMode,
  documents,
  onSemanticSearchResults,
  onTraditionalSearch,
  onViewModeChange
}) => {
  const handleTraditionalSearch = (term: string) => {
    if (!term.trim()) {
      onSemanticSearchResults(documents);
      return;
    }
    
    const filtered = documents.filter(doc =>
      doc.metadata.filename.toLowerCase().includes(term.toLowerCase()) ||
      doc.content.toLowerCase().includes(term.toLowerCase())
    );
    onTraditionalSearch(term);
    onSemanticSearchResults(filtered);
  };

  return (
    <div className="space-y-4">
      <DocumentSearchBar 
        onSemanticSearchResults={onSemanticSearchResults}
        searchTerm={searchTerm}
        onTraditionalSearch={handleTraditionalSearch}
      />
      
      <div className="flex items-center justify-between">
        <DocumentViewModeSelector 
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
};