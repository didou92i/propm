import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      }
    );

    // THEN check for existing session + validate refresh token health
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthState({
          session,
          user: session?.user ?? null,
          loading: false,
        });

        // Validate user to catch invalid refresh token and clean up
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError && (userError.status === 400 || (userError as any).code === 'refresh_token_not_found')) {
          await supabase.auth.signOut();
          setAuthState({ user: null, session: null, loading: false });
        }
      } catch (e) {
        await supabase.auth.signOut();
        setAuthState({ user: null, session: null, loading: false });
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}