export interface LLMAdapter {
  generate(prompt: string, config?: LLMConfig): Promise<string>;
  getAvailableModels(): Promise<string[]>;
}

export interface LLMConfig {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  // Add other common LLM parameters here
  [key: string]: any; // Allow for additional, service-specific parameters
}

export interface LLMServiceConfig {
  serviceType: string;
  displayName: string;
  requiresEndpoint: boolean;
  endpointPlaceholder?: string;
  requiresModel?: boolean;
  modelPlaceholder?: string;
  requiresApiKeyForModels?: boolean; // New property
}