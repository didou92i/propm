import type { LlamaSearchResult, LlamaSearchOptions } from './types';

export class SearchEngine {
  private queryEngine: any;
  private index: any;

  constructor(queryEngine: any, index: any) {
    this.queryEngine = queryEngine;
    this.index = index;
  }

  async search(query: string, options?: LlamaSearchOptions): Promise<LlamaSearchResult[]> {
    const { maxResults = 10, threshold = 0.5, retrievalStrategy = 'default' } = options || {};

    try {
      let results: LlamaSearchResult[];

      switch (retrievalStrategy) {
        case 'hierarchical':
          results = await this.hierarchicalSearch(query, maxResults);
          break;
        case 'auto_merging':
          results = await this.autoMergingSearch(query, maxResults);
          break;
        default:
          results = await this.defaultSearch(query, maxResults);
      }

      // Filtrer par seuil de pertinence
      const filteredResults = results.filter(result => result.score >= threshold);

      // Trier par score décroissant
      return filteredResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  async contextualSearch(query: string, conversationHistory: string[], maxResults: number = 5): Promise<LlamaSearchResult[]> {
    try {
      // Créer un contexte enrichi avec l'historique
      const contextualQuery = this.buildContextualQuery(query, conversationHistory);
      
      const response = await this.queryEngine.query({
        query: contextualQuery,
        similarityTopK: Math.max(maxResults * 2, 20)
      });

      if (!response?.sourceNodes) {
        return [];
      }

      const results = response.sourceNodes.map((node: any) => ({
        content: node.node?.getText() || '',
        metadata: node.node?.metadata || {},
        score: node.score || 0,
        relevanceScore: this.calculateRelevanceScore(node, query)
      }));

      return results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, maxResults);
    } catch (error) {
      console.error('Erreur lors de la recherche contextuelle:', error);
      return [];
    }
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

  private async defaultSearch(query: string, maxResults: number): Promise<LlamaSearchResult[]> {
    const response = await this.queryEngine.query({
      query,
      similarityTopK: maxResults
    });

    if (!response?.sourceNodes) return [];

    return response.sourceNodes.map((node: any) => ({
      content: node.node?.getText() || '',
      metadata: node.node?.metadata || {},
      score: node.score || 0,
      relevanceScore: this.calculateRelevanceScore(node, query)
    }));
  }

  private async hierarchicalSearch(query: string, maxResults: number): Promise<LlamaSearchResult[]> {
    const response = await this.queryEngine.query({
      query,
      similarityTopK: maxResults * 2
    });

    if (!response?.sourceNodes) return [];

    const results = response.sourceNodes.map((node: any) => ({
      content: node.node?.getText() || '',
      metadata: { ...node.node?.metadata, level: this.determineNodeLevel(node) },
      score: node.score || 0,
      relevanceScore: this.calculateRelevanceScore(node, query)
    }));

    // Prioriser les résultats de niveau supérieur (titres, sections)
    return results
      .sort((a, b) => {
        const levelDiff = (a.metadata.level || 0) - (b.metadata.level || 0);
        if (levelDiff !== 0) return levelDiff;
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      })
      .slice(0, maxResults);
  }

  private async autoMergingSearch(query: string, maxResults: number): Promise<LlamaSearchResult[]> {
    const response = await this.queryEngine.query({
      query,
      similarityTopK: maxResults * 3
    });

    if (!response?.sourceNodes) return [];

    const nodes = response.sourceNodes.map((node: any) => ({
      ...node,
      content: node.node?.getText() || '',
      metadata: node.node?.metadata || {},
      score: node.score || 0,
      relevanceScore: this.calculateRelevanceScore(node, query)
    }));

    // Fusionner les nœuds liés du même document
    const mergedResults = this.mergeRelatedNodes(nodes, query);
    
    return mergedResults.slice(0, maxResults);
  }

  private buildContextualQuery(query: string, conversationHistory: string[]): string {
    if (conversationHistory.length === 0) return query;

    const recentHistory = conversationHistory.slice(-3).join(' ');
    return `Contexte de conversation: ${recentHistory}\n\nQuestion actuelle: ${query}`;
  }

  private calculateRelevanceScore(node: any, query: string): number {
    const content = node.node?.getText()?.toLowerCase() || '';
    const queryLower = query.toLowerCase();
    const metadata = node.node?.metadata || {};
    
    let score = node.score || 0;
    
    // Bonus pour correspondance exacte dans le contenu
    const exactMatches = (content.match(new RegExp(queryLower.replace(/\s+/g, '\\s+'), 'g')) || []).length;
    score += exactMatches * 0.1;
    
    // Bonus pour métadonnées pertinentes
    if (metadata.title?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    if (metadata.category === 'procedure' && queryLower.includes('procédure')) {
      score += 0.15;
    }
    
    // Bonus pour récence (si timestamp disponible)
    if (metadata.timestamp) {
      const age = Date.now() - new Date(metadata.timestamp).getTime();
      const daysSinceCreation = age / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  private determineNodeLevel(node: any): number {
    const content = node.node?.getText() || '';
    
    if (content.length < 100) return 1; // Titre/section
    if (content.length < 500) return 2; // Paragraphe
    return 3; // Document complet
  }

  private mergeRelatedNodes(nodes: any[], query: string): LlamaSearchResult[] {
    const documentGroups: { [key: string]: any[] } = {};
    
    // Grouper par document source
    nodes.forEach(node => {
      const source = node.metadata.source || 'unknown';
      if (!documentGroups[source]) {
        documentGroups[source] = [];
      }
      documentGroups[source].push(node);
    });
    
    const mergedResults: LlamaSearchResult[] = [];
    
    Object.entries(documentGroups).forEach(([source, groupNodes]) => {
      if (groupNodes.length === 1) {
        mergedResults.push({
          content: groupNodes[0].content,
          metadata: groupNodes[0].metadata,
          score: groupNodes[0].score,
          relevanceScore: groupNodes[0].relevanceScore
        });
      } else {
        // Fusionner les nœuds du même document
        const mergedContent = groupNodes
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .map(node => node.content)
          .join('\n\n...\n\n');
        
        const avgScore = groupNodes.reduce((sum, node) => sum + node.score, 0) / groupNodes.length;
        const maxRelevance = Math.max(...groupNodes.map(node => node.relevanceScore || 0));
        
        mergedResults.push({
          content: mergedContent,
          metadata: { ...groupNodes[0].metadata, merged: true },
          score: avgScore,
          relevanceScore: maxRelevance
        });
      }
    });
    
    return mergedResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }
}