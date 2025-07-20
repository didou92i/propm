
import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { cn } from '@/lib/utils';

interface SmartSearchBarProps {
  onSearchResults?: (results: any[]) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearchBar = ({ 
  onSearchResults, 
  placeholder = "Recherche sémantique dans vos documents...",
  className 
}: SmartSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    semanticSearch, 
    getSuggestions, 
    searchResults, 
    searchHistory,
    isSearching 
  } = useSemanticSearch();

  // Debounced suggestions
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        const newSuggestions = await getSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, getSuggestions]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    const results = await semanticSearch(searchQuery, {
      threshold: isAdvancedMode ? 0.2 : 0.3,
      maxResults: isAdvancedMode ? 20 : 10,
      boostTitles: true
    });

    onSearchResults?.(results);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchResults?.([]);
  };

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
            if (e.key === 'Escape') {
              clearSearch();
            }
          }}
          className="pl-10 pr-20 glass-subtle border-border/40 focus:border-primary"
          disabled={isSearching}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            size="sm"
            variant={isAdvancedMode ? "default" : "ghost"}
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="h-6 px-2 text-xs"
            title="Mode recherche avancée"
          >
            <Sparkles className="h-3 w-3" />
          </Button>
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-lg shadow-lg z-50 glass-subtle">
          <div className="p-2 space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/50 flex items-center gap-2 transition-colors"
              >
                <Clock className="h-3 w-3 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search status */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border/40 rounded-lg shadow-lg glass-subtle">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Recherche sémantique en cours...
          </div>
        </div>
      )}

      {/* Advanced mode indicator */}
      {isAdvancedMode && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Mode avancé activé
          </Badge>
          <span className="text-xs text-muted-foreground">
            Seuil de similarité réduit, plus de résultats
          </span>
        </div>
      )}
    </div>
  );
};
