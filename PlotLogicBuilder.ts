/**
 * PlotLogicBuilder Module
 * Creates a map of plot, logical connections, and argumentation nodes
 */

import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class PlotLogicBuilder extends BaseModule {
  public moduleId = 'PlotLogicBuilder';
  public description = 'Creates a map of plot, logical connections, and argumentation nodes';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and build plot/logic map
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for plot/logic analysis'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting plot and logic structure analysis');

    try {
      // Prepare the prompt for plot/logic analysis
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract plot/logic analysis results
      const { report, status, recommendedFixes } = this.parsePlotLogicResults(completion);
      
      this.logger.info(this.moduleId, `Plot and logic analysis completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during plot and logic analysis', error);
      
      return this.createResult(
        'error',
        `Error during plot and logic analysis: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the plot and logic analysis', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for plot/logic analysis
   */
  protected getDefaultPrompt(): string {
    return `
You are a structural editor specializing in narrative and argumentative flow analysis.
Analyze the provided content to create a detailed map of:
1. Main themes, arguments, or plot points
2. Logical connections between ideas or events
3. Argumentative structure and evidence chains
4. Narrative arcs or argument progression
5. Potential logical fallacies or plot holes
6. Structural balance and pacing

For narrative content, focus on:
- Plot structure and story arcs
- Character development and relationships
- Setting and world-building elements
- Conflict and resolution patterns
- Pacing and tension management

For argumentative/academic content, focus on:
- Thesis statements and main arguments
- Evidence presentation and quality
- Logical flow between concepts
- Counter-arguments and their handling
- Conclusion strength and implications

Format your response as follows:
STRUCTURE_MAP: Visual representation of content structure
KEY_ELEMENTS: List of main components (arguments, plot points, etc.)
CONNECTIONS: Identified relationships between elements
STRUCTURAL_ISSUES: Potential problems in logic or narrative flow
RECOMMENDATIONS: Suggestions for structural improvement
OVERALL_COHERENCE: Either "STRONG", "ADEQUATE", or "NEEDS_RESTRUCTURING"
    `;
  }

  /**
   * Prepare the prompt for plot/logic analysis based on input and options
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
   * Parse the plot/logic analysis results from the AI completion
   */
  private parsePlotLogicResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Extract overall coherence
    const overallCoherenceMatch = completion.match(/OVERALL_COHERENCE:\s*(STRONG|ADEQUATE|NEEDS_RESTRUCTURING)/i);
    const overallCoherence = overallCoherenceMatch ? overallCoherenceMatch[1].toUpperCase() : 'UNKNOWN';
    
    // Extract recommendations
    const recommendationsMatch = completion.match(/RECOMMENDATIONS:(.*?)(?=OVERALL_COHERENCE:|$)/is);
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
    
    // Convert recommendations to array
    const recommendedFixes = recommendationsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('RECOMMENDATIONS:'));
    
    // Determine status based on overall coherence
    let status: 'success' | 'warning' | 'error';
    switch (overallCoherence) {
      case 'STRONG':
        status = 'success';
        break;
      case 'ADEQUATE':
        status = 'warning';
        break;
      case 'NEEDS_RESTRUCTURING':
        status = 'error';
        break;
      default:
        status = 'warning'; // Default to warning if coherence is unclear
    }
    
    return {
      report: completion,
      status,
      recommendedFixes
    };
  }
}
