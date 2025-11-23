/**
 * Ollama API Client
 *
 * Provides interface to interact with Ollama LLM for generating structured event data
 */

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaCompletionRequest {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  stream?: boolean;
  format?: 'json';
}

interface OllamaCompletionResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaClient {
  private endpoint: string;
  private model: string;

  constructor(endpoint: string = 'http://localhost:11434', model: string = 'llama3') {
    this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.model = model;
  }

  /**
   * Create a chat completion with Ollama
   */
  async createChatCompletion(
    messages: OllamaMessage[],
    options?: {
      temperature?: number;
      model?: string;
    }
  ): Promise<{ content: string }> {
    const request: OllamaCompletionRequest = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.3,
      stream: false,
      format: 'json',
    };

    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data: OllamaCompletionResponse = await response.json();

      if (!data.message?.content) {
        throw new Error('Invalid response from Ollama: missing message content');
      }

      return { content: data.message.content };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to call Ollama API: ${error.message}`);
      }
      throw new Error('Failed to call Ollama API: Unknown error');
    }
  }

  /**
   * Test connection to Ollama server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models from Ollama');
      }

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }
}

/**
 * Create an Ollama client instance from environment variables
 */
export function createOllamaClient(): OllamaClient {
  const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  return new OllamaClient(endpoint, model);
}
