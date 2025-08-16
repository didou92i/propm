import { lazy } from 'react';
import { createLazyComponent } from './LazyComponentLoader';
import { SkeletonMessage } from '@/components/common';

// Lazy loading des pages lourdes (avec export default confirmé)
export const LazyJobManage = lazy(() => import('@/pages/JobManage'));
export const LazyJobCreate = lazy(() => import('@/pages/JobCreate'));
export const LazyJobs = lazy(() => import('@/pages/Jobs'));
export const LazyDiagnostics = lazy(() => import('@/pages/Diagnostics'));
export const LazyUserDataManagement = lazy(() => import('@/pages/UserDataManagement'));

// Composants optimisés avec fallback personnalisé
export const OptimizedJobManage = createLazyComponent(
  () => import('@/pages/JobManage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="space-y-4">
      <SkeletonMessage />
      <div className="text-center text-muted-foreground">Chargement de la gestion des emplois...</div>
    </div>
  </div>
);

export const OptimizedJobCreate = createLazyComponent(
  () => import('@/pages/JobCreate'),
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="space-y-4">
      <SkeletonMessage />
      <div className="text-center text-muted-foreground">Chargement du formulaire...</div>
    </div>
  </div>
);

export const OptimizedJobs = createLazyComponent(
  () => import('@/pages/Jobs'),
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="space-y-4">
      <SkeletonMessage />
      <div className="text-center text-muted-foreground">Chargement des offres d'emploi...</div>
    </div>
  </div>
);

export const OptimizedDiagnostics = createLazyComponent(
  () => import('@/pages/Diagnostics'),
  <div className="flex items-center justify-center min-h-[500px]">
    <div className="space-y-4">
      <SkeletonMessage />
      <div className="text-center text-muted-foreground">Chargement des diagnostics...</div>
    </div>
  </div>
);

export const OptimizedUserDataManagement = createLazyComponent(
  () => import('@/pages/UserDataManagement'),
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="space-y-4">
      <SkeletonMessage />
      <div className="text-center text-muted-foreground">Chargement de la gestion des données...</div>
    </div>
  </div>
);