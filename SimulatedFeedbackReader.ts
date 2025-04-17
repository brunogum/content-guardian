/**
 * SimulatedFeedbackReader Module
 * Generates questions that a typical reader might ask and identifies confusing or insufficiently explained sections
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class SimulatedFeedbackReader extends BaseModule {
  public moduleId = 'SimulatedFeedbackReader';
  public description = 'Generates questions that a typical reader might ask and identifies confusing or insufficiently explained sections';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate simulated reader feedback
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for reader feedback simulation'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting simulated reader feedback generation');

    try {
      // Prepare the prompt for simulated reader feedback
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract simulated reader feedback results
      const { report, status, recommendedFixes } = this.parseSimulatedFeedbackResults(completion);
      
      this.logger.info(this.moduleId, `Simulated reader feedback completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during simulated reader feedback generation', error);
      
      return this.createResult(
        'error',
        `Error during simulated reader feedback generation: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the simulated reader feedback generation', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for simulated reader feedback
   */
  protected getDefaultPrompt(): string {
    return `
You are simulating a diverse group of readers encountering this content for the first time.
Your task is to identify areas that might confuse readers or prompt questions.

Analyze the content from multiple reader perspectives and identify:
1. Confusing passages or unclear explanations
2. Jargon or terminology that isn't adequately defined
3. Logical leaps that might lose readers
4. Concepts that need more background or context
5. Sections that feel rushed or overly condensed
6. Claims that readers might question or challenge

For each identified issue:
- Quote the specific text
- Explain why it might confuse readers
- Formulate 1-3 questions a typical reader might ask
- Suggest how the content could be improved for clarity

Consider different reader backgrounds (novice to expert) in your analysis.

Format your response as follows:
READER_PERSONAS: Brief description of the simulated reader types
CONFUSION_POINTS: Identified areas of potential confusion
READER_QUESTIONS: Likely questions readers would ask
CLARITY_RECOMMENDATIONS: Suggestions for improving reader comprehension
OVERALL_CLARITY: Either "CLEAR", "SOMEWHAT_CLEAR", or "NEEDS_CLARIFICATION"
    `;
  }

  /**
   * Prepare the prompt for simulated reader feedback based on input and options
   */
  private preparePrompt(input: ContentInput, options?: ModuleOptions): string {
    const customPrompt = options?.customPrompt || this.getDefaultPrompt();
    
    return `
${customPrompt}

CONTENT TO ANALYZE:
Title: ${input.title || 'Untitled'}
Author: ${input.author || 'Unknown'}
Content Type: ${input.contentType || 'Unknown'}
Target Audience: ${input.targetAudience || 'General'}

${input.content}
    `;
  }

  /**
   * Parse the simulated reader feedback results from the AI completion
   */
  private parseSimulatedFeedbackResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall clarity
    const overallClarityMatch = completion.match(/OVERALL_CLARITY:\s*(CLEAR|SOMEWHAT_CLEAR|NEEDS_CLARIFICATION)/i);
    const overallClarity = overallClarityMatch ? overallClarityMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/CLARITY_RECOMMENDATIONS:(.*?)(?=OVERALL_CLARITY:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('CLARITY_RECOMMENDATIONS:'));
    
    // Determine status based on overall clarity
    let status: 'success' | 'warning' | 'error';
    switch (overallClarity) {
      case 'CLEAR':
        status = 'success';
        break;
      case 'SOMEWHAT_CLEAR':
        status = 'warning';
        break;
      case 'NEEDS_CLARIFICATION':
        status = 'error';
        break;
      default:
        status = 'warning'; // Default to warning if clarity is unclear
    }
    
    return {
      report: completion,
      status,
      recommendedFixes
    };
  }
}
