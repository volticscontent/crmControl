// Tipos para Monday.com
export interface MondayWebhookPayload {
  event: {
    type: string;
    triggerTime: string;
    subscriptionId: number;
    userId: number;
    originalTriggerUuid: string;
    boardId: number;
    groupId: string;
    pulseId: number;
    pulseName: string;
    columnId: string;
    columnType: string;
    value: {
      label: {
        index: number;
        text: string;
        color: string;
        style: object;
      };
      post_id: number | null;
      changed_at: string;
    };
    previousValue: {
      label: {
        index: number;
        text: string;
        color: string;
        style: object;
      };
      post_id: number | null;
      changed_at: string;
    } | null;
  };
}

export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumn[];
}

export interface MondayColumn {
  id: string;
  type: string;
  text: string;
  value: string | null;
}

// Tipos para Evolution API
export interface EvolutionWebhookPayload {
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
    pushName: string;
  };
}

export interface EvolutionSendMessagePayload {
  number: string;
  text?: string;
  media?: {
    mediatype: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    caption?: string;
    media: string; // base64 ou URL
  };
}

// Tipos do sistema CRM
export interface Lead {
  id: string; // Monday item ID
  nome: string;
  telefone: string;
  statusAtual: ContatoTipo;
  proximoDisparo: Date | null;
  tentativas: number;
  dataCriacao: Date;
  dataUltimaAtualizacao: Date;
  ativo: boolean;
}

export type ContatoTipo = 'Primeiro Contato' | 'Segundo Contato' | 'Terceiro Contato' | 'Ultimo Contato';

export interface ContatoConfig {
  tipo: ContatoTipo;
  arquivoTexto: string;
  mensagemTexto?: string; // Texto inline como fallback para arquivos
  arquivoAudio?: string;
  proximoTipo?: ContatoTipo;
}

export interface LogEntry {
  id: string;
  leadId: string;
  acao: string;
  detalhes: string;
  timestamp: Date;
  sucesso: boolean;
}

// Configurações do sistema
export interface SystemConfig {
  workStartHour: number;
  workEndHour: number;
  timezone: string;
  intervaloContatos: number; // horas
  maxTentativas: number;
}
