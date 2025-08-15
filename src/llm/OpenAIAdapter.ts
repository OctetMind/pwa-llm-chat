import { BaseLLMAdapter } from './BaseLLMAdapter';
import type { LLMConfig } from './interfaces';
import { OPENAI_DEFAULT_ENDPOINT, OPENAI_DEFAULT_MODEL } from './constants';

export class OpenAIAdapter extends BaseLLMAdapter {
  constructor(apiKey: string, endpoint: string = OPENAI_DEFAULT_ENDPOINT) {
    super(apiKey, endpoint);
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  protected prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any> {
    return {
      model: config?.model || OPENAI_DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...config,
    };
  }

  protected parseResponse(data: any): string {
    return data.choices[0].message.content;
  }

  protected getServiceName(): string {
    return 'OpenAI';
  }
}