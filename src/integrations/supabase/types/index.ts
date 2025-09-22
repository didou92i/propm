/**
 * Point d'entrée principal pour tous les types Supabase
 * Garantit la rétro-compatibilité totale avec l'ancien fichier types.ts
 */

// Export du type Database principal (OBLIGATOIRE pour la compatibilité)
export type { Database } from './database'
export type { Json } from './base'

// Export des types utilitaires (compatibilité exacte avec l'ancien système)
export type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes
} from './utilities/tables'

// Export des constantes (compatibilité exacte)
export { Constants } from './enums'

// Export des domaines pour un accès modulaire (nouveauté)
export type * from './domains/audit'
export type * from './domains/chat'
export type * from './domains/documents'
export type * from './domains/jobs'
export type * from './domains/training'
export type * from './domains/profiles'

// Export des fonctions
export type * from './functions'

// Export des helpers avancés (nouveauté)
export type * from './utilities/helpers'

// Export des énumérations et type guards
export * from './enums'

// Aliases pour la rétro-compatibilité
export type {
  DatabaseWithoutInternals,
  DefaultSchema
} from './base'

/**
 * GARANTIE DE RÉTRO-COMPATIBILITÉ
 * 
 * Tous les imports existants continuent de fonctionner exactement comme avant :
 * 
 * import type { Database } from '@/integrations/supabase/types'
 * import type { Tables } from '@/integrations/supabase/types'
 * import type { TablesInsert } from '@/integrations/supabase/types'
 * import type { Json } from '@/integrations/supabase/types'
 * import { Constants } from '@/integrations/supabase/types'
 * 
 * Nouveaux imports possibles pour un code plus organisé :
 * 
 * import type { ConversationsTable } from '@/integrations/supabase/types'
 * import type { JobSearchResult } from '@/integrations/supabase/types'
 * import type { CreatePayload } from '@/integrations/supabase/types'
 * import { isAppRole } from '@/integrations/supabase/types'
 */