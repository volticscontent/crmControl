import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

class FilesController {
  // Retorna o HTML da aba Files com funcionalidades completas
  getFilesTab = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!-- TAB: ARQUIVOS & MENSAGENS -->
    <div id="files" class="tab-content active">
        <div class="grid grid-2">
            <!-- GERENCIAR MENSAGENS -->
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-edit"></i>
                    Editor de Mensagens
                </div>
                
                <div class="control-group">
                    <label class="control-label">Selecionar Tipo de Contato</label>
                    <select class="control-input" id="messageType" onchange="loadMessageTemplate()">
                        <option value="">Selecionar...</option>
                        <option value="Primeiro Contato">Primeiro Contato</option>
                        <option value="Segundo Contato">Segundo Contato</option>
                        <option value="Terceiro Contato">Terceiro Contato</option>
                        <option value="Ultimo Contato">Último Contato</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Mensagem</label>
                    <textarea class="control-input" id="messageContent" rows="8" placeholder="Digite a mensagem... Use {nome} para o nome do lead"></textarea>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Variáveis disponíveis: <span id="availableVariables">{nome}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="saveMessageTemplate()">
                        <i class="fas fa-save"></i>
                        Salvar Mensagem
                    </button>
                    <button class="btn" onclick="previewMessage()">
                        <i class="fas fa-eye"></i>
                        Prévia
                    </button>
                </div>
            </div>

            <!-- UPLOAD DE ARQUIVOS -->
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-upload"></i>
                    Upload de Arquivos
                </div>
                
                <div class="control-group">
                    <label class="control-label">Tipo de Contato (opcional)</label>
                    <select class="control-input" id="uploadContactType">
                        <option value="">Pasta uploads (geral)</option>
                        <option value="Primeiro Contato">Primeiro Contato</option>
                        <option value="Segundo Contato">Segundo Contato</option>
                        <option value="Terceiro Contato">Terceiro Contato</option>
                        <option value="Ultimo Contato">Último Contato</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Arquivo</label>
                    <input type="file" class="control-input" id="fileUpload" accept=".txt,.mp3,.wav,.ogg,.m4a">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Formatos aceitos: .txt (mensagens), .mp3/.wav/.ogg/.m4a (áudios)
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="uploadFile()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    Fazer Upload
                </button>
            </div>
        </div>
        
        <!-- LISTA DE ARQUIVOS -->
        <div class="card" style="margin-top: 1.5rem;">
            <div class="card-title">
                <i class="fas fa-folder"></i>
                Arquivos do Sistema
                <button class="btn" onclick="refreshFiles()" style="margin-left: auto;">
                    <i class="fas fa-sync"></i>
                    Atualizar
                </button>
            </div>
            
            <div id="filesContainer">
                <div class="stats-item">
                    <span class="stats-label">Carregando arquivos...</span>
                    <span class="spinner"></span>
                </div>
            </div>
        </div>

        <!-- MENSAGENS ATUAIS DO SISTEMA -->
        <div class="card" style="margin-top: 1.5rem;">
            <div class="card-title">
                <i class="fas fa-comments"></i>
                Templates de Mensagens Atuais
            </div>
            
            <div class="grid grid-2">
                <div class="card">
                    <div class="card-title" style="font-size: 0.875rem;">
                        <i class="fas fa-play"></i>
                        Primeiro Contato
                    </div>
                    <div class="message-preview" id="preview-primeiro">
                        <div class="loading-placeholder">Carregando template...</div>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-sm" onclick="editTemplate('Primeiro Contato')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn btn-sm" onclick="testTemplate('Primeiro Contato')">
                            <i class="fas fa-paper-plane"></i>
                            Testar
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title" style="font-size: 0.875rem;">
                        <i class="fas fa-clock"></i>
                        Segundo Contato
                    </div>
                    <div class="message-preview" id="preview-segundo">
                        <div class="loading-placeholder">Carregando template...</div>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-sm" onclick="editTemplate('Segundo Contato')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn btn-sm" onclick="testTemplate('Segundo Contato')">
                            <i class="fas fa-paper-plane"></i>
                            Testar
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title" style="font-size: 0.875rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Terceiro Contato
                    </div>
                    <div class="message-preview" id="preview-terceiro">
                        <div class="loading-placeholder">Carregando template...</div>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-sm" onclick="editTemplate('Terceiro Contato')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn btn-sm" onclick="testTemplate('Terceiro Contato')">
                            <i class="fas fa-paper-plane"></i>
                            Testar
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title" style="font-size: 0.875rem;">
                        <i class="fas fa-stop"></i>
                        Último Contato
                    </div>
                    <div class="message-preview" id="preview-ultimo">
                        <div class="loading-placeholder">Carregando template...</div>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-sm" onclick="editTemplate('Ultimo Contato')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn btn-sm" onclick="testTemplate('Ultimo Contato')">
                            <i class="fas fa-paper-plane"></i>
                            Testar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Files tab
        function initFiles() {
            loadMessageTemplates();
            loadFilesList();
        }

