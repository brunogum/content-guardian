/**
 * Workflow Manager for the Content Guardian system
 * Provides predefined workflows and custom workflow creation
 */

import { ContentGuardianController } from './ContentGuardianController';
import { ContentInput, WorkflowOptions, WorkflowResult } from '../interfaces/ModuleInterfaces';
import { Logger } from '../utils/logger';

export class WorkflowManager {
  private controller: ContentGuardianController;
  private logger: Logger = Logger.getInstance();

  constructor(controller: ContentGuardianController) {
    this.controller = controller;
  }

  /**
   * Run a comprehensive analysis workflow that includes all modules
   */
  public async runComprehensiveAnalysis(input: ContentInput): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', 'Starting comprehensive analysis workflow');
    
    const workflowOptions: WorkflowOptions = {
      modules: [
        'FactCheckLayer',
        'EthicalGuardian',
        'ToneAndAudienceModulator',
        'PlotLogicBuilder',
        'SimulatedFeedbackReader',
        'HallucinationFilter',
        'WYSIWYGLayoutPreview',
        'ChapterImageGallery',
        'PromptTraceability',
        'SmartExportEngine'
      ],
      sequential: true,
      stopOnError: false
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }

  /**
   * Run a factual integrity workflow focused on fact-checking and hallucination detection
   */
  public async runFactualIntegrityWorkflow(input: ContentInput): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', 'Starting factual integrity workflow');
    
    const workflowOptions: WorkflowOptions = {
      modules: [
        'FactCheckLayer',
        'HallucinationFilter',
        'PromptTraceability'
      ],
      sequential: true,
      stopOnError: false
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }

  /**
   * Run an ethical review workflow focused on ethical considerations and tone
   */
  public async runEthicalReviewWorkflow(input: ContentInput): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', 'Starting ethical review workflow');
    
    const workflowOptions: WorkflowOptions = {
      modules: [
        'EthicalGuardian',
        'ToneAndAudienceModulator',
        'PromptTraceability'
      ],
      sequential: true,
      stopOnError: false
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }

  /**
   * Run a reader experience workflow focused on readability and structure
   */
  public async runReaderExperienceWorkflow(input: ContentInput): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', 'Starting reader experience workflow');
    
    const workflowOptions: WorkflowOptions = {
      modules: [
        'ToneAndAudienceModulator',
        'PlotLogicBuilder',
        'SimulatedFeedbackReader',
        'PromptTraceability'
      ],
      sequential: true,
      stopOnError: false
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }

  /**
   * Run a publication preparation workflow focused on layout and export
   */
  public async runPublicationPrepWorkflow(input: ContentInput): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', 'Starting publication preparation workflow');
    
    const workflowOptions: WorkflowOptions = {
      modules: [
        'WYSIWYGLayoutPreview',
        'ChapterImageGallery',
        'SmartExportEngine',
        'PromptTraceability'
      ],
      sequential: true,
      stopOnError: false
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }

  /**
   * Create a custom workflow with specified modules
   */
  public async runCustomWorkflow(
    input: ContentInput,
    modules: string[],
    sequential: boolean = true,
    stopOnError: boolean = false,
    moduleOptions: Record<string, any> = {}
  ): Promise<WorkflowResult> {
    this.logger.info('WorkflowManager', `Starting custom workflow with ${modules.length} modules`);
    
    const workflowOptions: WorkflowOptions = {
      modules,
      sequential,
      stopOnError,
      options: moduleOptions
    };
    
    return this.controller.runWorkflow(input, workflowOptions);
  }
}
