/**
 * Base module implementation for the Content Guardian system
 * Provides common functionality for all modules
 */

import { ContentGuardianModule, ContentInput, ModuleMetadata, ModuleOptions, ModuleResult, ModuleStatus } from '../interfaces/ModuleInterfaces';
import { Logger } from '../utils/logger';

export abstract class BaseModule implements ContentGuardianModule {
  public abstract moduleId: string;
  public abstract description: string;
  protected logger: Logger = Logger.getInstance();
  
  /**
   * Process the content input and return module result
   * This method must be implemented by each module
   */
  public abstract process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult>;
  
  /**
   * Create module metadata with current timestamp and provided options
   */
  protected createMetadata(options?: ModuleOptions): ModuleMetadata {
    return {
      timestamp: new Date().toISOString(),
      promptUsed: options?.customPrompt || this.getDefaultPrompt(),
      modelVersion: options?.model || 'default-model'
    };
  }
  
  /**
   * Get the default prompt for this module
   * This method should be overridden by each module
   */
  protected abstract getDefaultPrompt(): string;
  
  /**
   * Create a module result with the provided status, report, and optional fixes
   */
  protected createResult(
    status: ModuleStatus,
    report: string,
    recommendedFixes?: string[],
    metadata?: ModuleMetadata
  ): ModuleResult {
    const result: ModuleResult = {
      moduleId: this.moduleId,
      status,
      report,
      metadata: metadata || this.createMetadata()
    };
    
    if (recommendedFixes && recommendedFixes.length > 0) {
      result.recommendedFixes = recommendedFixes;
    }
    
    this.logger.info(this.moduleId, `Module processing completed with status: ${status}`);
    return result;
  }
  
  /**
   * Validate the content input
   * Returns true if valid, false otherwise
   */
  protected validateInput(input: ContentInput): boolean {
    if (!input || !input.content || input.content.trim() === '') {
      this.logger.error(this.moduleId, 'Invalid input: content is required');
      return false;
    }
    return true;
  }
}
