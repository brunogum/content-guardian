/**
 * Unit tests for the FactCheckLayer module
 */

import { FactCheckLayer } from '../modules/FactCheckLayer/FactCheckLayer';
import { sampleContent, sampleModuleOptions, MockAIService } from './testUtils';
import { AIService } from '../utils/AIService';

// Mock the AIService
jest.mock('../utils/AIService', () => {
  return {
    AIService: jest.fn().mockImplementation(() => {
      return {
        getInstance: jest.fn().mockReturnValue({
          generateCompletion: jest.fn().mockImplementation(async (prompt) => {
            if (prompt.includes('FactCheckLayer')) {
              return `
SUMMARY: The content appears to be factually accurate with minor issues.
ISSUES:
1. "AI algorithms can analyze medical images to detect diseases like cancer often with greater accuracy than human radiologists." - This is somewhat overstated. While AI shows promise in medical imaging, it's not universally more accurate than radiologists in all contexts.
   Risk level: MEDIUM
   Source: https://www.nature.com/articles/s41591-020-0942-0

2. The distinction between "Narrow or Weak AI" and "General or Strong AI" is correct, but the article doesn't mention that General AI remains theoretical.
   Risk level: LOW

RECOMMENDATIONS:
1. Qualify the statement about AI in medical imaging to acknowledge variability in performance across different applications
2. Clarify that General AI is still theoretical and doesn't exist yet
3. Add specific examples of current AI limitations

OVERALL_ASSESSMENT: PASS_WITH_WARNINGS
              `;
            } else {
              return 'Default mock response';
            }
          }),
          convertModuleOptionsToAIOptions: jest.fn().mockReturnValue({})
        })
      };
    })
  };
});

describe('FactCheckLayer Module', () => {
  let factCheckLayer: FactCheckLayer;
  
  beforeEach(() => {
    factCheckLayer = new FactCheckLayer();
  });
  
  test('should have correct moduleId and description', () => {
    expect(factCheckLayer.moduleId).toBe('FactCheckLayer');
    expect(factCheckLayer.description).toBe('Validates facts, detects speculative/fabricated claims, and reports suspicious statements with risk levels');
  });
  
  test('should process content and return warning status for content with minor issues', async () => {
    const result = await factCheckLayer.process(sampleContent, sampleModuleOptions);
    
    expect(result).toBeDefined();
    expect(result.moduleId).toBe('FactCheckLayer');
    expect(result.status).toBe('warning');
    expect(result.report).toContain('SUMMARY: The content appears to be factually accurate with minor issues');
    expect(result.recommendedFixes).toBeDefined();
    expect(result.recommendedFixes?.length).toBeGreaterThan(0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.promptUsed).toBeDefined();
  });
  
  test('should return error status for invalid input', async () => {
    const result = await factCheckLayer.process({ content: '' });
    
    expect(result).toBeDefined();
    expect(result.moduleId).toBe('FactCheckLayer');
    expect(result.status).toBe('error');
    expect(result.report).toContain('Invalid input');
  });
});
