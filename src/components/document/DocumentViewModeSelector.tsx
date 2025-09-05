import { Grid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewModeSelectorProps {
  viewMode: 'list' | 'grid' | 'cluster';
  onViewModeChange: (mode: 'list' | 'grid' | 'cluster') => void;
}

export const DocumentViewModeSelector = ({ viewMode, onViewModeChange }: DocumentViewModeSelectorProps) => (
  <div className="flex items-center gap-2">
    <Button
      variant={viewMode === 'list' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onViewModeChange('list')}
      className="h-8"
    >
      <List className="w-4 h-4 mr-1" />
      Liste
    </Button>
    <Button
      variant={viewMode === 'grid' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onViewModeChange('grid')}
      className="h-8"
    >
      <Grid className="w-4 h-4 mr-1" />
      Grille
    </Button>
    <Button
      variant={viewMode === 'cluster' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onViewModeChange('cluster')}
      className="h-8"
    >
      <Filter className="w-4 h-4 mr-1" />
      Clusters
    </Button>
  </div>
);