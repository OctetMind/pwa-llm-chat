import type { LLMServiceConfig } from './interfaces';
import { GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT } from './constants';

const llmServiceConfigs: Record<string, LLMServiceConfig> = {
  openai: {
    serviceType: 'openai',
    displayName: 'OpenAI',
    requiresEndpoint: false,
  },
  huggingface: {
    serviceType: 'huggingface',
    displayName: 'Hugging Face',
    requiresEndpoint: true,
    endpointPlaceholder: 'e.g., https://api-inference.huggingface.co/models/gpt2',
  },
  'google-vertex-ai': {
    serviceType: 'google-vertex-ai',
    displayName: 'Google Vertex AI',
    requiresEndpoint: true,
    endpointPlaceholder: `e.g., ${GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT}`,
  },
  anthropic: {
    serviceType: 'anthropic',
    displayName: 'Anthropic',
    requiresEndpoint: false,
  },
};

export function getLLMServiceConfig(serviceType: string): LLMServiceConfig | undefined {
  return llmServiceConfigs[serviceType];
}

export function getAllLLMServiceTypes(): LLMServiceConfig[] {
  return Object.values(llmServiceConfigs);
}