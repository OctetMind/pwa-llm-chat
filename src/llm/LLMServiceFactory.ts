import type { LLMServiceConfig, LLMAdapter } from './interfaces';
import { GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT } from './constants';
import { OpenAIAdapter } from './OpenAIAdapter';
import { HuggingFaceAdapter } from './HuggingFaceAdapter';
import { GoogleVertexAIAdapter } from './GoogleVertexAIAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { RequestyAIAdapter } from './RequestyAIAdapter';

const llmServiceConfigs: Record<string, LLMServiceConfig> = {
  openai: {
    serviceType: 'openai',
    displayName: 'OpenAI',
    requiresEndpoint: false,
    requiresApiKeyForModels: true, // OpenAI typically requires API key for model listing
  },
  huggingface: {
    serviceType: 'huggingface',
    displayName: 'Hugging Face',
    requiresEndpoint: true,
    requiresApiKeyForModels: false, // Hugging Face does not require API key for model listing
    endpointPlaceholder: 'e.g., https://api-inference.huggingface.co/models/gpt2',
  },
  'google-vertex-ai': {
    serviceType: 'google-vertex-ai',
    displayName: 'Google Vertex AI',
    requiresEndpoint: true,
    requiresApiKeyForModels: false, // Google Vertex AI does not require API key for model listing
    endpointPlaceholder: `e.g., ${GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT}`,
  },
  anthropic: {
    serviceType: 'anthropic',
    displayName: 'Anthropic',
    requiresEndpoint: false,
    requiresApiKeyForModels: true, // Anthropic typically requires API key for model listing
  },
  'requesty-ai': {
    serviceType: 'requesty-ai',
    displayName: 'Requesty.ai',
    requiresEndpoint: false,
    requiresApiKeyForModels: false, // Requesty.ai does not require API key for model listing
    requiresModel: true,
    modelPlaceholder: 'e.g., requesty-model-v1',
  },
};

export function getLLMServiceConfig(serviceType: string): LLMServiceConfig | undefined {
  return llmServiceConfigs[serviceType];
}

export function createLLMAdapter(serviceType: string, apiKey: string, endpoint: string): LLMAdapter | undefined {
  const serviceConfig = llmServiceConfigs[serviceType.toLowerCase()];
  if (!serviceConfig) {
    return undefined;
  }

  const adapterApiKey = serviceConfig.requiresApiKeyForModels ? apiKey : '';

  switch (serviceType.toLowerCase()) {
    case 'openai':
      return new OpenAIAdapter(adapterApiKey);
    case 'huggingface':
      if (!endpoint) return undefined;
      return new HuggingFaceAdapter(adapterApiKey, endpoint);
    case 'google-vertex-ai':
      if (!endpoint) return undefined;
      return new GoogleVertexAIAdapter(adapterApiKey, endpoint);
    case 'anthropic':
      return new AnthropicAdapter(adapterApiKey);
    case 'requesty-ai':
      return new RequestyAIAdapter(adapterApiKey);
    default:
      return undefined;
  }
}

export function getAllLLMServiceTypes(): LLMServiceConfig[] {
  return Object.values(llmServiceConfigs);
}