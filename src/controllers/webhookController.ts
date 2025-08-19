import { Request, Response } from 'express';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { mondayService } from '../services/mondayService';
import { leadService } from '../services/leadService';
import { evolutionService } from '../services/evolutionService';
import { contactService } from '../services/contactService';
import { MondayWebhookPayload, EvolutionWebhookPayload, ContatoTipo } from '../types';
import { logger, logCrmAction } from '../utils/logger';
import { MONDAY_COLUMNS, MONDAY_STATUS } from '../config/constants';

class WebhookController {
  

  // 🎯 WEBHOOK SIMPLIFICADO - Interpreta payloads das automações Monday
  mondayWebhook = asyncHandler(async (req: Request, res: Response) => {
    // Challenge do Monday.com
    const challenge = req.body.challenge;
    if (challenge) {
      logger.info('Monday webhook challenge received:', { challenge });
      return res.status(200).json({ challenge });
    }

    const payload: MondayWebhookPayload = req.body;
    
    if (!payload?.event) {
      logger.warn('Invalid Monday webhook payload:', req.body);
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const { pulseId, columnId, value } = payload.event;
    const itemId = pulseId?.toString();
    const newStatus = value?.label?.text;

    logger.info('📥 Monday webhook:', { itemId, columnId, newStatus });

    // ✅ FILTRAR: Apenas coluna "Contato SDR Realizado"
    if (columnId !== 'color_mkt8t95b') {
      return res.status(200).json({ message: 'Ignored - not contact column' });
    }

    // ✅ FILTRAR: Apenas status de contato válidos
    const contactStatuses = ['Primeiro Contato', 'Segundo Contato', 'Terceiro Contato', 'Ultimo Contato'];
    if (!contactStatuses.includes(newStatus)) {
      return res.status(200).json({ message: 'Ignored - not contact status' });
    }

    try {
      // 🎯 BUSCAR dados do Monday
      const mondayItem = await mondayService.getItem(itemId);
      if (!mondayItem) {
        return res.status(200).json({ message: 'Item not found' });
      }

      const nome = mondayItem.name;
      const telefone = mondayService.getInstance().getPhoneNumber(mondayItem);

      if (!nome || !telefone) {
        logger.warn(`Missing data for ${itemId}:`, { nome, telefone });
        return res.status(200).json({ message: 'Missing name or phone' });
      }

      // 🎯 PROCESSAR contato
      const result = await this.processContact(itemId, nome, telefone, newStatus as ContatoTipo);
      
      return res.status(200).json({ 
        message: 'Processed successfully',
        success: result.success,
        action: result.action
      });

    } catch (error) {
      logger.error('Webhook processing error:', error);
      return res.status(500).json({ message: 'Processing failed' });
    }
  });

  // 🎯 WEBHOOK EVOLUTION SIMPLIFICADO - Resposta instantânea do cliente
  evolutionWebhook = asyncHandler(async (req: Request, res: Response) => {
    const payload: EvolutionWebhookPayload = req.body;
    
    // Ignora mensagens enviadas por nós
    if (payload.data.key.fromMe) {
      return res.status(200).json({ message: 'Ignored - sent by us' });
    }

    const phoneNumber = payload.data.key.remoteJid.split('@')[0];
    const messageText = payload.data.message.conversation || 
                       payload.data.message.extendedTextMessage?.text || '';

    logger.info('📱 Cliente respondeu:', { phone: phoneNumber, message: messageText });

    try {
      // 🎯 BUSCAR lead pelo telefone
      const normalizedPhone = evolutionService.getInstance().normalizePhoneNumber(phoneNumber || '');
      const lead = await leadService.getLeadByPhone(normalizedPhone);
      
      if (!lead) {
        logger.info(`No lead found for phone ${normalizedPhone}`);
        return res.status(200).json({ message: 'Lead not found' });
      }

      // 🎯 MARCAR INSTANTANEAMENTE como "Aguardando Ligação"
      await mondayService.updateStatus(lead.id, 'Aguardando Ligação');
      await mondayService.updateProximoContato(lead.id, null); // Remove data automação
      
      // 🎯 DESATIVAR no banco (sai do funil automático)
      await leadService.markAsWaitingCall(lead.id);
      
      logger.info(`✅ Cliente ${lead.nome} marcado como "Aguardando Ligação"`);
      logCrmAction(lead.id, 'CLIENT_RESPONDED', `Cliente respondeu: "${messageText}" - Status: Aguardando Ligação`);

      return res.status(200).json({ 
        message: 'Client response processed',
        action: 'marked_waiting_call',
        leadName: lead.nome
      });

    } catch (error) {
      logger.error('Evolution webhook error:', error);
      return res.status(500).json({ message: 'Processing failed' });
    }
  });

  // 🎯 ENDPOINT DE TESTE SIMPLIFICADO
  testMondayWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { itemId, nome, telefone, status, createNew } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: nome, telefone',
        optional: 'itemId (para leads existentes)',
        example: { nome: 'João Silva', telefone: '5511999999999', itemId: '123456789' }
      });
    }

    // Se createNew=true, criar lead REAL no Monday.com
    let finalItemId = itemId;
    let isRealMondayItem = false;
    
    if (createNew || !itemId) {
      if (createNew && nome && telefone) {
        logger.info('🆕 Criando lead REAL no Monday.com:', { nome, telefone });
        
        try {
          const createResult = await mondayService.createTestItem(nome, telefone);
          
          if (createResult.success && createResult.item) {
            finalItemId = createResult.item.id;
            isRealMondayItem = true;
            logger.info('✅ Lead criado no Monday com ID real:', {
              mondayId: finalItemId,
              nome,
              telefone
            });
          } else {
            logger.error('❌ Erro ao criar lead no Monday:', createResult.error);
            return res.status(500).json({
              success: false,
              error: 'Erro ao criar lead no Monday: ' + createResult.error,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error('❌ Erro fatal ao criar lead no Monday:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro fatal ao criar lead no Monday: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Fallback para ID virtual apenas se createNew=false
        finalItemId = itemId || `TEST_${Date.now()}`;
        logger.info('🆕 Usando ID virtual:', { 
          originalId: itemId, 
          generatedId: finalItemId, 
          createNew 
        });
      }
    }

    // Status padrão ou fornecido
    const contactStatus = status || 'Primeiro Contato';
    
    // Validar status se fornecido
    const validStatuses = ['Primeiro Contato', 'Segundo Contato', 'Terceiro Contato', 'Ultimo Contato'];
    if (!validStatuses.includes(contactStatus)) {
      return res.status(400).json({
        error: 'Status inválido',
        validStatuses,
        provided: contactStatus
      });
    }

    try {
      logger.info('🧪 Testando webhook:', { 
        originalItemId: itemId,
        finalItemId: finalItemId, 
        nome, 
        telefone, 
        status: contactStatus,
        isNewLead: createNew || !itemId
      });

      // ✅ PROCESSAR com status específico
      const result = await this.processContact(finalItemId, nome, telefone, contactStatus as ContatoTipo);

      return res.status(200).json({
        message: 'Teste executado com sucesso',
        success: result.success,
        action: result.action,
        contactType: contactStatus,
        itemId: finalItemId,
        isNewLead: createNew || !itemId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Test webhook error:', error);
      return res.status(500).json({
        error: 'Erro no teste',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check para os webhooks
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        monday: false,
        evolution: false
      }
    };

    try {
      // Testa conexão com Monday
      const testItem = await mondayService.getItem('test');
      status.services.monday = true; // Se não der erro, está funcionando
    } catch (error) {
      logger.warn('Monday service health check failed:', error);
    }

    try {
      // Testa conexão com Evolution
      status.services.evolution = await evolutionService.checkConnection();
    } catch (error) {
      logger.warn('Evolution service health check failed:', error);
    }

    res.status(200).json(status);
  });

  // 🎯 PROCESSADOR PRINCIPAL - Simplificado e otimizado
  private async processContact(itemId: string, nome: string, telefone: string, status: ContatoTipo): Promise<{success: boolean, action: string}> {
    try {
      logger.info(`🚀 Processando ${status} para ${nome}`, { itemId, telefone });

      // 1️⃣ SALVAR/ATUALIZAR no banco (apenas clientes no funil)
      const lead = await leadService.createOrUpdateLead(itemId, nome, telefone, status);
      if (!lead) {
        return { success: false, action: 'failed_to_save_lead' };
      }

      // 2️⃣ ENVIAR contato via WhatsApp
      const contactSent = await contactService.processContactDispatch(lead);
      if (!contactSent) {
        return { success: false, action: 'failed_to_send_contact' };
      }

      // 3️⃣ MARCAR data +24h (apenas se não for último contato)
      if (status !== 'Ultimo Contato') {
        const nextDate = this.calculateNext24Hours();
        await mondayService.updateProximoContato(itemId, nextDate);
        
        logCrmAction(itemId, 'CONTACT_SENT_SCHEDULED', `${status} enviado + data marcada: ${nextDate.toLocaleString()}`);
        return { success: true, action: 'sent_and_scheduled' };
      } else {
        // Último contato: remove data e aguarda automação "Não Respondeu"
        await mondayService.updateProximoContato(itemId, null);
        
        logCrmAction(itemId, 'LAST_CONTACT_SENT', `${status} enviado - aguardando "Não Respondeu"`);
        return { success: true, action: 'last_contact_sent' };
      }

    } catch (error) {
      logger.error('Error processing contact:', error);
      logCrmAction(itemId, 'PROCESS_CONTACT_ERROR', `Erro: ${error}`, false);
      return { success: false, action: 'processing_error' };
    }
  }

  // 🎯 CÁLCULO SIMPLIFICADO +24h em horário comercial
  private calculateNext24Hours(): Date {
    const now = new Date();
    const next = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +24 horas
    
    // Se for fim de semana, vai para segunda 9h
    const dayOfWeek = next.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Domingo ou Sábado
      const monday = new Date(next);
      monday.setDate(next.getDate() + (dayOfWeek === 0 ? 1 : 2));
      monday.setHours(9, 0, 0, 0);
      return monday;
    }
    
    // Se for antes de 9h, marcar para 9h
    if (next.getHours() < 9) {
      next.setHours(9, 0, 0, 0);
    }
    
    // Se for depois de 18h, marcar para próximo dia 9h
    if (next.getHours() >= 18) {
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      
      // Se o próximo dia for fim de semana
      const nextDayOfWeek = next.getDay();
      if (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
        next.setDate(next.getDate() + (nextDayOfWeek === 0 ? 1 : 2));
      }
    }
    
    return next;
  }

  // Método legado mantido para compatibilidade
  private async processContactDispatch(lead: any): Promise<boolean> {
    try {
      logger.info(`Processing contact dispatch for lead ${lead.id}`, {
        leadId: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        statusAtual: lead.statusAtual
      });

      // Chama o contactService para processar o disparo
      const success = await contactService.processContactDispatch(lead);
      
      if (success) {
        logger.info(`Contact dispatch successful for lead ${lead.id}`);
        logCrmAction(lead.id, 'CONTACT_DISPATCHED_WEBHOOK', `Disparo realizado via webhook: ${lead.statusAtual}`);
      } else {
        logger.warn(`Contact dispatch failed for lead ${lead.id}`);
        logCrmAction(lead.id, 'CONTACT_DISPATCH_FAILED', `Falha no disparo via webhook: ${lead.statusAtual}`, false);
      }

      return success;
    } catch (error) {
      logger.error('Error processing contact dispatch:', error);
      logCrmAction(lead.id, 'CONTACT_DISPATCH_ERROR', `Erro no processamento: ${error}`, false);
      return false;
    }
  }

  // Processa resposta do cliente
  private async handleClientResponse(phoneNumber: string, messageText: string): Promise<boolean> {
    try {
      // Busca lead pelo telefone
      const lead = await leadService.getLeadByPhone(phoneNumber);
      
      if (!lead) {
        logger.info(`No lead found for phone ${phoneNumber}`);
        return false;
      }

      // Para a sequência automática
      // await leadService.stopSequence(lead.id); // Implementar método
      
      // Atualiza status no Monday.com
      await mondayService.updateStatus(lead.id, 'Aguardando Ligação');
      
      // Log da ação
      logCrmAction(lead.id, 'CLIENT_RESPONSE', `Cliente respondeu: ${messageText}`, true);
      
      return true;
    } catch (error) {
      logger.error('Error handling client response:', error);
      return false;
    }
  }
}

export const webhookController = new WebhookController();
