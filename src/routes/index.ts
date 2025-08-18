import { Express, Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { dashboardController } from '../controllers/dashboardController';
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
  app.get('/dashboard', dashboardController.dashboard);
  app.get('/config', dashboardController.dashboard); // Alias
  app.get('/monitor', dashboardController.dashboard); // Alias
  
  // APIs do dashboard simplificadas
  app.get('/api/logs', dashboardController.getLogs);
  app.get('/api/logs/detailed', dashboardController.getDetailedLogs);
  app.get('/api/status', dashboardController.getStatus);
  
  // Assets (arquivos de texto e áudio)
  app.use('/assets', assetsRouter);
  
  // 🎯 Novos endpoints para melhor monitoramento
  app.get('/api/leads', dashboardController.getLeads);
  app.get('/api/webhook-logs', dashboardController.getWebhookLogs);
  app.get('/api/test/evolution', dashboardController.testEvolution);
  app.get('/api/test/monday', dashboardController.testMonday);

  // 📊 Analytics e métricas
  app.get('/api/analytics', dashboardController.getAnalytics);
  app.get('/api/system-health', dashboardController.getSystemHealth);
  
  // 🔍 Debug e testes detalhados
  app.get('/api/debug/env', dashboardController.debugEnvVars);
  app.get('/api/test/evolution/status', dashboardController.testEvolutionStatus);
  app.get('/api/test/evolution/info', dashboardController.testEvolutionInfo);
  app.post('/api/test/evolution/message', dashboardController.testEvolutionMessage);
  app.post('/api/test/evolution/audio', dashboardController.testEvolutionAudio);
  app.get('/api/test/monday/board', dashboardController.testMondayBoard);
  app.get('/api/test/monday/items', dashboardController.testMondayItems);
  app.get('/api/test/monday/item/:itemId', dashboardController.testMondayItem);
  app.post('/api/test/monday/update', dashboardController.testMondayUpdate);
  app.post('/api/test/monday/find', dashboardController.findMondayContact);
  app.post('/api/test/monday/create-real-flow', dashboardController.createRealFlowTest);
  app.post('/api/admin/clean-database', dashboardController.cleanAndSyncDatabase);
  app.get('/api/monday/full-board', dashboardController.getFullMondayBoard);

  // 📁 File Management endpoints
  app.get('/api/files', dashboardController.getFiles);
  app.get('/api/message-templates', dashboardController.getMessageTemplates);
  app.post('/api/message-templates', dashboardController.updateMessageTemplate);
  app.post('/api/upload', dashboardController.uploadFile);
  app.delete('/api/files/:filePath', dashboardController.deleteFile);
  app.get('/api/files/read/:filePath', dashboardController.readTextFile);

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
        'GET /assets/:filename'
      ]
    });
  });
}
