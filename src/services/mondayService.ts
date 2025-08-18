import axios from 'axios';
import { logger, logCrmAction } from '../utils/logger';
import { MondayItem, MondayColumn } from '../types';
import { analyticsService } from './analyticsService';
import { MONDAY_COLUMNS, MONDAY_STATUS } from '../config/constants';

class MondayService {
  private apiUrl = 'https://api.monday.com/v2';
  private apiToken: string;
  private boardId: string;

  constructor() {
    this.apiToken = process.env.MONDAY_API_TOKEN || '';
    this.boardId = process.env.MONDAY_BOARD_ID || '';
    
    // Debug das variáveis carregadas
    logger.info('Monday API constructor:', {
      hasToken: !!this.apiToken,
      hasBoardId: !!this.boardId,
      tokenLength: this.apiToken.length,
      boardId: this.boardId || 'EMPTY'
    });
    
    if (!this.apiToken || !this.boardId) {
      logger.warn('Monday API credentials not configured. Monday integration will be disabled.');
    }
  }

  private async makeRequest(query: string, variables?: object): Promise<any> {
    if (!this.apiToken || !this.boardId) {
      logger.warn('Monday API not configured - skipping request');
      return null;
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          query,
          variables
        },
        {
          headers: {
            'Authorization': this.apiToken,
            'Content-Type': 'application/json',
            'API-Version': '2023-10'
          }
        }
      );

