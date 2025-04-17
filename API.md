# API Documentation

This document provides detailed information about the Content Guardian API endpoints, request formats, and response structures.

## Base URL

When running locally, the base URL is:
```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. For production deployments, it is recommended to implement an authentication mechanism.

## Endpoints

### 1. Get System Information

Returns information about the Content Guardian system and available modules.

**Request:**
```
GET /
```

**Response:**
```json
{
  "name": "Content Guardian API",
  "version": "1.0.0",
  "modules": [
    {
      "id": "FactCheckLayer",
      "description": "Validates facts, detects speculative/fabricated claims, and reports suspicious statements with risk levels"
    },
    {
      "id": "EthicalGuardian",
      "description": "Detects subconscious stereotypes, discriminatory phrases, and ethically questionable language"
    },
    ...
  ]
}
```

### 2. Run a Single Module

Processes content through a specific module.

**Request:**
```
POST /api/module/:moduleId
```

**Path Parameters:**
- `moduleId`: ID of the module to run (e.g., "FactCheckLayer")

**Request Body:**
```json
{
  "content": {
    "title": "Article Title",
    "author": "Author Name",
    "content": "Article content goes here...",
    "contentType": "article",
    "targetAudience": "General",
    "additionalContext": {
      "purpose": "Educational",
      "publicationPlatform": "Online blog"
    }
  },
  "options": {
    "verbose": true,
    "maxTokens": 1000,
    "model": "gpt-4",
    "customPrompt": "Custom prompt to override default"
  }
}
```

**Response:**
```json
{
  "moduleId": "FactCheckLayer",
  "status": "warning",
  "report": "SUMMARY: The content appears to be factually accurate with minor issues...",
  "recommendedFixes": [
    "Qualify the statement about AI in medical imaging",
    "Clarify that General AI is still theoretical"
  ],
  "metadata": {
    "timestamp": "2025-04-17T13:30:45.123Z",
    "promptUsed": "You are a fact-checking expert tasked with...",
    "modelVersion": "gpt-4"
  }
}
```

### 3. Run a Workflow

Processes content through multiple modules according to a workflow configuration.

**Request:**
```
POST /api/workflow
```

**Request Body:**
```json
{
  "content": {
    "title": "Article Title",
    "author": "Author Name",
    "content": "Article content goes here...",
    "contentType": "article",
    "targetAudience": "General",
    "additionalContext": {
      "purpose": "Educational",
      "publicationPlatform": "Online blog"
    }
  },
  "workflow": {
    "modules": ["FactCheckLayer", "EthicalGuardian", "ToneAndAudienceModulator"],
    "sequential": true,
    "stopOnError": false,
    "options": {
      "FactCheckLayer": {
        "model": "gpt-4",
        "maxTokens": 1500
      },
      "EthicalGuardian": {
        "customPrompt": "Custom prompt for ethical analysis..."
      }
    }
  }
}
```

**Response:**
```json
{
  "workflowId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-04-17T13:35:22.456Z",
  "status": "warning",
  "results": [
    {
      "moduleId": "FactCheckLayer",
      "status": "warning",
      "report": "SUMMARY: The content appears to be factually accurate with minor issues...",
      "recommendedFixes": [
        "Qualify the statement about AI in medical imaging",
        "Clarify that General AI is still theoretical"
      ],
      "metadata": {
        "timestamp": "2025-04-17T13:35:10.123Z",
        "promptUsed": "You are a fact-checking expert tasked with...",
        "modelVersion": "gpt-4"
      }
    },
    {
      "moduleId": "EthicalGuardian",
      "status": "success",
      "report": "SUMMARY: The content is ethically sound...",
      "metadata": {
        "timestamp": "2025-04-17T13:35:15.789Z",
        "promptUsed": "Custom prompt for ethical analysis...",
        "modelVersion": "gpt-4"
      }
    },
    {
      "moduleId": "ToneAndAudienceModulator",
      "status": "warning",
      "report": "TONE_ANALYSIS: The content uses inconsistent tone...",
      "recommendedFixes": [
        "Maintain consistent formal tone throughout",
        "Simplify technical jargon in section 3"
      ],
      "metadata": {
        "timestamp": "2025-04-17T13:35:20.456Z",
        "promptUsed": "You are a professional editor specializing in tone analysis...",
        "modelVersion": "gpt-4"
      }
    }
  ],
  "summary": "Workflow Summary: 3 modules processed\n- Success: 1\n- Warning: 2\n- Error: 0\n\nIssues found:\n- [WARNING] FactCheckLayer: The content appears to be factually accurate with minor issues\n- [WARNING] ToneAndAudienceModulator: The content uses inconsistent tone"
}
```

## Error Responses

### 400 Bad Request

Returned when the request is invalid.

```json
{
  "error": "Content is required"
}
```

### 404 Not Found

Returned when the requested resource is not found.

```json
{
  "error": "Module FactCheckLayer not found"
}
```

### 500 Internal Server Error

Returned when an unexpected error occurs.

```json
{
  "error": "Error running module",
  "message": "OpenAI API error: Rate limit exceeded"
}
```

## Content Input Schema

The content input object should follow this schema:

```typescript
interface ContentInput {
  content: string;               // Required: The main content text
  title?: string;                // Optional: Content title
  author?: string;               // Optional: Content author
  targetAudience?: string;       // Optional: Target audience description
  contentType?: 'book' | 'article' | 'essay' | 'other'; // Optional: Content type
  additionalContext?: Record<string, any>; // Optional: Additional context
}
```

## Module Options Schema

The module options object should follow this schema:

```typescript
interface ModuleOptions {
  verbose?: boolean;             // Optional: Enable verbose output
  maxTokens?: number;            // Optional: Maximum tokens for AI completion
  model?: string;                // Optional: AI model to use
  customPrompt?: string;         // Optional: Custom prompt to override default
}
```

## Workflow Options Schema

The workflow options object should follow this schema:

```typescript
interface WorkflowOptions {
  modules: string[];             // Required: Array of module IDs to run
  sequential?: boolean;          // Optional: Run modules sequentially (default: true)
  stopOnError?: boolean;         // Optional: Stop on first error (default: false)
  options?: Record<string, ModuleOptions>; // Optional: Module-specific options
}
```
