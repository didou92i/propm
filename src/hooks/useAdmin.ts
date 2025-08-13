import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Cache pour éviter les vérifications répétées
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      setError(null);
      return;
    }

    // Vérifier le cache d'abord
    const cached = adminCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setIsAdmin(cached.isAdmin);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('is_admin');
      
      if (rpcError) {
        // Distinguer les erreurs de réseau des refus d'accès
        if (rpcError.code === 'PGRST116' || rpcError.message?.includes('permission denied')) {
          setIsAdmin(false);
          setError('Accès refusé');
        } else {
          throw rpcError;
        }
      } else {
        const adminStatus = data || false;
        setIsAdmin(adminStatus);
        
        // Mettre en cache le résultat
        adminCache.set(user.id, { isAdmin: adminStatus, timestamp: Date.now() });
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification des droits admin:', error);
      setIsAdmin(false);
      setError(error.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Fonction pour forcer une nouvelle vérification
  const refreshAdminStatus = useCallback(() => {
    if (user) {
      adminCache.delete(user.id);
      setLoading(true);
      checkAdminStatus();
    }
  }, [user, checkAdminStatus]);

  return { isAdmin, loading, error, refreshAdminStatus };
}