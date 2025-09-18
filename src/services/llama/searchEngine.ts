import type { LlamaSearchResult, LlamaSearchOptions } from './types';

export class SearchEngine {
  private queryEngine: any;
  private index: any;

  constructor(queryEngine: any, index: any) {
    this.queryEngine = queryEngine;
    this.index = index;
  }

  async search(query: string, options?: LlamaSearchOptions): Promise<LlamaSearchResult[]> {
    try {
      const results = await this.queryEngine.search(query);
      
      return results.map((doc: any) => ({
        content: doc.text,
        metadata: doc.metadata || {},
        score: 0.8 // Score simulé
      })).slice(0, options?.maxResults || 10);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  async contextualSearch(query: string, conversationHistory: string[], maxResults: number = 5): Promise<LlamaSearchResult[]> {
    // Recherche contextuelle simplifiée
    const contextQuery = `${conversationHistory.slice(-2).join(' ')} ${query}`;
    return this.search(contextQuery, { maxResults });
  }

  policeQueryRouter(query: string): 'hierarchical' | 'auto_merging' | 'default' {
    const lowerQuery = query.toLowerCase();
    
    // Mots-clés pour recherche hiérarchique (structure administrative)
    const hierarchicalKeywords = [
      'organisation', 'structure', 'hiérarchie', 'organigramme',
      'chef', 'adjoint', 'service', 'direction', 'commandement'
    ];
    
    // Mots-clés pour auto-merging (procédures complexes)
    const autoMergingKeywords = [
      'procédure', 'étapes', 'processus', 'méthode', 'protocole',
      'comment faire', 'marche à suivre', 'démarche'
    ];

    if (hierarchicalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'hierarchical';
    }
    
    if (autoMergingKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'auto_merging';
    }
    
    return 'default';
  }
}