/**
 * Unit tests for the ContentGuardianController
 */

import { ContentGuardianController } from '../controllers/ContentGuardianController';
import { FactCheckLayer } from '../modules/FactCheckLayer/FactCheckLayer';
import { EthicalGuardian } from '../modules/EthicalGuardian/EthicalGuardian';
import { sampleContent, createMockSuccessResult, createMockWarningResult, createMockErrorResult } from './testUtils';

// Mock the modules
jest.mock('../modules/FactCheckLayer/FactCheckLayer');
jest.mock('../modules/EthicalGuardian/EthicalGuardian');

describe('ContentGuardianController', () => {
  let controller: ContentGuardianController;
  let factCheckLayer: jest.Mocked<FactCheckLayer>;
  let ethicalGuardian: jest.Mocked<EthicalGuardian>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock implementations
    factCheckLayer = new FactCheckLayer() as jest.Mocked<FactCheckLayer>;
    ethicalGuardian = new EthicalGuardian() as jest.Mocked<EthicalGuardian>;
    
    // Set up module properties
    factCheckLayer.moduleId = 'FactCheckLayer';
    factCheckLayer.description = 'Mock FactCheckLayer';
    ethicalGuardian.moduleId = 'EthicalGuardian';
    ethicalGuardian.description = 'Mock EthicalGuardian';
    
    // Initialize controller
    controller = new ContentGuardianController();
  });
  
  test('should register modules correctly', () => {
    controller.registerModule(factCheckLayer);
    controller.registerModule(ethicalGuardian);
    
    const modules = controller.getAllModules();
    expect(modules.length).toBe(2);
    expect(modules[0].moduleId).toBe('FactCheckLayer');
    expect(modules[1].moduleId).toBe('EthicalGuardian');
  });
  
  test('should get module by ID', () => {
    controller.registerModule(factCheckLayer);
    controller.registerModule(ethicalGuardian);
    
    const module = controller.getModule('EthicalGuardian');
    expect(module).toBeDefined();
    expect(module?.moduleId).toBe('EthicalGuardian');
  });
  
  test('should run a single module', async () => {
    // Mock the process method to return a success result
    factCheckLayer.process = jest.fn().mockResolvedValue(createMockSuccessResult('FactCheckLayer'));
    
    controller.registerModule(factCheckLayer);
    
    const result = await controller.runModule('FactCheckLayer', sampleContent);
    
    expect(factCheckLayer.process).toHaveBeenCalledWith(sampleContent, undefined);
    expect(result).toBeDefined();
    expect(result.moduleId).toBe('FactCheckLayer');
    expect(result.status).toBe('success');
  });
  
  test('should throw error when running non-existent module', async () => {
    await expect(controller.runModule('NonExistentModule', sampleContent))
      .rejects.toThrow('Module NonExistentModule not found');
  });
  
  test('should run sequential workflow successfully', async () => {
    // Mock the process methods
    factCheckLayer.process = jest.fn().mockResolvedValue(createMockSuccessResult('FactCheckLayer'));
    ethicalGuardian.process = jest.fn().mockResolvedValue(createMockWarningResult('EthicalGuardian'));
    
    controller.registerModule(factCheckLayer);
    controller.registerModule(ethicalGuardian);
    
    const workflowResult = await controller.runWorkflow(sampleContent, {
      modules: ['FactCheckLayer', 'EthicalGuardian'],
      sequential: true
    });
    
    expect(factCheckLayer.process).toHaveBeenCalledWith(sampleContent, undefined);
    expect(ethicalGuardian.process).toHaveBeenCalledWith(sampleContent, undefined);
    
    expect(workflowResult).toBeDefined();
    expect(workflowResult.results.length).toBe(2);
    expect(workflowResult.status).toBe('warning'); // Overall status should be warning due to EthicalGuardian
    expect(workflowResult.summary).toContain('Success: 1');
    expect(workflowResult.summary).toContain('Warning: 1');
  });
  
  test('should stop sequential workflow on error when stopOnError is true', async () => {
    // Mock the process methods
    factCheckLayer.process = jest.fn().mockResolvedValue(createMockErrorResult('FactCheckLayer'));
    ethicalGuardian.process = jest.fn().mockResolvedValue(createMockSuccessResult('EthicalGuardian'));
    
    controller.registerModule(factCheckLayer);
    controller.registerModule(ethicalGuardian);
    
    const workflowResult = await controller.runWorkflow(sampleContent, {
      modules: ['FactCheckLayer', 'EthicalGuardian'],
      sequential: true,
      stopOnError: true
    });
    
    expect(factCheckLayer.process).toHaveBeenCalledWith(sampleContent, undefined);
    expect(ethicalGuardian.process).not.toHaveBeenCalled(); // Should not be called due to stopOnError
    
    expect(workflowResult).toBeDefined();
    expect(workflowResult.results.length).toBe(1);
    expect(workflowResult.status).toBe('error');
  });
  
  test('should run parallel workflow successfully', async () => {
    // Mock the process methods
    factCheckLayer.process = jest.fn().mockResolvedValue(createMockSuccessResult('FactCheckLayer'));
    ethicalGuardian.process = jest.fn().mockResolvedValue(createMockWarningResult('EthicalGuardian'));
    
    controller.registerModule(factCheckLayer);
    controller.registerModule(ethicalGuardian);
    
    const workflowResult = await controller.runWorkflow(sampleContent, {
      modules: ['FactCheckLayer', 'EthicalGuardian'],
      sequential: false
    });
    
    expect(factCheckLayer.process).toHaveBeenCalledWith(sampleContent, undefined);
    expect(ethicalGuardian.process).toHaveBeenCalledWith(sampleContent, undefined);
    
    expect(workflowResult).toBeDefined();
    expect(workflowResult.results.length).toBe(2);
    expect(workflowResult.status).toBe('warning'); // Overall status should be warning due to EthicalGuardian
  });
});
