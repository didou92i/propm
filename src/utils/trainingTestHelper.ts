/**
 * Utilitaire de test pour valider le fonctionnement du module formation
 */

import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import { trainingContentService } from '@/services/training/trainingContentService';
import { ContentFallbackService } from '@/services/training/contentFallback';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export class TrainingTestHelper {
  /**
   * Teste tous les types d'entraînement
   */
  public static async testAllTrainingTypes(): Promise<Record<TrainingType, TestResult>> {
    const types: TrainingType[] = ['qcm', 'vrai_faux', 'cas_pratique', 'question_ouverte'];
    const results: Record<string, TestResult> = {};

    for (const type of types) {
      try {
        const startTime = Date.now();
        const result = await trainingContentService.generateContent(
          type,
          'intermediaire',
          'droit_administratif'
        );
        
        const duration = Date.now() - startTime;
        
        results[type] = {
          success: true,
          message: `✅ ${type} généré avec succès`,
          details: {
            source: result.source,
            hasContent: !!result.content,
            duration: `${duration}ms`
          },
          duration
        };
      } catch (error) {
        results[type] = {
          success: false,
          message: `❌ Échec de génération ${type}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          details: { error }
        };
      }
    }

    return results as Record<TrainingType, TestResult>;
  }

  /**
   * Teste le service de fallback
   */
  public static testFallbackService(): Record<TrainingType, TestResult> {
    const types: TrainingType[] = ['qcm', 'vrai_faux', 'cas_pratique', 'question_ouverte'];
    const results: Record<string, TestResult> = {};

    for (const type of types) {
      try {
        const content = ContentFallbackService.generateFallbackContent(
          type,
          'intermediaire',
          'droit_administratif'
        );

        const isValid = this.validateFallbackContent(content, type);
        
        results[type] = {
          success: isValid,
          message: isValid ? `✅ Fallback ${type} valide` : `❌ Fallback ${type} invalide`,
          details: {
            hasContent: !!content,
            isFallback: ContentFallbackService.isFallbackContent(content),
            structure: this.getContentStructure(content)
          }
        };
      } catch (error) {
        results[type] = {
          success: false,
          message: `❌ Erreur fallback ${type}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          details: { error }
        };
      }
    }

    return results as Record<TrainingType, TestResult>;
  }

  /**
   * Teste la robustesse avec différents niveaux et domaines
   */
  public static async testRobustness(): Promise<TestResult> {
    const levels: UserLevel[] = ['debutant', 'intermediaire', 'avance'];
    const domains: StudyDomain[] = [
      'droit_administratif', 
      'police_municipale', 
      'securite_publique'
    ];

    let successCount = 0;
    let totalTests = 0;
    const details: any[] = [];

    for (const level of levels) {
      for (const domain of domains) {
        totalTests++;
        try {
          const result = await trainingContentService.generateContent(
            'qcm',
            level,
            domain
          );
          
          if (result.content) {
            successCount++;
            details.push({
              level,
              domain,
              status: '✅ Succès',
              source: result.source
            });
          } else {
            details.push({
              level,
              domain,
              status: '❌ Contenu vide',
              source: result.source
            });
          }
        } catch (error) {
          details.push({
            level,
            domain,
            status: '❌ Erreur',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }
    }

    const successRate = (successCount / totalTests) * 100;
    
    return {
      success: successRate >= 80, // 80% de réussite minimum
      message: `Tests de robustesse: ${successCount}/${totalTests} (${successRate.toFixed(1)}%)`,
      details: {
        successRate: `${successRate.toFixed(1)}%`,
        breakdown: details
      }
    };
  }

  /**
   * Valide la structure d'un contenu fallback
   */
  private static validateFallbackContent(content: any, type: TrainingType): boolean {
    if (!content || !content.metadata) return false;
    
    switch (type) {
      case 'qcm':
      case 'vrai_faux':
        return Array.isArray(content.questions) && content.questions.length > 0;
      
      case 'cas_pratique':
        return Array.isArray(content.steps) && content.steps.length > 0;
      
      case 'question_ouverte':
        return Array.isArray(content.questions) && content.questions.length > 0;
      
      default:
        return false;
    }
  }

  /**
   * Extrait la structure d'un contenu pour debug
   */
  private static getContentStructure(content: any): any {
    if (!content) return null;
    
    const structure: any = {
      hasTitle: !!content.title,
      hasMetadata: !!content.metadata
    };

    if (content.questions) {
      structure.questionsCount = content.questions.length;
    }
    
    if (content.steps) {
      structure.stepsCount = content.steps.length;
    }

    return structure;
  }

  /**
   * Lance tous les tests et retourne un rapport complet
   */
  public static async runFullTestSuite(): Promise<{
    success: boolean;
    summary: string;
    details: {
      trainingTypes: Record<TrainingType, TestResult>;
      fallback: Record<TrainingType, TestResult>;
      robustness: TestResult;
    };
  }> {
    console.log('🚀 Lancement de la suite de tests du module formation...');
    
    const trainingTypes = await this.testAllTrainingTypes();
    const fallback = this.testFallbackService();
    const robustness = await this.testRobustness();
    
    const allSuccessful = 
      Object.values(trainingTypes).every(r => r.success) &&
      Object.values(fallback).every(r => r.success) &&
      robustness.success;
    
    const summary = allSuccessful 
      ? '✅ Tous les tests sont passés avec succès'
      : '⚠️ Certains tests ont échoué - Vérifiez les détails';
    
    return {
      success: allSuccessful,
      summary,
      details: {
        trainingTypes,
        fallback,
        robustness
      }
    };
  }
}