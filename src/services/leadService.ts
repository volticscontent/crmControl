import moment from 'moment-timezone';
import { database } from '../database/connection';
import { mondayService } from './mondayService';
import { Lead, ContatoTipo } from '../types';
import { logger, logCrmAction } from '../utils/logger';
import { DEFAULT_CONFIG, CONTATOS_CONFIG, MONDAY_STATUS } from '../config/constants';

class LeadService {
  private timezone: string;

  constructor() {
    this.timezone = process.env.TIMEZONE || DEFAULT_CONFIG.TIMEZONE;
  }

  async createOrUpdateLead(
    id: string,
    nome: string,
    telefone: string,
    statusAtual: ContatoTipo
  ): Promise<Lead | null> {
    try {
      // Verifica se o lead já existe
      const existingLead = await this.getLeadById(id);
      
      if (existingLead) {
        // Atualiza lead existente
        await database.run(`
          UPDATE leads 
          SET nome = ?, telefone = ?, status_atual = ?, data_ultima_atualizacao = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [nome, telefone, statusAtual, id]);
        
        logCrmAction(id, 'UPDATE_LEAD', `Lead atualizado: ${nome}`);
      } else {
        // Cria novo lead
        await database.run(`
          INSERT INTO leads (id, nome, telefone, status_atual)
          VALUES (?, ?, ?, ?)
        `, [id, nome, telefone, statusAtual]);
        
        logCrmAction(id, 'CREATE_LEAD', `Novo lead criado: ${nome}`);
      }

      return await this.getLeadById(id);
    } catch (error) {
      logger.error(`Error creating/updating lead ${id}:`, error);
      return null;
    }
  }

  async getLeadById(id: string): Promise<Lead | null> {
    try {
      const row = await database.get<any>(`
        SELECT * FROM leads WHERE id = ?
      `, [id]);

      if (!row) return null;

      return {
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        statusAtual: row.status_atual as ContatoTipo,
        proximoDisparo: row.proximo_disparo ? new Date(row.proximo_disparo) : null,
        tentativas: row.tentativas,
        dataCriacao: new Date(row.data_criacao),
        dataUltimaAtualizacao: new Date(row.data_ultima_atualizacao),
        ativo: Boolean(row.ativo)
      };
    } catch (error) {
      logger.error(`Error getting lead by ID ${id}:`, error);
      return null;
    }
  }

  async getLeadByPhone(telefone: string): Promise<Lead | null> {
    try {
      const row = await database.get<any>(`
        SELECT * FROM leads WHERE telefone = ? AND ativo = 1
      `, [telefone]);

      if (!row) return null;

      return {
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        statusAtual: row.status_atual as ContatoTipo,
        proximoDisparo: row.proximo_disparo ? new Date(row.proximo_disparo) : null,
        tentativas: row.tentativas,
        dataCriacao: new Date(row.data_criacao),
        dataUltimaAtualizacao: new Date(row.data_ultima_atualizacao),
        ativo: Boolean(row.ativo)
      };
    } catch (error) {
      logger.error(`Error getting lead by phone ${telefone}:`, error);
      return null;
    }
  }

  async scheduleNextContact(leadId: string): Promise<boolean> {
    try {
      const lead = await this.getLeadById(leadId);
      if (!lead) return false;

      const config = CONTATOS_CONFIG[lead.statusAtual];
      
      // Se não há próximo tipo de contato, é o último
      if (!config.proximoTipo) {
        // Marca como "Não Respondeu" no Monday
        await mondayService.updateStatus(leadId, MONDAY_STATUS.NAO_RESPONDEU);
        await mondayService.updateProximoContato(leadId, null);
        
        // Desativa o lead
        await database.run(`
          UPDATE leads 
          SET ativo = 0, data_ultima_atualizacao = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [leadId]);
        
        logCrmAction(leadId, 'COMPLETE_SEQUENCE', 'Sequência de contatos finalizada - marcado como não respondeu');
        return true;
      }

      // Calcula próximo disparo (+24 horas em horário comercial)
      const proximoDisparo = this.calculateNextBusinessTime();

      logger.info('Agendando próximo contato', {
        leadId,
        currentStatus: lead.statusAtual,
        nextStatus: config.proximoTipo,
        nextDispatch: proximoDisparo.toISOString(),
        nextDispatchFormatted: proximoDisparo.toLocaleString('pt-BR', { timeZone: this.timezone })
      });

      // Atualiza status no Monday para próximo contato
      await mondayService.updateStatus(leadId, config.proximoTipo);
      await mondayService.updateProximoContato(leadId, proximoDisparo);

      // Atualiza no banco local
      await database.run(`
        UPDATE leads 
        SET status_atual = ?, proximo_disparo = ?, data_ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [config.proximoTipo, proximoDisparo.toISOString(), leadId]);

      logCrmAction(leadId, 'SCHEDULE_NEXT_CONTACT', 
        `Próximo contato agendado: ${config.proximoTipo} em ${proximoDisparo.toLocaleString()}`);

      return true;
    } catch (error) {
      logger.error(`Error scheduling next contact for lead ${leadId}:`, error);
      return false;
    }
  }

  async markAsWaitingCall(leadId: string): Promise<boolean> {
    try {
      // Atualiza no Monday
      await mondayService.setAguardandoLigacao(leadId);

      // Desativa no banco local (para parar sequência automática)
      await database.run(`
        UPDATE leads 
        SET ativo = 0, proximo_disparo = NULL, data_ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [leadId]);

      logCrmAction(leadId, 'MARK_WAITING_CALL', 'Lead marcado como aguardando ligação');
      return true;
    } catch (error) {
      logger.error(`Error marking lead ${leadId} as waiting call:`, error);
      return false;
    }
  }

