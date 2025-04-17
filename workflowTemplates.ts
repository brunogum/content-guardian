/**
 * Example workflow configurations for the Content Guardian system
 */

import { WorkflowOptions } from '../interfaces/ModuleInterfaces';

/**
 * Comprehensive analysis workflow that includes all modules
 */
export const comprehensiveWorkflow: WorkflowOptions = {
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

/**
 * Factual integrity workflow focused on fact-checking and hallucination detection
 */
export const factualIntegrityWorkflow: WorkflowOptions = {
  modules: [
    'FactCheckLayer',
    'HallucinationFilter',
    'PromptTraceability'
  ],
  sequential: true,
  stopOnError: false
};

/**
 * Ethical review workflow focused on ethical considerations and tone
 */
export const ethicalReviewWorkflow: WorkflowOptions = {
  modules: [
    'EthicalGuardian',
    'ToneAndAudienceModulator',
    'PromptTraceability'
  ],
  sequential: true,
  stopOnError: false
};

/**
 * Reader experience workflow focused on readability and structure
 */
export const readerExperienceWorkflow: WorkflowOptions = {
  modules: [
    'ToneAndAudienceModulator',
    'PlotLogicBuilder',
    'SimulatedFeedbackReader',
    'PromptTraceability'
  ],
  sequential: true,
  stopOnError: false
};

/**
 * Publication preparation workflow focused on layout and export
 */
export const publicationPrepWorkflow: WorkflowOptions = {
  modules: [
    'WYSIWYGLayoutPreview',
    'ChapterImageGallery',
    'SmartExportEngine',
    'PromptTraceability'
  ],
  sequential: true,
  stopOnError: false
};

/**
 * Create a custom workflow with specified modules
 */
export function createCustomWorkflow(
  modules: string[],
  sequential: boolean = true,
  stopOnError: boolean = false,
  moduleOptions: Record<string, any> = {}
): WorkflowOptions {
  return {
    modules,
    sequential,
    stopOnError,
    options: moduleOptions
  };
}
