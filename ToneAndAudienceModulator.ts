/**
 * ToneAndAudienceModulator Module
 * Analyzes target audience and language level, suggests stylistic changes for consistent tone
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class ToneAndAudienceModulator extends BaseModule {
  public moduleId = 'ToneAndAudienceModulator';
  public description = 'Analyzes target audience and language level, suggests stylistic changes for consistent tone';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and analyze tone and audience fit
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for tone and audience analysis'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting tone and audience analysis');

    try {
      // Prepare the prompt for tone and audience analysis
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract tone and audience analysis results
      const { report, status, recommendedFixes } = this.parseToneAnalysisResults(completion);
      
      this.logger.info(this.moduleId, `Tone and audience analysis completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during tone and audience analysis', error);
      
      return this.createResult(
        'error',
        `Error during tone and audience analysis: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the tone and audience analysis', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for tone and audience analysis
   */
  protected getDefaultPrompt(): string {
    return `
You are a professional editor specializing in tone analysis and audience targeting.
Analyze the provided content for:
1. Current tone and voice (formal, casual, academic, conversational, etc.)
2. Language complexity and readability level (grade level, technical density)
3. Consistency of tone throughout the document
4. Appropriateness for the stated target audience
5. Vocabulary and terminology usage
6. Sentence structure and paragraph flow

Provide detailed analysis including:
- Assessment of current tone and style
- Identification of inconsistencies or shifts in tone
- Evaluation of audience appropriateness
- Specific examples of text that could be improved
- Suggested revisions with examples

Format your response as follows:
TONE_ANALYSIS: Detailed assessment of current tone
AUDIENCE_FIT: Evaluation of appropriateness for target audience
READABILITY_METRICS: Estimated reading level and complexity
CONSISTENCY_ISSUES: Identified tone shifts or inconsistencies
RECOMMENDATIONS: Specific suggestions for improvement
OVERALL_ASSESSMENT: Either "WELL_ALIGNED", "MINOR_ADJUSTMENTS_NEEDED", or "MAJOR_REVISION_REQUIRED"
    `;
  }

  /**
   * Prepare the prompt for tone and audience analysis based on input and options
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
   * Parse the tone and audience analysis results from the AI completion
   */
  private parseToneAnalysisResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(WELL_ALIGNED|MINOR_ADJUSTMENTS_NEEDED|MAJOR_REVISION_REQUIRED)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/RECOMMENDATIONS:(.*?)(?=OVERALL_ASSESSMENT:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('RECOMMENDATIONS:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'WELL_ALIGNED':
        status = 'success';
        break;
      case 'MINOR_ADJUSTMENTS_NEEDED':
        status = 'warning';
        break;
      case 'MAJOR_REVISION_REQUIRED':
        status = 'error';
        break;
      default:
        status = 'warning'; // Default to warning if assessment is unclear
    }
    
    return {
      report: completion,
      status,
      recommendedFixes
    };
  }
}