      if (response.data.errors) {
        throw new Error(`Monday API Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      logger.error('Monday API request failed:', error);
      throw error;
    }
  }

  async getItem(itemId: string): Promise<MondayItem | null> {
    const query = `
      query GetItem($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          column_values {
            id
            type
            text
            value
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { itemId });
      
      if (!data || !data.items) {
        return null;
      }
      
      const items = data.items;
      
      if (!items || items.length === 0) {
        return null;
      }

      return items[0] as MondayItem;
    } catch (error) {
      logger.error(`Error getting Monday item ${itemId}:`, error);
      return null;
    }
  }

  getColumnValue(item: MondayItem, columnId: string): string | null {
    const column = item.column_values.find(col => col.id === columnId);
    return column ? column.text : null;
  }

  getPhoneNumber(item: MondayItem): string | null {
    return this.getColumnValue(item, MONDAY_COLUMNS.TELEFONE);
  }

  getCurrentStatus(item: MondayItem): string | null {
    return this.getColumnValue(item, MONDAY_COLUMNS.CONTATO_SDR_REALIZADO);
  }

  async updateStatus(itemId: string, newStatus: string): Promise<boolean> {
    const query = `
      mutation UpdateStatus($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          board_id: $boardId
          item_id: $itemId
          column_id: $columnId
          value: $value
        ) {
          id
        }
      }
    `;

    try {
      await this.makeRequest(query, {
        boardId: this.boardId,
        itemId,
        columnId: MONDAY_COLUMNS.CONTATO_SDR_REALIZADO,
        value: JSON.stringify({ label: newStatus })
      });

      logCrmAction(itemId, 'UPDATE_STATUS', `Status atualizado para: ${newStatus}`);
      return true;
    } catch (error) {
      logger.error(`Error updating status for item ${itemId}:`, error);
      logCrmAction(itemId, 'UPDATE_STATUS', `Erro ao atualizar status: ${error}`, false);
      return false;
    }
  }

  async updateProximoContato(itemId: string, dataProximoContato: Date | null): Promise<boolean> {
    const query = `
      mutation UpdateDate($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          board_id: $boardId
          item_id: $itemId
          column_id: $columnId
          value: $value
        ) {
          id
        }
      }
    `;

    try {
      const dateValue = dataProximoContato 
        ? { date: dataProximoContato.toISOString().split('T')[0] }
        : null;

      await this.makeRequest(query, {
        boardId: this.boardId,
        itemId,
        columnId: MONDAY_COLUMNS.PROXIMO_CONTATO,
        value: JSON.stringify(dateValue)
      });

      const action = dataProximoContato 
        ? `Data próximo contato definida: ${dataProximoContato.toLocaleDateString()}`
        : 'Data próximo contato removida';
      
      logCrmAction(itemId, 'UPDATE_NEXT_CONTACT_DATE', action);
      return true;
    } catch (error) {
      logger.error(`Error updating next contact date for item ${itemId}:`, error);
      logCrmAction(itemId, 'UPDATE_NEXT_CONTACT_DATE', `Erro ao atualizar data: ${error}`, false);
      return false;
    }
  }

  async setAguardandoLigacao(itemId: string): Promise<boolean> {
    try {
      // Atualiza status para "Aguardando Ligação"
      const statusUpdated = await this.updateStatus(itemId, MONDAY_STATUS.AGUARDANDO_LIGACAO);
      
      // Remove data do próximo contato
      const dateUpdated = await this.updateProximoContato(itemId, null);

      if (statusUpdated && dateUpdated) {
        logCrmAction(itemId, 'SET_WAITING_CALL', 'Lead marcado como aguardando ligação');
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error setting waiting call for item ${itemId}:`, error);
      logCrmAction(itemId, 'SET_WAITING_CALL', `Erro: ${error}`, false);
      return false;
    }
  }

  // 🔍 Testa conexão com Monday API
  async testConnection(): Promise<{success: boolean, boardName?: string, details?: any}> {
    try {
      if (!this.apiToken || !this.boardId) {
        return {
          success: false,
          details: { error: 'Monday API não configurada (token ou boardId ausente)' }
        };
      }

      const query = `
        query GetBoard($boardId: ID!) {
          boards(ids: [$boardId]) {
            id
            name
            state
            description
          }
        }
      `;

      const response = await this.makeRequest(query, { boardId: this.boardId });
      const board = response?.boards?.[0];

      if (board) {
        return {
          success: true,
          boardName: board.name,
          details: { boardId: board.id, state: board.state }
        };
      }

      return {
        success: false,
        details: { error: 'Board não encontrado' }
      };
    } catch (error) {
      logger.error('Monday API connection test failed:', error);
      return {
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 📊 Métodos adicionais para testes
  async getBoardItems(limit: number = 10): Promise<any[]> {
    try {
      if (!this.apiToken || !this.boardId) {
        return [];
      }

      const query = `
        query GetBoardItems($boardId: ID!, $limit: Int!) {
          boards(ids: [$boardId]) {
            items_page(limit: $limit) {
              items {
                id
                name
                created_at
                updated_at
                column_values {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;

      const response = await this.makeRequest(query, { boardId: this.boardId, limit });
      return response?.boards?.[0]?.items_page?.items || [];
    } catch (error) {
      logger.error('Error getting board items:', error);
      return [];
    }
  }

  // 🚀 Criar lead completo no Monday com todos os campos necessários
  async createRealLeadWithStatus(nome: string, telefone: string, intervalMinutes: number): Promise<{ item: any | null, success: boolean, error?: string }> {
    try {
      if (!this.apiToken || !this.boardId) {
        return {
          item: null,
          success: false,
          error: 'Monday API não configurada'
        };
      }

      // 1. Criar item
      const createResult = await this.createTestItem(nome, telefone);
      if (!createResult.success || !createResult.item) {
        return createResult;
      }

      const itemId = createResult.item.id;
      logger.info('✅ Item criado, agora configurando status e próximo contato:', { itemId });

      // 2. Definir status como "Primeiro Contato"
      const statusResult = await this.updateStatus(itemId, 'Primeiro Contato');
      if (!statusResult) {
        logger.warn('⚠️ Falha ao definir status, mas continuando...');
      }

      // 3. Calcular e definir próximo contato
      const nextDate = new Date(Date.now() + (intervalMinutes * 60 * 1000));
      const dateResult = await this.updateProximoContato(itemId, nextDate);
      if (!dateResult) {
        logger.warn('⚠️ Falha ao definir próximo contato, mas continuando...');
      }

      logger.info('🎯 Lead completo criado no Monday:', {
        itemId,
        nome,
        telefone,
        status: 'Primeiro Contato',
        proximoContato: nextDate.toISOString()
      });

      return {
        item: {
          ...createResult.item,
          statusConfigured: statusResult,
          dateConfigured: dateResult,
          proximoContato: nextDate
        },
        success: true
      };
      
    } catch (error) {
      logger.error('Error creating real lead:', error);
      return {
        item: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // 🆕 Criar novo item de teste no Monday.com
  async createTestItem(nome: string, telefone: string): Promise<{ item: any | null, success: boolean, error?: string }> {
    try {
      if (!this.apiToken || !this.boardId) {
        return {
          item: null,
          success: false,
          error: 'Monday API não configurada'
        };
      }

      const mutation = `
        mutation CreateTestItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId
            item_name: $itemName
            column_values: $columnValues
          ) {
            id
            name
            created_at
            updated_at
            column_values {
              id
              text
              value
              type
            }
          }
        }
      `;

      // Configurar valores das colunas (telefone e status inicial)
      const columnValues = JSON.stringify({
        'phone_mkt8s8kn': telefone,  // Coluna de telefone
        'color_mkt8t95b': { label: 'Primeiro Contato' }  // Coluna de status contato
      });

      const variables = {
        boardId: this.boardId,
        itemName: nome,
        columnValues: columnValues
      };

      logger.info('🆕 Criando item de teste no Monday:', {
        nome,
        telefone,
        boardId: this.boardId
      });

      const response = await this.makeRequest(mutation, variables);
      
      if (response?.create_item) {
        logger.info('✅ Item criado no Monday:', {
          id: response.create_item.id,
          nome: response.create_item.name
        });
        
        return {
          item: response.create_item,
          success: true
        };
      } else {
        logger.error('❌ Resposta inválida do Monday:', response);
        return {
          item: null,
          success: false,
          error: 'Resposta inválida da API Monday'
        };
      }
      
    } catch (error) {
      logger.error('Error creating test item:', error);
      return {
        item: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // 🔍 Busca item por telefone ou email
  async findItemByContact(searchValue: string): Promise<{ item: MondayItem | null, success: boolean, error?: string }> {
    try {
      if (!this.apiToken || !this.boardId) {
        return {
          item: null,
          success: false,
          error: 'Monday API não configurada'
        };
      }

      const query = `
        query FindItemByContact($boardId: ID!) {
          boards(ids: [$boardId]) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                  type
                }
              }
            }
          }
        }
      `;

      const response = await this.makeRequest(query, { boardId: this.boardId });
      const items = response?.boards?.[0]?.items_page?.items || [];
      
      if (items.length === 0) {
        return {
          item: null,
          success: false,
          error: 'Nenhum item encontrado no board'
        };
      }

      // Procura por telefone ou email
      const foundItem = items.find((item: any) => {
        const phoneValue = this.getColumnValue(item, MONDAY_COLUMNS.TELEFONE);
        const emailValue = item.column_values.find((col: any) => 
          col.type === 'email' || col.id.includes('email') || col.id.includes('mail')
        )?.text;
        const nameValue = item.name;

        // Normaliza o valor de busca
        const searchNormalized = searchValue.replace(/\D/g, ''); // Remove não-dígitos para telefone
        const phoneNormalized = phoneValue ? phoneValue.replace(/\D/g, '') : '';

        return (
          // Busca por telefone
          (phoneValue && (
            phoneValue === searchValue ||
            phoneNormalized === searchNormalized ||
            phoneValue.includes(searchValue) ||
            searchValue.includes(phoneValue)
          )) ||
          // Busca por email
          (emailValue && (
            emailValue === searchValue ||
            emailValue.toLowerCase().includes(searchValue.toLowerCase()) ||
            searchValue.toLowerCase().includes(emailValue.toLowerCase())
          )) ||
          // Busca por nome
          (nameValue && (
            nameValue.toLowerCase().includes(searchValue.toLowerCase()) ||
            searchValue.toLowerCase().includes(nameValue.toLowerCase())
          ))
        );
      });

      if (foundItem) {
        return {
          item: foundItem as MondayItem,
          success: true
        };
      } else {
        return {
          item: null,
          success: false,
          error: `Nenhum item encontrado com: ${searchValue}`
        };
      }

    } catch (error) {
      logger.error('Error finding item by contact:', error);
      return {
        item: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // 📋 Busca tabela completa do Monday com informações das colunas
  async getFullBoard(): Promise<{ items: any[], columns: any[], success: boolean, error?: string }> {
    try {
      if (!this.apiToken || !this.boardId) {
        return {
          items: [],
          columns: [],
          success: false,
          error: 'Monday API não configurada'
        };
      }

      const query = `
        query GetFullBoard($boardId: ID!) {
          boards(ids: [$boardId]) {
            name
            columns {
              id
              title
              type
            }
            items_page(limit: 100) {
              cursor
              items {
                id
                name
                created_at
                updated_at
                column_values {
                  id
                  text
                  value
                  type
                }
              }
            }
          }
        }
      `;

      const response = await this.makeRequest(query, { boardId: this.boardId });
      const board = response?.boards?.[0];
      
      if (!board) {
        return {
          items: [],
          columns: [],
          success: false,
          error: 'Board não encontrado'
        };
      }

      return {
        items: board.items_page?.items || [],
        columns: board.columns || [],
        success: true
      };
    } catch (error) {
      logger.error('Error getting full board:', error);
      return {
        items: [],
        columns: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async getInstanceStatus(): Promise<any> {
    try {
      if (!this.apiToken || !this.boardId) {
        return { state: 'not_configured' };
      }

      const query = `
        query {
          me {
            id
            name
            email
          }
        }
      `;

      const response = await this.makeRequest(query);
      return response?.me ? { state: 'connected', user: response.me } : { state: 'error' };
    } catch (error) {
      logger.error('Error getting Monday status:', error);
      return { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Lazy initialization para garantir que dotenv foi carregado
let _mondayService: MondayService | null = null;

export const mondayService = {
  getInstance(): MondayService {
    if (!_mondayService) {
      _mondayService = new MondayService();
    }
    return _mondayService;
  },
  // Proxy methods for backward compatibility
  testConnection: () => mondayService.getInstance().testConnection(),
  getBoardItems: (limit: number) => mondayService.getInstance().getBoardItems(limit),
  getFullBoard: () => mondayService.getInstance().getFullBoard(),
  getInstanceStatus: () => mondayService.getInstance().getInstanceStatus(),
  getItem: (itemId: string) => mondayService.getInstance().getItem(itemId),
  findItemByContact: (searchValue: string) => mondayService.getInstance().findItemByContact(searchValue),
  createTestItem: (nome: string, telefone: string) => mondayService.getInstance().createTestItem(nome, telefone),
  createRealLeadWithStatus: (nome: string, telefone: string, intervalMinutes: number) => mondayService.getInstance().createRealLeadWithStatus(nome, telefone, intervalMinutes),
  updateStatus: (itemId: string, status: string) => mondayService.getInstance().updateStatus(itemId, status),
  updateProximoContato: (itemId: string, nextDate: Date | null) => mondayService.getInstance().updateProximoContato(itemId, nextDate),
  setAguardandoLigacao: (itemId: string) => mondayService.getInstance().setAguardandoLigacao(itemId)
};
