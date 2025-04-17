/**
 * Content Guardian Controller
 * Main controller for managing modules and workflows
 */

import { ContentGuardianModule, ContentInput, ModuleOptions, ModuleResult, ModuleStatus, WorkflowOptions, WorkflowResult } from '../interfaces/ModuleInterfaces';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ContentGuardianController {
  private modules: Map<string, ContentGuardianModule> = new Map();
  private logger: Logger = Logger.getInstance();

  /**
   * Register a module with the controller
   */
  public registerModule(module: ContentGuardianModule): void {
    if (this.modules.has(module.moduleId)) {
      this.logger.warning('ContentGuardianController', `Module with ID ${module.moduleId} already exists. Overwriting.`);
    }
    this.modules.set(module.moduleId, module);
    this.logger.info('ContentGuardianController', `Module ${module.moduleId} registered successfully`);
  }

  /**
   * Get a module by ID
   */
  public getModule(moduleId: string): ContentGuardianModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  public getAllModules(): ContentGuardianModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Run a single module
   */
  public async runModule(
    moduleId: string,
    input: ContentInput,
    options?: ModuleOptions
  ): Promise<ModuleResult> {
    const module = this.modules.get(moduleId);
    
    if (!module) {
      this.logger.error('ContentGuardianController', `Module ${moduleId} not found`);
      throw new Error(`Module ${moduleId} not found`);
    }

    this.logger.info('ContentGuardianController', `Running module ${moduleId}`);
    
    try {
      const result = await module.process(input, options);
      this.logger.info('ContentGuardianController', `Module ${moduleId} completed with status: ${result.status}`);
      return result;
    } catch (error) {
      this.logger.error('ContentGuardianController', `Error running module ${moduleId}`, error);
      
      return {
        moduleId,
        status: 'error',
        report: `Error running module: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          timestamp: new Date().toISOString(),
          promptUsed: options?.customPrompt || 'default',
          modelVersion: options?.model || 'default-model'
        }
      };
    }
  }

  /**
   * Run a workflow with multiple modules
   */
  public async runWorkflow(
    input: ContentInput,
    workflowOptions: WorkflowOptions
  ): Promise<WorkflowResult> {
    const workflowId = uuidv4();
    const startTime = new Date().toISOString();
    const results: ModuleResult[] = [];
    let overallStatus: ModuleStatus = 'success';

    this.logger.info('ContentGuardianController', `Starting workflow ${workflowId} with ${workflowOptions.modules.length} modules`);

    if (workflowOptions.sequential) {
      // Run modules sequentially
      for (const moduleId of workflowOptions.modules) {
        const moduleOptions = workflowOptions.options?.[moduleId];
        
        try {
          const result = await this.runModule(moduleId, input, moduleOptions);
          results.push(result);
          
          // Update overall status based on module result
          if (result.status === 'error') {
            overallStatus = 'error';
            if (workflowOptions.stopOnError) {
              this.logger.warning('ContentGuardianController', `Workflow stopped due to error in module ${moduleId}`);
              break;
            }
          } else if (result.status === 'warning' && overallStatus !== 'error') {
            overallStatus = 'warning';
          }
        } catch (error) {
          this.logger.error('ContentGuardianController', `Error in workflow for module ${moduleId}`, error);
          
          if (workflowOptions.stopOnError) {
            overallStatus = 'error';
            break;
          }
        }
      }
    } else {
      // Run modules in parallel
      const modulePromises = workflowOptions.modules.map(async (moduleId) => {
        const moduleOptions = workflowOptions.options?.[moduleId];
        
        try {
          return await this.runModule(moduleId, input, moduleOptions);
        } catch (error) {
          this.logger.error('ContentGuardianController', `Error in parallel workflow for module ${moduleId}`, error);
          throw error;
        }
      });

      try {
        const moduleResults = await Promise.all(modulePromises);
        results.push(...moduleResults);
        
        // Update overall status based on all module results
        if (results.some(result => result.status === 'error')) {
          overallStatus = 'error';
        } else if (results.some(result => result.status === 'warning')) {
          overallStatus = 'warning';
        }
      } catch (error) {
        this.logger.error('ContentGuardianController', 'Error in parallel workflow execution', error);
        overallStatus = 'error';
      }
    }

    // Generate workflow summary
    const summary = this.generateWorkflowSummary(results);

    const workflowResult: WorkflowResult = {
      workflowId,
      timestamp: startTime,
      status: overallStatus,
      results,
      summary
    };

    this.logger.info('ContentGuardianController', `Workflow ${workflowId} completed with status: ${overallStatus}`);
    return workflowResult;
  }

  /**
   * Generate a summary of the workflow results
   */
  private generateWorkflowSummary(results: ModuleResult[]): string {
    const totalModules = results.length;
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    let summary = `Workflow Summary: ${totalModules} modules processed\n`;
    summary += `- Success: ${successCount}\n`;
    summary += `- Warning: ${warningCount}\n`;
    summary += `- Error: ${errorCount}\n\n`;
    
    if (warningCount > 0 || errorCount > 0) {
      summary += 'Issues found:\n';
      
      results.forEach(result => {
        if (result.status === 'warning' || result.status === 'error') {
          summary += `- [${result.status.toUpperCase()}] ${result.moduleId}: ${result.report.split('\n')[0]}\n`;
          
          if (result.recommendedFixes && result.recommendedFixes.length > 0) {
            summary += `  Recommended fixes: ${result.recommendedFixes.length}\n`;
          }
        }
      });
    }
    
    return summary;
  }
}
