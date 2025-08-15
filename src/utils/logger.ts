import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { PATHS } from '../config/constants';

// Configuração do logger
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuração para desenvolvimento
const developmentFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Função para garantir que o diretório de logs existe
function ensureLogDir() {
  if (!fs.existsSync(PATHS.LOGS)) {
    fs.mkdirSync(PATHS.LOGS, { recursive: true });
  }
}

const transports: winston.transport[] = [
  // Console output sempre presente
  new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true
  })
];

// Em produção no Vercel, só usar console
if (process.env.NODE_ENV !== 'production') {
  ensureLogDir();
  
  transports.push(
    // Arquivo de logs gerais
    new winston.transports.File({
      filename: path.join(PATHS.LOGS, 'app.log'),
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Arquivo específico para erros
    new winston.transports.File({
      filename: path.join(PATHS.LOGS, 'error.log'),
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? logFormat : developmentFormat,
  transports,
  exitOnError: false
});

// Log específico para ações do CRM
export const crmLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'crm-actions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: parseInt(process.env.LOG_RETENTION_DAYS || '7')
    })
  ]
});

// Função para log de ações específicas do CRM
export function logCrmAction(
  leadId: string,
  action: string,
  details: string,
  success: boolean = true,
  metadata?: object
) {
  crmLogger.info('CRM Action', {
    leadId,
    action,
    details,
    success,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}
