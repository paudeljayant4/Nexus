import { AIProviderAdapter, AIRequest, AIResponse, AIModel } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { buildRankingPrompt, RankingInput, RANKING_SYSTEM_PROMPT } from './prompts/ranking';
import { TaskRanking, TaskRankingSchema } from '@nexus/types';

export interface AIGatewayConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  apiKey: string;
  baseUrl?: string;
  defaultModel?: AIModel;
}

export class AIGateway {
  private provider: AIProviderAdapter;
  private defaultModel: AIModel;

  constructor(config: AIGatewayConfig) {
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider(config.apiKey, config.baseUrl);
        break;
      case 'google':
        this.provider = new GeminiProvider(config.apiKey, config.baseUrl);
        break;
      default:
        throw new Error(`Provider ${config.provider} not implemented yet`);
    }
    this.defaultModel = config.defaultModel ?? {
      provider: config.provider,
      model: config.provider === 'google' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
      temperature: 0.7,
    };
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model ?? this.defaultModel;
    return this.provider.generate({ ...request, model });
  }

  async embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }

  async rankTasks(input: RankingInput): Promise<TaskRanking[]> {
    const prompt = buildRankingPrompt(input);

    const response = await this.generate({
      prompt,
      systemPrompt: RANKING_SYSTEM_PROMPT,
      jsonMode: true,
      model: { ...this.defaultModel, temperature: 0.3 },
    });

    try {
      const parsed = JSON.parse(response.content);
      const rankings = Array.isArray(parsed) ? parsed : [];
      return rankings
        .map(r => TaskRankingSchema.parse(r))
        .sort((a, b) => a.rank - b.rank);
    } catch (error) {
      throw new Error('Invalid ranking response from AI');
    }
  }
}

let gatewayInstance: AIGateway | null = null;

export function createAIGateway(config: AIGatewayConfig): AIGateway {
  gatewayInstance = new AIGateway(config);
  return gatewayInstance;
}

export function getAIGateway(): AIGateway | null {
  return gatewayInstance;
}