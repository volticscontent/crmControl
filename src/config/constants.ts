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

// 🎯 CONFIGURAÇÃO PLAYBOOK BOT - Mensagens profissionais atualizadas
export const CONTATOS_CONFIG: Record<ContatoTipo, ContatoConfig> = {
  'Primeiro Contato': {
    tipo: 'Primeiro Contato',
    arquivoTexto: 'Primeiro Contato/TXT PRIMEIRO CONTATO.txt',
    arquivoAudio: 'Primeiro Contato/WhatsApp Ptt 2025-08-15 at 15.27.15.ogg',
    mensagemTexto: `Boa tarde {nome}! Tudo bem?`,
    proximoTipo: 'Segundo Contato'
  },
  'Segundo Contato': {
    tipo: 'Segundo Contato',
    arquivoTexto: 'Segundo Contato/TXT SEGUNDO CONTATO.txt',
    mensagemTexto: `{nome}, tudo bem?

É realmente do seu interesse entender como estruturar uma operação de Drop Global para faturar 50 mil euros por mês?`,
    proximoTipo: 'Terceiro Contato'
  },
  'Terceiro Contato': {
    tipo: 'Terceiro Contato',
    arquivoTexto: 'Terceiro Contato/TXT TERCEIRO CONTATO.txt',
    mensagemTexto: `{nome}, devido a falta de resposta, entendemos que não é do seu interesse entender como você pode faturar 50 mil euros por mês.

Com isso iremos tirar você da nossa base de contatos. Caso seja do seu interesse trocar essa papo, pode me sinalizar aqui.`,
    proximoTipo: 'Ultimo Contato'
  },
  'Ultimo Contato': {
    tipo: 'Ultimo Contato',
    arquivoTexto: 'Ultimo Contato/TXT ULTIMO CONTATO.txt',
    mensagemTexto: `{nome}, devido a falta de retorno, estamos tirando você da nossa lista. De qualquer maneira, obrigado.`,
    proximoTipo: null
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
  ASSETS: process.env.NODE_ENV === 'production' ? process.cwd() + '/public/assets' : './assets',
  DATABASE: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/crm.db' : './data/crm.db'),
  LOGS: process.env.NODE_ENV === 'production' ? '/tmp/logs' : './logs'
} as const;
