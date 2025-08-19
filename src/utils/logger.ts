import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { PATHS } from '../config/constants';

// Sistema de logs em memória como fallback
const inMemoryLogs: Array<{timestamp: string, level: string, message: string, meta?: any}> = [];
const MAX_MEMORY_LOGS = 1000;

// Configuração robusta do logger com fallbacks
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    try {
      // Sanitiza metadados para evitar problemas de parsing
      const sanitizedMeta = sanitizeLogMeta(meta);
      const metaStr = Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    } catch (error) {
      // Fallback se houver erro na formatação
      return `${timestamp} [${level}]: ${message} [FORMATTING_ERROR]`;
    }
  })
);

// Configuração para desenvolvimento com melhor tratamento de erros
const developmentFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    try {
      const sanitizedMeta = sanitizeLogMeta(meta);
      const metaStr = Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    } catch (error) {
      return `${timestamp} [${level}]: ${message} [DEV_FORMATTING_ERROR]`;
    }
  })
);

// Função para sanitizar metadados e evitar referências circulares
function sanitizeLogMeta(meta: any): any {
  if (!meta || typeof meta !== 'object') return meta;
  
  try {
    // Remove referências circulares e propriedades problemáticas
    const sanitized = JSON.parse(JSON.stringify(meta, (key, value) => {
      // Remove funções e valores undefined
      if (typeof value === 'function' || value === undefined) return '[REMOVED]';
      
      // Limita strings muito longas
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '...[TRUNCATED]';
      }
      
      // Remove propriedades sensíveis
      if (typeof key === 'string' && (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      )) {
        return '[REDACTED]';
      }
      
      return value;
    }));
    
    return sanitized;
  } catch (error) {
    return { error: 'SANITIZATION_FAILED', original_type: typeof meta };
  }
}

