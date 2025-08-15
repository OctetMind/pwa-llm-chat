import { BaseLLMAdapter } from './BaseLLMAdapter';
import type { LLMConfig } from './interfaces';

export class HuggingFaceAdapter extends BaseLLMAdapter {
  constructor(apiKey: string, endpoint: string) {
    super(apiKey, endpoint);
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  protected prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any> {
    return {
      inputs: prompt,
      parameters: config,
    };
  }

  protected parseResponse(data: any): string {
    return data[0].generated_text;
  }

  protected getServiceName(): string {
    return 'Hugging Face';
  }
}