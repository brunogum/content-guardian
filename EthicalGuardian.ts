/**
 * EthicalGuardian Module
 * Detects subconscious stereotypes, discriminatory phrases, and ethically questionable language
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class EthicalGuardian extends BaseModule {
  public moduleId = 'EthicalGuardian';
  public description = 'Detects subconscious stereotypes, discriminatory phrases, and ethically questionable language';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and evaluate ethical considerations
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for ethical evaluation'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting ethical evaluation process');

    try {
      // Prepare the prompt for ethical evaluation
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract ethical evaluation results
      const { report, status, recommendedFixes } = this.parseEthicalEvaluationResults(completion);
      
      this.logger.info(this.moduleId, `Ethical evaluation completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during ethical evaluation', error);
      
      return this.createResult(
        'error',
        `Error during ethical evaluation: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the ethical evaluation process', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for ethical evaluation
   */
  protected getDefaultPrompt(): string {
    return `
You are an ethical content reviewer tasked with identifying potentially problematic language, stereotypes, and biases in the provided content.
Analyze the text for:
1. Explicit or implicit stereotypes based on gender, race, ethnicity, religion, age, disability, etc.
2. Discriminatory language or microaggressions
3. Cultural appropriation or insensitivity
4. Exclusionary terminology or framing
5. Problematic assumptions about readers or subjects
6. Ethically questionable perspectives or implications

For each identified issue:
- Quote the exact text
- Explain why it's problematic
- Suggest more inclusive or balanced alternatives
- Consider the context and intent before flagging

Format your response as follows:
SUMMARY: Brief overview of the ethical evaluation
ISSUES: List of identified issues with details
RECOMMENDATIONS: Suggested fixes or improvements
TONE_ASSESSMENT: Evaluation of overall tone and inclusivity
OVERALL_RATING: Either "ACCEPTABLE", "NEEDS_REVISION", or "PROBLEMATIC"
    `;
  }

  /**
   * Prepare the prompt for ethical evaluation based on input and options
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
   * Parse the ethical evaluation results from the AI completion
   */
  private parseEthicalEvaluationResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall rating
    const overallRatingMatch = completion.match(/OVERALL_RATING:\s*(ACCEPTABLE|NEEDS_REVISION|PROBLEMATIC)/i);
    const overallRating = overallRatingMatch ? overallRatingMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/RECOMMENDATIONS:(.*?)(?=TONE_ASSESSMENT:|OVERALL_RATING:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('RECOMMENDATIONS:'));
    
    // Determine status based on overall rating
    let status: 'success' | 'warning' | 'error';
    switch (overallRating) {
      case 'ACCEPTABLE':
        status = 'success';
        break;
      case 'NEEDS_REVISION':
        status = 'warning';
        break;
      case 'PROBLEMATIC':
        status = 'error';
        break;
      default:
        status = 'warning'; // Default to warning if rating is unclear
    }
    
    return {
      report: completion,
      status,
      recommendedFixes
    };
  }
}
