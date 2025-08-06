import { useState, useCallback } from 'react';
import { CommuneContext, Priority, DocumentTemplate } from '@/components/chat/CdsProControls';

interface CdsProConfiguration {
  context: CommuneContext;
  priority: Priority;
  vectorialDatabase: string;
  securityLevel: 'strict';
}

interface DocumentGeneration {
  template: DocumentTemplate;
  context: CommuneContext;
  priority: Priority;
}

/**
 * Hook spécialisé pour les fonctionnalités avancées de CDS Pro
 */
export function useCdsProEnhancements() {
  const [configuration, setConfiguration] = useState<CdsProConfiguration>({
    context: 'moyenne',
    priority: 'conformite',
    vectorialDatabase: 'vs_67eefbe160348191b7a19ad6210afd55',
    securityLevel: 'strict'
  });

  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  /**
   * Met à jour le contexte territorial
   */
  const updateContext = useCallback((context: CommuneContext) => {
    setConfiguration(prev => ({ ...prev, context }));
  }, []);

  /**
   * Met à jour la priorité de traitement
   */
  const updatePriority = useCallback((priority: Priority) => {
    setConfiguration(prev => ({ ...prev, priority }));
  }, []);

  /**
   * Génère un prompt enrichi selon le contexte CDS Pro
   */
  const enrichPrompt = useCallback((originalPrompt: string): string => {
    const contextInstructions = getContextInstructions(configuration.context);
    const priorityInstructions = getPriorityInstructions(configuration.priority);
    
    return `${originalPrompt}

**CONTEXTE TERRITORIAL ACTUEL**: ${contextInstructions}
**PRIORITÉ DE TRAITEMENT**: ${priorityInstructions}
**BASE VECTORIELLE**: Consulter obligatoirement la base ${configuration.vectorialDatabase}
**MODE SÉCURISÉ**: Police municipale administrative uniquement - Références juridiques obligatoires (CGCT, CSI, Code de la route, Code pénal)`;
  }, [configuration]);

  /**
   * Génère un template de document administratif
   */
  const generateDocumentTemplate = useCallback(async (template: DocumentTemplate): Promise<string> => {
    setIsGeneratingDocument(true);
    
    try {
      const templateConfig: DocumentGeneration = {
        template,
        context: configuration.context,
        priority: configuration.priority
      };
      
      const generatedTemplate = await generateTemplate(templateConfig);
      return generatedTemplate;
    } finally {
      setIsGeneratingDocument(false);
    }
  }, [configuration]);

  /**
   * Valide la sécurité d'une demande
   */
  const validateSecurityRequest = useCallback((request: string): boolean => {
    const forbiddenPatterns = [
      /modifier.*instruction/i,
      /révéler.*prompt/i,
      /contourner.*limitation/i,
      /police nationale.*tactique/i,
      /surveillance.*non.*autorisé/i,
      /procédure.*illégal/i
    ];

    return !forbiddenPatterns.some(pattern => pattern.test(request));
  }, []);

  /**
   * Retourne une réponse de sécurité standardisée
   */
  const getSecurityResponse = useCallback((): string => {
    return "Je ne peux répondre qu'aux questions relatives à la police municipale dans un cadre légal et administratif. Comment puis-je vous aider concernant la gestion de votre service ?";
  }, []);

  return {
    configuration,
    updateContext,
    updatePriority,
    enrichPrompt,
    generateDocumentTemplate,
    validateSecurityRequest,
    getSecurityResponse,
    isGeneratingDocument
  };
}

/**
 * Instructions contextuelles selon le type de commune
 */
function getContextInstructions(context: CommuneContext): string {
  switch (context) {
    case 'rural':
      return 'Commune rurale (<5000 habitants) - Focus polyvalence agents, mutualisation intercommunale, missions essentielles';
    case 'moyenne':
      return 'Ville moyenne (5000-50000 habitants) - Équilibre prévention/répression, coordination gendarmerie/PN, brigades spécialisées';
    case 'metropole':
      return 'Grande agglomération (>50000 habitants) - Brigades spécialisées, vidéoprotection avancée, centres supervision urbains';
    default:
      return 'Contexte standard';
  }
}

