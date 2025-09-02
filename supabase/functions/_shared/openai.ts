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

export const DEFAULT_MODEL = 'gpt-4o';
export const POLLING_CONFIG = {
  initialInterval: 50,
  maxInterval: 400,
  backoffMultiplier: 1.15
};