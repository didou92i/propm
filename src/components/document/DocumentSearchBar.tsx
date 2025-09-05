import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SmartSearchBar } from '@/components/search';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

interface DocumentSearchBarProps {
  onSemanticSearchResults: (results: DocumentData[]) => void;
  searchTerm: string;
  onTraditionalSearch: (term: string) => void;
}

export const DocumentSearchBar = ({ 
  onSemanticSearchResults, 
  searchTerm, 
  onTraditionalSearch 
}: DocumentSearchBarProps) => (
  <div className="space-y-4">
    <SmartSearchBar 
      onSearchResults={onSemanticSearchResults}
      placeholder="Recherche sémantique intelligente dans vos documents..."
      className="w-full"
    />
    
    {/* Traditional Search Fallback */}
    <div className="relative max-w-xs ml-auto">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Recherche traditionnelle..."
        value={searchTerm}
        onChange={(e) => onTraditionalSearch(e.target.value)}
        className="pl-10 glass-subtle text-sm h-8"
      />
    </div>
  </div>
);