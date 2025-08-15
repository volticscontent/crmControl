import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger, logCrmAction } from '../utils/logger';
import { EvolutionSendMessagePayload } from '../types';
import { PATHS } from '../config/constants';

class EvolutionService {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || '';
    
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      logger.warn('Evolution API credentials not configured. WhatsApp integration will be disabled.');
    }
  }

  private async makeRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      logger.warn('Evolution API not configured - skipping request');
      return null;
    }

    try {
      const config = {
        method,
        url: `${this.apiUrl}/${endpoint}`,
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        data: method === 'POST' ? data : undefined
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('Evolution API request failed:', error);
      throw error;
    }
  }

  async sendTextMessage(phone: string, text: string, skipRetry: boolean = false): Promise<boolean> {
    try {
      // Remove caracteres especiais do telefone
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload: EvolutionSendMessagePayload = {
        number: cleanPhone,
        text
      };

      await this.makeRequest(`message/sendText/${this.instanceName}`, payload);
      
      logCrmAction(phone, 'SEND_TEXT_MESSAGE', `Mensagem enviada: ${text.substring(0, 100)}...`);
      return true;
    } catch (error) {
      logger.error(`Error sending text message to ${phone}:`, error);
      logCrmAction(phone, 'SEND_TEXT_MESSAGE', `Erro ao enviar mensagem: ${error}`, false);
      
      // Se não deve pular retry e o erro é recuperável, lança para retry handler
      if (!skipRetry && this.isRetryableError(error)) {
        throw error;
      }
      
      return false;
    }
  }

  async sendAudioMessage(phone: string, audioPath: string, caption?: string, skipRetry: boolean = false): Promise<boolean> {
    try {
      // Remove caracteres especiais do telefone
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Lê o arquivo de áudio e converte para base64
      const audioFullPath = path.join(PATHS.ASSETS, audioPath);
      
      if (!fs.existsSync(audioFullPath)) {
        throw new Error(`Audio file not found: ${audioFullPath}`);
      }

      const audioBuffer = fs.readFileSync(audioFullPath);
      const audioBase64 = audioBuffer.toString('base64');
      
      const payload: EvolutionSendMessagePayload = {
        number: cleanPhone,
        media: {
          mediatype: 'audio',
          fileName: path.basename(audioPath),
          caption,
          media: audioBase64
        }
      };

      await this.makeRequest(`message/sendMedia/${this.instanceName}`, payload);
      
      logCrmAction(phone, 'SEND_AUDIO_MESSAGE', `Áudio enviado: ${audioPath}`);
      return true;
    } catch (error) {
      logger.error(`Error sending audio message to ${phone}:`, error);
      logCrmAction(phone, 'SEND_AUDIO_MESSAGE', `Erro ao enviar áudio: ${error}`, false);
      
      // Se não deve pular retry e o erro é recuperável, lança para retry handler
      if (!skipRetry && this.isRetryableError(error)) {
        throw error;
      }
      
      return false;
    }
  }

  async getInstanceInfo(): Promise<any> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      return null;
    }

    try {
      return await this.makeRequest(`instance/fetchInstances`, {}, 'GET');
    } catch (error) {
      logger.error('Error getting instance info:', error);
      return null;
    }
  }

  // Verifica se a instância está conectada
  async isConnected(): Promise<boolean> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      return false;
    }

    try {
      const instances = await this.getInstanceInfo();
      
      if (!instances || !Array.isArray(instances)) {
        return false;
      }

      const instance = instances.find((inst: any) => 
        inst && inst.instance && inst.instance.instanceName === this.instanceName
      );
      
      return instance && instance.instance.connectionStatus === 'open';
    } catch (error) {
      logger.error('Error checking connection status:', error);
      return false;
    }
  }

  // Normaliza número de telefone para formato internacional
  normalizePhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adiciona +55 (Brasil)
    if (!cleanPhone.startsWith('55') && cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone;
    }
    
    return cleanPhone;
  }

  // Valida se o número é válido para WhatsApp
  isValidWhatsAppNumber(phone: string): boolean {
    const cleanPhone = this.normalizePhoneNumber(phone);
    
    // Número brasileiro deve ter 13 dígitos (55 + DDD + número)
    if (cleanPhone.startsWith('55')) {
      return cleanPhone.length === 13;
    }
    
    // Outros países - validação básica
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  // Determina se um erro é recuperável (deve tentar novamente)
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.response?.status;

    // Erros de rede/timeout são recuperáveis
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('enotfound')) {
      return true;
    }

    // Status codes temporários são recuperáveis
    if (statusCode === 429 || // Rate limit
        statusCode === 502 || // Bad gateway
        statusCode === 503 || // Service unavailable
        statusCode === 504) { // Gateway timeout
      return true;
    }

    // Erros da Evolution API que são temporários
    if (errorMessage.includes('instance not connected') ||
        errorMessage.includes('qr code') ||
        errorMessage.includes('session not found')) {
      return true;
    }

    // Outros erros não são recuperáveis (número inválido, etc)
    return false;
  }
}

export const evolutionService = new EvolutionService();
