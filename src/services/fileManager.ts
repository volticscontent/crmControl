import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { PATHS } from '../config/constants';
import { ContatoTipo, ContatoConfig } from '../types';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  type: 'text' | 'audio' | 'other';
}

interface MessageTemplate {
  tipo: ContatoTipo;
  textoPersonalizado?: string;
  arquivoTexto?: string;
  arquivoAudio?: string;
  variaveis: string[];
}

class FileManager {
  private assetsPath: string;

  constructor() {
    this.assetsPath = PATHS.ASSETS;
    this.ensureDirectoriesExist();
  }

  // 📁 GERENCIAMENTO DE DIRETÓRIOS
  private ensureDirectoriesExist(): void {
    const requiredDirs = [
      this.assetsPath,
      path.join(this.assetsPath, 'Primeiro Contato'),
      path.join(this.assetsPath, 'Segundo Contato'),
      path.join(this.assetsPath, 'Terceiro Contato'),
      path.join(this.assetsPath, 'Ultimo Contato'),
      path.join(this.assetsPath, 'uploads')
    ];

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`📁 Diretório criado: ${dir}`);
      }
    });
  }

  // 📄 OPERAÇÕES COM ARQUIVOS
  async listFiles(): Promise<FileInfo[]> {
    try {
      const files: FileInfo[] = [];
      
      const scanDirectory = (dirPath: string, relativePath: string = '') => {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
          const fullPath = path.join(dirPath, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase();
            let type: 'text' | 'audio' | 'other' = 'other';
            
            if (ext === '.txt') type = 'text';
            else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) type = 'audio';
            
            files.push({
              name: item,
              path: path.join(relativePath, item),
              size: stats.size,
              lastModified: stats.mtime,
              type
            });
          } else if (stats.isDirectory()) {
            scanDirectory(fullPath, path.join(relativePath, item));
          }
        });
      };

      scanDirectory(this.assetsPath);
      return files;
    } catch (error) {
      logger.error('Erro ao listar arquivos:', error);
      return [];
    }
  }

  async readTextFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.assetsPath, filePath);
      
      logger.info(`📂 FileManager: Tentando ler arquivo`, {
        filePath,
        fullPath,
        assetsPath: this.assetsPath,
        fileExists: fs.existsSync(fullPath)
      });
      
      if (!fs.existsSync(fullPath)) {
        logger.warn(`❌ Arquivo não encontrado: ${fullPath}`);
        
        // Lista arquivos na pasta para debug
        try {
          const dir = path.dirname(fullPath);
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            logger.info(`📁 Arquivos na pasta ${dir}:`, files);
          } else {
            logger.warn(`📁 Diretório não existe: ${dir}`);
          }
        } catch (listError) {
          logger.warn(`❌ Erro ao listar diretório:`, listError);
        }
        
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      logger.info(`✅ Arquivo lido com sucesso`, {
        contentLength: content.length,
        preview: content.substring(0, 50) + '...'
      });
      
      return content.trim();
    } catch (error) {
      logger.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
      return null;
    }
  }

  async writeTextFile(filePath: string, content: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.assetsPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Garante que o diretório existe
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      logger.info(`📝 Arquivo salvo: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao salvar arquivo ${filePath}:`, error);
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.assetsPath, filePath);
      
      if (!fs.existsSync(fullPath)) {
        logger.warn(`Arquivo não encontrado para exclusão: ${fullPath}`);
        return false;
      }

      fs.unlinkSync(fullPath);
      logger.info(`🗑️ Arquivo deletado: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao deletar arquivo ${filePath}:`, error);
      return false;
    }
  }

  // 📤 UPLOAD DE ARQUIVOS
  async saveUploadedFile(buffer: Buffer, filename: string, contactType?: ContatoTipo): Promise<string> {
    try {
      const ext = path.extname(filename).toLowerCase();
      const timestamp = Date.now();
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const newFilename = `${timestamp}_${safeName}`;
      
      let destinationPath: string;
      
      if (contactType) {
        // Salva na pasta específica do tipo de contato
        destinationPath = path.join(contactType, newFilename);
      } else {
        // Salva na pasta uploads
        destinationPath = path.join('uploads', newFilename);
      }
      
      const fullPath = path.join(this.assetsPath, destinationPath);
      
      fs.writeFileSync(fullPath, buffer);
      logger.info(`📤 Arquivo upload salvo: ${destinationPath}`);
      
      return destinationPath;
    } catch (error) {
      logger.error('Erro ao salvar upload:', error);
      throw error;
    }
  }

  // 📝 TEMPLATES DE MENSAGEM
  async getMessageTemplate(tipo: ContatoTipo): Promise<MessageTemplate> {
    const config = await this.getContactConfig(tipo);
    
    // Extrai variáveis do texto (palavras entre {})
    const variaveis = this.extractVariables(config.mensagemTexto || '');
    
    return {
      tipo,
      textoPersonalizado: config.mensagemTexto,
      arquivoTexto: config.arquivoTexto,
      arquivoAudio: config.arquivoAudio,
      variaveis
    };
  }

  async updateMessageTemplate(tipo: ContatoTipo, novoTexto: string, novoArquivoTexto?: string): Promise<boolean> {
    try {
      // Atualiza o arquivo de texto se especificado
      if (novoArquivoTexto) {
        const saved = await this.writeTextFile(novoArquivoTexto, novoTexto);
        if (!saved) return false;
      }

      // Atualiza a configuração em memória (seria ideal ter um arquivo de config)
      logger.info(`📝 Template atualizado para ${tipo}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar template ${tipo}:`, error);
      return false;
    }
  }

  // 🔍 MÉTODOS AUXILIARES
  private async getContactConfig(tipo: ContatoTipo): Promise<ContatoConfig> {
    // Importa dinamicamente para evitar circular dependency
    const { CONTATOS_CONFIG } = await import('../config/constants');
    return CONTATOS_CONFIG[tipo];
  }

  private extractVariables(text: string): string[] {
    const regex = /\{(\w+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // 📊 ESTATÍSTICAS
  async getFileStats(): Promise<{total: number, textFiles: number, audioFiles: number, totalSize: number}> {
    const files = await this.listFiles();
    
    return {
      total: files.length,
      textFiles: files.filter(f => f.type === 'text').length,
      audioFiles: files.filter(f => f.type === 'audio').length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0)
    };
  }

  // 🔄 PROCESSAMENTO DE MENSAGENS
  async processMessage(text: string, variables: Record<string, string>): Promise<string> {
    let processedText = text;
    
    // Substitui variáveis
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedText = processedText.replace(regex, value);
    });

    return processedText;
  }

  // 🧹 LIMPEZA
  async cleanupOldUploads(olderThanDays: number = 30): Promise<number> {
    try {
      const uploadsDir = path.join(this.assetsPath, 'uploads');
      if (!fs.existsSync(uploadsDir)) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`🗑️ Upload antigo removido: ${file}`);
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Erro na limpeza de uploads:', error);
      return 0;
    }
  }
}

export const fileManager = new FileManager();
