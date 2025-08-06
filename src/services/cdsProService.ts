import { supabase } from '@/integrations/supabase/client';
import { CommuneContext, Priority, DocumentTemplate } from '@/components/chat/CdsProControls';

export interface CdsProRequest {
  query: string;
  context: CommuneContext;
  priority: Priority;
  vectorialDatabase: string;
}

export interface CdsProResponse {
  response: string;
  references: LegalReference[];
  recommendations: string[];
  templates?: GeneratedTemplate[];
}

export interface LegalReference {
  article: string;
  code: string;
  content: string;
  url?: string;
}

export interface GeneratedTemplate {
  type: DocumentTemplate;
  title: string;
  content: string;
  context: CommuneContext;
}

/**
 * Service dédié aux fonctionnalités avancées de CDS Pro
 */
class CdsProService {
  private readonly VECTORIAL_DB = 'vs_67eefbe160348191b7a19ad6210afd55';
  private readonly SECURITY_PATTERNS = [
    /modifier.*instruction/i,
    /révéler.*prompt/i,
    /contourner.*limitation/i,
    /police nationale.*tactique/i,
    /surveillance.*non.*autorisé/i,
    /procédure.*illégal/i
  ];

  /**
   * Enrichit une requête avec le contexte CDS Pro
   */
  enrichQuery(request: CdsProRequest): string {
    const contextInstructions = this.getContextInstructions(request.context);
    const priorityInstructions = this.getPriorityInstructions(request.priority);
    
    return `${request.query}

**CONTEXTE TERRITORIAL**: ${contextInstructions}
**PRIORITÉ**: ${priorityInstructions}
**BASE VECTORIELLE**: Consulter ${request.vectorialDatabase}
**MODE SÉCURISÉ**: Police municipale administrative - Références juridiques obligatoires (CGCT, CSI, Code de la route, Code pénal)

Répondez de manière structurée avec :
1. Analyse juridique précise
2. Références légales exactes
3. Recommandations pratiques adaptées au contexte territorial
4. Solutions opérationnelles directement applicables`;
  }

  /**
   * Valide la sécurité d'une requête
   */
  validateSecurityRequest(query: string): { isValid: boolean; reason?: string } {
    const forbiddenPattern = this.SECURITY_PATTERNS.find(pattern => pattern.test(query));
    
    if (forbiddenPattern) {
      return {
        isValid: false,
        reason: "Demande non autorisée - Sortie du cadre police municipale"
      };
    }

    return { isValid: true };
  }

  /**
   * Retourne la réponse de sécurité standardisée
   */
  getSecurityResponse(): string {
    return "Je ne peux répondre qu'aux questions relatives à la police municipale dans un cadre légal et administratif. Comment puis-je vous aider concernant la gestion de votre service ?";
  }

  /**
   * Recherche dans la base vectorielle spécialisée
   */
  async searchVectorialDatabase(query: string, context: CommuneContext): Promise<any[]> {
    try {
      // Utilisation de la base vectorielle spécialisée
      const { data, error } = await supabase.functions.invoke('search-cds-vectorial', {
        body: {
          query,
          database: this.VECTORIAL_DB,
          context,
          filters: {
            police_municipale: true,
            droit_administratif: true
          }
        }
      });

      if (error) {
        console.error('Erreur recherche vectorielle:', error);
        return [];
      }

      return data?.results || [];
    } catch (error) {
      console.error('Erreur service vectoriel:', error);
      return [];
    }
  }

  /**
   * Génère des références juridiques automatiquement
   */
  async generateLegalReferences(query: string, context: CommuneContext): Promise<LegalReference[]> {
    const references: LegalReference[] = [];

    // Références CGCT selon le contexte
    if (query.toLowerCase().includes('police municipale')) {
      references.push({
        article: 'L.511-1',
        code: 'Code de la Sécurité Intérieure',
        content: 'Compétences des agents de police municipale',
        url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025503156'
      });
    }

    // Références spécifiques au contexte territorial
    if (context === 'rural') {
      references.push({
        article: 'L.511-2',
        code: 'Code de la Sécurité Intérieure',
        content: 'Mutualisation des services de police municipale',
        url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025503154'
      });
    }

    return references;
  }

  /**
   * Génère des templates administratifs personnalisés
   */
  async generateTemplate(type: DocumentTemplate, context: CommuneContext, priority: Priority): Promise<GeneratedTemplate> {
    const contextInstructions = this.getContextInstructions(context);
    
    const template: GeneratedTemplate = {
      type,
      title: this.getTemplateTitle(type, context),
      content: await this.generateTemplateContent(type, context, priority),
      context
    };

    return template;
  }

  private getContextInstructions(context: CommuneContext): string {
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

  private getPriorityInstructions(priority: Priority): string {
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

  private getTemplateTitle(type: DocumentTemplate, context: CommuneContext): string {
    const contextSuffix = context === 'rural' ? ' (Commune rurale)' : 
                         context === 'metropole' ? ' (Métropole)' : '';
    
    switch (type) {
      case 'note_service':
        return `Note de service${contextSuffix}`;
      case 'rapport_interne':
        return `Rapport interne${contextSuffix}`;
      case 'courrier_officiel':
        return `Courrier officiel${contextSuffix}`;
      case 'procedure':
        return `Procédure opérationnelle${contextSuffix}`;
      default:
        return 'Document administratif';
    }
  }

  private async generateTemplateContent(type: DocumentTemplate, context: CommuneContext, priority: Priority): Promise<string> {
    const baseHeaders = `
MAIRIE DE [COMMUNE]
Service de Police Municipale
${this.getContextInstructions(context)}
`;

    switch (type) {
      case 'note_service':
        return `${baseHeaders}

NOTE DE SERVICE N° [ANNÉE]-[NUMÉRO]

Objet : [OBJET DE LA NOTE]
Référence : [DÉLIBÉRATION/ARRÊTÉ DE RÉFÉRENCE]

J'ai l'honneur de porter à votre connaissance les dispositions suivantes :

[CORPS DE LA NOTE - Instructions détaillées selon le contexte ${context}]

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
[Description du contexte territorial - ${context}]

2. ANALYSE DE LA SITUATION
[Analyse détaillée selon priorité ${priority}]

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

[CORPS DU COURRIER - Adaptation selon contexte ${context}]

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
[Objectif de la procédure selon priorité ${priority}]

2. CHAMP D'APPLICATION
[Contexte territorial : ${context}]

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
        return 'Contenu du template non disponible';
    }
  }
}

export const cdsProService = new CdsProService();