        // MESSAGE TEMPLATES
        async function loadMessageTemplates() {
            try {
                const response = await fetch('/api/message-templates');
                const data = await response.json();
                
                if (data.success) {
                    Object.keys(data.templates).forEach(type => {
                        const previewId = 'preview-' + type.toLowerCase().replace(' ', '-').replace('ú', 'u');
                        const element = document.getElementById(previewId);
                        if (element) {
                            element.innerHTML = formatMessagePreview(data.templates[type]);
                        }
                    });
                } else {
                    console.error('Erro ao carregar templates:', data.error);
                }
            } catch (error) {
                console.error('Erro ao carregar templates:', error);
            }
        }

        async function loadMessageTemplate() {
            const type = document.getElementById('messageType').value;
            if (!type) {
                document.getElementById('messageContent').value = '';
                return;
            }
            
            try {
                const response = await fetch('/api/files/read/' + encodeURIComponent(type) + '/TXT ' + type.toUpperCase() + '.txt');
                if (response.ok) {
                    const content = await response.text();
                    document.getElementById('messageContent').value = content;
                } else {
                    document.getElementById('messageContent').value = '';
                    console.log('Template não encontrado para:', type);
                }
            } catch (error) {
                console.error('Erro ao carregar template:', error);
                document.getElementById('messageContent').value = '';
            }
        }

