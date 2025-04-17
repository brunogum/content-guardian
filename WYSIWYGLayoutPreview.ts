/**
 * WYSIWYGLayoutPreview Module
 * Generates preview layouts for different formats (.pdf, .epub, .html, .md)
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class WYSIWYGLayoutPreview extends BaseModule {
  public moduleId = 'WYSIWYGLayoutPreview';
  public description = 'Generates preview layouts for different formats (.pdf, .epub, .html, .md)';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate layout previews
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for layout preview generation'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting layout preview generation');

    try {
      // Prepare the prompt for layout preview generation
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract layout preview results
      const { report, status, recommendedFixes } = this.parseLayoutPreviewResults(completion);
      
      this.logger.info(this.moduleId, `Layout preview generation completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during layout preview generation', error);
      
      return this.createResult(
        'error',
        `Error during layout preview generation: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the layout preview generation', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for layout preview generation
   */
  protected getDefaultPrompt(): string {
    return `
You are a layout and formatting specialist tasked with generating preview layouts for different publication formats.
Analyze the provided content and create layout specifications for:
1. PDF format
2. EPUB format
3. HTML format
4. Markdown format

For each format, provide:
- Recommended structure and organization
- Heading hierarchy and formatting
- Paragraph styling and spacing
- Table and image placement recommendations
- Typography suggestions (font families, sizes, weights)
- Page/screen layout considerations
- Navigation elements and cross-references

Consider the content type and target audience when making recommendations.
Provide specific CSS or styling code snippets where appropriate.

Format your response as follows:
PDF_LAYOUT: Detailed specifications for PDF format
EPUB_LAYOUT: Detailed specifications for EPUB format
HTML_LAYOUT: Detailed specifications for HTML format including CSS
MARKDOWN_LAYOUT: Detailed specifications for Markdown format
LAYOUT_RECOMMENDATIONS: General suggestions for improving visual presentation
OVERALL_ASSESSMENT: Either "READY_FOR_FORMATTING", "MINOR_ADJUSTMENTS_NEEDED", or "MAJOR_RESTRUCTURING_REQUIRED"
    `;
  }

  /**
   * Prepare the prompt for layout preview generation based on input and options
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
   * Parse the layout preview results from the AI completion
   */
  private parseLayoutPreviewResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(READY_FOR_FORMATTING|MINOR_ADJUSTMENTS_NEEDED|MAJOR_RESTRUCTURING_REQUIRED)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/LAYOUT_RECOMMENDATIONS:(.*?)(?=OVERALL_ASSESSMENT:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('LAYOUT_RECOMMENDATIONS:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'READY_FOR_FORMATTING':
        status = 'success';
        break;
      case 'MINOR_ADJUSTMENTS_NEEDED':
        status = 'warning';
        break;
      case 'MAJOR_RESTRUCTURING_REQUIRED':
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
