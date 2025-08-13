import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setError(null);
        const { data, error: rpcError } = await supabase.rpc('is_admin');
        
        if (rpcError) {
          console.error('Admin check error:', rpcError);
          setIsAdmin(false);
          setError('Erreur de vérification');
        } else {
          setIsAdmin(data || false);
        }
      } catch (error: any) {
        console.error('Erreur lors de la vérification des droits admin:', error);
        setIsAdmin(false);
        setError(error.message || 'Erreur de vérification');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading, error };
}