export interface LLMAdapter {
  generate(prompt: string, config?: Record<string, any>): Promise<string>;
}

export class OpenAIAdapter implements LLMAdapter {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string = 'https://api.openai.com/v1/chat/completions') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async generate(prompt: string, config?: Record<string, any>): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: config?.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          ...config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error.message}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw error;
    }
  }
}

export class HuggingFaceAdapter implements LLMAdapter {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async generate(prompt: string, config?: Record<string, any>): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Hugging Face API error: ${errorData.error.message}`);
      }

      const data = await response.json();
      return data[0].generated_text;
    } catch (error) {
      console.error('Error generating text with Hugging Face:', error);
      throw error;
    }
  }
}

// You can add more adapters here for other LLM services (e.g., Grok, Requesty.ai)
// export class GrokAdapter implements LLMAdapter { ... }