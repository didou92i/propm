/**
 * Service de validation d'authentification unifié
 */

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  userId?: string;
}

export interface AuthConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  checkRateLimit?: boolean;
}

export class AuthValidationService {
  private supabaseAdmin: any;

  constructor(supabaseAdmin: any) {
    this.supabaseAdmin = supabaseAdmin;
  }

  /**
   * Valider l'authentification d'un utilisateur
   */
  async validateAuth(
    authHeader: string | null,
    config: AuthConfig = { requireAuth: true }
  ): Promise<AuthResult> {
    if (!config.requireAuth) {
      return { success: true };
    }

    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header manquant'
      };
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await this.supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Authentification échouée',
          details: authError?.message || 'Utilisateur non trouvé'
        };
      }

      // Vérifier les rôles si spécifiés
      if (config.allowedRoles && config.allowedRoles.length > 0) {
        const hasValidRole = await this.checkUserRoles(user.id, config.allowedRoles);
        if (!hasValidRole) {
          return {
            success: false,
            error: 'Rôle insuffisant pour cette opération'
          };
        }
      }

      // Vérifier le rate limiting si activé
      if (config.checkRateLimit) {
        const rateLimitOk = await this.checkRateLimit(user.id);
        if (!rateLimitOk) {
          return {
            success: false,
            error: 'Limite de taux dépassée, veuillez patienter'
          };
        }
      }

      return {
        success: true,
        user,
        userId: user.id
      };
    } catch (error) {
      console.error('Auth validation error:', error);
      return {
        success: false,
        error: 'Erreur de validation d\'authentification',
        details: error.message
      };
    }
  }

  /**
   * Créer un client Supabase authentifié pour l'utilisateur
   */
  createUserClient(authHeader: string): any {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
  }

  /**
   * Vérifier les rôles d'un utilisateur
   */
  private async checkUserRoles(userId: string, allowedRoles: string[]): Promise<boolean> {
    try {
      const { data: userRoles } = await this.supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (!userRoles || userRoles.length === 0) {
        return false;
      }

      const userRoleNames = userRoles.map(r => r.role);
      return allowedRoles.some(role => userRoleNames.includes(role));
    } catch (error) {
      console.error('Error checking user roles:', error);
      return false;
    }
  }

  /**
   * Vérifier le rate limiting (basique)
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    try {
      // Vérifier le nombre de requêtes dans les 5 dernières minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await this.supabaseAdmin
        .from('api_usage_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', fiveMinutesAgo);

      // Limite de 100 requêtes par 5 minutes
      return (count || 0) < 100;
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      // En cas d'erreur, permettre la requête
      return true;
    }
  }

  /**
   * Logger l'usage de l'API
   */
  async logApiUsage(
    userId: string, 
    functionName: string, 
    requestData?: any,
    responseTime?: number
  ): Promise<void> {
    try {
      await this.supabaseAdmin
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          function_name: functionName,
          request_data: requestData ? JSON.stringify(requestData) : null,
          response_time: responseTime,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log API usage:', error);
      // Ne pas faire échouer la requête pour un problème de logging
    }
  }

  /**
   * Valider les paramètres de requête
   */
  static validateRequestParams(
    requestData: any,
    requiredParams: string[],
    optionalParams: string[] = []
  ): { isValid: boolean; error?: string; cleanedData?: any } {
    if (!requestData || typeof requestData !== 'object') {
      return {
        isValid: false,
        error: 'Données de requête invalides'
      };
    }

    // Vérifier les paramètres requis
    const missingParams = requiredParams.filter(param => 
      requestData[param] === undefined || requestData[param] === null
    );

    if (missingParams.length > 0) {
      return {
        isValid: false,
        error: `Paramètres manquants: ${missingParams.join(', ')}`
      };
    }

    // Créer un objet avec seulement les paramètres autorisés
    const allowedParams = [...requiredParams, ...optionalParams];
    const cleanedData: any = {};
    
    for (const param of allowedParams) {
      if (requestData[param] !== undefined) {
        cleanedData[param] = requestData[param];
      }
    }

    return {
      isValid: true,
      cleanedData
    };
  }

  /**
   * Valider les clés API nécessaires
   */
  static validateRequiredApiKeys(keys: string[]): { isValid: boolean; missingKeys: string[] } {
    const missingKeys = keys.filter(key => !Deno.env.get(key));
    
    return {
      isValid: missingKeys.length === 0,
      missingKeys
    };
  }
}

// Utilisation avec import dynamique pour éviter les dépendances circulaires
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';