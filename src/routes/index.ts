import { Express, Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { mainDashboardController, overviewController, analyticsController, leadsController, filesController, controlsController } from '../controllers/dashboard';
import assetsRouter from './assetsRoutes';

export function setupRoutes(app: Express): void {
  // Rota raiz
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'API CRM Automatizado',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
              endpoints: {
          webhooks: ['/webhook/monday', '/webhook/evolution'],
          dashboard: '/dashboard',
          assets: ['/assets/*'],
          health: '/health'
        }
    });
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

  // Configuração das rotas  
  app.post('/webhook/monday', webhookController.mondayWebhook);
  app.post('/webhook/evolution', webhookController.evolutionWebhook);
  app.get('/webhook/health', webhookController.healthCheck);
  
  // Endpoint de teste para webhook Monday
  app.post('/webhook/test/monday', webhookController.testMondayWebhook);
  

  
  // Dashboard principal
  app.get('/dashboard', mainDashboardController.dashboard);
  app.get('/config', mainDashboardController.dashboard); // Alias
  app.get('/monitor', mainDashboardController.dashboard); // Alias
  
  // Rotas das abas modulares - ENDPOINTS QUE ESTAVAM FALTANDO
  app.get('/api/dashboard/overview', overviewController.getOverviewTab);
  app.get('/api/dashboard/analytics', analyticsController.getAnalyticsTab);
  app.get('/api/dashboard/leads', leadsController.getLeadsTab);
  app.get('/api/dashboard/files', filesController.getFilesTab);
  app.get('/api/dashboard/controls', controlsController.getControlsTab);
  app.get('/api/dashboard/logs', leadsController.getLeadsTab); // Reutiliza a aba leads que já tem logs
  
  // APIs dos dados
  app.get('/api/overview/data', overviewController.getOverviewData);
  app.get('/api/analytics', analyticsController.getAnalyticsData);
  app.get('/api/logs', leadsController.getLogs);
  app.get('/api/webhook-logs', leadsController.getWebhookLogs);
  app.get('/api/leads', leadsController.getLeads);
  app.get('/api/leads/stats', leadsController.getLeadsStats);
  app.get('/api/files', filesController.getFiles);
  app.get('/api/message-templates', filesController.getMessageTemplates);
  app.post('/api/message-templates', filesController.updateMessageTemplate);
  app.post('/api/upload', filesController.uploadFile);
  app.delete('/api/files/:filePath', filesController.deleteFile);
  app.get('/api/files/read/:filePath', filesController.readTextFile);
  app.get('/api/system/info', controlsController.getSystemInfo);
  app.get('/api/test/evolution', controlsController.testEvolution);
  app.get('/api/test/monday', controlsController.testMonday);
  
  // Assets (arquivos de texto e áudio)
  app.use('/assets', assetsRouter);
  
  // 🎯 TODO: Implementar novos endpoints modularizados
  // app.get('/api/leads', leadsController.getLeads);
  // app.get('/api/test/evolution', controlsController.testEvolution);
  // app.get('/api/test/monday', controlsController.testMonday);

  // 📊 TODO: Analytics e métricas
  // app.get('/api/system-health', analyticsController.getSystemHealth);
  
  // 🔍 TODO: Debug e testes detalhados
  // app.get('/api/debug/env', controlsController.debugEnvVars);
  // app.get('/api/test/evolution/status', controlsController.testEvolutionStatus);
  // app.get('/api/test/evolution/info', controlsController.testEvolutionInfo);
  // app.post('/api/test/evolution/message', controlsController.testEvolutionMessage);
  // app.post('/api/test/evolution/audio', controlsController.testEvolutionAudio);
  // app.get('/api/test/monday/board', controlsController.testMondayBoard);
  // app.get('/api/test/monday/items', controlsController.testMondayItems);
  // app.get('/api/test/monday/item/:itemId', controlsController.testMondayItem);
  // app.post('/api/test/monday/update', controlsController.testMondayUpdate);
  // app.post('/api/test/monday/find', controlsController.findMondayContact);
  // app.post('/api/test/monday/create-real-flow', controlsController.createRealFlowTest);
  // app.post('/api/admin/clean-database', controlsController.cleanAndSyncDatabase);
  // app.get('/api/monday/full-board', controlsController.getFullMondayBoard);

  // 📁 TODO: File Management endpoints
  // app.get('/api/files', filesController.getFiles);
  // app.get('/api/message-templates', filesController.getMessageTemplates);
  // app.post('/api/message-templates', filesController.updateMessageTemplate);
  // app.post('/api/upload', filesController.uploadFile);
  // app.delete('/api/files/:filePath', filesController.deleteFile);
  // app.get('/api/files/read/:filePath', filesController.readTextFile);

  // Rota 404
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Endpoint not found',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'POST /webhook/monday',
        'POST /webhook/evolution',
        'GET /dashboard',
        'GET /config',
        'GET /monitor',
        'GET /assets/:filename',
        'GET /api/dashboard/overview',
        'GET /api/dashboard/analytics', 
        'GET /api/dashboard/leads',
        'GET /api/dashboard/files',
        'GET /api/dashboard/controls',
        'GET /api/dashboard/logs',
        'GET /api/logs',
        'GET /api/files',
        'GET /api/system/info'
      ]
    });
  });
}
