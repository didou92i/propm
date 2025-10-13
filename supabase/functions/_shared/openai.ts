export function createOpenAIClient(apiKey: string) {
  return {
    apiKey,
    baseURL: 'https://api.openai.com/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
}

export const DEFAULT_MODEL = 'gpt-5-2025-08-07'; // GPT-5 pour qualité maximale
export const MINI_MODEL = 'gpt-5-mini-2025-08-07'; // Pour tâches ultra-simples
export const POLLING_CONFIG = {
  initialInterval: 50,
  maxInterval: 400,
  backoffMultiplier: 1.15
};