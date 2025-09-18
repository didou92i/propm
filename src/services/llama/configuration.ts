export class LlamaConfiguration {
  static configure(): void {
    console.log('Configuration de LlamaIndex...');
    
    try {
      // Configuration simplifiée sans dépendance LlamaIndex
      // Les embeddings et LLM sont gérés par Supabase
      
      console.log('Configuration LlamaIndex terminée');
    } catch (error) {
      console.error('Erreur lors de la configuration:', error);
      throw error;
    }
  }
}