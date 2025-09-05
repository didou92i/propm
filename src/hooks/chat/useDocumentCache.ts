import { useState, useCallback } from 'react';

interface CachedDocument {
  id: string;
  filename: string;
  extractedText: string;
  processed_at: string;
  hash: string;
}

export function useDocumentCache() {
  const [cache, setCache] = useState<Map<string, CachedDocument>>(new Map());

  // Generate simple hash for file
  const generateFileHash = useCallback((file: File): string => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }, []);

  // Check if document is already processed
  const getCachedDocument = useCallback((file: File): CachedDocument | null => {
    const hash = generateFileHash(file);
    return cache.get(hash) || null;
  }, [cache, generateFileHash]);

  // Cache processed document
  const cacheDocument = useCallback((file: File, result: any) => {
    const hash = generateFileHash(file);
    const cachedDoc: CachedDocument = {
      id: `cached_${Date.now()}`,
      filename: file.name,
      extractedText: result.extractedText || '',
      processed_at: new Date().toISOString(),
      hash
    };
    
    setCache(prev => new Map(prev.set(hash, cachedDoc)));
    return cachedDoc;
  }, [generateFileHash]);

  // Clear cache (useful for debugging)
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    getCachedDocument,
    cacheDocument,
    clearCache,
    cacheSize: cache.size
  };
}