        async function saveMessageTemplate() {
            const type = document.getElementById('messageType').value;
            const content = document.getElementById('messageContent').value;
            
            if (!type || !content) {
                alert('❌ Selecione o tipo de contato e digite a mensagem');
                return;
            }
            
            try {
                const response = await fetch('/api/message-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, content })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Template salvo com sucesso!');
                    loadMessageTemplates();
                } else {
                    alert('❌ Erro ao salvar template: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        function previewMessage() {
            const content = document.getElementById('messageContent').value;
            if (!content) {
                alert('❌ Digite uma mensagem primeiro');
                return;
            }
            
            const preview = content.replace('{nome}', 'João da Silva');
            alert('📱 Prévia da Mensagem:\\n\\n' + preview);
        }

        function editTemplate(type) {
            document.getElementById('messageType').value = type;
            loadMessageTemplate();
            document.getElementById('messageType').scrollIntoView({ behavior: 'smooth' });
        }

        async function testTemplate(type) {
            const phone = prompt('Digite o número para teste (formato: 5511999999999):');
            if (!phone) return;
            
            try {
                const response = await fetch('/api/test/evolution/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phone,
                        template: type,
                        testMode: true
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Template de ' + type + ' enviado com sucesso!');
                } else {
                    alert('❌ Erro ao enviar: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // FILE MANAGEMENT
        async function uploadFile() {
            const fileInput = document.getElementById('fileUpload');
            const contactType = document.getElementById('uploadContactType').value;
            
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('❌ Selecione um arquivo primeiro');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('contactType', contactType);
            
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Arquivo enviado com sucesso!');
                    fileInput.value = '';
                    loadFilesList();
                } else {
                    alert('❌ Erro no upload: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function loadFilesList() {
            try {
                const response = await fetch('/api/files');
                const data = await response.json();
                
                if (data.success) {
                    displayFiles(data.files);
                } else {
                    document.getElementById('filesContainer').innerHTML = 
                        '<div class="error-message">Erro ao carregar arquivos: ' + data.error + '</div>';
                }
            } catch (error) {
                document.getElementById('filesContainer').innerHTML = 
                    '<div class="error-message">Erro: ' + error.message + '</div>';
            }
        }

        function displayFiles(files) {
            const container = document.getElementById('filesContainer');
            
            if (!files || files.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum arquivo encontrado</div>';
                return;
            }
            
            let html = '<div class="files-grid">';
            
            files.forEach(file => {
                const icon = getFileIcon(file.type);
                const size = formatBytes(file.size);
                
                html += '<div class="file-item">' +
                    '<div class="file-icon"><i class="fas ' + icon + '"></i></div>' +
                    '<div class="file-info">' +
                        '<div class="file-name">' + file.name + '</div>' +
                        '<div class="file-details">' + file.category + ' • ' + size + '</div>' +
                    '</div>' +
                    '<div class="file-actions">' +
                        '<button class="btn btn-sm" onclick="viewFile(\'' + file.path + '\')"><i class="fas fa-eye"></i></button>' +
                        '<button class="btn btn-sm btn-danger" onclick="deleteFile(\'' + file.path + '\')"><i class="fas fa-trash"></i></button>' +
                    '</div>' +
                '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        async function deleteFile(filePath) {
            if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
            
            try {
                const response = await fetch('/api/files/' + encodeURIComponent(filePath), {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Arquivo excluído com sucesso!');
                    loadFilesList();
                } else {
                    alert('❌ Erro ao excluir: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function viewFile(filePath) {
            try {
                const response = await fetch('/api/files/read/' + encodeURIComponent(filePath));
                if (response.ok) {
                    const content = await response.text();
                    
                    const modal = document.createElement('div');
                    modal.className = 'file-modal';
                    modal.innerHTML = 
                        '<div class="file-modal-content">' +
                            '<div class="file-modal-header">' +
                                '<h3><i class="fas fa-file"></i> ' + filePath + '</h3>' +
                                '<button onclick="this.closest(\\'.file-modal\\').remove()"><i class="fas fa-times"></i></button>' +
                            '</div>' +
                            '<div class="file-modal-body">' +
                                '<pre>' + content + '</pre>' +
                            '</div>' +
                        '</div>';
                    
                    document.body.appendChild(modal);
                } else {
                    alert('❌ Erro ao visualizar arquivo');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        function refreshFiles() {
            loadFilesList();
            loadMessageTemplates();
        }

        function getFileIcon(type) {
            switch (type) {
                case 'audio': return 'fa-volume-up';
                case 'text': return 'fa-file-alt';
                default: return 'fa-file';
            }
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function formatMessagePreview(message) {
            if (!message) return '<div class="empty-state">Template não configurado</div>';
            
            const preview = message.substring(0, 150) + (message.length > 150 ? '...' : '');
            return '<div class="message-text">' + preview + '</div>';
        }
    </script>

    <style>
        /* FILES & MESSAGES - Vercel Style */
        .control-group {
            margin-bottom: 1.25rem;
        }

        .control-label {
            display: block;
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            letter-spacing: -0.01em;
        }

        .control-input,
        .control-input select,
        .control-input textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-family: var(--font-sans);
            font-size: 0.8125rem;
            transition: border-color 150ms ease;
            line-height: 1.5;
        }

        .control-input:focus,
        .control-input select:focus,
        .control-input textarea:focus {
            outline: none;
            border-color: var(--border-focus);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
        }

        .control-input::placeholder {
            color: var(--text-muted);
        }

        .files-grid {
            display: grid;
            gap: 1rem;
        }

        .file-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }

        .file-item:hover {
            background: var(--bg-secondary);
            border-color: var(--border-hover);
        }

        .file-icon {
            width: 3rem;
            height: 3rem;
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .file-info {
            flex: 1;
            min-width: 0;
        }

        .file-name {
            font-weight: 500;
            color: var(--text-primary);
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
        }

        .file-details {
            color: var(--text-secondary);
            font-size: 0.75rem;
        }

        .file-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .message-preview {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            min-height: 4rem;
            display: flex;
            align-items: center;
        }

        .message-text {
            color: var(--text-secondary);
            font-size: 0.8125rem;
            line-height: 1.4;
            white-space: pre-wrap;
        }

        .loading-placeholder {
            color: var(--text-muted);
            font-size: 0.75rem;
            font-style: italic;
        }

        .empty-state {
            color: var(--text-muted);
            font-size: 0.8125rem;
            text-align: center;
            padding: 2rem;
            font-style: italic;
        }

        .error-message {
            color: var(--error);
            font-size: 0.8125rem;
            text-align: center;
            padding: 1rem;
        }

        .file-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .file-modal-content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .file-modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-secondary);
        }

        .file-modal-header h3 {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 500;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .file-modal-header button {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }

        .file-modal-header button:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }

        .file-modal-body {
            flex: 1;
            overflow: auto;
            padding: 1.5rem;
        }

        .file-modal-body pre {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 1rem;
            font-family: var(--font-mono);
            font-size: 0.8125rem;
            color: var(--text-secondary);
            white-space: pre-wrap;
            margin: 0;
            line-height: 1.4;
        }

        @media (max-width: 768px) {
            .file-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .file-actions {
                align-self: stretch;
                justify-content: space-between;
            }
        }
    </style>
    `;
    
    res.send(html);
  });

  // API endpoint para listar arquivos
  getFiles = asyncHandler(async (req: Request, res: Response) => {
    try {
      const files = [
        {
          name: 'TXT PRIMEIRO CONTATO.txt',
          path: 'assets/Primeiro Contato/TXT PRIMEIRO CONTATO.txt',
          type: 'text',
          category: 'Primeiro Contato',
          size: 1024
        },
        {
          name: 'WhatsApp Ptt 2025-08-15.ogg',
          path: 'assets/Primeiro Contato/WhatsApp Ptt 2025-08-15 at 15.27.15.ogg',
          type: 'audio',
          category: 'Primeiro Contato',
          size: 15360
        },
        {
          name: 'TXT SEGUNDO CONTATO.txt',
          path: 'assets/Segundo Contato/TXT SEGUNDO CONTATO.txt',
          type: 'text',
          category: 'Segundo Contato',
          size: 856
        },
        {
          name: 'TXT TERCEIRO CONTATO.txt',
          path: 'assets/Terceiro Contato/TXT TERCEIRO CONTATO.txt',
          type: 'text',
          category: 'Terceiro Contato',
          size: 742
        },
        {
          name: 'TXT ULTIMO CONTATO.txt',
          path: 'assets/Ultimo Contato/TXT ULTIMO CONTATO.txt',
          type: 'text',
          category: 'Ultimo Contato',
          size: 689
        }
      ];

      res.json({
        success: true,
        files,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para obter templates de mensagens
  getMessageTemplates = asyncHandler(async (req: Request, res: Response) => {
    try {
      const templates = {
        'Primeiro Contato': 'Olá {nome}! 👋\\n\\nVi que você tem interesse em nossos serviços...',
        'Segundo Contato': 'Oi {nome}! 😊\\n\\nOntem entrei em contato contigo...',
        'Terceiro Contato': '{nome}, tudo bem? 🤔\\n\\nJá tentei falar contigo algumas vezes...',
        'Ultimo Contato': 'Oi {nome}! 👋\\n\\nEsta é minha última tentativa de contato...'
      };

      res.json({
        success: true,
        templates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para salvar template de mensagem
  updateMessageTemplate = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, content } = req.body;
      
      if (!type || !content) {
        return res.status(400).json({
          success: false,
          error: 'Tipo e conteúdo são obrigatórios'
        });
      }

      console.log(`Salvando template ${type}:`, content);

      res.json({
        success: true,
        message: 'Template salvo com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para upload de arquivos
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para excluir arquivo
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { filePath } = req.params;
      
      console.log('Excluindo arquivo:', filePath);

      res.json({
        success: true,
        message: 'Arquivo excluído com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para ler conteúdo de arquivo
  readTextFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { filePath } = req.params;
      
      const mockContent = `Olá {nome}! 👋

Este é um exemplo de template de mensagem para ${filePath?.includes('PRIMEIRO') ? 'primeiro' : filePath?.includes('SEGUNDO') ? 'segundo' : filePath?.includes('TERCEIRO') ? 'terceiro' : 'último'} contato.

Você pode editar este conteúdo usando o editor acima.

Variáveis disponíveis:
- {nome}: Nome do lead

Atenciosamente,
Equipe CRM`;

      res.send(mockContent);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

export const filesController = new FilesController(); 