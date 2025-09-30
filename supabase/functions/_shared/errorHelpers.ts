/**
 * Helper utilities pour la gestion sécurisée des erreurs TypeScript
 */

/**
 * Type guard pour vérifier si une valeur est une instance d'Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extrait un message d'erreur sécurisé depuis n'importe quelle valeur
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Extrait une stack trace sécurisée depuis n'importe quelle valeur
 */
export function getErrorStack(error: unknown): string {
  if (isError(error)) {
    return error.stack || 'No stack trace available';
  }
  return 'No stack trace available';
}
