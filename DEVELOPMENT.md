# Development Guide

This document provides detailed information for developers who want to extend or modify the Content Guardian system.

## Project Structure

```
content-guardian/
├── src/
│   ├── controllers/           # Controller classes
│   ├── interfaces/            # TypeScript interfaces
│   ├── modules/               # Module implementations
│   │   ├── FactCheckLayer/
│   │   ├── EthicalGuardian/
│   │   └── ...
│   ├── tests/                 # Test files
│   └── utils/                 # Utility functions and classes
├── dist/                      # Compiled JavaScript files
├── examples/                  # Example files
├── .env                       # Environment variables
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

## Adding a New Module

To add a new module to the Content Guardian system:

1. Create a new directory in `src/modules/YourModuleName/`
2. Create a module class that extends `BaseModule`
3. Implement the required methods
4. Register the module in `src/index.ts`

### Example Module Implementation

```typescript
import { BaseModule } from '../utils/BaseModule';
import { ContentInput, ModuleOptions, ModuleResult } from '../interfaces/ModuleInterfaces';
import { AIService } from '../utils/AIService';

export class YourModuleName extends BaseModule {
  public moduleId = 'YourModuleName';
  public description = 'Description of your module';
  private aiService = AIService.getInstance();

  /**
   * Process the content input and generate results
   */
  public async process(input: ContentInput, options?: ModuleOptions): Promise<ModuleResult> {
    if (!this.validateInput(input)) {
      return this.createResult(
        'error',
        'Invalid input: content is required',
        ['Provide non-empty content for processing'],
        this.createMetadata(options)
      );
    }

    this.logger.info(this.moduleId, 'Starting processing');

    try {
      // Prepare the prompt
      const prompt = this.preparePrompt(input, options);
      
      // Get AI service options
      const aiOptions = this.aiService.convertModuleOptionsToAIOptions(options);
      
      // Generate completion
      const completion = await this.aiService.generateCompletion(prompt, aiOptions);
      
      // Parse the completion to extract results
      const { report, status, recommendedFixes } = this.parseResults(completion);
      
      this.logger.info(this.moduleId, `Processing completed with status: ${status}`);
      
      return this.createResult(
        status,
        report,
        recommendedFixes,
        this.createMetadata(options)
      );
    } catch (error) {
      this.logger.error(this.moduleId, 'Error during processing', error);
      
      return this.createResult(
        'error',
        `Error during processing: ${error instanceof Error ? error.message : String(error)}`,
        ['Retry the processing', 'Check API connectivity'],
        this.createMetadata(options)
      );
    }
  }

  /**
   * Get the default prompt for this module
   */
  protected getDefaultPrompt(): string {
    return `
Your default prompt here...
    `;
  }

  /**
   * Prepare the prompt based on input and options
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
   * Parse the results from the AI completion
   */
  private parseResults(completion: string): { 
    report: string; 
    status: 'success' | 'warning' | 'error'; 
    recommendedFixes: string[] 
  } {
    // Implement your parsing logic here
    // This is just an example
    const hasWarnings = completion.includes('WARNING') || completion.includes('NEEDS_IMPROVEMENT');
    const hasErrors = completion.includes('ERROR') || completion.includes('CRITICAL');
    
    // Extract recommendations
    const recommendedFixes = completion
      .split('\n')
      .filter(line => line.includes('RECOMMENDATION:'))
      .map(line => line.replace('RECOMMENDATION:', '').trim());
    
    // Determine status
    let status: 'success' | 'warning' | 'error';
    if (hasErrors) {
      status = 'error';
    } else if (hasWarnings) {
      status = 'warning';
    } else {
      status = 'success';
    }
    
    return {
      report: completion,
      status,
      recommendedFixes
    };
  }
}
```

### Registering the Module

Add your module to `src/index.ts`:

```typescript
import { YourModuleName } from './modules/YourModuleName/YourModuleName';

// ...

// Register all modules
controller.registerModule(new FactCheckLayer());
controller.registerModule(new EthicalGuardian());
// ...
controller.registerModule(new YourModuleName());
```

## Creating Custom Workflows

You can create custom workflows by defining a workflow configuration:

```typescript
import { WorkflowOptions } from './interfaces/ModuleInterfaces';

export const customWorkflow: WorkflowOptions = {
  modules: [
    'YourModuleName',
    'AnotherModule',
    'ThirdModule'
  ],
  sequential: true,
  stopOnError: false,
  options: {
    'YourModuleName': {
      model: 'gpt-4',
      maxTokens: 2000
    }
  }
};
```

## Testing

### Unit Tests

Create unit tests for your module in `src/tests/YourModuleName.test.ts`:

```typescript
import { YourModuleName } from '../modules/YourModuleName/YourModuleName';
import { sampleContent, sampleModuleOptions } from './testUtils';
import { AIService } from '../utils/AIService';

// Mock the AIService
jest.mock('../utils/AIService');

describe('YourModuleName Module', () => {
  let yourModule: YourModuleName;
  
  beforeEach(() => {
    yourModule = new YourModuleName();
  });
  
  test('should have correct moduleId and description', () => {
    expect(yourModule.moduleId).toBe('YourModuleName');
    expect(yourModule.description).toBe('Description of your module');
  });
  
  test('should process content and return expected result', async () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test -- src/tests/YourModuleName.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Debugging

### Logging

The system uses a centralized logger. Use it in your module:

```typescript
this.logger.debug(this.moduleId, 'Debug message');
this.logger.info(this.moduleId, 'Info message');
this.logger.warning(this.moduleId, 'Warning message');
this.logger.error(this.moduleId, 'Error message', error);
```

### Viewing Logs

```typescript
import { Logger } from './utils/logger';

const logger = Logger.getInstance();
const logs = logger.getLogs();
console.log(logs);

// Export logs to file
const fs = require('fs');
fs.writeFileSync('logs.json', logger.exportLogs());
```

## Performance Considerations

- Be mindful of token usage in AI prompts
- Consider implementing caching for frequent operations
- For large documents, process in chunks to avoid token limits

## Best Practices

1. Follow the existing module pattern for consistency
2. Write comprehensive tests for your module
3. Document your module's purpose and functionality
4. Use meaningful variable and method names
5. Handle errors gracefully
6. Provide helpful recommendations in your module's output

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for your changes
5. Submit a pull request

Please follow the existing code style and include appropriate tests for your changes.
