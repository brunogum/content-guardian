/**
 * AI Service for interacting with LLM APIs
 * Provides a unified interface for making requests to different AI models
 */

import { Logger } from './logger';
import { ModuleOptions } from '../interfaces/ModuleInterfaces';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AIServiceOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export class AIService {
  private static instance: AIService;
  private logger: Logger = Logger.getInstance();
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate a completion using the OpenAI API
   */
  public async generateCompletion(
    prompt: string,
    options: AIServiceOptions = {}
  ): Promise<string> {
    try {
      this.logger.info('AIService', `Generating completion with model: ${options.model || 'default'}`);
      
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      });

      const completion = response.choices[0]?.message?.content || '';
      this.logger.info('AIService', 'Completion generated successfully');
      
      return completion;
    } catch (error) {
      this.logger.error('AIService', 'Error generating completion', error);
      throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert module options to AI service options
   */
  public convertModuleOptionsToAIOptions(moduleOptions?: ModuleOptions): AIServiceOptions {
    return {
      model: moduleOptions?.model || 'gpt-4',
      maxTokens: moduleOptions?.maxTokens || 1000,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };
  }
}
