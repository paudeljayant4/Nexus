import { AIProviderAdapter, AIRequest, AIResponse } from '../types';

export class GeminiProvider implements AIProviderAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://generativelanguage.googleapis.com/v1beta') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model?.model ?? 'gemini-1.5-flash';
    const temperature = request.model?.temperature ?? 0.7;
    const maxTokens = request.model?.maxTokens;

    const contents = [
      { role: 'user', parts: [{ text: request.prompt }] },
    ];

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
        ...(request.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = { parts: [{ text: request.systemPrompt }] };
    }

    const response = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      content,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      } : undefined,
      model,
    };
  }

  async embed(text: string): Promise<number[]> {
    const model = 'text-embedding-004';
    const response = await fetch(
      `${this.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini embeddings error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.embedding?.values ?? [];
  }
}