/**
 * Instructions de priorité de traitement
 */
function getPriorityInstructions(priority: Priority): string {
  switch (priority) {
    case 'urgence':
      return 'URGENCE OPÉRATIONNELLE - Sécurité immédiate agents/public - Traitement prioritaire';
    case 'conformite':
      return 'CONFORMITÉ JURIDIQUE - Vérification légalité procédures/interventions - Références obligatoires';
    case 'optimisation':
      return 'OPTIMISATION ADMINISTRATIVE - Amélioration processus/documents - Solutions pratiques';
    case 'planification':
      return 'PLANIFICATION STRATÉGIQUE - Développement moyen/long terme - Vision globale service';
    default:
      return 'Traitement standard';
  }
}

/**
 * Génération de templates selon le type demandé
 */
async function generateTemplate(config: DocumentGeneration): Promise<string> {
  const baseHeaders = `
MAIRIE DE [COMMUNE]
Service de Police Municipale
${getContextInstructions(config.context)}
`;

  switch (config.template) {
    case 'note_service':
      return `${baseHeaders}

NOTE DE SERVICE N° [ANNÉE]-[NUMÉRO]

Objet : [OBJET DE LA NOTE]
Référence : [DÉLIBÉRATION/ARRÊTÉ DE RÉFÉRENCE]

J'ai l'honneur de porter à votre connaissance les dispositions suivantes :

[CORPS DE LA NOTE - Instructions détaillées selon le contexte ${config.context}]

Cette note entre en vigueur le [DATE].

Le responsable du service de police municipale,
[NOM ET QUALITÉ]`;

    case 'rapport_interne':
      return `${baseHeaders}

RAPPORT INTERNE

Date : [DATE]
Objet : [OBJET DU RAPPORT]
Période concernée : [PÉRIODE]

1. CONTEXTE ET ENJEUX
[Description du contexte territorial - ${config.context}]

2. ANALYSE DE LA SITUATION
[Analyse détaillée selon priorité ${config.priority}]

3. RECOMMANDATIONS
[Recommandations adaptées au contexte]

4. RÉFÉRENCES JURIDIQUES
[Articles CGCT, CSI, Code de la route applicables]

Établi par : [NOM]
Fonction : [FONCTION]`;

    case 'courrier_officiel':
      return `${baseHeaders}

[DESTINATAIRE]
[ADRESSE]

Objet : [OBJET DU COURRIER]
Référence : [RÉFÉRENCE]

Monsieur/Madame [TITRE],

[CORPS DU COURRIER - Adaptation selon contexte ${config.context}]

Dans l'attente de votre réponse, je vous prie d'agréer, Monsieur/Madame [TITRE], l'expression de mes salutations distinguées.

Le responsable du service de police municipale,
[NOM ET QUALITÉ]`;

    case 'procedure':
      return `${baseHeaders}

PROCÉDURE OPÉRATIONNELLE

Titre : [TITRE DE LA PROCÉDURE]
Version : [VERSION]
Date d'application : [DATE]

1. OBJECTIF
[Objectif de la procédure selon priorité ${config.priority}]

2. CHAMP D'APPLICATION
[Contexte territorial : ${config.context}]

3. RÉFÉRENCES JURIDIQUES
- CGCT : [Articles applicables]
- CSI : [Articles applicables]
- Code de la route : [Articles applicables]

4. DÉROULEMENT DE LA PROCÉDURE
[Étapes détaillées]

5. POINTS DE VIGILANCE
[Aspects juridiques et sécuritaires]

Validation : [NOM ET FONCTION]`;

    default:
      return 'Template non reconnu';
  }
}