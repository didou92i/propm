
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  communes: string[];
  value: {
    commune: string;
    dateRange: "recent" | "week" | "month" | "";
    keywords: string;
  };
  onChange: (v: Props["value"]) => void;
  onSearchAI: () => void;
  loadingAI?: boolean;
};

export const JobsFilterBar: React.FC<Props> = ({ communes, value, onChange, onSearchAI, loadingAI }) => {
  return (
    <div className="space-y-3">
      {/* Ligne 1: Filtres Select sur mobile, inline sur desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-1">
          <Select
            value={value.commune || ""}
            onValueChange={(v) => onChange({ ...value, commune: v })}
          >
            <SelectTrigger className="h-10 sm:h-9">
              <SelectValue placeholder="Commune" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {communes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-1">
          <Select
            value={value.dateRange || ""}
            onValueChange={(v) => onChange({ ...value, dateRange: v as any })}
          >
            <SelectTrigger className="h-10 sm:h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">3 derniers jours</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ligne 2: Recherche sur mobile et desktop */}
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-10 sm:h-9 text-base sm:text-sm"
                placeholder="Mots-clés (ex: policier municipal, RH...)"
                value={value.keywords}
                onChange={(e) => onChange({ ...value, keywords: e.target.value })}
                style={{ fontSize: 'max(16px, 1rem)' }}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={onSearchAI} 
                  disabled={loadingAI}
                  className="w-full sm:w-auto h-10 sm:h-9 touch-manipulation"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">Recherche intelligente</span>
                  <span className="hidden sm:inline">Recherche IA</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-xs text-xs leading-relaxed">
                La recherche IA comprend vos besoins même avec des termes approximatifs. Exemple : "job avec les mains" trouvera des postes manuels, artisanaux, etc.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
