import { Express, Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { dashboardController } from '../controllers/dashboardController';

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
  
  // Dashboard principal
  app.get('/dashboard', dashboardController.dashboard);
  app.get('/config', dashboardController.dashboard); // Alias
  app.get('/monitor', dashboardController.dashboard); // Alias
  
  // APIs do dashboard
  app.get('/api/logs', dashboardController.getLogs);
  app.get('/api/status', dashboardController.getStatus);
  app.get('/api/test/monday', dashboardController.testMonday);
  app.get('/api/test/evolution', dashboardController.testEvolution);
  app.get('/api/test/calculate-time', dashboardController.testCalculateTime);
  app.get('/api/clients', dashboardController.getActiveClients);
  app.get('/api/monday/data', dashboardController.getMondayData);
  
  // Endpoints para cron jobs do Vercel
  app.get('/api/cron/health-check', dashboardController.cronHealthCheck);
  
  // 🎯 ExternalScheduler endpoints (estratégia robusta para Vercel Hobby)
  app.get('/api/external-scheduler/process', dashboardController.externalSchedulerProcess);
  app.post('/api/external-scheduler/process', dashboardController.externalSchedulerProcess);
  app.get('/api/external-scheduler/health', dashboardController.externalSchedulerHealth);
  app.get('/api/external-scheduler/config', dashboardController.externalSchedulerConfig);

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
