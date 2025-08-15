import { BaseLLMAdapter } from './BaseLLMAdapter';
import type { LLMConfig } from './interfaces';
import { ANTHROPIC_DEFAULT_ENDPOINT, ANTHROPIC_DEFAULT_MODEL, ANTHROPIC_API_VERSION } from './constants';

export class AnthropicAdapter extends BaseLLMAdapter {
  constructor(apiKey: string, endpoint: string = ANTHROPIC_DEFAULT_ENDPOINT) {
    super(apiKey, endpoint);
  }

  protected getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_API_VERSION,
    };
  }

  protected prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any> {
    return {
      model: config?.model || ANTHROPIC_DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config?.max_tokens || 1024, // Anthropic requires max_tokens
      ...config,
    };
  }

  protected parseResponse(data: any): string {
    return data.content[0].text;
  }

  protected getServiceName(): string {
    return 'Anthropic';
  }
}