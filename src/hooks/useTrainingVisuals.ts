import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratedVisual {
  image: string;
  type: string;
  timestamp: number;
}

interface VisualGenerationOptions {
  context: string;
  scenario: string;
  visualType?: string;
  domain?: string;
}

export const useTrainingVisuals = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVisuals, setGeneratedVisuals] = useState<GeneratedVisual[]>([]);
  const { toast } = useToast();

  const generateVisual = useCallback(async (options: VisualGenerationOptions): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const visualTypes = ['press_clipping', 'official_document', 'field_photo', 'infraction_scene'];
      const selectedType = options.visualType || visualTypes[Math.floor(Math.random() * visualTypes.length)];

      const { data, error } = await supabase.functions.invoke('generate-training-visuals', {
        body: {
          context: options.context,
          scenario: options.scenario,
          visualType: selectedType,
          domain: options.domain || 'police_municipale'
        }
      });

      if (error) {
        console.error('Error generating visual:', error);
        toast({
          title: "Erreur de génération",
          description: "Impossible de générer le visuel contextuel",
          variant: "destructive"
        });
        return null;
      }

      if (data?.images && data.images.length > 0) {
        const visual: GeneratedVisual = {
          image: data.images[0].data,
          type: selectedType,
          timestamp: Date.now()
        };
        
        setGeneratedVisuals(prev => [...prev, visual]);
        return visual.image;
      }

      return null;
    } catch (error) {
      console.error('Error in visual generation:', error);
      toast({
        title: "Erreur technique",
        description: "Une erreur est survenue lors de la génération",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const clearVisuals = useCallback(() => {
    setGeneratedVisuals([]);
  }, []);

  return {
    generateVisual,
    clearVisuals,
    isGenerating,
    generatedVisuals,
    hasVisuals: generatedVisuals.length > 0
  };
};