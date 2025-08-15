import { BaseLLMAdapter } from './BaseLLMAdapter';
import type { LLMConfig } from './interfaces';
import { GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT } from './constants';

export class GoogleVertexAIAdapter extends BaseLLMAdapter {
  constructor(apiKey: string, endpoint: string = GOOGLE_VERTEX_AI_DEFAULT_ENDPOINT) {
    super(apiKey, endpoint);
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  protected prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any> {
    return {
      instances: [{ content: prompt }],
      parameters: { ...config },
    };
  }

  protected parseResponse(data: any): string {
    return data.predictions[0].content;
  }

  protected getServiceName(): string {
    return 'Google Vertex AI';
  }

  async getAvailableModels(): Promise<string[]> {
    // In a real application, this would involve querying the Google Vertex AI API
    // to list available models for the configured project and region.
    // Example: return ['text-bison', 'gemini-pro'];
    return [];
  }
}