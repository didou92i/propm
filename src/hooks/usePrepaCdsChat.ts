import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { TrainingType, UserLevel, StudyDomain } from "@/types/prepacds";

interface PrepaCdsResponse {
  content: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  success: boolean;
  error?: string;
}

export const usePrepaCdsChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');

  const generateContent = async (
    prompt: string,
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain
  ): Promise<string> => {
    setIsLoading(true);
    
    try {
      console.log('Generating PrepaCDS content:', { prompt, trainingType, level, domain });
      
      const { data, error } = await supabase.functions.invoke('prepa-cds-chat', {
        body: {
          prompt,
          trainingType,
          level,
          domain
        }
      });

      if (error) {
        console.error('PrepaCDS error:', error);
        toast.error('Erreur lors de la génération du contenu');
        throw error;
      }

      const response = data as PrepaCdsResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur inconnue');
      }

      setLastResponse(response.content);
      return response.content;

    } catch (error) {
      console.error('Error in generateContent:', error);
      toast.error('Impossible de générer le contenu. Veuillez réessayer.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateContent,
    isLoading,
    lastResponse
  };
};