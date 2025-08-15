import { ContatoConfig, ContatoTipo } from '../types';

// IDs das colunas do Monday (baseado no estrutura.md)
export const MONDAY_COLUMNS = {
  CONTATO_SDR_REALIZADO: 'color_mkt8t95b',
  TELEFONE: 'phone_mkt8s8kn',
  PROXIMO_CONTATO: 'date_mkt8ccx4',
  NOME: 'name'
} as const;

// Status possíveis do Monday
export const MONDAY_STATUS = {
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  SEGUNDO_CONTATO: 'Segundo Contato', 
  TERCEIRO_CONTATO: 'Terceiro Contato',
  ULTIMO_CONTATO: 'Ultimo Contato',
  NAO_RESPONDEU: 'Não Respondeu',
  AGUARDANDO_LIGACAO: 'Aguardando Ligação'
} as const;

// Configuração dos tipos de contato
export const CONTATOS_CONFIG: Record<ContatoTipo, ContatoConfig> = {
  'Primeiro Contato': {
    tipo: 'Primeiro Contato',
    arquivoTexto: 'primeiro-contato.txt',
    arquivoAudio: 'primeiro-contato.mp3',
    proximoTipo: 'Segundo Contato'
  },
  'Segundo Contato': {
    tipo: 'Segundo Contato',
    arquivoTexto: 'segundo-contato.txt',
    proximoTipo: 'Terceiro Contato'
  },
  'Terceiro Contato': {
    tipo: 'Terceiro Contato',
    arquivoTexto: 'terceiro-contato.txt',
    proximoTipo: 'Ultimo Contato'
  },
  'Ultimo Contato': {
    tipo: 'Ultimo Contato',
    arquivoTexto: 'ultimo-contato.txt'
  }
};

// Configurações padrão do sistema
export const DEFAULT_CONFIG = {
  WORK_START_HOUR: 9,
  WORK_END_HOUR: 18,
  TIMEZONE: 'America/Sao_Paulo',
  INTERVALO_CONTATOS_HORAS: 24,
  MAX_TENTATIVAS: 3,
  RETRY_DELAY_MINUTES: 30
} as const;

// Paths dos arquivos
export const PATHS = {
  ASSETS: './assets',
  DATABASE: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/crm.db' : './data/crm.db'),
  LOGS: process.env.NODE_ENV === 'production' ? '/tmp/logs' : './logs'
} as const;
