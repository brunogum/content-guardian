/**
 * FactCheckLayer Module
 * Validates facts, detects speculative/fabricated claims, and reports suspicious statements
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class FactCheckLayer extends BaseModule {
  public moduleId = 'FactCheckLayer';
  public description = 'Validates facts, detects speculative/fabricated claims, and reports suspicious statements with risk levels';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and validate facts
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for fact checking'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting fact checking process');

    try {
      // Prepare the prompt for fact checking
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract fact check results
      const { report, status, recommendedFixes } = this.parseFactCheckResults(completion);
      
      this.logger.info(this.moduleId, `Fact checking completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during fact checking', error);
      
      return this.createResult(
        'error',
        `Error during fact checking: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the fact checking process', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for fact checking
   */
  protected getDefaultPrompt(): string {
    return `
You are a fact-checking expert tasked with validating the factual accuracy of the provided content.
Analyze the text for:
1. Factual claims that can be verified
2. Speculative or fabricated statements presented as facts
3. Misleading statistics or data
4. Unsupported generalizations

For each identified issue:
- Quote the exact text
- Explain why it's problematic
- Assign a risk level (LOW, MEDIUM, HIGH)
- Suggest a correction or clarification if possible
- Provide a source for verification when available

Format your response as follows:
SUMMARY: Brief overview of the fact check results
ISSUES: List of identified issues with details
RECOMMENDATIONS: Suggested fixes or improvements
OVERALL_ASSESSMENT: Either "PASS", "PASS_WITH_WARNINGS", or "FAIL"
    `;
  }

  /**
   * Prepare the prompt for fact checking based on input and options
   */
  private preparePrompt(input: ContentInput, options?: ModuleOptions): string {
    const customPrompt = options?.customPrompt || this.getDefaultPrompt();
    
    return `
${customPrompt}

CONTENT TO ANALYZE:
Title: ${input.title || 'Untitled'}
Author: ${input.author || 'Unknown'}
Content Type: ${input.contentType || 'Unknown'}

${input.content}
    `;
  }

  /**
   * Parse the fact check results from the AI completion
   */
  private parseFactCheckResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(PASS|PASS_WITH_WARNINGS|FAIL)/i);
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
      case 'PASS':
        status = 'success';
        break;
      case 'PASS_WITH_WARNINGS':
        status = 'warning';
        break;
      case 'FAIL':
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
