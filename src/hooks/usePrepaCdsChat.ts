import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { TrainingType, UserLevel, StudyDomain } from "@/types/prepacds";

interface PrepaCdsResponse {
  content: any; // Objet structuré selon le type de training
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
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain
  ): Promise<any> => {
    setIsLoading(true);
    
    try {
      console.log('Generating PrepaCDS content:', { trainingType, level, domain });
      
      // Validation côté client avant appel
      const supportedTypes = ['qcm', 'vrai_faux', 'cas_pratique', 'simulation_oral', 'question_ouverte', 'plan_revision'];
      if (!supportedTypes.includes(trainingType)) {
        throw new Error(`Type d'entraînement non supporté côté client: ${trainingType}. Types supportés: ${supportedTypes.join(', ')}`);
      }
      
      const { data, error } = await supabase.functions.invoke('generate-animated-training', {
        body: {
          trainingType,
          level,
          domain,
          options: {
            timestamp: new Date().toISOString(),
            clientValidation: true
          }
        }
      });
      
      console.log('Supabase function response:', { data, error, trainingType });

      if (error) {
        console.error('PrepaCDS Supabase error:', {
          error,
          trainingType,
          level,
          domain,
          timestamp: new Date().toISOString()
        });
        toast.error('Erreur lors de la génération du contenu');
        throw new Error(`Erreur Supabase: ${error.message || 'Erreur inconnue'}`);
      }

      const response = data as PrepaCdsResponse;
      console.log('PrepaCDS response parsed:', {
        success: response?.success,
        hasContent: !!response?.content,
        error: response?.error,
        trainingType,
        responseKeys: response ? Object.keys(response) : []
      });
      
      if (!response || !response.success) {
        const errorMsg = response?.error || 'Réponse invalide du serveur';
        console.error('PrepaCDS response error:', {
          response,
          errorMsg,
          trainingType
        });
        throw new Error(errorMsg);
      }

      if (!response.content) {
        throw new Error('Aucun contenu généré dans la réponse');
      }

      console.log('PrepaCDS content generated successfully:', {
        trainingType,
        contentKeys: Object.keys(response.content),
        hasQuestions: !!(response.content.questions || response.content.steps || response.content.phases)
      });

      setLastResponse(JSON.stringify(response.content));
      return response.content;

    } catch (error) {
      console.error('Error in generateContent:', {
        error,
        message: error.message,
        stack: error.stack,
        trainingType,
        level,
        domain
      });
      
      // Messages d'erreur plus spécifiques
      let userMessage = 'Impossible de générer le contenu. Veuillez réessayer.';
      if (error.message?.includes('non supporté')) {
        userMessage = 'Type d\'entraînement non supporté. Veuillez choisir un autre type.';
      } else if (error.message?.includes('API')) {
        userMessage = 'Erreur de communication. Vérifiez votre connexion et réessayez.';
      }
      
      toast.error(userMessage);
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