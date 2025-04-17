/**
 * Test utilities for the Content Guardian system
 */

import { ContentInput, ModuleOptions, ModuleResult, WorkflowResult } from '../interfaces/ModuleInterfaces';

/**
 * Sample content for testing
 */
export const sampleContent: ContentInput = {
  title: 'The Future of Artificial Intelligence',
  author: 'Test Author',
  content: `
Artificial Intelligence: Transforming Our World

Introduction
Artificial Intelligence (AI) has become one of the most transformative technologies of the 21st century. From virtual assistants like Siri and Alexa to sophisticated algorithms that power recommendation systems on platforms like Netflix and Amazon, AI is increasingly integrated into our daily lives. This article explores the current state of AI, its potential future developments, and the ethical considerations that accompany this rapidly evolving technology.

What is Artificial Intelligence?
Artificial Intelligence refers to computer systems designed to perform tasks that typically require human intelligence. These tasks include visual perception, speech recognition, decision-making, and language translation. AI systems learn from data, identify patterns, and make decisions with minimal human intervention.

There are two main types of AI:
1. Narrow or Weak AI: Systems designed for a specific task, such as facial recognition or internet searches.
2. General or Strong AI: Systems with generalized human cognitive abilities that can find solutions to unfamiliar tasks.

Current Applications of AI
AI is already transforming numerous industries:

Healthcare: AI algorithms can analyze medical images to detect diseases like cancer often with greater accuracy than human radiologists. AI is also being used to discover new drugs and personalize treatment plans.

Finance: Banks and financial institutions use AI for fraud detection, algorithmic trading, and customer service chatbots.

Transportation: Self-driving cars and traffic management systems rely heavily on AI technologies.

Entertainment: Streaming services use AI to recommend content based on viewing habits, while game developers create more realistic and adaptive gaming experiences.

Future Possibilities
The future of AI holds exciting possibilities:

Advanced robotics may revolutionize manufacturing, healthcare, and home assistance.
Quantum computing could exponentially increase AI processing capabilities.
Brain-computer interfaces might allow direct communication between humans and AI systems.
AI could help address global challenges like climate change through optimized energy systems and improved climate modeling.

Ethical Considerations
As AI becomes more powerful, several ethical questions arise:

Privacy concerns: AI systems often require vast amounts of personal data.
Bias and fairness: AI systems can perpetuate or amplify existing societal biases if trained on biased data.
Autonomy and accountability: Who is responsible when AI systems make mistakes?
Economic impact: How will AI affect employment and economic inequality?

Conclusion
Artificial Intelligence represents one of humanity's most powerful tools, with the potential to solve complex problems and enhance human capabilities. However, responsible development and thoughtful regulation are essential to ensure that AI benefits humanity while minimizing potential harms. As we continue to advance AI technology, ongoing dialogue between technologists, policymakers, and the public will be crucial in shaping an AI-enabled future that aligns with human values and needs.
  `,
  contentType: 'article',
  targetAudience: 'General public interested in technology',
  additionalContext: {
    purpose: 'Educational',
    publicationPlatform: 'Online blog'
  }
};

/**
 * Sample module options for testing
 */
export const sampleModuleOptions: ModuleOptions = {
  verbose: true,
  maxTokens: 1000,
  model: 'gpt-4',
  customPrompt: 'Analyze the following content carefully and provide detailed feedback.'
};

/**
 * Mock successful module result for testing
 */
export function createMockSuccessResult(moduleId: string): ModuleResult {
  return {
    moduleId,
    status: 'success',
    report: 'The content has been analyzed successfully with no issues found.',
    recommendedFixes: [],
    metadata: {
      timestamp: new Date().toISOString(),
      promptUsed: 'Test prompt',
      modelVersion: 'test-model'
    }
  };
}

/**
 * Mock warning module result for testing
 */
export function createMockWarningResult(moduleId: string): ModuleResult {
  return {
    moduleId,
    status: 'warning',
    report: 'The content has been analyzed with some minor issues found.',
    recommendedFixes: [
      'Consider revising the introduction for clarity',
      'Add more specific examples in the third paragraph'
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      promptUsed: 'Test prompt',
      modelVersion: 'test-model'
    }
  };
}

/**
 * Mock error module result for testing
 */
export function createMockErrorResult(moduleId: string): ModuleResult {
  return {
    moduleId,
    status: 'error',
    report: 'The content analysis failed due to significant issues.',
    recommendedFixes: [
      'Major restructuring required',
      'Several factual inaccuracies need correction',
      'Ethical concerns need to be addressed'
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      promptUsed: 'Test prompt',
      modelVersion: 'test-model'
    }
  };
}

/**
 * Mock workflow result for testing
 */
export function createMockWorkflowResult(moduleResults: ModuleResult[]): WorkflowResult {
  // Determine overall status based on module results
  let overallStatus: 'success' | 'warning' | 'error' = 'success';
  if (moduleResults.some(result => result.status === 'error')) {
    overallStatus = 'error';
  } else if (moduleResults.some(result => result.status === 'warning')) {
    overallStatus = 'warning';
  }
  
  // Generate summary
  const totalModules = moduleResults.length;
  const successCount = moduleResults.filter(r => r.status === 'success').length;
  const warningCount = moduleResults.filter(r => r.status === 'warning').length;
  const errorCount = moduleResults.filter(r => r.status === 'error').length;
  
  let summary = `Workflow Summary: ${totalModules} modules processed\n`;
  summary += `- Success: ${successCount}\n`;
  summary += `- Warning: ${warningCount}\n`;
  summary += `- Error: ${errorCount}\n\n`;
  
  if (warningCount > 0 || errorCount > 0) {
    summary += 'Issues found:\n';
    
    moduleResults.forEach(result => {
      if (result.status === 'warning' || result.status === 'error') {
        summary += `- [${result.status.toUpperCase()}] ${result.moduleId}: ${result.report.split('\n')[0]}\n`;
      }
    });
  }
  
  return {
    workflowId: 'test-workflow-id',
    timestamp: new Date().toISOString(),
    status: overallStatus,
    results: moduleResults,
    summary
  };
}

/**
 * Mock AI service for testing
 */
export class MockAIService {
  public async generateCompletion(prompt: string, options: any = {}): Promise<string> {
    // Return different mock responses based on the prompt content
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
    } else if (prompt.includes('EthicalGuardian')) {
      return `
SUMMARY: The content is generally balanced but contains some subtle biases and assumptions.
ISSUES:
1. "AI could help address global challenges like climate change" - This presents a techno-optimistic view without acknowledging potential negative environmental impacts of AI systems themselves.
   Suggestion: Balance this with mention of AI's energy consumption and environmental footprint.

2. The article doesn't address potential cultural differences in AI adoption and ethics across different societies.
   Suggestion: Include perspective on how AI development and regulation varies globally.

RECOMMENDATIONS:
1. Add discussion of AI's own environmental impact
2. Include more diverse global perspectives
3. Consider addressing accessibility concerns for people with disabilities

TONE_ASSESSMENT: Generally neutral with slight techno-optimistic bias
OVERALL_RATING: NEEDS_REVISION
      `;
    } else {
      // Default response for other modules
      return `
ANALYSIS: The content is well-structured and informative.
RECOMMENDATIONS:
1. Consider adding more specific examples
2. The conclusion could be strengthened with a call to action
3. Consider breaking up longer paragraphs for readability

OVERALL_ASSESSMENT: MINOR_ADJUSTMENTS_NEEDED
      `;
    }
  }
}
