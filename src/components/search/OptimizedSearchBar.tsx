import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIncrementalSearch } from '@/hooks/useIncrementalSearch';
import { useAnimationOptimization } from '@/hooks/performance/useAnimationOptimization';

interface OptimizedSearchBarProps {
  placeholder?: string;
  onSelect?: (result: any) => void;
  className?: string;
}

/**
 * Barre de recherche optimisée avec recherche incrémentale et suggestions intelligentes
 */
export const OptimizedSearchBar: React.FC<OptimizedSearchBarProps> = ({
  placeholder = "Rechercher...",
  onSelect,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const {
    query,
    results,
    suggestions,
    isSearching,
    incrementalSearch,
    getAutocompleteSuggestions
  } = useIncrementalSearch();

  const { animateWithCleanup, optimizeForAnimation } = useAnimationOptimization();

  // Suggestions auto-complétées en temps réel
  const autocompleteSuggestions = query.length >= 2 ? getAutocompleteSuggestions(query) : [];
  const allSuggestions = [...autocompleteSuggestions, ...suggestions].slice(0, 8);

  // Gestion du focus et des interactions clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length + allSuggestions.length - 1 ? prev + 1 : -1
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > -1 ? prev - 1 : results.length + allSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < results.length) {
              handleSelectResult(results[selectedIndex]);
            } else {
              const suggestionIndex = selectedIndex - results.length;
              if (suggestionIndex < allSuggestions.length) {
                handleSelectSuggestion(allSuggestions[suggestionIndex]);
              }
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, allSuggestions]);

  // Scroll automatique vers l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = suggestionRefs.current[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (resultsRef.current) {
      if (isOpen) {
        optimizeForAnimation(resultsRef.current, ['opacity', 'transform']);
        resultsRef.current.classList.add('animate-fade-in', 'animate-scale-in');
      } else {
        resultsRef.current.classList.remove('animate-fade-in', 'animate-scale-in');
      }
    }
  }, [isOpen, optimizeForAnimation]);

  const handleInputChange = (value: string) => {
    incrementalSearch(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleSelectResult = (result: any) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
    onSelect?.(result);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (inputRef.current) {
      inputRef.current.value = suggestion;
      incrementalSearch(suggestion);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      incrementalSearch('');
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recent':
        return <Clock className="w-3 h-3" />;
      case 'popular':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Search className="w-3 h-3" />;
    }
  };

  return (
    <div className={`relative will-change-contents ${className}`}>
      {/* Champ de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-10 pr-10 will-change-contents"
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onBlur={() => {
            // Délai pour permettre les clics sur les suggestions
            setTimeout(() => setIsOpen(false), 150);
          }}
        />

        {/* Bouton de nettoyage */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover-scale"
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* Indicateur de chargement */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Résultats et suggestions */}
      {isOpen && (results.length > 0 || allSuggestions.length > 0) && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg glass max-h-96 overflow-hidden will-change-transform"
        >
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {/* Suggestions rapides */}
              {allSuggestions.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Suggestions
                  </div>
                  <div className="space-y-1">
                    {allSuggestions.map((suggestion, index) => (
                      <div
                        key={`suggestion-${index}`}
                        ref={el => suggestionRefs.current[results.length + index] = el}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors will-change-transform
                          ${selectedIndex === results.length + index 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted/50'
                          }
                        `}
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        {getCategoryIcon('recent')}
                        <span className="text-sm">{suggestion}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          suggestion
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats de recherche */}
              {results.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Résultats ({results.length})
                  </div>
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <div
                        key={result.id}
                        ref={el => suggestionRefs.current[index] = el}
                        className={`
                          p-3 rounded-md cursor-pointer transition-colors will-change-transform
                          ${selectedIndex === index 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted/50'
                          }
                        `}
                        onClick={() => handleSelectResult(result)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1 truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {result.content}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {Math.round(result.relevance * 100)}%
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {result.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};