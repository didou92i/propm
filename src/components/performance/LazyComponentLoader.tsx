import React, { Suspense, lazy, ComponentType } from 'react';
import { SkeletonMessage } from '@/components/common';

interface LazyComponentLoaderProps {
  loadComponent: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

/**
 * Composant pour le chargement paresseux avec gestion d'erreur et fallback
 */
export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({ 
  loadComponent, 
  fallback = <SkeletonMessage />,
  ...props 
}) => {
  const LazyComponent = lazy(loadComponent);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * HOC pour créer un composant lazy facilement
 */
export function createLazyComponent<T = {}>(
  loadComponent: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  return (props: T) => (
    <LazyComponentLoader 
      loadComponent={loadComponent}
      fallback={fallback}
      {...props}
    />
  );
}

/**
 * Hook pour créer des composants lazy avec cache
 */
const lazyComponentCache = new Map<string, ComponentType<any>>();

export function useLazyComponent<T = {}>(
  key: string,
  loadComponent: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  if (!lazyComponentCache.has(key)) {
    const LazyComponent = createLazyComponent(loadComponent, fallback);
    lazyComponentCache.set(key, LazyComponent);
  }
  
  return lazyComponentCache.get(key) as ComponentType<T>;
}