// Função robusta para garantir que o diretório de logs existe
function ensureLogDir(): boolean {
  try {
    if (!fs.existsSync(PATHS.LOGS)) {
      fs.mkdirSync(PATHS.LOGS, { recursive: true });
      console.log(`✅ Diretório de logs criado: ${PATHS.LOGS}`);
    }
    
    // Verifica se é possível escrever no diretório
    const testFile = path.join(PATHS.LOGS, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar/verificar diretório de logs: ${error}`);
    return false;
  }
}

// Função para adicionar log à memória como fallback
function addToMemoryLog(level: string, message: string, meta?: any) {
  inMemoryLogs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: sanitizeLogMeta(meta)
  });
  
  // Mantém apenas os últimos N logs na memória
  if (inMemoryLogs.length > MAX_MEMORY_LOGS) {
    inMemoryLogs.splice(0, inMemoryLogs.length - MAX_MEMORY_LOGS);
  }
}

// Função para obter logs da memória
export function getMemoryLogs(): typeof inMemoryLogs {
  return [...inMemoryLogs];
}

// Função para limpar logs antigos
export function cleanOldLogs(): void {
  try {
    const logDir = PATHS.LOGS;
    if (!fs.existsSync(logDir)) return;
    
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    
    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Log antigo removido: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao limpar logs antigos:', error);
  }
}

// Sistema robusto de transports com fallbacks
const transports: winston.transport[] = [
  // Console output sempre presente com fallback personalizado
  new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true,
    stderrLevels: ['error'],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Configuração inteligente baseada no ambiente
const canWriteFiles = ensureLogDir();
const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isDevelopment = process.env.NODE_ENV !== 'production';

if (canWriteFiles && !isServerless) {
  console.log('📝 Configurando logs em arquivo (ambiente local/servidor)');
  
  // Transport personalizado com fallback
  class RobustFileTransport extends winston.transports.File {
    log(info: any, callback?: () => void) {
      try {
        super.log(info, callback || (() => {}));
        // Adiciona à memória como backup
        addToMemoryLog(info.level, info.message, info);
      } catch (error) {
        console.error('❌ Erro ao escrever log em arquivo:', error);
        // Fallback para memória
        addToMemoryLog(info.level, info.message, info);
        if (callback) callback();
      }
    }
  }
  
  transports.push(
    // Arquivo de logs gerais com rotação automática
    new RobustFileTransport({
      filename: path.join(PATHS.LOGS, 'app.log'),
      handleExceptions: true,
      handleRejections: true,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true,
      zippedArchive: true
    }),
    
    // Arquivo específico para erros
    new RobustFileTransport({
      filename: path.join(PATHS.LOGS, 'error.log'),
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    })
  );
} else {
  console.log('☁️ Ambiente serverless/sem permissão de escrita - usando fallback em memória');
}

// Logger principal com tratamento robusto de erros
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDevelopment ? developmentFormat : logFormat,
  transports,
  exitOnError: false,
  silent: false,
  handleExceptions: true,
  handleRejections: true
});

// Intercepta erros de logging e adiciona à memória
logger.on('error', (error) => {
  console.error('❌ Erro no sistema de logging:', error);
  addToMemoryLog('error', 'LOGGING_SYSTEM_ERROR', { error: error.message });
});

// Transport personalizado para CRM com múltiplos fallbacks
class CrmLogTransport extends winston.transports.Console {
  log(info: any, callback: () => void) {
    try {
      // Tenta escrever no arquivo se possível
      if (canWriteFiles && !isServerless) {
        const logPath = path.join(PATHS.LOGS, 'crm-actions.log');
        const logLine = JSON.stringify({
          timestamp: new Date().toISOString(),
          level: info.level,
          message: info.message,
          ...sanitizeLogMeta(info)
        }) + '\n';
        
        fs.appendFileSync(logPath, logLine);
      }
      
      // Sempre adiciona à memória como backup
      addToMemoryLog(info.level, info.message, info);
      
      // Chama o callback
      if (callback) callback();
    } catch (error) {
      console.error('❌ Erro no CRM logger:', error);
      // Fallback garantido para memória
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addToMemoryLog('error', 'CRM_LOGGING_ERROR', { originalInfo: info, error: errorMsg });
      if (callback) callback();
    }
  }
}

// CRM Logger com sistema robusto
export const crmLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new CrmLogTransport()
  ],
  exitOnError: false
});

// Função robusta para log de ações específicas do CRM
export function logCrmAction(
  leadId: string,
  action: string,
  details: string,
  success: boolean = true,
  metadata?: object
) {
  try {
    const logData = {
      leadId,
      action,
      details,
      success,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...sanitizeLogMeta(metadata)
    };
    
    // Tenta log principal
    crmLogger.info('CRM Action', logData);
    
    // Fallback adicional para casos críticos
    if (!success || action.includes('ERROR')) {
      console.error(`🚨 CRM Action Failed: ${action} - Lead: ${leadId} - ${details}`);
    }
    
  } catch (error) {
    console.error('❌ Falha crítica no logCrmAction:', error);
    // Fallback de último recurso
    addToMemoryLog('error', 'CRM_ACTION_LOGGING_FAILED', {
      leadId,
      action,
      details,
      success,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Função para recuperar logs quando arquivos falham
export function getLogsFromAllSources(type: string = 'all', lines: number = 50): any[] {
  const allLogs: any[] = [];
  
  try {
    // Tenta ler arquivos se existirem
    if (canWriteFiles && !isServerless) {
      const logFiles = ['app.log', 'error.log', 'crm-actions.log'];
      
      logFiles.forEach(file => {
        const filePath = path.join(PATHS.LOGS, file);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const fileLines = content.split('\n')
              .filter(line => line.trim())
              .slice(-lines)
              .map(line => {
                try {
                  return JSON.parse(line);
                } catch {
                  return { message: line, source: file, parseError: true };
                }
              });
            allLogs.push(...fileLines);
          } catch (error) {
            console.warn(`⚠️ Erro ao ler arquivo ${file}:`, error);
          }
        }
      });
    }
    
    // Sempre inclui logs da memória
    allLogs.push(...getMemoryLogs());
    
    // Ordena por timestamp e limita
    return allLogs
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, lines);
      
  } catch (error) {
    console.error('❌ Erro ao recuperar logs:', error);
    return getMemoryLogs().slice(-lines);
  }
}

// Inicialização e limpeza automática
if (canWriteFiles) {
  // Limpa logs antigos na inicialização
  cleanOldLogs();
  
  // Programa limpeza automática
  setInterval(cleanOldLogs, 24 * 60 * 60 * 1000); // Uma vez por dia
}

// Log de inicialização
logger.info('🚀 Sistema de logging inicializado', {
  environment: process.env.NODE_ENV || 'development',
  canWriteFiles,
  isServerless: !!isServerless,
  logPath: PATHS.LOGS,
  memoryLogsEnabled: true
});
