/**
 * Service de contenu modernisé - Interface de compatibilité
 * Remplace l'ancien trainingData.ts avec le nouveau système modulaire
 */

import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import { contentLoader, type GenerationOptions } from './contentLoader';

export class ModernContentService {
  /**
   * Fonction de compatibilité avec l'ancienne API
   * Remplace directement getStaticContent() de trainingData.ts
   */
  public static async getContent(
    trainingType: TrainingType, 
    domain: StudyDomain, 
    level: UserLevel,
    options: GenerationOptions = {}
  ): Promise<any> {
    return contentLoader.generateContent(trainingType, domain, level, options);
  }

  /**
   * Préchargement pour améliorer les performances
   */
  public static async initialize(): Promise<void> {
    await contentLoader.preloadAll();
  }

  /**
   * Nettoie le cache si nécessaire
   */
  public static clearCache(): void {
    contentLoader.clearCache();
  }

  /**
   * Statistiques du cache pour debug
   */
  public static getCacheStats() {
    return contentLoader.getCacheStats();
  }
}

// Export principal pour compatibilité
export const getStaticContent = ModernContentService.getContent;

// Export du service complet
export { ModernContentService as contentService };