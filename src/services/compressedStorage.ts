import LZString from 'lz-string';
import { logger } from '@/utils/logger';

/**
 * Service de stockage local optimisé avec compression LZ-String
 * Améliore les performances en réduisant la taille des données stockées
 */
export class CompressedStorageService {
  private static instance: CompressedStorageService;
  private compressionThreshold = 1000; // Compresser si > 1KB

  static getInstance(): CompressedStorageService {
    if (!CompressedStorageService.instance) {
      CompressedStorageService.instance = new CompressedStorageService();
    }
    return CompressedStorageService.instance;
  }

  /**
   * Stocke des données avec compression automatique
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      const shouldCompress = serialized.length > this.compressionThreshold;
      
      if (shouldCompress) {
        const compressed = LZString.compress(serialized);
        if (compressed) {
          localStorage.setItem(`${key}_compressed`, compressed);
          localStorage.removeItem(key); // Nettoie l'ancienne version
          return true;
        }
      }
      
      localStorage.setItem(key, serialized);
      localStorage.removeItem(`${key}_compressed`); // Nettoie la version compressée
      return true;
    } catch (error) {
      logger.error('Erreur lors du stockage compressé', error, 'CompressedStorage');
      return false;
    }
  }

  /**
   * Récupère des données avec décompression automatique
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      // Essaie d'abord la version compressée
      const compressedData = localStorage.getItem(`${key}_compressed`);
      if (compressedData) {
        const decompressed = LZString.decompress(compressedData);
        if (decompressed) {
          return JSON.parse(decompressed) as T;
        }
      }

      // Fallback vers la version non compressée
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data) as T;
      }

      return defaultValue;
    } catch (error) {
      logger.warn('Erreur lors de la récupération des données', error, 'CompressedStorage');
      return defaultValue;
    }
  }

  /**
   * Supprime un élément (versions compressée et non compressée)
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_compressed`);
  }

  /**
   * Migre les données existantes vers le format compressé
   */
  migrateToCompressed(keys: string[]): void {
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data.length > this.compressionThreshold) {
        const parsed = JSON.parse(data);
        this.setItem(key, parsed);
      }
    });
  }

  /**
   * Obtient les statistiques de compression
   */
  getCompressionStats(): { totalKeys: number; compressedKeys: number; savings: number } {
    const keys = Object.keys(localStorage);
    const compressedKeys = keys.filter(key => key.endsWith('_compressed'));
    
    let originalSize = 0;
    let compressedSize = 0;

    compressedKeys.forEach(key => {
      const originalKey = key.replace('_compressed', '');
      const compressedData = localStorage.getItem(key);
      
      if (compressedData) {
        compressedSize += compressedData.length;
        const decompressed = LZString.decompress(compressedData);
        if (decompressed) {
          originalSize += decompressed.length;
        }
      }
    });

    return {
      totalKeys: keys.length,
      compressedKeys: compressedKeys.length,
      savings: originalSize > 0 ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0
    };
  }

  /**
   * Nettoie les données anciennes et optimise le stockage
   */
  optimize(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.timestamp && new Date(parsed.timestamp) < cutoffDate) {
            this.removeItem(key.replace('_compressed', ''));
          }
        }
      } catch {
        // Ignore les erreurs de parsing
      }
    });
  }
}

// Instance globale
export const compressedStorage = CompressedStorageService.getInstance();