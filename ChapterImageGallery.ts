/**
 * ChapterImageGallery Module
 * Assigns illustrated images to chapters based on content and uses text2image engine for visual enrichment
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class ChapterImageGallery extends BaseModule {
  public moduleId = 'ChapterImageGallery';
  public description = 'Assigns illustrated images to chapters based on content and uses text2image engine for visual enrichment';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate image suggestions for chapters
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for chapter image generation'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting chapter image gallery generation');

    try {
      // Prepare the prompt for chapter image generation
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract chapter image gallery results
      const { report, status, recommendedFixes } = this.parseChapterImageResults(completion);
      
      this.logger.info(this.moduleId, `Chapter image gallery generation completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during chapter image gallery generation', error);
      
      return this.createResult(
        'error',
        `Error during chapter image gallery generation: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the chapter image gallery generation', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for chapter image generation
   */
  protected getDefaultPrompt(): string {
    return `
You are a visual content specialist tasked with creating image prompts for text-to-image generation based on content chapters.
Analyze the provided content and:
1. Identify natural chapter or section breaks
2. For each chapter/section, create detailed image prompts that:
   - Capture the essence of the chapter/section
   - Represent key concepts, scenes, or ideas
   - Align with the overall tone and style
   - Would enhance reader understanding
3. Suggest image placement and sizing within the document
4. Recommend visual style consistency guidelines

For each chapter/section:
- Provide a brief summary of the content
- Create 1-3 detailed text-to-image prompts (150-200 words each)
- Suggest caption text for each image
- Recommend placement (beginning, within specific paragraphs, end)

Format your response as follows:
CONTENT_STRUCTURE: Brief overview of identified chapters/sections
CHAPTER_IMAGES: Detailed image prompts for each chapter/section
STYLE_GUIDELINES: Recommendations for visual consistency
IMAGE_METADATA: Suggested captions, alt text, and placement
OVERALL_ASSESSMENT: Either "READY_FOR_ILLUSTRATION", "PARTIAL_COVERAGE", or "NEEDS_RESTRUCTURING"
    `;
  }

  /**
   * Prepare the prompt for chapter image generation based on input and options
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
   * Parse the chapter image gallery results from the AI completion
   */
  private parseChapterImageResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(READY_FOR_ILLUSTRATION|PARTIAL_COVERAGE|NEEDS_RESTRUCTURING)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract style guidelines as recommendations
    const styleGuidelinesMatch = completion.match(/STYLE_GUIDELINES:(.*?)(?=IMAGE_METADATA:|OVERALL_ASSESSMENT:|$)/is);
    const styleGuidelinesText = styleGuidelinesMatch ? styleGuidelinesMatch[1].trim() : '';
    
    // Convert style guidelines to array of recommended fixes
    const recommendedFixes = styleGuidelinesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('STYLE_GUIDELINES:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'READY_FOR_ILLUSTRATION':
        status = 'success';
        break;
      case 'PARTIAL_COVERAGE':
        status = 'warning';
        break;
      case 'NEEDS_RESTRUCTURING':
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
