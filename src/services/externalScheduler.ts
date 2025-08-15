import { logger, logCrmAction } from '../utils/logger';
import { leadService } from './leadService';
import { contactService } from './contactService';

/**
 * 🎯 EXTERNAL SCHEDULER - Estratégia robusta para Vercel Hobby
 * 
 * Esta implementação resolve as limitações do Vercel usando serviços externos:
 * 1. EasyCron (gratuito) - 20 cron jobs gratuitos
 * 2. cron-job.org (gratuito) - cron jobs ilimitados
 * 3. GitHub Actions (gratuito) - scheduled workflows
 * 4. Render.com cron (gratuito) - cron jobs
 */

interface SchedulingConfig {
  service: 'easycron' | 'cronjob' | 'github' | 'render';
  endpoint: string;
  interval: string;
  description: string;
}

class ExternalScheduler {
  private baseUrl: string;
  private isProcessing: boolean = false;

  constructor() {
    // URL base da aplicação
    this.baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.BASE_URL || 'http://localhost:3002';
  }

  /**
   * 🎯 ENDPOINT PRINCIPAL: Processa contatos pendentes
   * Este endpoint será chamado por serviços externos de cron
   */
  async processScheduledContacts(): Promise<{
    success: boolean;
    processed: number;
    pending: number;
    details: any[];
    timestamp: string;
  }> {
    if (this.isProcessing) {
      logger.warn('ExternalScheduler: Processamento já em andamento, ignorando chamada');
      return {
        success: false,
        processed: 0,
        pending: 0,
        details: ['Processamento já em andamento'],
        timestamp: new Date().toISOString()
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      logger.info('🔄 ExternalScheduler: Iniciando processamento de contatos agendados');
      
      // Busca leads pendentes para disparo
      const leadsForDispatch = await leadService.getLeadsForDispatch();
      
      if (leadsForDispatch.length === 0) {
        logger.info('ExternalScheduler: Nenhum contato pendente para processamento');
        return {
          success: true,
          processed: 0,
          pending: 0,
          details: ['Nenhum contato pendente'],
          timestamp: new Date().toISOString()
        };
      }

      logger.info(`ExternalScheduler: ${leadsForDispatch.length} contatos encontrados para verificação`);

      let processedCount = 0;
      const details: any[] = [];
      const now = new Date();

      // Processa cada lead
      for (const lead of leadsForDispatch) {
        if (!lead.proximoDisparo) {
          logger.warn(`Lead ${lead.id} sem proximoDisparo, ignorando`);
          continue;
        }
        const scheduledTime = new Date(lead.proximoDisparo);
        
        // Verifica se chegou a hora do contato
        if (now >= scheduledTime) {
          const delayMinutes = Math.round((now.getTime() - scheduledTime.getTime()) / (1000 * 60));
          
          logger.info(`⏰ Processando contato: ${lead.nome} (${lead.statusAtual}), delay: ${delayMinutes}min`);
          
          try {
            // 🎯 PROCESSA O CONTATO COMPLETO
            const success = await contactService.processContactDispatch(lead);
            
            if (success) {
              processedCount++;
              
              await logCrmAction(lead.id, 'AUTO_CONTACT_SENT', 
                `Contato ${lead.statusAtual} enviado automaticamente via ExternalScheduler`, true, {
                  scheduledTime: scheduledTime.toISOString(),
                  actualTime: now.toISOString(),
                  delayMinutes,
                  triggerType: 'external_scheduler',
                  processingDuration: Date.now() - startTime
                });

              details.push({
                leadId: lead.id,
                nome: lead.nome,
                status: lead.statusAtual,
                result: 'success',
                delayMinutes,
                scheduledTime: scheduledTime.toISOString()
              });

              logger.info(`✅ Contato processado com sucesso: ${lead.nome}`);
            } else {
              details.push({
                leadId: lead.id,
                nome: lead.nome,
                status: lead.statusAtual,
                result: 'failed',
                delayMinutes,
                scheduledTime: scheduledTime.toISOString(),
                error: 'Contact dispatch failed'
              });

              logger.warn(`❌ Falha ao processar contato: ${lead.nome}`);
            }
            
            // Delay entre envios para não sobrecarregar APIs
            await this.delay(3000);
            
          } catch (error) {
            logger.error(`Erro ao processar contato ${lead.id}:`, error);
            
            details.push({
              leadId: lead.id,
              nome: lead.nome,
              status: lead.statusAtual,
              result: 'error',
              delayMinutes,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        } else {
          // Contato ainda não está na hora
          const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
          logger.debug(`⏳ Contato ${lead.nome} agendado para ${minutesUntil} minutos`);
        }
      }

      const totalTime = Date.now() - startTime;
      const pendingCount = leadsForDispatch.length - processedCount;

      logger.info(`🎯 ExternalScheduler concluído: ${processedCount} processados, ${pendingCount} pendentes, ${totalTime}ms`);

      return {
        success: true,
        processed: processedCount,
        pending: pendingCount,
        details,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erro no ExternalScheduler:', error);
      
      await logCrmAction('system', 'EXTERNAL_SCHEDULER_ERROR', 
        `Erro no processamento externo: ${error}`, false);

      return {
        success: false,
        processed: 0,
        pending: 0,
        details: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 🎯 CONFIGURAÇÃO DOS SERVIÇOS EXTERNOS
   * Retorna instruções para configurar cron jobs externos
   */
  getExternalSchedulingConfig(): SchedulingConfig[] {
    const configs: SchedulingConfig[] = [
      {
        service: 'easycron',
        endpoint: `${this.baseUrl}/api/external-scheduler/process`,
        interval: '*/5 * * * *', // A cada 5 minutos durante horário comercial
        description: 'EasyCron.com - 20 jobs gratuitos, interface amigável'
      },
      {
        service: 'cronjob',
        endpoint: `${this.baseUrl}/api/external-scheduler/process`,
        interval: '*/5 * * * *',
        description: 'cron-job.org - Jobs ilimitados gratuitos'
      },
      {
        service: 'github',
        endpoint: `${this.baseUrl}/api/external-scheduler/process`,
        interval: '*/10 * * * *', // GitHub Actions: mais conservador
        description: 'GitHub Actions - Scheduled workflows (2000 min/mês grátis)'
      },
      {
        service: 'render',
        endpoint: `${this.baseUrl}/api/external-scheduler/process`,
        interval: '*/15 * * * *',
        description: 'Render.com - Cron jobs gratuitos'
      }
    ];

    return configs;
  }

  /**
   * 🎯 HEALTH CHECK para serviços externos
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    system: any;
    nextScheduled: any[];
  }> {
    try {
      const leadsForDispatch = await leadService.getLeadsForDispatch();
      const now = new Date();
      
      const nextScheduled = leadsForDispatch
        .filter(lead => lead.proximoDisparo && new Date(lead.proximoDisparo) > now)
        .slice(0, 5)
        .map(lead => ({
          leadId: lead.id,
          nome: lead.nome,
          status: lead.statusAtual,
          scheduledFor: lead.proximoDisparo,
          minutesUntil: lead.proximoDisparo ? Math.round((new Date(lead.proximoDisparo).getTime() - now.getTime()) / (1000 * 60)) : 0
        }));

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        system: {
          isProcessing: this.isProcessing,
          baseUrl: this.baseUrl,
          pendingContacts: leadsForDispatch.length,
          timezone: 'America/Sao_Paulo'
        },
        nextScheduled
      };
    } catch (error) {
      logger.error('Erro no health check:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        system: { error: error instanceof Error ? error.message : 'Unknown error' },
        nextScheduled: []
      };
    }
  }

  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const externalScheduler = new ExternalScheduler();
