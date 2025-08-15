import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { PATHS } from '../config/constants';

// Configuração do SQLite
const sqlite = sqlite3.verbose();

class Database {
  private db: sqlite3.Database | null = null;

  async connect(): Promise<sqlite3.Database> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      // Garante que o diretório existe
      const dbDir = path.dirname(PATHS.DATABASE);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite.Database(PATHS.DATABASE, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database: ${PATHS.DATABASE}`);
          resolve(this.db!);
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }
}

// Instância singleton
export const database = new Database();

// Função para inicializar o banco e criar as tabelas
export async function initializeDatabase(): Promise<void> {
  try {
    await database.connect();
    
    // Tabela de leads
    await database.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        status_atual TEXT NOT NULL,
        proximo_disparo DATETIME,
        tentativas INTEGER DEFAULT 0,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT 1
      )
    `);

    // Tabela de logs de ações
    await database.run(`
      CREATE TABLE IF NOT EXISTS logs_acoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL,
        acao TEXT NOT NULL,
        detalhes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        sucesso BOOLEAN DEFAULT 1,
        FOREIGN KEY (lead_id) REFERENCES leads (id)
      )
    `);

    // Tabela de revisões manuais
    await database.run(`
      CREATE TABLE IF NOT EXISTS revisoes_manuais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL,
        motivo TEXT NOT NULL,
        detalhes TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_resolucao DATETIME,
        resolvido BOOLEAN DEFAULT 0,
        observacoes TEXT,
        FOREIGN KEY (lead_id) REFERENCES leads (id)
      )
    `);

    // Índices para performance
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_leads_proximo_disparo 
      ON leads (proximo_disparo, ativo)
    `);

    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_leads_telefone 
      ON leads (telefone)
    `);

    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_logs_lead_id 
      ON logs_acoes (lead_id)
    `);

    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp 
      ON logs_acoes (timestamp)
    `);

    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_revisoes_resolvido 
      ON revisoes_manuais (resolvido, data_criacao)
    `);

    logger.info('Database tables created successfully');

  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}
