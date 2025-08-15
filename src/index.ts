import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { initializeDatabase } from './database/connection';
// import { setupCronJobs } from './services/scheduler'; // Simplificado
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Carrega variáveis de ambiente
// Sempre carrega o .env para garantir que funcione
dotenv.config();

// Log de configuração inicial
if (process.env.NODE_ENV === 'production') {
  logger.info('🌍 Running in production mode');
} else {
  logger.info('🔧 Running in development mode');
}

// Debug das variáveis de ambiente
logger.info('Environment variables loaded:', {
  MONDAY_API_TOKEN: process.env.MONDAY_API_TOKEN ? `${process.env.MONDAY_API_TOKEN.substring(0, 20)}...` : 'NOT SET',
  MONDAY_BOARD_ID: process.env.MONDAY_BOARD_ID || 'NOT SET',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'NOT SET',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? `${process.env.EVOLUTION_API_KEY.substring(0, 10)}...` : 'NOT SET',
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || 'NOT SET'
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Permite event handlers inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rotas
setupRoutes(app);

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    // Inicializa banco de dados
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Jobs de agendamento desabilitados para simplificação
    // setupCronJobs();
    logger.info('Sistema simplificado inicializado');

    // Inicia servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor CRM rodando na porta ${PORT}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`⏰ Timezone: ${process.env.TIMEZONE || 'America/Sao_Paulo'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Tratamento de sinais de término
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
