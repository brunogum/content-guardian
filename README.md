# Content Guardian

A comprehensive AI agent system for automated validation and improvement of AI-generated professional content for books and articles.

## Overview

Content Guardian is a modular Node.js/TypeScript system designed to analyze, validate, and improve AI-generated content. It functions as a "content guardian" that ensures high-quality, factually accurate, ethically sound, and well-structured content.

Each module in the system provides specialized analysis and can be run independently or as part of a workflow pipeline. Every module generates a unique report with ID, status, and recommendations for improvement.

## Features

- **Modular Architecture**: 10 specialized modules that can be run independently or in sequence
- **Comprehensive Analysis**: Fact-checking, ethical evaluation, tone analysis, structure mapping, and more
- **Flexible Workflows**: Predefined and custom workflows for different content needs
- **Multiple Interfaces**: API, CLI, and programmatic usage options
- **Detailed Reporting**: Each module provides actionable recommendations with clear status indicators
- **Extensible Design**: Easily add new modules to extend functionality

## Modules

### 1. FactCheckLayer
Validates facts, detects speculative/fabricated claims, and reports suspicious statements with risk levels.

### 2. EthicalGuardian
Detects subconscious stereotypes, discriminatory phrases, and ethically questionable language.

### 3. ToneAndAudienceModulator
Analyzes target audience and language level, suggests stylistic changes for consistent tone.

### 4. PlotLogicBuilder
Creates a map of plot, logical connections, and argumentation nodes for both narrative and academic content.

### 5. SimulatedFeedbackReader
Generates questions that a typical reader might ask and identifies confusing or insufficiently explained sections.

### 6. WYSIWYGLayoutPreview
Generates preview layouts for different formats (.pdf, .epub, .html, .md).

### 7. ChapterImageGallery
Assigns illustrated images to chapters based on content and uses text2image engine for visual enrichment.

### 8. SmartExportEngine
Exports content to various formats (.pdf, .epub, .html, .md, .json) while preserving structure and style.

### 9. PromptTraceability
Ensures each output contains metadata including prompt used, model, time, and ID for auditability.

### 10. HallucinationFilter
Detects LLM hallucinations such as fabricated citations, non-existent books, and incorrect numbers.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-organization/content-guardian.git
cd content-guardian

# Install dependencies
npm install

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "PORT=3000" >> .env

# Build the project
npm run build
```

## Quick Start

### API Server

Start the API server:

```bash
npm start
```

The API will be available at http://localhost:3000

### CLI Usage

Run a single module:

```bash
node dist/index.js run-module FactCheckLayer ./examples/sample-content.json
```

Run a workflow:

```bash
node dist/index.js run-workflow ./examples/factual-integrity-workflow.json ./examples/sample-content.json
```

### Programmatic Usage

```typescript
import { controller, FactCheckLayer, EthicalGuardian } from './dist';

// Register modules if not already registered
controller.registerModule(new FactCheckLayer());
controller.registerModule(new EthicalGuardian());

// Run a single module
const content = {
  title: "Article Title",
  author: "Author Name",
  content: "Article content goes here...",
  contentType: "article"
};

const result = await controller.runModule('FactCheckLayer', content);
console.log(result);

// Run a workflow
const workflowResult = await controller.runWorkflow(content, {
  modules: ['FactCheckLayer', 'EthicalGuardian'],
  sequential: true
});
console.log(workflowResult);
```

## API Endpoints

### Get System Information
```
GET /
```

### Run a Single Module
```
POST /api/module/:moduleId
```

### Run a Workflow
```
POST /api/workflow
```

See the [API Documentation](./API.md) for detailed request and response formats.

## Predefined Workflows

The system includes several predefined workflows:

1. **Comprehensive Analysis**: Runs all modules in sequence
2. **Factual Integrity**: Focuses on fact-checking and hallucination detection
3. **Ethical Review**: Focuses on ethical considerations and tone
4. **Reader Experience**: Focuses on readability and structure
5. **Publication Preparation**: Focuses on layout and export

See the [examples directory](./examples) for workflow configuration examples.

## Module Output Format

Each module produces a standardized output:

```typescript
{
  moduleId: string;
  status: 'success' | 'warning' | 'error';
  report: string;
  recommendedFixes?: string[];
  metadata: {
    timestamp: string;
    promptUsed: string;
    modelVersion: string;
  }
}
```

## Development

### Running Tests

```bash
npm test
```

### Adding a New Module

1. Create a new directory in `src/modules/YourModuleName`
2. Create a module class that extends `BaseModule`
3. Implement the required methods
4. Register the module in `src/index.ts`

See the [Development Guide](./DEVELOPMENT.md) for detailed instructions.

## Deployment

For deployment instructions, see the [Deployment Guide](./DEPLOYMENT.md).

## License

[MIT](./LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- OpenAI for providing the AI models
- The Node.js and TypeScript communities for their excellent tools and libraries
