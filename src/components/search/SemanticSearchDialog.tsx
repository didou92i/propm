import { useState } from "react";
import { Search, FileText, Clock, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { MarkdownRenderer } from "@/components/common";

interface SemanticSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SemanticSearchDialog({ open, onOpenChange }: SemanticSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"semantic" | "hierarchical" | "llama">("semantic");
  const {
    semanticSearch,
    hierarchicalSearch,
    llamaSearch,
    searchResults,
    llamaResults,
    isSearching,
    getSuggestions
  } = useSemanticSearch();

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    switch (searchMode) {
      case "semantic":
        await semanticSearch(query, { maxResults: 10, threshold: 0.3 });
        break;
      case "hierarchical":
        await hierarchicalSearch(query, { maxResults: 10, threshold: 0.3 });
        break;
      case "llama":
        await llamaSearch(query, { maxResults: 10 });
        break;
    }
  };

  const handleQueryChange = async (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      const newSuggestions = await getSuggestions(value);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const currentResults = searchMode === "llama" ? llamaResults : searchResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recherche sémantique dans les documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode de recherche */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === "semantic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("semantic")}
            >
              Sémantique
            </Button>
            <Button
              variant={searchMode === "hierarchical" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("hierarchical")}
            >
              Hiérarchique
            </Button>
            <Button
              variant={searchMode === "llama" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("llama")}
            >
              LlamaIndex
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les documents analysés..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7"
              size="sm"
            >
              {isSearching ? "..." : "Rechercher"}
            </Button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(suggestion);
                    setSuggestions([]);
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Résultats */}
          <ScrollArea className="h-[400px]">
            {currentResults.length > 0 ? (
              <div className="space-y-4">
                {currentResults.map((result, index) => (
                  <div key={result.id || index} className="p-4 rounded-lg glass border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {result.metadata?.filename || "Document"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round((result.similarity || result.relevanceScore || 0) * 100)}% pertinence
                        </Badge>
                        {result.metadata?.level && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {result.metadata?.processed_at && 
                        new Date(result.metadata.processed_at).toLocaleDateString()
                      }
                    </div>

                    <div className="text-sm max-h-32 overflow-y-auto">
                      <MarkdownRenderer 
                        content={result.content.slice(0, 300) + (result.content.length > 300 ? "..." : "")}
                        isAssistant={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !isSearching ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun résultat trouvé pour "{query}"</p>
                </div>
              </div>
            ) : !query ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Entrez un terme de recherche pour commencer</p>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}