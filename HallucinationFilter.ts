/**
 * HallucinationFilter Module
 * Detects LLM hallucinations such as fabricated citations, non-existent books, and incorrect numbers
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class HallucinationFilter extends BaseModule {
  public moduleId = 'HallucinationFilter';
  public description = 'Detects LLM hallucinations such as fabricated citations, non-existent books, and incorrect numbers';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and detect potential hallucinations
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for hallucination detection'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting hallucination detection');

    try {
      // Prepare the prompt for hallucination detection
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract hallucination detection results
      const { report, status, recommendedFixes } = this.parseHallucinationResults(completion);
      
      this.logger.info(this.moduleId, `Hallucination detection completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during hallucination detection', error);
      
      return this.createResult(
        'error',
        `Error during hallucination detection: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the hallucination detection', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for hallucination detection
   */
  protected getDefaultPrompt(): string {
    return `
You are a hallucination detection specialist tasked with identifying potential AI fabrications in content.
Analyze the provided content for:
1. Citations to non-existent or incorrectly referenced sources
2. References to fictional books, papers, or authors presented as real
3. Made-up statistics, dates, or numerical data
4. Fabricated quotes or statements attributed to real people
5. Invented historical events or scientific discoveries
6. Fictional organizations, institutions, or companies presented as real

For each identified potential hallucination:
- Quote the exact text
- Explain why it appears to be a hallucination
- Assign a confidence level (LOW, MEDIUM, HIGH)
- Suggest a correction or removal approach

Format your response as follows:
HALLUCINATION_SUMMARY: Brief overview of detected issues
DETAILED_FINDINGS: List of potential hallucinations with analysis
VERIFICATION_SUGGESTIONS: Approaches to verify suspicious content
RECOMMENDED_ACTIONS: Specific fixes for identified hallucinations
OVERALL_ASSESSMENT: Either "NO_HALLUCINATIONS_DETECTED", "MINOR_HALLUCINATIONS", or "SIGNIFICANT_HALLUCINATIONS"
    `;
  }

  /**
   * Prepare the prompt for hallucination detection based on input and options
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
   * Parse the hallucination detection results from the AI completion
   */
  private parseHallucinationResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(NO_HALLUCINATIONS_DETECTED|MINOR_HALLUCINATIONS|SIGNIFICANT_HALLUCINATIONS)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/RECOMMENDED_ACTIONS:(.*?)(?=OVERALL_ASSESSMENT:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('RECOMMENDED_ACTIONS:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'NO_HALLUCINATIONS_DETECTED':
        status = 'success';
        break;
      case 'MINOR_HALLUCINATIONS':
        status = 'warning';
        break;
      case 'SIGNIFICANT_HALLUCINATIONS':
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
