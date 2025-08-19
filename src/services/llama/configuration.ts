import { Settings } from 'llamaindex';

export class LlamaConfiguration {
  static configure(): void {
    console.log('Configuration de LlamaIndex...');
    
    try {
      // Désactiver les embeddings côté client car ils seront gérés par Supabase
      Settings.embedModel = undefined;
      
      // Désactiver les appels LLM côté client
      Settings.llm = undefined;
      
      // Configuration des paramètres de chunk
      Settings.chunkSize = 1024;
      Settings.chunkOverlap = 20;
      
      console.log('Configuration LlamaIndex terminée');
    } catch (error) {
      console.error('Erreur lors de la configuration de LlamaIndex:', error);
      throw error;
    }
  }
}