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

  // 🎯 PERSISTÊNCIA OTIMIZADA - Apenas clientes no funil ativo
  async createOrUpdateLead(
    id: string,
    nome: string,
    telefone: string,
    statusAtual: ContatoTipo
  ): Promise<Lead | null> {
    try {
      const existingLead = await this.getLeadById(id);
      
      if (existingLead) {
        // ✅ ATUALIZAR lead existente (mantém no funil)
        await database.run(`
          UPDATE leads 
          SET nome = ?, telefone = ?, status_atual = ?, ativo = 1, data_ultima_atualizacao = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [nome, telefone, statusAtual, id]);
        
        logCrmAction(id, 'LEAD_UPDATED', `${nome} - Status: ${statusAtual}`);
      } else {
        // ✅ CRIAR novo lead (ativo no funil)
        await database.run(`
          INSERT INTO leads (id, nome, telefone, status_atual, ativo)
          VALUES (?, ?, ?, ?, 1)
        `, [id, nome, telefone, statusAtual]);
        
        logCrmAction(id, 'LEAD_CREATED', `${nome} - Entrou no funil: ${statusAtual}`);
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

  // ⚠️ MÉTODO REMOVIDO - Agora o cálculo é feito diretamente no webhook
  // A data +24h é calculada e marcada pelo webhookController.calculateNext24Hours()

  // 🎯 DESATIVAR lead do funil (quando cliente responde)
  async markAsWaitingCall(leadId: string): Promise<boolean> {
    try {
      // ✅ DESATIVAR no banco (sai do funil automático)
      await database.run(`
        UPDATE leads 
        SET ativo = 0, proximo_disparo = NULL, data_ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [leadId]);

      logCrmAction(leadId, 'REMOVED_FROM_FUNNEL', 'Lead removido do funil automático');
      return true;
    } catch (error) {
      logger.error(`Error removing lead ${leadId} from funnel:`, error);
      return false;
    }
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

  // 👥 OBTER TODOS OS LEADS ATIVOS (para administração)
  async getAllActiveLeads(): Promise<Lead[]> {
    try {
      const rows = await database.all<any>(`
        SELECT * FROM leads 
        WHERE ativo = 1 
        ORDER BY data_criacao DESC
      `);

      return rows.map(row => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        statusAtual: row.status_atual as ContatoTipo,
        proximoDisparo: row.proximo_disparo ? new Date(row.proximo_disparo) : null,
        tentativas: row.tentativas,
        dataCriacao: new Date(row.data_criacao),
        dataUltimaAtualizacao: new Date(row.data_ultima_atualizacao),
        ativo: Boolean(row.ativo)
      }));
    } catch (error) {
      logger.error('Error getting all active leads:', error);
      return [];
    }
  }

  // 🎯 OBTER LEADS ATIVOS NO FUNIL (com próximo contato marcado)
  async getActiveLeads(): Promise<Lead[]> {
    try {
      const rows = await database.all<any>(`
        SELECT * FROM leads 
        WHERE ativo = 1 
        AND proximo_disparo IS NOT NULL
        AND proximo_disparo != ''
        ORDER BY proximo_disparo ASC, data_criacao DESC
      `);

      return rows.map(row => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        statusAtual: row.status_atual as ContatoTipo,
        proximoDisparo: row.proximo_disparo ? new Date(row.proximo_disparo) : null,
        tentativas: row.tentativas,
        dataCriacao: new Date(row.data_criacao),
        dataUltimaAtualizacao: new Date(row.data_ultima_atualizacao),
        ativo: Boolean(row.ativo)
      }));
    } catch (error) {
      logger.error('Error getting active leads:', error);
      return [];
    }
  }
}

export const leadService = new LeadService();
