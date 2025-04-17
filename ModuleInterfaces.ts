/**
 * Core interfaces for the Content Guardian system
 */

export type ModuleStatus = 'success' | 'warning' | 'error';

export interface ModuleMetadata {
  timestamp: string;
  promptUsed: string;
  modelVersion: string;
}

export interface ModuleResult {
  moduleId: string;
  status: ModuleStatus;
  report: string;
  recommendedFixes?: string[];
  metadata: ModuleMetadata;
}

export interface ContentInput {
  content: string;
  title?: string;
  author?: string;
  targetAudience?: string;
  contentType?: 'book' | 'article' | 'essay' | 'other';
  additionalContext?: Record<string, any>;
}

export interface ModuleOptions {
  verbose?: boolean;
  maxTokens?: number;
  model?: string;
  customPrompt?: string;
}

export interface ContentGuardianModule {
  moduleId: string;
  description: string;
  process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult>;
}

export interface WorkflowOptions {
  modules: string[];
  sequential?: boolean;
  stopOnError?: boolean;
  options?: Record<string, ModuleOptions>;
}

export interface WorkflowResult {
  workflowId: string;
  timestamp: string;
  status: ModuleStatus;
  results: ModuleResult[];
  summary: string;
}
