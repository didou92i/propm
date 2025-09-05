import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import { questionGenerator, type ContentData, type GenerationOptions } from './questionGenerator';

// Re-export types for external use
export type { GenerationOptions, ContentData } from './questionGenerator';

/**
 * Service de chargement de contenu de formation avec cache intelligent
 */
export class ContentLoader {
  private cache = new Map<string, ContentData>();
  private loadingPromises = new Map<string, Promise<ContentData>>();

  /**
   * Charge le contenu JSON pour un domaine donné
   */
  public async loadDomainContent(domain: StudyDomain): Promise<ContentData> {
    const cacheKey = domain;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Vérifier les promesses en cours
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Créer la promesse de chargement
    const loadingPromise = this.fetchDomainData(domain);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const data = await loadingPromise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Génère du contenu adapté au niveau et type d'entraînement
   */
  public async generateContent(
    trainingType: TrainingType,
    domain: StudyDomain,
    level: UserLevel,
    options: GenerationOptions = {}
  ): Promise<any> {
    try {
      const domainData = await this.loadDomainContent(domain);
      
      switch (trainingType) {
        case 'qcm': {
          const maxItems = this.getMaxItemsByLevel(level, 8);
          return questionGenerator.selectQuestions(
            domainData.qcm, 
            level, 
            { ...options, maxItems: options.maxItems || maxItems }
          );
        }
        
        case 'vrai_faux': {
          const maxItems = this.getMaxItemsByLevel(level, 6);
          return questionGenerator.selectQuestions(
            domainData.trueFalse, 
            level, 
            { ...options, maxItems: options.maxItems || maxItems }
          );
        }
        
        case 'cas_pratique': {
          return questionGenerator.selectCasePractice(
            domainData.casePractice, 
            level, 
            options
          );
        }
        
        default: {
          // Fallback vers QCM
          const maxItems = this.getMaxItemsByLevel(level, 5);
          return questionGenerator.selectQuestions(
            domainData.qcm, 
            level, 
            { ...options, maxItems: options.maxItems || maxItems }
          );
        }
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du contenu pour ${domain}:`, error);
      
      // Fallback vers le domaine par défaut
      if (domain !== 'droit_administratif') {
        console.log('Fallback vers droit_administratif...');
        return this.generateContent(trainingType, 'droit_administratif', level, options);
      }
      
      throw error;
    }
  }

  /**
   * Récupère les données depuis le fichier JSON
   */
  private async fetchDomainData(domain: StudyDomain): Promise<ContentData> {
    const domainMap: Record<StudyDomain, string> = {
      'droit_administratif': 'droit-administratif',
      'police_municipale': 'police-municipale',
      'securite_publique': 'securite-publique',
      'reglementation': 'reglementation',
      'procedure_penale': 'procedure-penale',
      'management': 'management',
      'ethique_deontologie': 'ethique-deontologie'
    };

    const fileName = domainMap[domain] || 'droit-administratif';
    const filePath = `/src/data/questions/${fileName}.json`;

    try {
      // Utilisation de l'import dynamique pour charger le JSON
      const module = await import(/* @vite-ignore */ filePath);
      return module.default || module;
    } catch (error) {
      console.error(`Impossible de charger ${filePath}:`, error);
      
      // Tentative avec fetch en fallback
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} pour ${filePath}`);
      }
      
      return response.json();
    }
  }

  /**
   * Détermine le nombre maximum d'éléments selon le niveau
   */
  private getMaxItemsByLevel(level: UserLevel, defaultMax: number): number {
    const multipliers: Record<UserLevel, number> = {
      'debutant': 0.6,
      'intermediaire': 0.8,
      'avance': 1.0
    };
    
    const multiplier = multipliers[level] || 1.0;
    return Math.max(1, Math.floor(defaultMax * multiplier));
  }

  /**
   * Précharge tous les domaines pour améliorer les performances
   */
  public async preloadAll(): Promise<void> {
    const domains: StudyDomain[] = [
      'droit_administratif',
      'police_municipale', 
      'securite_publique',
      'reglementation',
      'procedure_penale',
      'management',
      'ethique_deontologie'
    ];

    const promises = domains.map(domain => 
      this.loadDomainContent(domain).catch(err => 
        console.warn(`Échec du préchargement de ${domain}:`, err)
      )
    );

    await Promise.allSettled(promises);
  }

  /**
   * Vide le cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Obtient la taille du cache
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Obtient les statistiques du cache
   */
  public getCacheStats(): { cached: string[], loading: string[] } {
    return {
      cached: Array.from(this.cache.keys()),
      loading: Array.from(this.loadingPromises.keys())
    };
  }
}

// Instance singleton
export const contentLoader = new ContentLoader();

// Export du service avec méthode de convenance
export const getStaticContent = (
  trainingType: TrainingType, 
  domain: StudyDomain, 
  level: UserLevel,
  options: GenerationOptions = {}
) => {
  return contentLoader.generateContent(trainingType, domain, level, options);
};