import { logger, logCrmAction } from '../utils/logger';
import { evolutionService } from './evolutionService';

interface ValidationResult {
  valid: boolean;
  fixed: boolean;
  issues: string[];
}

class EdgeCaseHandler {
  /**
   * Valida e corrige dados do Monday.com se necessário
   */
  async validateAndFixMondayData(leadId: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      fixed: false,
      issues: []
    };

    try {
      // Validação básica - pode ser expandida conforme necessário
      logger.info(`Validating Monday.com data for lead ${leadId}`);
      
      // Por enquanto, sempre considera válido
      // Futuras validações podem ser adicionadas aqui
      
      return result;
    } catch (error) {
      logger.error(`Error validating Monday.com data for lead ${leadId}:`, error);
      result.valid = false;
      result.issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Trata falhas da Evolution API com retry automático
   */
  async handleEvoApiFailure(
    phone: string, 
    message: string, 
    leadId: string, 
    audioFile?: string
  ): Promise<boolean> {
    try {
      logger.warn(`Attempting retry for Evolution API failure - Lead ${leadId}`);
      
      await logCrmAction(leadId, 'RETRY_ATTEMPT', `Tentando reenvio para ${phone}`, true, {
        phone,
        messageLength: message.length,
        hasAudio: !!audioFile
      });

      // Aguarda 3 segundos antes do retry
      await this.delay(3000);

      if (audioFile) {
        // Retry para áudio
        return await evolutionService.sendAudioMessage(phone, audioFile, message);
      } else {
        // Retry para texto
        return await evolutionService.sendTextMessage(phone, message); // skipRetry removido para evitar erro
      }
    } catch (error) {
      logger.error(`Retry failed for lead ${leadId}:`, error);
      await logCrmAction(leadId, 'RETRY_FAILED', `Falha no retry: ${error}`, false);
      return false;
    }
  }

  /**
   * Delay helper function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normaliza número de telefone para formato brasileiro
   */
  normalizePhoneNumber(phone: string): string {
    // Remove caracteres especiais
    let normalized = phone.replace(/[^\d]/g, '');
    
    // Se começar com 55 (código do Brasil), mantém
    if (normalized.startsWith('55') && normalized.length >= 12) {
      return normalized;
    }
    
    // Se não tiver código do país, adiciona 55
    if (normalized.length === 11 || normalized.length === 10) {
      return '55' + normalized;
    }
    
    return normalized;
  }

  /**
   * Verifica se o horário está dentro do horário comercial
   */
  isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Segunda a sexta (1-5) das 9h às 18h
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  /**
   * Calcula o próximo horário comercial
   */
  getNextBusinessTime(): Date {
    const now = new Date();
    const nextTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 horas
    
    // Se não for horário comercial, ajusta para próximo dia útil às 9h
    if (!this.isBusinessHours()) {
      nextTime.setHours(9, 0, 0, 0);
      
      // Se for fim de semana, vai para segunda
      const day = nextTime.getDay();
      if (day === 0) { // Domingo
        nextTime.setDate(nextTime.getDate() + 1); // Segunda
      } else if (day === 6) { // Sábado
        nextTime.setDate(nextTime.getDate() + 2); // Segunda
      }
    }
    
    return nextTime;
  }
}

export const edgeCaseHandler = new EdgeCaseHandler();
