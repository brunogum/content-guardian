/**
 * PromptTraceability Module
 * Ensures each output contains metadata including prompt used, model, time, and ID for auditability
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';
import { v4 as uuidv4 } from 'uuid';

export class PromptTraceability extends BaseModule {
  public moduleId = 'PromptTraceability';
  public description = 'Ensures each output contains metadata including prompt used, model, time, and ID for auditability';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate traceability metadata
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for traceability analysis'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting prompt traceability analysis');

    try {
      // Prepare the prompt for traceability analysis
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract traceability analysis results
      const { report, status, recommendedFixes } = this.parseTraceabilityResults(completion);
      
      this.logger.info(this.moduleId, `Prompt traceability analysis completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during prompt traceability analysis', error);
      
      return this.createResult(
        'error',
        `Error during prompt traceability analysis: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the prompt traceability analysis', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for traceability analysis
   */
  protected getDefaultPrompt(): string {
    return `
You are a content auditing specialist tasked with analyzing AI-generated content for traceability.
Analyze the provided content and:
1. Identify potential AI-generated sections or elements
2. Assess whether the content contains sufficient metadata for traceability
3. Recommend metadata fields that should be included for full auditability
4. Suggest a structured format for embedding traceability information

Consider:
- Transparency requirements for AI-generated content
- Ethical considerations for content attribution
- Technical approaches for embedding metadata
- Compliance with potential regulatory requirements

Format your response as follows:
AI_DETECTION: Assessment of which parts appear to be AI-generated
METADATA_ASSESSMENT: Evaluation of existing metadata and traceability
RECOMMENDED_METADATA: Suggested metadata fields and format
IMPLEMENTATION_APPROACH: Technical suggestions for metadata embedding
OVERALL_ASSESSMENT: Either "FULLY_TRACEABLE", "PARTIALLY_TRACEABLE", or "NOT_TRACEABLE"
    `;
  }

  /**
   * Prepare the prompt for traceability analysis based on input and options
   */
  private preparePrompt(input: ContentInput, options?: ModuleOptions): string {
    const customPrompt = options?.customPrompt || this.getDefaultPrompt();
    
    // Generate a unique trace ID for this content
    const traceId = uuidv4();
    
    return `
${customPrompt}

CONTENT TO ANALYZE:
Title: ${input.title || 'Untitled'}
Author: ${input.author || 'Unknown'}
Content Type: ${input.contentType || 'Unknown'}
Trace ID: ${traceId}
Timestamp: ${new Date().toISOString()}
Model: ${options?.model || 'default-model'}

${input.content}
    `;
  }

  /**
   * Parse the traceability analysis results from the AI completion
   */
  private parseTraceabilityResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall assessment
    const overallAssessmentMatch = completion.match(/OVERALL_ASSESSMENT:\s*(FULLY_TRACEABLE|PARTIALLY_TRACEABLE|NOT_TRACEABLE)/i);
    const overallAssessment = overallAssessmentMatch ? overallAssessmentMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/RECOMMENDED_METADATA:(.*?)(?=IMPLEMENTATION_APPROACH:|OVERALL_ASSESSMENT:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('RECOMMENDED_METADATA:'));
    
    // Determine status based on overall assessment
    let status: 'success' | 'warning' | 'error';
    switch (overallAssessment) {
      case 'FULLY_TRACEABLE':
        status = 'success';
        break;
      case 'PARTIALLY_TRACEABLE':
        status = 'warning';
        break;
      case 'NOT_TRACEABLE':
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
