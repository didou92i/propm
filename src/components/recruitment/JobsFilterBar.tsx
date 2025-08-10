
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="md:col-span-1">
        <Select
          value={value.commune || ""}
          onValueChange={(v) => onChange({ ...value, commune: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Commune" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {communes.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-1">
        <Select
          value={value.dateRange || ""}
          onValueChange={(v) => onChange({ ...value, dateRange: v as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">3 derniers jours</SelectItem>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Mots-clés (ex: policier municipal, RH...)"
            value={value.keywords}
            onChange={(e) => onChange({ ...value, keywords: e.target.value })}
          />
        </div>
        <Button type="button" variant="secondary" onClick={onSearchAI} disabled={loadingAI}>
          <Sparkles className="h-4 w-4 mr-1" />
          Recherche IA
        </Button>
      </div>
    </div>
  );
};
