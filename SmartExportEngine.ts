/**
 * SmartExportEngine Module
 * Exports content to various formats (.pdf, .epub, .html, .md, .json) while preserving structure and style
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class SmartExportEngine extends BaseModule {
  public moduleId = 'SmartExportEngine';
  public description = 'Exports content to various formats (.pdf, .epub, .html, .md, .json) while preserving structure and style';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate export specifications
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for export specification generation'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting export specification generation');

    try {
      // Prepare the prompt for export specification generation
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract export specification results
      const { report, status, recommendedFixes } = this.parseExportResults(completion);
      
      this.logger.info(this.moduleId, `Export specification generation completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during export specification generation', error);
      
      return this.createResult(
        'error',
        `Error during export specification generation: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the export specification generation', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for export specification generation
   */
  protected getDefaultPrompt(): string {
    return `
You are a document format specialist tasked with preparing content for export to multiple formats.
Analyze the provided content and create detailed export specifications for:
1. PDF format
2. EPUB format
3. HTML format
4. Markdown format
5. JSON format

For each format, provide:
- Necessary structural transformations
- Format-specific metadata requirements
- Code snippets or templates for conversion
- Preservation strategies for complex elements (tables, images, etc.)
- Styling and formatting considerations
- Potential export issues and solutions

Consider the content type and structure when making recommendations.
Provide specific code examples, templates, or configuration snippets where appropriate.

Format your response as follows:
PDF_EXPORT: Detailed specifications for PDF export
EPUB_EXPORT: Detailed specifications for EPUB export
HTML_EXPORT: Detailed specifications for HTML export
MARKDOWN_EXPORT: Detailed specifications for Markdown export
JSON_EXPORT: Detailed specifications for JSON export
EXPORT_RECOMMENDATIONS: General suggestions for improving export quality
OVERALL_ASSESSMENT: Either "READY_FOR_EXPORT", "MINOR_ADJUSTMENTS_NEEDED", or "MAJOR_RESTRUCTURING_REQUIRED"
    `;
  }

  /**
   * Prepare the prompt for export specification generation based on input and options
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
   * Parse the export specification results from the AI completion
   */
  private parseExportResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(READY_FOR_EXPORT|MINOR_ADJUSTMENTS_NEEDED|MAJOR_RESTRUCTURING_REQUIRED)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/EXPORT_RECOMMENDATIONS:(.*?)(?=OVERALL_ASSESSMENT:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('EXPORT_RECOMMENDATIONS:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'READY_FOR_EXPORT':
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
