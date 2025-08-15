import cron from 'node-cron';
import moment from 'moment-timezone';
import { contactService } from './contactService';
import { logger } from '../utils/logger';
import { DEFAULT_CONFIG } from '../config/constants';

class SchedulerService {
  private timezone: string;
  private jobs: cron.ScheduledTask[] = [];

  constructor() {
    this.timezone = process.env.TIMEZONE || DEFAULT_CONFIG.TIMEZONE;
  }

  setupCronJobs(): void {
    // Job principal: verifica contatos pendentes a cada 15 minutos durante horário comercial
    const mainJob = cron.schedule('*/15 9-18 * * 1-5', async () => {
      await this.processScheduledContacts();
    }, {
      scheduled: false,
      timezone: this.timezone
    });

    // Job de verificação rápida: a cada 5 minutos (para casos urgentes)
    const quickCheckJob = cron.schedule('*/5 * * * *', async () => {
      await this.quickCheck();
    }, {
      scheduled: false,
      timezone: this.timezone
    });

    // Job de limpeza: executa uma vez por dia à meia-noite
    const cleanupJob = cron.schedule('0 0 * * *', async () => {
      await this.dailyCleanup();
    }, {
      scheduled: false,
      timezone: this.timezone
    });

    // Job de health check: a cada hora
    const healthCheckJob = cron.schedule('0 * * * *', async () => {
      await this.healthCheck();
    }, {
      scheduled: false,
      timezone: this.timezone
    });

    this.jobs = [mainJob, quickCheckJob, cleanupJob, healthCheckJob];

    // Inicia todos os jobs
    this.startAll();

    logger.info('Cron jobs configured and started', {
      timezone: this.timezone,
      jobsCount: this.jobs.length
    });
  }

  private async processScheduledContacts(): Promise<void> {
    try {
      const now = moment().tz(this.timezone);
      const currentHour = now.hour();

      // Verifica se está no horário comercial
      if (currentHour < DEFAULT_CONFIG.WORK_START_HOUR || currentHour >= DEFAULT_CONFIG.WORK_END_HOUR) {
        logger.debug('Outside business hours, skipping scheduled contacts processing');
        return;
      }

      logger.info('Starting scheduled contacts processing');
      await contactService.processScheduledContacts();
      logger.info('Scheduled contacts processing completed');

    } catch (error) {
      logger.error('Error in scheduled contacts processing:', error);
    }
  }

  private async quickCheck(): Promise<void> {
    try {
      // Verificação rápida para casos urgentes ou correções
      const now = moment().tz(this.timezone);
      
      // Só executa se for horário comercial
      if (this.isBusinessHours(now)) {
        // Aqui você pode adicionar verificações específicas se necessário
        logger.debug('Quick check completed');
      }
    } catch (error) {
      logger.error('Error in quick check:', error);
    }
  }

  private async dailyCleanup(): Promise<void> {
    try {
      logger.info('Starting daily cleanup');

      // Aqui você pode adicionar limpezas específicas:
      // - Logs antigos
      // - Dados temporários
      // - Relatórios diários

      logger.info('Daily cleanup completed');

    } catch (error) {
      logger.error('Error in daily cleanup:', error);
    }
  }

  private async healthCheck(): Promise<void> {
    try {
      logger.info('Performing system health check');

      // Verificações básicas de saúde do sistema
      const status = {
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timezone: this.timezone,
        businessHours: this.isBusinessHours(moment().tz(this.timezone))
      };

      logger.info('System health check completed', status);

    } catch (error) {
      logger.error('Error in health check:', error);
    }
  }

  private isBusinessHours(momentTime: moment.Moment): boolean {
    const hour = momentTime.hour();
    const day = momentTime.day(); // 0 = Sunday, 6 = Saturday

    // Segunda a sexta (1-5) das 9h às 18h
    return day >= 1 && day <= 5 && 
           hour >= DEFAULT_CONFIG.WORK_START_HOUR && 
           hour < DEFAULT_CONFIG.WORK_END_HOUR;
  }

  startAll(): void {
    this.jobs.forEach(job => job.start());
    logger.info('All cron jobs started');
  }

  stopAll(): void {
    this.jobs.forEach(job => job.stop());
    logger.info('All cron jobs stopped');
  }

  getJobsStatus(): any[] {
    return this.jobs.map((job, index) => ({
      id: index,
      running: job.running || false
    }));
  }

  // Método para execução manual (útil para testes)
  async executeManualDispatch(): Promise<void> {
    logger.info('Manual dispatch requested');
    await this.processScheduledContacts();
  }
}

const schedulerService = new SchedulerService();

// Função para configurar jobs (chamada no index.ts)
export function setupCronJobs(): void {
  schedulerService.setupCronJobs();
}

// Função para parar todos os jobs (útil para shutdown graceful)
export function stopAllJobs(): void {
  schedulerService.stopAll();
}

// Função para execução manual
export function executeManualDispatch(): Promise<void> {
  return schedulerService.executeManualDispatch();
}

// Função para obter status dos jobs
export function getJobsStatus(): any[] {
  return schedulerService.getJobsStatus();
}
