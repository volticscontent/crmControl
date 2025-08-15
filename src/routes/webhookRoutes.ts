import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

// Webhook do Monday.com
router.post('/monday', webhookController.mondayWebhook);

// Webhook da Evolution API
router.post('/evolution', webhookController.evolutionWebhook);

// Health check específico dos webhooks
router.get('/health', webhookController.healthCheck);

export default router;
