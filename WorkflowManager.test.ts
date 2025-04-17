/**
 * Unit tests for the WorkflowManager
 */

import { WorkflowManager } from '../controllers/WorkflowManager';
import { ContentGuardianController } from '../controllers/ContentGuardianController';
import { sampleContent, createMockSuccessResult, createMockWarningResult } from './testUtils';

// Mock the ContentGuardianController
jest.mock('../controllers/ContentGuardianController');

describe('WorkflowManager', () => {
  let workflowManager: WorkflowManager;
  let mockController: jest.Mocked<ContentGuardianController>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock controller
    mockController = new ContentGuardianController() as jest.Mocked<ContentGuardianController>;
    
    // Initialize workflow manager
    workflowManager = new WorkflowManager(mockController);
  });
  
  test('should run comprehensive analysis workflow', async () => {
    // Mock the runWorkflow method
    mockController.runWorkflow = jest.fn().mockResolvedValue({
      workflowId: 'test-workflow-id',
      timestamp: new Date().toISOString(),
      status: 'success',
      results: [
        createMockSuccessResult('FactCheckLayer'),
        createMockSuccessResult('EthicalGuardian'),
        createMockSuccessResult('ToneAndAudienceModulator')
      ],
      summary: 'All modules completed successfully'
    });
    
    const result = await workflowManager.runComprehensiveAnalysis(sampleContent);
    
    expect(mockController.runWorkflow).toHaveBeenCalledWith(sampleContent, expect.objectContaining({
      modules: expect.arrayContaining([
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
      ]),
      sequential: true,
      stopOnError: false
    }));
    
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.results.length).toBe(3);
  });
  
  test('should run factual integrity workflow', async () => {
    // Mock the runWorkflow method
    mockController.runWorkflow = jest.fn().mockResolvedValue({
      workflowId: 'test-workflow-id',
      timestamp: new Date().toISOString(),
      status: 'warning',
      results: [
        createMockSuccessResult('FactCheckLayer'),
        createMockWarningResult('HallucinationFilter'),
        createMockSuccessResult('PromptTraceability')
      ],
      summary: 'Some modules completed with warnings'
    });
    
    const result = await workflowManager.runFactualIntegrityWorkflow(sampleContent);
    
    expect(mockController.runWorkflow).toHaveBeenCalledWith(sampleContent, expect.objectContaining({
      modules: ['FactCheckLayer', 'HallucinationFilter', 'PromptTraceability'],
      sequential: true,
      stopOnError: false
    }));
    
    expect(result).toBeDefined();
    expect(result.status).toBe('warning');
    expect(result.results.length).toBe(3);
  });
  
  test('should run ethical review workflow', async () => {
    // Mock the runWorkflow method
    mockController.runWorkflow = jest.fn().mockResolvedValue({
      workflowId: 'test-workflow-id',
      timestamp: new Date().toISOString(),
      status: 'success',
      results: [
        createMockSuccessResult('EthicalGuardian'),
        createMockSuccessResult('ToneAndAudienceModulator'),
        createMockSuccessResult('PromptTraceability')
      ],
      summary: 'All modules completed successfully'
    });
    
    const result = await workflowManager.runEthicalReviewWorkflow(sampleContent);
    
    expect(mockController.runWorkflow).toHaveBeenCalledWith(sampleContent, expect.objectContaining({
      modules: ['EthicalGuardian', 'ToneAndAudienceModulator', 'PromptTraceability'],
      sequential: true,
      stopOnError: false
    }));
    
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.results.length).toBe(3);
  });
  
  test('should run custom workflow', async () => {
    // Mock the runWorkflow method
    mockController.runWorkflow = jest.fn().mockResolvedValue({
      workflowId: 'test-workflow-id',
      timestamp: new Date().toISOString(),
      status: 'success',
      results: [
        createMockSuccessResult('FactCheckLayer'),
        createMockSuccessResult('EthicalGuardian')
      ],
      summary: 'All modules completed successfully'
    });
    
    const customModules = ['FactCheckLayer', 'EthicalGuardian'];
    const moduleOptions = {
      'FactCheckLayer': { maxTokens: 2000 },
      'EthicalGuardian': { model: 'gpt-4-turbo' }
    };
    
    const result = await workflowManager.runCustomWorkflow(
      sampleContent,
      customModules,
      false, // non-sequential
      true,  // stopOnError
      moduleOptions
    );
    
    expect(mockController.runWorkflow).toHaveBeenCalledWith(sampleContent, expect.objectContaining({
      modules: customModules,
      sequential: false,
      stopOnError: true,
      options: moduleOptions
    }));
    
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.results.length).toBe(2);
  });
});
