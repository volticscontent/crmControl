import { Request, Response } from 'express';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { mondayService } from '../services/mondayService';
import { leadService } from '../services/leadService';
import { evolutionService } from '../services/evolutionService';
// import { contactService } from '../services/contactService'; // Removido
import { MondayWebhookPayload, EvolutionWebhookPayload, ContatoTipo } from '../types';
import { logger, logCrmAction } from '../utils/logger';
import { MONDAY_COLUMNS, MONDAY_STATUS } from '../config/constants';

class WebhookController {
  // Webhook do Monday.com
  mondayWebhook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    // Sistema de challenge do Monday.com
    // Quando você configura o webhook no Monday.com, ele envia um challenge
    // que precisamos retornar para validar a URL
    const challenge = req.body.challenge;
    if (challenge) {
      logger.info('Monday webhook challenge received:', { challenge });
      return res.status(200).json({
        challenge: challenge
      });
    }

    const payload: MondayWebhookPayload = req.body;
    
    // Validação básica da estrutura do payload
    if (!payload || !payload.event) {
      logger.warn('Invalid Monday webhook payload received:', req.body);
      return res.status(400).json({ message: 'Invalid payload structure' });
    }
    
    logger.info('Monday webhook received:', { 
      event: payload.event.type,
      itemId: payload.event.pulseId,
      columnId: payload.event.columnId,
      fullPayload: payload,
      eventValue: payload.event.value,
      timestamp: new Date().toISOString()
    });

    // Verifica se é mudança na coluna de status "Contato SDR Realizado"
    if (payload.event.columnId !== MONDAY_COLUMNS.CONTATO_SDR_REALIZADO) {
      logger.info('Event ignored - not target column', { 
        receivedColumnId: payload.event.columnId,
        targetColumnId: MONDAY_COLUMNS.CONTATO_SDR_REALIZADO,
        reason: 'Column ID mismatch'
      });
      return res.status(200).json({ message: 'Event ignored - not the target column' });
    }

    const itemId = payload.event.pulseId.toString();
    const newStatus = payload.event.value?.label?.text;

    logger.info('Processing status change', {
      itemId,
      newStatus,
      hasValue: !!payload.event.value,
      hasLabel: !!payload.event.value?.label,
      fullValue: payload.event.value
    });

    if (!newStatus) {
      logger.warn('Event ignored - no status value', { 
        itemId,
        value: payload.event.value
      });
      return res.status(200).json({ message: 'Event ignored - no status value' });
    }

