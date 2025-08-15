import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PATHS } from '../config/constants';

const router = Router();

// Serve arquivos estáticos (textos e áudios)
router.get('/:filename', asyncHandler(async (req: Request, res: Response) => {
  const filename = req.params.filename;
  
  // Validação básica do nome do arquivo
  if (!filename || filename.includes('..') || filename.includes('/')) {
    throw new CustomError('Invalid filename', 400);
  }

  const filePath = path.join(PATHS.ASSETS, filename);
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(filePath)) {
    throw new CustomError('File not found', 404);
  }

  // Determina o tipo de conteúdo baseado na extensão
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  
  switch (ext) {
    case '.txt':
      contentType = 'text/plain; charset=utf-8';
      break;
    case '.mp3':
      contentType = 'audio/mpeg';
      break;
    case '.wav':
      contentType = 'audio/wav';
      break;
    case '.ogg':
      contentType = 'audio/ogg';
      break;
    case '.json':
      contentType = 'application/json';
      break;
  }

  // Log da requisição
  logger.info(`Asset requested: ${filename}`, {
    filePath,
    contentType,
    ip: req.ip
  });

  // Define headers apropriados
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora

  // Envia o arquivo
  res.sendFile(filePath);
}));

// Lista arquivos disponíveis (JSON simples)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(PATHS.ASSETS)) {
      fs.mkdirSync(PATHS.ASSETS, { recursive: true });
    }

    const files = fs.readdirSync(PATHS.ASSETS).map(filename => {
      const filePath = path.join(PATHS.ASSETS, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        modified: stats.mtime,
        type: path.extname(filename),
        url: `/assets/${filename}`
      };
    });

    // Retorna HTML simples
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Assets - CRM</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .file-list { margin-top: 20px; }
            .file-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; }
            .nav { margin-bottom: 20px; }
            .nav a { margin-right: 15px; color: #0066cc; text-decoration: none; }
            .nav a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="nav">
                <a href="/monitor">📊 Dashboard</a>
                <a href="/config">⚙️ Configuração</a>
                <a href="/api/stats">📈 Estatísticas</a>
            </div>
            
            <div class="header">
                <h1>📁 Assets do Sistema</h1>
                <p>Arquivos de texto e áudio para o CRM</p>
            </div>
            
            <div class="file-list">
                <h3>Arquivos Disponíveis (${files.length})</h3>
                ${files.length === 0 ? 
                  '<p>Nenhum arquivo encontrado. Adicione arquivos .txt ou .mp3 na pasta assets/</p>' :
                  files.map(file => `
                    <div class="file-item">
                      <strong>${file.filename}</strong> 
                      (${Math.round(file.size / 1024)}KB) 
                      - <a href="${file.url}" target="_blank">📥 Download</a>
                    </div>
                  `).join('')
                }
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);

  } catch (error) {
    logger.error('Error listing assets:', error);
    throw new CustomError('Error listing files', 500);
  }
}));

// API JSON para listar arquivos
router.get('/api', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(PATHS.ASSETS)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(PATHS.ASSETS).map(filename => {
      const filePath = path.join(PATHS.ASSETS, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        modified: stats.mtime,
        type: path.extname(filename)
      };
    });

    res.json({ files });
  } catch (error) {
    logger.error('Error listing assets via API:', error);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
}));

export default router;
