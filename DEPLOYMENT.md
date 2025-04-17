# Content Guardian Deployment Guide

This guide provides instructions for deploying the Content Guardian system in various environments.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- OpenAI API key (for AI-powered modules)

## Installation

1. Clone the repository or download the source code:

```bash
git clone https://github.com/your-organization/content-guardian.git
cd content-guardian
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## Building the Project

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

## Running Tests

Run the test suite to ensure everything is working correctly:

```bash
npm test
```

For test coverage report:

```bash
npm test -- --coverage
```

## Deployment Options

### 1. Local Development

For local development and testing:

```bash
npm run dev
```

This will start the server in development mode with hot reloading.

### 2. Production Server

For production deployment:

```bash
npm start
```

This will start the server using the compiled JavaScript files in the `dist` directory.

### 3. Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t content-guardian .

# Run the container
docker run -p 3000:3000 --env-file .env content-guardian
```

### 4. Cloud Deployment

#### AWS Elastic Beanstalk

1. Install the EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB application:
```bash
eb init content-guardian --platform node.js --region us-east-1
```

3. Create an environment and deploy:
```bash
eb create content-guardian-production
```

4. For subsequent deployments:
```bash
eb deploy
```

#### Heroku

1. Install the Heroku CLI and login:
```bash
npm install -g heroku
heroku login
```

2. Create a Heroku app:
```bash
heroku create content-guardian
```

3. Set environment variables:
```bash
heroku config:set OPENAI_API_KEY=your_openai_api_key_here
```

4. Deploy to Heroku:
```bash
git push heroku main
```

## API Usage

Once deployed, the Content Guardian API will be available at:

- Local: http://localhost:3000
- Production: https://your-deployment-url

### API Endpoints

1. **GET /** - Get system information and available modules
2. **POST /api/module/:moduleId** - Run a specific module
3. **POST /api/workflow** - Run a workflow with multiple modules

### Example API Requests

#### Run a single module:

```bash
curl -X POST http://localhost:3000/api/module/FactCheckLayer \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "title": "Article Title",
      "author": "Author Name",
      "content": "Article content goes here...",
      "contentType": "article",
      "targetAudience": "General"
    },
    "options": {
      "model": "gpt-4",
      "maxTokens": 1000
    }
  }'
```

#### Run a workflow:

```bash
curl -X POST http://localhost:3000/api/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "title": "Article Title",
      "author": "Author Name",
      "content": "Article content goes here...",
      "contentType": "article",
      "targetAudience": "General"
    },
    "workflow": {
      "modules": ["FactCheckLayer", "EthicalGuardian", "ToneAndAudienceModulator"],
      "sequential": true,
      "stopOnError": false,
      "options": {
        "FactCheckLayer": {
          "model": "gpt-4"
        }
      }
    }
  }'
```

## CLI Usage

The Content Guardian system can also be used via command line:

```bash
# Run a single module
node dist/index.js run-module FactCheckLayer ./content.json

# Run a workflow
node dist/index.js run-workflow ./workflow.json ./content.json
```

Example content.json:
```json
{
  "title": "Article Title",
  "author": "Author Name",
  "content": "Article content goes here...",
  "contentType": "article",
  "targetAudience": "General"
}
```

Example workflow.json:
```json
{
  "modules": ["FactCheckLayer", "EthicalGuardian", "ToneAndAudienceModulator"],
  "sequential": true,
  "stopOnError": false,
  "options": {
    "FactCheckLayer": {
      "model": "gpt-4"
    }
  }
}
```

## Monitoring and Maintenance

- Logs are stored in the application and can be exported for analysis
- For production deployments, consider setting up monitoring with tools like PM2, New Relic, or AWS CloudWatch
- Regularly update dependencies to ensure security and performance

## Troubleshooting

- If you encounter OpenAI API errors, check your API key and rate limits
- For memory issues, adjust the Node.js memory limit: `NODE_OPTIONS=--max_old_space_size=4096`
- Check the logs for detailed error information

## Support

For issues and feature requests, please open an issue in the GitHub repository or contact the development team.