  async getLeadsForDispatch(): Promise<Lead[]> {
    try {
      const now = moment().tz(this.timezone);
      
      const rows = await database.all<any>(`
        SELECT * FROM leads 
        WHERE ativo = 1 
        AND proximo_disparo IS NOT NULL 
        AND datetime(proximo_disparo) <= datetime('now')
        ORDER BY proximo_disparo ASC
      `);

      return rows.map(row => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        statusAtual: row.status_atual as ContatoTipo,
        proximoDisparo: new Date(row.proximo_disparo),
        tentativas: row.tentativas,
        dataCriacao: new Date(row.data_criacao),
        dataUltimaAtualizacao: new Date(row.data_ultima_atualizacao),
        ativo: Boolean(row.ativo)
      }));
    } catch (error) {
      logger.error('Error getting leads for dispatch:', error);
      return [];
    }
  }

  private calculateNextBusinessTime(): Date {
    const now = moment().tz(this.timezone);
    let nextTime = now.clone().add(DEFAULT_CONFIG.INTERVALO_CONTATOS_HORAS, 'hours');

    // Log detalhado do cálculo
    const initialCalc = {
      now: now.format('YYYY-MM-DD HH:mm:ss'),
      timezone: this.timezone,
      intervalHours: DEFAULT_CONFIG.INTERVALO_CONTATOS_HORAS,
      initialNextTime: nextTime.format('YYYY-MM-DD HH:mm:ss'),
      dayOfWeek: nextTime.day(), // 0=Sunday, 1=Monday, etc
      hour: nextTime.hour()
    };

    // Ajusta para horário comercial se necessário
    const workStart = DEFAULT_CONFIG.WORK_START_HOUR;
    const workEnd = DEFAULT_CONFIG.WORK_END_HOUR;

    // Se for fim de semana, vai para segunda
    if (nextTime.day() === 0) { // Domingo
      nextTime = nextTime.day(1).hour(workStart).minute(0).second(0);
      logger.info('Ajuste fim de semana: Domingo → Segunda', { 
        from: initialCalc.initialNextTime, 
        to: nextTime.format('YYYY-MM-DD HH:mm:ss') 
      });
    } else if (nextTime.day() === 6) { // Sábado
      nextTime = nextTime.day(8).hour(workStart).minute(0).second(0); // day(8) = próxima segunda
      logger.info('Ajuste fim de semana: Sábado → Segunda', { 
        from: initialCalc.initialNextTime, 
        to: nextTime.format('YYYY-MM-DD HH:mm:ss') 
      });
    }

    // Se for antes do horário comercial
    if (nextTime.hour() < workStart) {
      const beforeAdjust = nextTime.format('YYYY-MM-DD HH:mm:ss');
      nextTime = nextTime.hour(workStart).minute(0).second(0);
      logger.info('Ajuste horário comercial: Antes do início', { 
        from: beforeAdjust, 
        to: nextTime.format('YYYY-MM-DD HH:mm:ss'),
        workStart: `${workStart}h`
      });
    }

    // Se for depois do horário comercial
    if (nextTime.hour() >= workEnd) {
      const beforeAdjust = nextTime.format('YYYY-MM-DD HH:mm:ss');
      nextTime = nextTime.add(1, 'day').hour(workStart).minute(0).second(0);
      
      // Verifica se o próximo dia é fim de semana
      if (nextTime.day() === 0) { // Domingo
        nextTime = nextTime.day(1);
      } else if (nextTime.day() === 6) { // Sábado
        nextTime = nextTime.day(8);
      }
      
      logger.info('Ajuste horário comercial: Após o fim', { 
        from: beforeAdjust, 
        to: nextTime.format('YYYY-MM-DD HH:mm:ss'),
        workEnd: `${workEnd}h`
      });
    }

    const finalResult = nextTime.toDate();
    
    logger.info('Cálculo próximo contato finalizado', {
      ...initialCalc,
      finalTime: nextTime.format('YYYY-MM-DD HH:mm:ss'),
      workHours: `${workStart}h às ${workEnd}h`,
      hoursFromNow: nextTime.diff(now, 'hours', true).toFixed(1)
    });

    return finalResult;
  }

  async incrementAttempts(leadId: string): Promise<void> {
    try {
      await database.run(`
        UPDATE leads 
        SET tentativas = tentativas + 1, data_ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [leadId]);
    } catch (error) {
      logger.error(`Error incrementing attempts for lead ${leadId}:`, error);
    }
  }

  async getLeadStats(): Promise<any> {
    try {
      const stats = await database.get<any>(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN ativo = 1 THEN 1 END) as ativos,
          COUNT(CASE WHEN status_atual = 'Primeiro Contato' THEN 1 END) as primeiro_contato,
          COUNT(CASE WHEN status_atual = 'Segundo Contato' THEN 1 END) as segundo_contato,
          COUNT(CASE WHEN status_atual = 'Terceiro Contato' THEN 1 END) as terceiro_contato,
          COUNT(CASE WHEN status_atual = 'Ultimo Contato' THEN 1 END) as ultimo_contato,
          COUNT(CASE WHEN proximo_disparo IS NOT NULL AND datetime(proximo_disparo) <= datetime('now') THEN 1 END) as pendentes
        FROM leads
      `);

      return stats;
    } catch (error) {
      logger.error('Error getting lead stats:', error);
      return null;
    }
  }
}

export const leadService = new LeadService();
