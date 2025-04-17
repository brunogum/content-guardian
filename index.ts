/**
 * Main index file for the Content Guardian system
 * Initializes and registers all modules with the controller
 */

import { ContentGuardianController } from './controllers/ContentGuardianController';
import { FactCheckLayer } from './modules/FactCheckLayer/FactCheckLayer';
import { EthicalGuardian } from './modules/EthicalGuardian/EthicalGuardian';
import { ToneAndAudienceModulator } from './modules/ToneAndAudienceModulator/ToneAndAudienceModulator';
import { PlotLogicBuilder } from './modules/PlotLogicBuilder/PlotLogicBuilder';
import { SimulatedFeedbackReader } from './modules/SimulatedFeedbackReader/SimulatedFeedbackReader';
import { WYSIWYGLayoutPreview } from './modules/WYSIWYGLayoutPreview/WYSIWYGLayoutPreview';
import { ChapterImageGallery } from './modules/ChapterImageGallery/ChapterImageGallery';
import { SmartExportEngine } from './modules/SmartExportEngine/SmartExportEngine';
import { PromptTraceability } from './modules/PromptTraceability/PromptTraceability';
import { HallucinationFilter } from './modules/HallucinationFilter/HallucinationFilter';
import { Logger } from './utils/logger';
import { ContentInput, WorkflowOptions } from './interfaces/ModuleInterfaces';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Initialize logger
const logger = Logger.getInstance();
logger.info('ContentGuardian', 'Initializing Content Guardian system');

// Initialize controller
const controller = new ContentGuardianController();

// Register all modules
controller.registerModule(new FactCheckLayer());
controller.registerModule(new EthicalGuardian());
controller.registerModule(new ToneAndAudienceModulator());
controller.registerModule(new PlotLogicBuilder());
controller.registerModule(new SimulatedFeedbackReader());
controller.registerModule(new WYSIWYGLayoutPreview());
controller.registerModule(new ChapterImageGallery());
controller.registerModule(new SmartExportEngine());
controller.registerModule(new PromptTraceability());
controller.registerModule(new HallucinationFilter());

logger.info('ContentGuardian', 'All modules registered successfully');

// Create Express app for API
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Content Guardian API',
    version: '1.0.0',
    modules: controller.getAllModules().map(module => ({
      id: module.moduleId,
      description: module.description
    }))
  });
});

// Run a single module
app.post('/api/module/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { content, options } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    logger.info('API', `Running module ${moduleId}`);
    
    const result = await controller.runModule(moduleId, content, options);
    
    return res.json(result);
  } catch (error) {
    logger.error('API', 'Error running module', error);
    return res.status(500).json({ 
      error: 'Error running module', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Run a workflow with multiple modules
app.post('/api/workflow', async (req, res) => {
  try {
    const { content, workflow } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!workflow || !workflow.modules || !Array.isArray(workflow.modules) || workflow.modules.length === 0) {
      return res.status(400).json({ error: 'Valid workflow configuration is required' });
    }
    
    logger.info('API', `Running workflow with ${workflow.modules.length} modules`);
    
    const result = await controller.runWorkflow(content, workflow);
    
    return res.json(result);
  } catch (error) {
    logger.error('API', 'Error running workflow', error);
    return res.status(500).json({ 
      error: 'Error running workflow', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info('ContentGuardian', `API server running on port ${port}`);
    console.log(`Content Guardian API server running on port ${port}`);
  });
}

// Export for programmatic usage
export { 
  controller,
  FactCheckLayer,
  EthicalGuardian,
  ToneAndAudienceModulator,
  PlotLogicBuilder,
  SimulatedFeedbackReader,
  WYSIWYGLayoutPreview,
  ChapterImageGallery,
  SmartExportEngine,
  PromptTraceability,
  HallucinationFilter
};

// CLI functionality
if (require.main === module && process.argv.length > 2) {
  const command = process.argv[2];
  
  if (command === 'run-module' && process.argv.length >= 5) {
    const moduleId = process.argv[3];
    const contentFile = process.argv[4];
    
    // Read content from file and run module
    const fs = require('fs');
    const path = require('path');
    
    try {
      const contentPath = path.resolve(contentFile);
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      
      controller.runModule(moduleId, content)
        .then(result => {
          console.log(JSON.stringify(result, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error('Error running module:', error);
          process.exit(1);
        });
    } catch (error) {
      console.error('Error reading content file:', error);
      process.exit(1);
    }
  } else if (command === 'run-workflow' && process.argv.length >= 5) {
    const workflowFile = process.argv[3];
    const contentFile = process.argv[4];
    
    // Read workflow and content from files and run workflow
    const fs = require('fs');
    const path = require('path');
    
    try {
      const workflowPath = path.resolve(workflowFile);
      const contentPath = path.resolve(contentFile);
      
      const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      
      controller.runWorkflow(content, workflow)
        .then(result => {
          console.log(JSON.stringify(result, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error('Error running workflow:', error);
          process.exit(1);
        });
    } catch (error) {
      console.error('Error reading input files:', error);
      process.exit(1);
    }
  } else {
    console.log(`
Content Guardian CLI Usage:
  node dist/index.js run-module <moduleId> <contentFile.json>
  node dist/index.js run-workflow <workflowFile.json> <contentFile.json>
    `);
    process.exit(1);
  }
}
