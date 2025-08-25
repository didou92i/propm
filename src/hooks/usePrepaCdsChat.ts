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

  // Fallback content generator when Edge Function fails
  const generateFallbackContent = (trainingType: TrainingType, level: UserLevel, domain: StudyDomain) => {
    console.log('Generating fallback content:', { trainingType, level, domain });
    
    if (trainingType === 'qcm') {
      return {
        questions: [
          {
            id: "QADM1",
            question: "Quel est l'objet principal du recours pour excès de pouvoir devant le juge administratif ?",
            options: [
              "Obtenir l'annulation d'un acte administratif illégal",
              "Obtenir réparation pécuniaire pour un préjudice causé par l'administration",
              "Modifier le contenu d'un contrat administratif",
              "Demander une injonction comportementale à l'administration"
            ],
            correctAnswer: 0,
            explanation: "Le recours pour excès de pouvoir (REP) a pour finalité première l'annulation d'un acte administratif individuel ou réglementaire entaché d'illégalité.",
            difficulty: "moyen",
            animationType: "standard"
          },
          {
            id: "QADM2",
            question: "Parmi les critères suivants, lequel caractérise un contrat administratif ?",
            options: [
              "La présence d'une clause exorbitante du droit commun ou l'exécution d'une mission de service public",
              "La stricte application du droit privé sans dérogation",
              "L'absence de toute implication financière pour l'administration",
              "Le fait qu'il soit systématiquement conclu entre deux personnes privées"
            ],
            correctAnswer: 0,
            explanation: "Un contrat administratif se distingue notamment par l'existence d'une clause exorbitante du droit commun et/ou parce qu'il a pour objet l'exécution d'une mission de service public.",
            difficulty: "moyen",
            animationType: "highlight"
          },
          {
            id: "QADM3",
            question: "Quel est l'objectif principal de la police administrative ?",
            options: [
              "La répression des infractions pénales",
              "La protection de l'ordre public (sécurité, tranquillité, salubrité)",
              "La gestion des contentieux entre administrations",
              "La négociation de contrats publics"
            ],
            correctAnswer: 1,
            explanation: "La police administrative a pour objet la prévention et la protection de l'ordre public, qui se définit classiquement par la sécurité, la tranquillité publique et la salubrité publique.",
            difficulty: "moyen",
            animationType: "progressive"
          }
        ],
        metadata: {
          estimatedTime: 10,
          passingScore: 70,
          tips: [
            "Relisez régulièrement le cadre procédural et leurs conditions spécifiques.",
            "Distinguez toujours l'objectif de la voie de recours appropriée."
          ]
        },
        sessionInfo: {
          id: `session-${Date.now()}`,
          trainingType,
          level,
          domain,
          createdAt: new Date().toISOString(),
          estimatedDuration: 10
        }
      };
    }

    if (trainingType === 'vrai_faux') {
      return {
        questions: [
          {
            id: "VF1",
            statement: "Le maire est l'autorité de police administrative générale sur le territoire de sa commune.",
            correctAnswer: true,
            explanation: "Effectivement, le maire détient les pouvoirs de police administrative générale sur le territoire communal selon l'article L2212-1 du CGCT.",
            domain: domain
          },
          {
            id: "VF2", 
            statement: "Un arrêté municipal peut interdire totalement et définitivement la circulation sur une voie publique.",
            correctAnswer: false,
            explanation: "Non, une interdiction totale et définitive serait disproportionnée. Les mesures de police doivent être nécessaires et proportionnées.",
            domain: domain
          }
        ],
        metadata: {
          estimatedTime: 8,
          passingScore: 70
        }
      };
    }

    if (trainingType === 'cas_pratique') {
      return {
        caseTitle: "Gestion d'une manifestation non déclarée",
        context: "Vous êtes Chef de Service de Police Municipale dans une commune de 25 000 habitants.",
        scenario: "Une manifestation spontanée de 200 personnes bloque la circulation sur l'avenue principale un samedi après-midi.",
        steps: [
          {
            id: "step1",
            title: "Évaluation initiale",
            question: "Quelles sont vos premières actions à entreprendre ?",
            expectedPoints: ["Sécuriser le périmètre", "Informer le maire", "Évaluer les risques"]
          },
          {
            id: "step2", 
            title: "Coordination",
            question: "Avec quels services devez-vous vous coordonner ?",
            expectedPoints: ["Police nationale", "Services municipaux", "Préfecture"]
          }
        ]
      };
    }

    // Default fallback
    return {
      error: "Type d'entraînement non supporté en mode fallback",
      supportedTypes: ['qcm', 'vrai_faux', 'cas_pratique']
    };
  };

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

      try {
        // Try Edge Function first
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

        if (!error && data && data.success) {
          console.log('Edge Function succeeded:', data);
          setLastResponse(JSON.stringify(data.content || data));
          return data.content || data;
        }
        
        console.warn('Edge Function failed, using fallback:', { error, data });
      } catch (networkError) {
        console.warn('Network error calling Edge Function, using fallback:', networkError);
      }

      // Use fallback content
      console.log('Using fallback content generator');
      const fallbackContent = generateFallbackContent(trainingType, level, domain);
      
      if (fallbackContent.error) {
        throw new Error(fallbackContent.error);
      }

      console.log('Fallback content generated successfully:', {
        trainingType,
        contentKeys: Object.keys(fallbackContent),
        hasQuestions: !!(fallbackContent.questions || fallbackContent.steps)
      });

      setLastResponse(JSON.stringify(fallbackContent));
      
      toast.success('Contenu généré (mode hors ligne)', {
        description: 'Interface d\'entraînement prête !'
      });
      
      return fallbackContent;

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