    // Busca informações completas do item no Monday
    let mondayItem;
    try {
      mondayItem = await mondayService.getItem(itemId);
    } catch (error) {
      logger.error(`Failed to fetch Monday item ${itemId}:`, error);
      logCrmAction(itemId, 'WEBHOOK_ERROR', `Erro ao buscar item no Monday: ${error}`, false);
      return res.status(200).json({ 
        message: 'Failed to fetch item from Monday',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (!mondayItem) {
      logger.warn(`Item ${itemId} not found in Monday`);
      logCrmAction(itemId, 'WEBHOOK_ERROR', 'Item não encontrado no Monday', false);
      return res.status(200).json({ message: 'Item not found in Monday' });
    }

    const nome = mondayItem.name;
    const telefone = mondayService.getPhoneNumber(mondayItem);

    // Validações mais robustas
    if (!nome || nome.trim() === '') {
      logger.warn(`No name found for item ${itemId}`);
      logCrmAction(itemId, 'WEBHOOK_ERROR', 'Nome não encontrado no item', false);
      return res.status(200).json({ message: 'No name found for item' });
    }

    if (!telefone || telefone.trim() === '') {
      logger.warn(`No phone number found for item ${itemId}`);
      logCrmAction(itemId, 'WEBHOOK_ERROR', 'Telefone não encontrado no item', false);
      return res.status(200).json({ message: 'No phone number found' });
    }

    // Validação básica do formato do telefone
    const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(telefone)) {
      logger.warn(`Invalid phone format for item ${itemId}: ${telefone}`);
      logCrmAction(itemId, 'WEBHOOK_ERROR', `Formato de telefone inválido: ${telefone}`, false);
      return res.status(200).json({ message: 'Invalid phone number format' });
    }

    // Valida se é um status de contato válido
    const validStatuses = [
      MONDAY_STATUS.PRIMEIRO_CONTATO,
      MONDAY_STATUS.SEGUNDO_CONTATO,
      MONDAY_STATUS.TERCEIRO_CONTATO,
      MONDAY_STATUS.ULTIMO_CONTATO
    ];

    if (!validStatuses.includes(newStatus)) {
      logger.info('Event ignored - not a contact status', { 
        itemId, 
        receivedStatus: newStatus, 
        validStatuses 
      });
      return res.status(200).json({ message: 'Event ignored - not a contact status' });
    }

    // Validação adicional para garantir que é um ContatoTipo válido
    const contatoTipo = newStatus as ContatoTipo;
    const tiposValidos: ContatoTipo[] = ['Primeiro Contato', 'Segundo Contato', 'Terceiro Contato', 'Ultimo Contato'];
    
    if (!tiposValidos.includes(contatoTipo)) {
      logger.warn(`Invalid contact type for item ${itemId}: ${newStatus}`, {
        receivedStatus: newStatus,
        validTypes: tiposValidos
      });
      return res.status(200).json({ message: 'Invalid contact type' });
    }

    try {
      // Cria ou atualiza lead no banco local
      const lead = await leadService.createOrUpdateLead(
        itemId,
        nome,
        telefone,
        contatoTipo
      );

      if (!lead) {
        throw new CustomError('Failed to create/update lead', 500);
      }

      // Processa o disparo do contato
      const success = await this.processContactDispatch(lead);
      
      if (success) {
        logCrmAction(itemId, 'WEBHOOK_PROCESSED', `Monday webhook processado com sucesso: ${newStatus}`);
      } else {
        logCrmAction(itemId, 'WEBHOOK_PROCESSED', `Erro ao processar Monday webhook: ${newStatus}`, false);
      }

      res.status(200).json({ 
        message: 'Webhook processed successfully',
        success,
        leadId: itemId
      });

    } catch (error) {
      logger.error('Error processing Monday webhook:', error);
      logCrmAction(itemId, 'WEBHOOK_ERROR', `Erro: ${error}`, false);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Webhook da Evolution API (WhatsApp)
  evolutionWebhook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const payload: EvolutionWebhookPayload = req.body;
    
    logger.info('Evolution webhook received:', {
      instance: payload.instance,
      from: payload.data.key.remoteJid,
      fromMe: payload.data.key.fromMe
    });

    // Ignora mensagens enviadas por nós
    if (payload.data.key.fromMe) {
      return res.status(200).json({ message: 'Message sent by us - ignored' });
    }

    const phoneNumber = payload.data.key.remoteJid.split('@')[0]; // Remove @c.us
    const messageText = payload.data.message.conversation || 
                       payload.data.message.extendedTextMessage?.text || '';

    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({ message: 'Invalid phone number in payload' });
    }

    // Normaliza o número de telefone
    const normalizedPhone = evolutionService.normalizePhoneNumber(phoneNumber);

    try {
      // Processa resposta do cliente
      const success = await this.handleClientResponse(normalizedPhone, messageText);

      if (success) {
        logger.info(`Client response processed successfully for phone ${normalizedPhone}`);
      } else {
        logger.info(`Client response ignored or failed for phone ${normalizedPhone}`);
      }

      res.status(200).json({ 
        message: 'Client response processed',
        success,
        phone: normalizedPhone,
        action: success ? 'marked_as_waiting_call' : 'ignored_or_failed'
      });

    } catch (error) {
      logger.error('Error processing Evolution webhook:', error);
      logCrmAction(phoneNumber, 'EVOLUTION_WEBHOOK_ERROR', `Erro: ${error}`, false);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
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
      status.services.evolution = await evolutionService.isConnected();
    } catch (error) {
      logger.warn('Evolution service health check failed:', error);
    }

    res.status(200).json(status);
  });

  // Processa disparo de contato
  private async processContactDispatch(lead: any): Promise<boolean> {
    try {
      logger.info(`Processing contact dispatch for lead ${lead.id}`);
      // Implementar lógica de disparo
      return true;
    } catch (error) {
      logger.error('Error processing contact dispatch:', error);
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
