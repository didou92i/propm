/**
 * Énumérations et constantes Supabase
 * Centralise tous les types énumérés utilisés dans la base
 */

/** Rôles applicatifs disponibles */
export type AppRole = "admin" | "moderator" | "user"

/** Statuts des offres d'emploi */
export type JobPostStatus = "pending" | "approved" | "rejected"

/** Énumérations de la base de données */
export interface DatabaseEnums {
  app_role: AppRole
  job_post_status: JobPostStatus
}

/** Constantes pour un accès facile aux valeurs d'énumération */
export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"] as const,
      job_post_status: ["pending", "approved", "rejected"] as const,
    },
  },
} as const

/** Type guards pour vérifier les énumérations */
export const isAppRole = (value: string): value is AppRole => {
  return Constants.public.Enums.app_role.includes(value as AppRole)
}

export const isJobPostStatus = (value: string): value is JobPostStatus => {
  return Constants.public.Enums.job_post_status.includes(value as JobPostStatus)
}