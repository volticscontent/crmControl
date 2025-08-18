import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger, logCrmAction } from '../utils/logger';
import { EvolutionSendMessagePayload } from '../types';
import { PATHS } from '../config/constants';
import { analyticsService } from './analyticsService';

class EvolutionService {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || '';
    
    // Debug das variáveis carregadas
    logger.info('Evolution API constructor:', {
      hasApiUrl: !!this.apiUrl,
      hasApiKey: !!this.apiKey,
      hasInstanceName: !!this.instanceName,
      apiUrl: this.apiUrl || 'EMPTY',
      instanceName: this.instanceName || 'EMPTY'
    });
    
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      logger.warn('Evolution API credentials not configured. WhatsApp integration will be disabled.');
    }
  }

  private async makeRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      logger.warn('Evolution API not configured - skipping request');
      return null;
    }

    const requestDetails = {
      timestamp: new Date().toISOString(),
      method,
      url: `${this.apiUrl}/${endpoint}`,
      endpoint,
      instance: this.instanceName,
      apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT_SET',
      data: data,
      headers: {
        'apikey': '[HIDDEN]',
        'Content-Type': 'application/json'
      }
    };

    try {
      logger.info('📤 Evolution API request:', requestDetails);

      const config = {
        method,
        url: `${this.apiUrl}/${endpoint}`,
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        data: method === 'POST' ? data : undefined
      };

      const startTime = Date.now();
      const response = await axios(config);
      const duration = Date.now() - startTime;

      const responseDetails = {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        data: response.data,
        headers: {
          'content-type': response.headers['content-type'],
          'content-length': response.headers['content-length']
        }
      };

      logger.info('✅ Evolution API response:', responseDetails);
      
      // Log para monitoramento
      if (data && data.number) {
        logCrmAction(data.number, 'EVOLUTION_API_REQUEST', 
          `${method} ${endpoint} - Status: ${response.status} - Duration: ${duration}ms`, 
          true, { request: requestDetails, response: responseDetails });
      }

      return response.data;
    } catch (error: any) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        duration: Date.now() - Date.now()
      };

      logger.error('❌ Evolution API request failed:', { request: requestDetails, error: errorDetails });
      
      // Log de erro para monitoramento
      if (data && data.number) {
        logCrmAction(data.number, 'EVOLUTION_API_ERROR', 
          `${method} ${endpoint} failed - Status: ${error.response?.status} - Error: ${error.message || 'Unknown error'}`, 
          false, { request: requestDetails, error: errorDetails });
      }

      throw error;
    }
  }

  async sendTextMessage(phone: string, text: string, skipRetry: boolean = false): Promise<boolean> {
    return await analyticsService.trackOperation(
      'evolution_api',
      'send_text_message',
      async () => {
        // Normaliza o número de telefone para o formato correto
        const cleanPhone = this.normalizePhoneNumber(phone);
        const whatsappNumber = `${cleanPhone}@s.whatsapp.net`;
        
        logger.info(`📤 Enviando mensagem para ${whatsappNumber} - Texto: ${text.substring(0, 50)}...`);
        
        const payload: EvolutionSendMessagePayload = {
          number: whatsappNumber,
          text
        };

        const response = await this.makeRequest(`message/sendText/${this.instanceName}`, payload);
        
        logger.info(`✅ Mensagem enviada com sucesso para ${phone}`);
        logCrmAction(phone, 'SEND_TEXT_MESSAGE', `Mensagem enviada: ${text.substring(0, 100)}...`);
        
        return true;
      },
      {
        phone,
        textLength: text.length,
        preview: text.substring(0, 50)
      }
    ).catch(error => {
      logger.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
      logCrmAction(phone, 'SEND_TEXT_MESSAGE', `Erro ao enviar mensagem: ${error}`, false);
      
      // Se não deve pular retry e o erro é recuperável, lança para retry handler
      if (!skipRetry && this.isRetryableError(error)) {
        throw error;
      }
      
      return false;
    });
  }

  async sendAudioMessage(phone: string, audioPath: string, caption?: string, skipRetry: boolean = false): Promise<boolean> {
    return await analyticsService.trackOperation(
      'evolution_api',
      'send_audio_message',
      async () => {
        // Normaliza o número de telefone para o formato correto
        const cleanPhone = this.normalizePhoneNumber(phone);
        const whatsappNumber = `${cleanPhone}@s.whatsapp.net`;
        
        // Lê o arquivo de áudio e converte para base64
        const audioFullPath = path.join(PATHS.ASSETS, audioPath);
        
        if (!fs.existsSync(audioFullPath)) {
          throw new Error(`Audio file not found: ${audioFullPath}`);
        }

        const audioBuffer = fs.readFileSync(audioFullPath);
        const audioBase64 = audioBuffer.toString('base64');
        const fileExtension = path.extname(audioPath).toLowerCase();
        
        logger.info(`🎵 Preparando áudio - Arquivo: ${audioPath}, Tamanho: ${audioBuffer.length} bytes, Extensão: ${fileExtension}`);
        
        // Tenta primeiro o endpoint específico de áudio da API v2
        try {
          const audioPayload: any = {
            number: whatsappNumber,
            audio: audioBase64,
            delay: 1000,
            linkPreview: false,
            mentionsEveryOne: false,
            ...(caption && { quoted: { message: { conversation: caption } } })
          };
          
          // Só adiciona mentioned se mentionsEveryOne for true
          if (audioPayload.mentionsEveryOne) {
            audioPayload.mentioned = [whatsappNumber];
          }
          
          logger.info(`🎵 Tentando envio via sendWhatsAppAudio para ${whatsappNumber}`);
          const response = await this.makeRequest(`message/sendWhatsAppAudio/${this.instanceName}`, audioPayload);
          
          logger.info(`✅ Áudio enviado com sucesso via sendWhatsAppAudio para ${phone}`);
          logCrmAction(phone, 'SEND_AUDIO_MESSAGE', `Áudio enviado via sendWhatsAppAudio: ${audioPath}`);
          return true;
          
        } catch (audioError) {
          logger.warn(`⚠️ Falha no sendWhatsAppAudio, tentando fallback com sendMedia:`, audioError);
          
          // Fallback: usa o endpoint de mídia geral
          const getMimeType = (ext: string): string => {
            switch (ext) {
              case '.mp3': return 'audio/mpeg';
              case '.ogg': return 'audio/ogg';
              case '.wav': return 'audio/wav';
              case '.m4a': return 'audio/mp4';
              case '.aac': return 'audio/aac';
              default: return 'audio/mpeg';
            }
          };
          
          const mediaPayload = {
            number: whatsappNumber,
            mediatype: 'audio',
            media: audioBase64,
            mimetype: getMimeType(fileExtension),
            fileName: path.basename(audioPath),
            ...(caption && { caption })
          };
          
          logger.info(`🎵 Tentando envio via sendMedia para ${whatsappNumber} - MIME: ${getMimeType(fileExtension)}`);
          const fallbackResponse = await this.makeRequest(`message/sendMedia/${this.instanceName}`, mediaPayload);
          
          logger.info(`✅ Áudio enviado com sucesso via sendMedia para ${phone}`);
          logCrmAction(phone, 'SEND_AUDIO_MESSAGE', `Áudio enviado via sendMedia (fallback): ${audioPath}`);
          return true;
        }
      },
      {
        phone,
        audioPath,
        hasCaption: !!caption,
        audioSize: fs.existsSync(path.join(PATHS.ASSETS, audioPath)) ? fs.statSync(path.join(PATHS.ASSETS, audioPath)).size : 0
      }
    ).catch(error => {
      logger.error(`❌ Erro ao enviar áudio para ${phone} (ambos endpoints falharam):`, error);
      logCrmAction(phone, 'SEND_AUDIO_MESSAGE', `Erro ao enviar áudio (ambos endpoints): ${error}`, false);
      
      // Se não deve pular retry e o erro é recuperável, lança para retry handler
      if (!skipRetry && this.isRetryableError(error)) {
        throw error;
      }
      
      return false;
    });
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
    
    logger.info(`🔍 Normalizando número: ${phone} -> ${cleanPhone} (${cleanPhone.length} dígitos)`);
    
    // Se não começar com código do país, adiciona +55 (Brasil)
    if (!cleanPhone.startsWith('55')) {
      if (cleanPhone.length === 11) {
        // Número brasileiro com 11 dígitos (DDD + 9 + 8 dígitos)
        cleanPhone = '55' + cleanPhone;
        logger.info(`📱 Adicionado código do país: ${cleanPhone}`);
      } else if (cleanPhone.length === 10) {
        // Número brasileiro com 10 dígitos (DDD + 8 dígitos) - adiciona 9
        const ddd = cleanPhone.substring(0, 2);
        const number = cleanPhone.substring(2);
        cleanPhone = '55' + ddd + '9' + number;
        logger.info(`📱 Adicionado código do país e 9: ${cleanPhone}`);
      } else if (cleanPhone.length >= 8 && cleanPhone.length <= 11) {
        // Para números com 8-11 dígitos, assume brasileiro e adiciona 55
        if (cleanPhone.length === 8) {
          // 8 dígitos: assume celular sem DDD, adiciona DDD padrão
          cleanPhone = '5511' + cleanPhone;
          logger.info(`📱 Adicionado código do país e DDD padrão: ${cleanPhone}`);
        } else if (cleanPhone.length === 9) {
          // 9 dígitos: assume celular sem DDD, adiciona DDD padrão
          cleanPhone = '5511' + cleanPhone;
          logger.info(`📱 Adicionado código do país e DDD padrão: ${cleanPhone}`);
        } else {
          // 10-11 dígitos: adiciona apenas código do país
          cleanPhone = '55' + cleanPhone;
          logger.info(`📱 Adicionado código do país: ${cleanPhone}`);
        }
      } else {
        logger.warn(`⚠️ Formato de número não reconhecido: ${cleanPhone} (${cleanPhone.length} dígitos)`);
        // Para números não reconhecidos, tenta adicionar 55 se for brasileiro
        if (cleanPhone.length > 0) {
          cleanPhone = '55' + cleanPhone;
          logger.info(`📱 Tentativa de correção adicionando código do país: ${cleanPhone}`);
        }
      }
    }
    
    // Validação final: número brasileiro deve ter 13 dígitos
    if (cleanPhone.startsWith('55') && cleanPhone.length !== 13) {
      logger.warn(`⚠️ Número brasileiro com formato incorreto: ${cleanPhone} (esperado: 13 dígitos)`);
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

  // 🔍 Verifica conexão com Evolution API
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        logger.warn('Evolution API não configurada completamente');
        return false;
      }

      const response = await this.makeRequest(`instance/connectionState/${this.instanceName}`, null, 'GET');
      return response?.instance?.state === 'open' || true; // Retorna true se conectado
    } catch (error) {
      logger.error('Evolution API connection check failed:', error);
      return false;
    }
  }

  // 📊 Métodos adicionais para testes
  async getInstanceStatus(): Promise<any> {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        return { state: 'not_configured' };
      }

      const response = await this.makeRequest(`instance/connectionState/${this.instanceName}`, null, 'GET');
      return response?.instance || { state: 'unknown' };
    } catch (error) {
      logger.error('Error getting instance status:', error);
      return { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getInstanceInfo(): Promise<any> {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        return { error: 'API não configurada' };
      }

      const response = await this.makeRequest(`instance/fetchInstances`, null, 'GET');
      const instances = response?.instance || [];
      
      const currentInstance = Array.isArray(instances) 
        ? instances.find(i => i.instanceName === this.instanceName)
        : instances;

      return currentInstance || { instanceName: this.instanceName, status: 'not_found' };
    } catch (error) {
      logger.error('Error getting instance info:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Lazy initialization para garantir que dotenv foi carregado
let _evolutionService: EvolutionService | null = null;

export const evolutionService = {
  getInstance(): EvolutionService {
    if (!_evolutionService) {
      _evolutionService = new EvolutionService();
    }
    return _evolutionService;
  },
  // Proxy methods for backward compatibility
  checkConnection: () => evolutionService.getInstance().checkConnection(),
  getInstanceStatus: () => evolutionService.getInstance().getInstanceStatus(),
  getInstanceInfo: () => evolutionService.getInstance().getInstanceInfo(),
  sendTextMessage: (number: string, message: string) => evolutionService.getInstance().sendTextMessage(number, message),
  sendAudioMessage: (number: string, audioPath: string, caption?: string, skipRetry?: boolean) => evolutionService.getInstance().sendAudioMessage(number, audioPath, caption, skipRetry),
  isValidWhatsAppNumber: (phone: string) => evolutionService.getInstance().isValidWhatsAppNumber(phone),
  normalizePhoneNumber: (phone: string) => evolutionService.getInstance().normalizePhoneNumber(phone)
};
