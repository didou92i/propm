/**
 * Service d'authentification pour les Edge Functions
 */

import { getErrorMessage } from './errorHelpers.ts';

export interface AuthResult {
  user: any;
  error?: string;
}

export class AuthService {
  static async authenticateUser(supabaseAdmin: any, authHeader: string | null): Promise<AuthResult> {
    if (!authHeader) {
      return { user: null, error: 'Authorization header required' };
    }

    try {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (authError || !user) {
        return { user: null, error: 'User not authenticated' };
      }

      return { user };
    } catch (error) {
      return { user: null, error: `Authentication failed: ${getErrorMessage(error)}` };
    }
  }

  static validateApiKey(apiKey: string | undefined, keyName: string): void {
    if (!apiKey) {
      throw new Error(`${keyName} not configured`);
    }
  }
}