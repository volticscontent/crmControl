import axios from 'axios';
import { logger, logCrmAction } from '../utils/logger';
import { MondayItem, MondayColumn } from '../types';
import { MONDAY_COLUMNS, MONDAY_STATUS } from '../config/constants';

class MondayService {
  private apiUrl = 'https://api.monday.com/v2';
  private apiToken: string;
  private boardId: string;

  constructor() {
    this.apiToken = process.env.MONDAY_API_TOKEN || '';
    this.boardId = process.env.MONDAY_BOARD_ID || '';
    
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
}

export const mondayService = new MondayService();
