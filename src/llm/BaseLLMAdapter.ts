import type { LLMAdapter, LLMConfig } from './interfaces';
import { LLM_DEFAULT_TIMEOUT } from './constants';

export abstract class BaseLLMAdapter implements LLMAdapter {
  protected apiKey: string;
  protected endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  protected abstract prepareRequestBody(prompt: string, config?: LLMConfig): Record<string, any>;
  protected abstract parseResponse(data: any): string;
  protected abstract getHeaders(): Record<string, string>;
  protected abstract getServiceName(): string;
  public abstract getAvailableModels(): Promise<string[]>;

  async generate(prompt: string, config?: LLMConfig): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_DEFAULT_TIMEOUT);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        body: JSON.stringify(this.prepareRequestBody(prompt, config)),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        let errorData = null;
        try {
          errorData = await response.json();
          errorDetail = errorData.error?.message || JSON.stringify(errorData);
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorDetail = response.statusText;
        }
        console.error(`Error response from ${this.getServiceName()} API:`, errorData || response.statusText);
        throw new Error(`${this.getServiceName()} API error: ${errorDetail}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`${this.getServiceName()} API request timed out:`, error);
        throw new Error(`${this.getServiceName()} API request timed out.`);
      }
      console.error(`Error generating text with ${this.getServiceName()}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}