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

  async getAvailableModels(): Promise<string[]> {
    // Hugging Face does not provide a direct API to list all available models
    // via a single endpoint. Model availability depends on the specific task
    // and whether the model is public or private.
    // For a real-world application, you might integrate with the Hugging Face Hub API
    // or maintain a curated list of models relevant to your use case.
    return ['gpt2', 'facebook/opt-125m', 'distilbert-base-uncased'];
  }
}