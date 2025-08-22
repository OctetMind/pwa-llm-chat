import { BaseLLMAdapter } from './BaseLLMAdapter';
import type { LLMConfig } from './interfaces';
import { REQUESTY_AI_CHAT_COMPLETIONS_ENDPOINT } from './constants';

export class RequestyAIAdapter extends BaseLLMAdapter {
  constructor(apiKey: string, endpoint: string = REQUESTY_AI_CHAT_COMPLETIONS_ENDPOINT) {
    super(apiKey, endpoint);
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  protected prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any> {
    if (!config?.model) {
      throw new Error('Requesty.ai requires a model to be specified in the config.');
    }
    return {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
    };
  }

  protected parseResponse(data: any): string {
    return data.choices[0].message.content;
  }

  protected getServiceName(): string {
    return 'Requesty.ai';
  }

  async getAvailableModels(): Promise<string[]> {
    const modelsEndpoint = `https://router.requesty.ai/v1/models`;
    const response = await fetch(modelsEndpoint, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.error?.message || JSON.stringify(errorData);
      } catch (jsonError) {
        errorDetail = response.statusText;
      }
      throw new Error(`Failed to fetch Requesty.ai models: ${errorDetail}`);
    }

    const data = await response.json();
    return data.data.map((model: any) => model.id);
  }
}