import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

class DashboardController {
  // Dashboard principal
  dashboard = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard CRM</title>
        <style>
            * { box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                background: #f8fafc;
                padding: 20px;
                line-height: 1.6;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
            }
            .header { 
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%); 
                color: white; 
                padding: 30px; 
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header h1 { 
                margin: 0 0 20px 0; 
                font-size: 2em; 
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }
            .header-main {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .header-clock {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.6em;
                background: rgba(255,255,255,0.1);
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .clock-time {
                font-family: 'Courier New', monospace;
                font-weight: bold;
                color: #fbbf24;
            }
            .nav-links {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            .nav-links a {
                color: rgba(255,255,255,0.9);
                text-decoration: none;
                padding: 8px 15px;
                border-radius: 8px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                transition: all 0.2s ease;
            }
            .nav-links a:hover {
                background: rgba(255,255,255,0.2);
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
            }
            .card h3 {
                margin: 0 0 20px 0;
                color: #1f2937;
                font-size: 1.3em;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .status-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .status-item:last-child { border-bottom: none; }
            .status-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: 600;
            }
            .status-success { background: #dcfce7; color: #166534; }
            .status-error { background: #fef2f2; color: #dc2626; }
            .btn {
                background: #3b82f6;
                color: white;
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin: 5px;
                font-weight: 500;
                transition: background 0.2s ease;
            }
            .btn:hover { background: #2563eb; }
            .btn-test { background: #f59e0b; }
            .btn-test:hover { background: #d97706; }
            .logs-container {
                background: #1f2937;
                color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 0.85em;
                max-height: 400px;
                overflow-y: auto;
                margin-top: 15px;
            }
            .webhook-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 10px 0;
                border-left: 4px solid #17a2b8;
            }
            .webhook-url {
                font-family: monospace;
                background: #2c3e50;
                color: #ecf0f1;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
                word-break: break-all;
                font-size: 0.9em;
            }
            input, textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: inherit;
                margin: 8px 0;
            }
            .challenge-section {
                background: #fffbeb;
                border: 1px solid #f59e0b;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>
                    <div class="header-main">🤖 Dashboard CRM Automatizado</div>
                    <div class="header-clock">
                        <span>🕐 Brasília:</span>
                        <span id="current-time" class="clock-time">--:--:--</span>
                    </div>
                </h1>
                <div class="nav-links">
                    <a href="/webhook/health">🏥 Health Check</a>
                    <a href="/assets/">📁 Assets</a>
                    <a href="/">🔗 API Info</a>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Status dos Serviços -->
                <div class="card">
                    <h3>🔧 Status dos Serviços</h3>
                    <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px; font-size: 0.85em; color: #0369a1;">
                        🔄 Verificações automáticas: Monday.com (1h) • APIs (2min) • Clientes (15s) • Logs (30s)
                    </div>
                    <div class="status-item">
                        <span>Monday.com API</span>
                        <span id="mondayStatus" class="status-badge status-error">Verificando...</span>
                    </div>
                    <div class="status-item">
                        <span>Evolution API</span>
                        <span id="evolutionStatus" class="status-badge status-error">Verificando...</span>
                    </div>
                    <div class="status-item">
                        <span>Database SQLite</span>
                        <span id="dbStatus" class="status-badge status-success">✅ Ativo</span>
                    </div>
                    <div class="status-item">
                        <span>Scheduler</span>
                        <span id="schedulerStatus" class="status-badge status-success">✅ Rodando</span>
                    </div>
                    <div class="status-item">
                        <span>Última verificação</span>
                        <span id="lastCheck" style="font-size: 0.8em; color: #6b7280;">-</span>
                    </div>
                    <button class="btn btn-test" onclick="testServices()">🔍 Testar Serviços</button>
                </div>

                <!-- Webhooks -->
                <div class="card">
                    <h3>🔗 URLs dos Webhooks</h3>
                    <div class="webhook-info">
                        <strong>Monday.com Webhook:</strong>
                        <div class="webhook-url" id="mondayWebhook"></div>
                        <small>Configure no Monday.com → Board → Integrações → Webhook</small>
                    </div>
                    <div class="webhook-info">
                        <strong>Evolution API Webhook:</strong>
                        <div class="webhook-url" id="evolutionWebhook"></div>
                        <small>Configure na Evolution API → Instance → Webhook</small>
                    </div>
                </div>

                <!-- Challenge Response -->
                <div class="card">
                    <h3>🤝 Sistema de Challenge</h3>
                    <div class="challenge-section">
                        <p><strong>✅ Implementado Automaticamente!</strong></p>
                        <p>Quando você configurar o webhook no Monday.com:</p>
                        <p>📨 <strong>Monday.com envia:</strong> <code>{"challenge": "abc123"}</code></p>
                        <p>🔄 <strong>Nossa API responde:</strong> <code>{"challenge": "abc123"}</code></p>
                    </div>
                    <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <strong>📋 Como configurar no Monday.com:</strong><br>
                        1. Board → Configurações → Integrações<br>
                        2. Adicionar Webhook<br>
                        3. URL: Copie da seção acima<br>
                        4. Evento: "Column value changed"<br>
                        5. Coluna: "Contato SDR Realizado"<br>
                        6. ✅ NÃO precisa de secret/senha
                    </div>
                </div>
            </div>

            <!-- Monday.com Board View -->
            <div class="card" style="grid-column: 1 / -1;">
                <h3>📊 Monday.com - Visão do Board CRM</h3>
                <div style="margin: 15px 0;">
                    <button class="btn btn-test" onclick="loadMondayData()">🔄 Sincronizar com Monday.com</button>
                    <select id="mondayStatusFilter" style="margin-left: 10px; padding: 8px;">
                        <option value="all">Todos os status</option>
                        <option value="Primeiro Contato">Primeiro Contato</option>
                        <option value="Segundo Contato">Segundo Contato</option>
                        <option value="Terceiro Contato">Terceiro Contato</option>
                        <option value="Ultimo Contato">Último Contato</option>
                    </select>
                    <select id="mondayProcessFilter" style="margin-left: 10px; padding: 8px;">
                        <option value="all">Todos os processos</option>
                        <option value="active">Ativos</option>
                        <option value="completed">Finalizados</option>
                        <option value="pending">Pendentes</option>
                    </select>
                </div>
                
                <!-- Board Info -->
                <div id="mondayBoardInfo" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; display: none;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                        <div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #3b82f6;" id="boardName">-</div>
                            <div style="font-size: 0.8em; color: #6b7280;">Nome do Board</div>
                        </div>
                        <div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #10b981;" id="totalItems">-</div>
                            <div style="font-size: 0.8em; color: #6b7280;">Total de Itens</div>
                        </div>
                        <div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #f59e0b;" id="syncedItems">-</div>
                            <div style="font-size: 0.8em; color: #6b7280;">Sincronizados</div>
                        </div>
                        <div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #ef4444;" id="lastSync">-</div>
                            <div style="font-size: 0.8em; color: #6b7280;">Última Sincronização</div>
                        </div>
                    </div>
                </div>

                <!-- Monday.com Style Table -->
                <div id="mondayTableContainer" style="max-height: 500px; overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="color: #6b7280; text-align: center; padding: 40px;">
                        <div style="font-size: 1.2em; margin-bottom: 10px;">📋</div>
                        <div>Clique em "Sincronizar com Monday.com" para carregar os dados</div>
                    </div>
                </div>
            </div>

            <!-- Clientes Ativos (Sistema Local) -->
            <div class="card" style="grid-column: 1 / -1;">
                <h3>👥 Clientes em Processamento (Sistema Local)</h3>
                <div style="margin: 15px 0;">
                    <button class="btn btn-test" onclick="loadActiveClients()">🔄 Atualizar Clientes</button>
                    <select id="clientFilter" style="margin-left: 10px; padding: 8px;">
                        <option value="all">Todos os clientes</option>
                        <option value="pending">Pendentes de disparo</option>
                        <option value="first">Primeiro Contato</option>
                        <option value="second">Segundo Contato</option>
                        <option value="third">Terceiro Contato</option>
                        <option value="last">Último Contato</option>
                    </select>
                </div>
                
                <!-- Estatísticas -->
                <div id="clientStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #3b82f6;" id="statTotal">-</div>
                        <div style="font-size: 0.8em; color: #6b7280;">Total Ativos</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #f59e0b;" id="statPending">-</div>
                        <div style="font-size: 0.8em; color: #6b7280;">Pendentes</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #10b981;" id="statFirst">-</div>
                        <div style="font-size: 0.8em; color: #6b7280;">1º Contato</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #ef4444;" id="statLast">-</div>
                        <div style="font-size: 0.8em; color: #6b7280;">Último</div>
                    </div>
                </div>

                <!-- Lista de Clientes -->
                <div id="clientsContainer" style="max-height: 400px; overflow-y: auto;">
                    <div style="color: #6b7280; text-align: center; padding: 20px;">Clique em "Atualizar Clientes" para carregar...</div>
                </div>

                <!-- Últimas Ações -->
                <div style="margin-top: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #1f2937;">📝 Últimas Ações</h4>
                        <button class="btn btn-test" onclick="generateTestLogs()" style="font-size: 0.8em; padding: 5px 10px;">
                            🧪 Gerar Logs de Teste
                        </button>
                    </div>
                    <div id="recentActionsContainer" style="max-height: 300px; overflow-y: auto; background: #f8f9fa; border-radius: 8px; padding: 15px;">
                        <div style="color: #6b7280; text-align: center;">Carregando ações...</div>
                    </div>
                </div>
            </div>

            <!-- Logs em Tempo Real -->
            <div class="card" style="grid-column: 1 / -1;">
                <h3>📋 Logs do Sistema</h3>
                <div style="margin: 15px 0;">
                    <button class="btn btn-test" onclick="loadLogs()">🔄 Atualizar Logs</button>
                    <select id="logType" style="margin-left: 10px; padding: 8px;">
                        <option value="all">Todos os logs</option>
                        <option value="app">Aplicação</option>
                        <option value="error">Erros</option>
                        <option value="crm">Ações CRM</option>
                    </select>
                </div>
                <div id="logsContainer" class="logs-container">
                    <div style="color: #6b7280;">Clique em "Atualizar Logs" para carregar...</div>
                </div>
            </div>
        </div>

        <script>
            // Gera URLs dos webhooks
            function generateWebhookUrls() {
                const baseUrl = window.location.origin;
                document.getElementById('mondayWebhook').textContent = baseUrl + '/webhook/monday';
                document.getElementById('evolutionWebhook').textContent = baseUrl + '/webhook/evolution';
            }

            // Testa serviços
            async function testServices() {
                const mondayStatus = document.getElementById('mondayStatus');
                const evolutionStatus = document.getElementById('evolutionStatus');
                
                mondayStatus.textContent = 'Testando...';
                mondayStatus.className = 'status-badge status-warning';
                
                evolutionStatus.textContent = 'Testando...';
                evolutionStatus.className = 'status-badge status-warning';

                try {
                    // Testa Monday.com real
                    const mondayResponse = await fetch('/api/test/monday');
                    const mondayResult = await mondayResponse.json();
                    
                    if (mondayResult.success) {
                        mondayStatus.textContent = '✅ Online - ' + (mondayResult.boardName || 'Conectado');
                        mondayStatus.className = 'status-badge status-success';
                    } else if (mondayResult.configured) {
                        mondayStatus.textContent = '⚠️ Erro - ' + (mondayResult.error || 'Falha na conexão');
                        mondayStatus.className = 'status-badge status-warning';
                    } else {
                        mondayStatus.textContent = '❌ Não Configurado';
                        mondayStatus.className = 'status-badge status-error';
                    }
                    
                    // Testa Evolution API real
                    const evolutionResponse = await fetch('/api/test/evolution');
                    const evolutionResult = await evolutionResponse.json();
                    
                    if (evolutionResult.success) {
                        evolutionStatus.textContent = '✅ Online - ' + (evolutionResult.state || 'Conectado');
                        evolutionStatus.className = 'status-badge status-success';
                    } else if (evolutionResult.configured) {
                        evolutionStatus.textContent = '⚠️ Erro - ' + (evolutionResult.error || 'Falha na conexão');
                        evolutionStatus.className = 'status-badge status-warning';
                    } else {
                        evolutionStatus.textContent = '❌ Não Configurado';
                        evolutionStatus.className = 'status-badge status-error';
                    }
                } catch (error) {
                    mondayStatus.textContent = '❌ Erro de Rede';
                    mondayStatus.className = 'status-badge status-error';
                    
                    evolutionStatus.textContent = '❌ Erro de Rede';
                    evolutionStatus.className = 'status-badge status-error';
                }

                // Atualiza logs após o teste
                setTimeout(loadLogs, 1000);
            }

            // Carrega logs reais
            async function loadLogs() {
                const container = document.getElementById('logsContainer');
                const logType = document.getElementById('logType').value;
                
                container.innerHTML = '<div style="color: #6b7280;">🔄 Carregando logs...</div>';
                
                try {
                    const response = await fetch('/api/logs?type=' + logType + '&lines=50');
                    const result = await response.json();
                    
                    if (result.success && result.logs && result.logs.length > 0) {
                        let logsHtml = '';
                        
                        result.logs.forEach(logFile => {
                            logsHtml += '<div style="border-bottom: 1px solid #374151; margin-bottom: 15px; padding-bottom: 10px;">';
                            logsHtml += '<div style="color: #10b981; font-weight: bold; margin-bottom: 8px;">📄 ' + logFile.file + '</div>';
                            
                            if (logFile.content && logFile.content.length > 0) {
                                logFile.content.forEach(line => {
                                    if (line.trim()) {
                                        // Destaca diferentes tipos de log com cores
                                        let color = '#f3f4f6';
                                        if (line.includes('[error]') || line.includes('ERROR')) {
                                            color = '#fca5a5';
                                        } else if (line.includes('[warn]') || line.includes('WARN')) {
                                            color = '#fcd34d';
                                        } else if (line.includes('[info]') || line.includes('INFO')) {
                                            color = '#93c5fd';
                                        } else if (line.includes('✅') || line.includes('SUCCESS')) {
                                            color = '#86efac';
                                        }
                                        
                                        logsHtml += '<div style="color: ' + color + '; margin-bottom: 2px; font-size: 0.85em;">' + escapeHtml(line) + '</div>';
                                    }
                                });
                            } else {
                                logsHtml += '<div style="color: #6b7280;">Nenhum log encontrado neste arquivo</div>';
                            }
                            logsHtml += '</div>';
                        });
                        
                        container.innerHTML = logsHtml;
                        
                        // Auto-scroll para o final
                        container.scrollTop = container.scrollHeight;
                        
                    } else {
                        container.innerHTML = '<div style="color: #6b7280;">📭 Nenhum log encontrado</div>';
                    }
                    
                } catch (error) {
                    container.innerHTML = '<div style="color: #fca5a5;">❌ Erro ao carregar logs: ' + error.message + '</div>';
                }
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Challenge é automático, não precisa de configuração manual

            // Carrega dados da Monday.com
            async function loadMondayData() {
                const container = document.getElementById('mondayTableContainer');
                const boardInfo = document.getElementById('mondayBoardInfo');
                const statusFilter = document.getElementById('mondayStatusFilter').value;
                const processFilter = document.getElementById('mondayProcessFilter').value;
                
                container.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 40px;">🔄 Sincronizando com Monday.com...</div>';
                
                try {
                    const response = await fetch('/api/monday/data');
                    const result = await response.json();
                    
                    if (result.success) {
                        // Atualizar informações do board
                        document.getElementById('boardName').textContent = result.board.name;
                        document.getElementById('totalItems').textContent = result.board.totalItems;
                        document.getElementById('syncedItems').textContent = result.synchronized;
                        document.getElementById('lastSync').textContent = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                        boardInfo.style.display = 'block';
                        
                        // Filtrar itens
                        let filteredItems = result.items;
                        
                        if (statusFilter !== 'all') {
                            filteredItems = filteredItems.filter(item => {
                                return Object.values(item.columns).some(col => 
                                    col.title.toLowerCase().includes('contato') && 
                                    col.title.toLowerCase().includes('sdr') && 
                                    col.text === statusFilter
                                );
                            });
                        }
                        
                        if (processFilter !== 'all') {
                            // Implementar filtro de processo se necessário
                        }
                        
                        // Criar tabela estilo Monday.com
                        if (filteredItems.length === 0) {
                            container.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 40px;">📭 Nenhum item encontrado</div>';
                        } else {
                            // Identificar colunas principais
                            const mainColumns = ['name'];
                            const columnTitles = { name: 'Nome' };
                            
                            if (result.board.columns.length > 0) {
                                result.board.columns.forEach(col => {
                                    mainColumns.push(col.id);
                                    columnTitles[col.id] = col.title;
                                });
                            }
                            
                            let tableHtml = \`
                                <table style="width: 100%; border-collapse: collapse; background: white;">
                                    <thead style="background: #f8f9fa; border-bottom: 2px solid #e5e7eb;">
                                        <tr>
                            \`;
                            
                            mainColumns.forEach(colId => {
                                tableHtml += \`<th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e5e7eb;">\${columnTitles[colId] || colId}</th>\`;
                            });
                            
                            tableHtml += \`
                                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                            \`;
                            
                            filteredItems.forEach(item => {
                                // Determinar cor da linha baseada no status
                                let rowColor = '#ffffff';
                                Object.values(item.columns).forEach(col => {
                                    if (col.title.toLowerCase().includes('contato') && col.title.toLowerCase().includes('sdr')) {
                                        switch(col.text) {
                                            case 'Primeiro Contato': rowColor = '#eff6ff'; break;
                                            case 'Segundo Contato': rowColor = '#fef3c7'; break;
                                            case 'Terceiro Contato': rowColor = '#fef2f2'; break;
                                            case 'Ultimo Contato': rowColor = '#f3e8ff'; break;
                                        }
                                    }
                                });
                                
                                tableHtml += \`<tr style="background: \${rowColor}; border-bottom: 1px solid #e5e7eb;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='\${rowColor}'">\`;
                                
                                mainColumns.forEach(colId => {
                                    let cellContent = '';
                                    
                                    if (colId === 'name') {
                                        cellContent = escapeHtml(item.name);
                                    } else if (item.columns[colId]) {
                                        const col = item.columns[colId];
                                        if (col.type === 'color') {
                                            cellContent = \`<span style="background: \${col.value?.color || '#e5e7eb'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">\${escapeHtml(col.text || '')}</span>\`;
                                        } else if (col.type === 'phone') {
                                            cellContent = \`📱 \${escapeHtml(col.text || '')}\`;
                                        } else {
                                            cellContent = escapeHtml(col.text || '-');
                                        }
                                    } else {
                                        cellContent = '-';
                                    }
                                    
                                    tableHtml += \`<td style="padding: 12px; border-right: 1px solid #e5e7eb;">\${cellContent}</td>\`;
                                });
                                
                                tableHtml += \`
                                    <td style="padding: 12px;">
                                        <button onclick="viewItemDetails('\${item.id}')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer;">
                                            👁️ Ver
                                        </button>
                                    </td>
                                </tr>\`;
                            });
                            
                            tableHtml += \`
                                    </tbody>
                                </table>
                            \`;
                            
                            container.innerHTML = tableHtml;
                        }
                        
                    } else {
                        container.innerHTML = \`<div style="color: #ef4444; text-align: center; padding: 40px;">❌ Erro: \${result.error}</div>\`;
                        boardInfo.style.display = 'none';
                    }
                    
                } catch (error) {
                    container.innerHTML = \`<div style="color: #ef4444; text-align: center; padding: 40px;">❌ Erro de conexão: \${error.message}</div>\`;
                    boardInfo.style.display = 'none';
                }
            }
            
            // Ver detalhes de um item
            function viewItemDetails(itemId) {
                // Por enquanto, só mostrar o ID - pode expandir para modal
                alert(\`Ver detalhes do item: \${itemId}\`);
            }

            // Gerar logs de teste
            async function generateTestLogs() {
                try {
                    const response = await fetch('/api/test/logs');
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ Logs de teste criados com sucesso! Atualize a seção de ações para visualizar.');
                        // Recarregar automaticamente os clientes para ver os novos logs
                        loadActiveClients();
                    } else {
                        alert('❌ Erro ao criar logs de teste: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro de conexão ao criar logs de teste: ' + error.message);
                }
            }

            // Carrega clientes ativos
            async function loadActiveClients() {
                const container = document.getElementById('clientsContainer');
                const actionsContainer = document.getElementById('recentActionsContainer');
                const filter = document.getElementById('clientFilter').value;
                
                container.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 20px;">🔄 Carregando clientes...</div>';
                
                try {
                    const response = await fetch('/api/clients');
                    const result = await response.json();
                    
                    if (result.success) {
                        // Atualiza estatísticas
                        document.getElementById('statTotal').textContent = result.stats.ativos || 0;
                        document.getElementById('statPending').textContent = result.pendingDispatch || 0;
                        document.getElementById('statFirst').textContent = result.stats.primeiro_contato || 0;
                        document.getElementById('statLast').textContent = result.stats.ultimo_contato || 0;
                        
                        // Filtra clientes
                        let filteredClients = result.activeLeads || [];
                        if (filter === 'pending') {
                            filteredClients = filteredClients.filter(c => c.pendenteDisparo);
                        } else if (filter === 'first') {
                            filteredClients = filteredClients.filter(c => c.statusAtual === 'Primeiro Contato');
                        } else if (filter === 'second') {
                            filteredClients = filteredClients.filter(c => c.statusAtual === 'Segundo Contato');
                        } else if (filter === 'third') {
                            filteredClients = filteredClients.filter(c => c.statusAtual === 'Terceiro Contato');
                        } else if (filter === 'last') {
                            filteredClients = filteredClients.filter(c => c.statusAtual === 'Ultimo Contato');
                        }
                        
                        if (filteredClients.length === 0) {
                            container.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 20px;">📭 Nenhum cliente encontrado</div>';
                        } else {
                            let clientsHtml = '<div style="display: grid; gap: 10px;">';
                            
                            filteredClients.forEach(client => {
                                const statusBadge = \`<span style="background: \${client.statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7em; font-weight: bold;">\${client.statusAtual}</span>\`;
                                const pendingIcon = client.pendenteDisparo ? '🔴' : '⏰';
                                const nextContact = client.proximoDisparoFormatted || 'Não agendado';
                                
                                clientsHtml += \`
                                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: \${client.pendenteDisparo ? '#fef2f2' : 'white'};">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <div style="font-weight: bold; color: #1f2937;">\${pendingIcon} \${escapeHtml(client.nome)}</div>
                                            \${statusBadge}
                                        </div>
                                        <div style="font-size: 0.85em; color: #6b7280; margin-bottom: 4px;">
                                            📱 \${escapeHtml(client.telefone)} | 🔄 \${client.tentativas} tentativas
                                        </div>
                                        <div style="font-size: 0.85em; color: #6b7280;">
                                            ⏰ Próximo: \${nextContact}
                                        </div>
                                        \${client.horasAteProximo !== null ? 
                                            \`<div style="font-size: 0.8em; color: \${client.horasAteProximo <= 0 ? '#ef4444' : '#6b7280'}; margin-top: 4px;">
                                                \${client.horasAteProximo <= 0 ? '🚨 Vencido' : \`⏳ Em \${Math.abs(client.horasAteProximo).toFixed(1)}h\`}
                                            </div>\` : ''
                                        }
                                    </div>
                                \`;
                            });
                            
                            clientsHtml += '</div>';
                            container.innerHTML = clientsHtml;
                        }
                        
                        // Carrega últimas ações com informações detalhadas
                        if (result.recentActions && result.recentActions.length > 0) {
                            let actionsHtml = '';
                            
                            // Adicionar informações do servidor no topo
                            if (result.serverInfo) {
                                actionsHtml += \`
                                    <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 10px; margin-bottom: 15px; font-size: 0.8em;">
                                        <strong>🕐 Info do Servidor:</strong><br/>
                                        Timezone: \${result.serverInfo.timezone} | Brasília: \${result.serverInfo.currentTimeBrasilia}<br/>
                                        Atual: \${result.timestampBrasilia}
                                    </div>
                                \`;
                            }
                            
                            result.recentActions.forEach(action => {
                                const icon = action.sucesso ? '✅' : '❌';
                                const bgColor = action.sucesso ? '#ecfdf5' : '#fef2f2';
                                const borderColor = action.sucesso ? '#10b981' : '#ef4444';
                                
                                // Determinar se tem detalhes expandidos
                                const hasExpandedDetails = action.detalhesCompletos && action.detalhesCompletos.metadata;
                                
                                actionsHtml += \`
                                    <div style="border-left: 3px solid \${borderColor}; padding: 10px 12px; margin-bottom: 10px; background: \${bgColor}; border-radius: 0 6px 6px 0;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                            <div style="font-size: 0.85em; font-weight: bold; color: #1f2937;">
                                                \${icon} \${escapeHtml(action.nome || action.leadId)} - \${action.acao}
                                            </div>
                                            <div style="font-size: 0.7em; color: #6b7280;">
                                                \${action.timestampRelative}
                                            </div>
                                        </div>
                                        <div style="font-size: 0.8em; color: #374151; margin-bottom: 3px;">
                                            \${escapeHtml(action.detalhes || '')}
                                        </div>
                                        <div style="font-size: 0.7em; color: #6b7280; display: flex; justify-content: space-between;">
                                            <span>📱 \${escapeHtml(action.telefone)} | Status: \${action.statusAtual}</span>
                                            <span>🕐 \${action.timestampFormatted}</span>
                                        </div>
                                        \${hasExpandedDetails ? \`
                                            <div style="margin-top: 5px; padding: 5px; background: rgba(0,0,0,0.05); border-radius: 3px; font-size: 0.7em;">
                                                <strong>Timezone:</strong> \${action.serverTimezone}
                                            </div>
                                        \` : ''}
                                    </div>
                                \`;
                            });
                            
                            actionsContainer.innerHTML = actionsHtml;
                        } else {
                            actionsContainer.innerHTML = '<div style="color: #6b7280; text-align: center;">📭 Nenhuma ação recente</div>';
                        }
                        
                    } else {
                        container.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 20px;">❌ Erro ao carregar clientes</div>';
                        actionsContainer.innerHTML = '<div style="color: #ef4444; text-align: center;">❌ Erro ao carregar ações</div>';
                    }
                    
                } catch (error) {
                    container.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 20px;">❌ Erro de conexão: ' + (error instanceof Error ? error.message : 'Erro desconhecido') + '</div>';
                    actionsContainer.innerHTML = '<div style="color: #ef4444; text-align: center;">❌ Erro de conexão</div>';
                }
            }

            // Função para atualizar o relógio
            function updateClock() {
                const now = new Date();
                const brasiliaTime = now.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                document.getElementById('current-time').textContent = brasiliaTime;
            }

            // Atualiza o relógio a cada segundo
            updateClock(); // Primeira atualização imediata
            setInterval(updateClock, 1000);

            // Inicializa página
            generateWebhookUrls();
            loadLogs();
            loadActiveClients();
            loadMondayData(); // Carrega dados da Monday.com automaticamente
            
            // Auto-atualização com intervalos diferenciados
            setInterval(loadLogs, 30000); // Logs a cada 30 segundos
            setInterval(loadActiveClients, 15000); // Clientes locais a cada 15 segundos
            setInterval(loadMondayData, 3600000); // Monday.com a cada 1 hora (3600000ms)
            
            // Verificações de status mais frequentes para o monitor
            setInterval(async function() {
                try {
                    // Atualizar status das APIs
                    const statusResponse = await fetch('/api/status');
                    const statusResult = await statusResponse.json();
                    
                    // Atualizar indicadores visuais do status
                    updateStatusIndicators(statusResult);
                } catch (error) {
                    console.log('Erro ao verificar status:', error);
                }
            }, 120000); // Status das APIs a cada 2 minutos
            
            // Event listeners para filtros
            document.getElementById('clientFilter').addEventListener('change', loadActiveClients);
            document.getElementById('mondayStatusFilter').addEventListener('change', loadMondayData);
            document.getElementById('mondayProcessFilter').addEventListener('change', loadMondayData);
            
            // Função para atualizar indicadores de status
            function updateStatusIndicators(statusData) {
                // Atualizar status Monday.com
                const mondayStatus = document.querySelector('#mondayStatus');
                if (mondayStatus) {
                    mondayStatus.className = 'status-badge';
                    if (statusData.monday && statusData.monday.status === 'connected') {
                        mondayStatus.innerHTML = '✅ Conectado';
                        mondayStatus.classList.add('status-success');
                    } else {
                        mondayStatus.innerHTML = '❌ Erro';
                        mondayStatus.classList.add('status-error');
                    }
                }
                
                // Atualizar status Evolution API
                const evolutionStatus = document.querySelector('#evolutionStatus');
                if (evolutionStatus) {
                    evolutionStatus.className = 'status-badge';
                    if (statusData.evolution && statusData.evolution.status === 'connected') {
                        evolutionStatus.innerHTML = '✅ Conectado';
                        evolutionStatus.classList.add('status-success');
                    } else {
                        evolutionStatus.innerHTML = '❌ Erro';
                        evolutionStatus.classList.add('status-error');
                    }
                }
                
                // Atualizar timestamp da última verificação
                const lastCheck = document.querySelector('#lastCheck');
                if (lastCheck) {
                    lastCheck.textContent = new Date().toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
            }
        </script>
    </body>
    </html>
    `;

    res.send(html);
  });

  // Endpoint para logs reais
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const { lines = 50, type = 'all' } = req.query;
    
    try {
      let logFiles: string[] = [];
      
      // Determina quais arquivos de log ler
      if (type === 'all' || type === 'app') {
        logFiles.push(path.join(process.cwd(), 'logs', 'app.log'));
      }
      if (type === 'all' || type === 'error') {
        logFiles.push(path.join(process.cwd(), 'logs', 'error.log'));
      }
      if (type === 'all' || type === 'crm') {
        logFiles.push(path.join(process.cwd(), 'logs', 'crm-actions.log'));
      }

      const logs: Array<{file: string, content: string[], timestamp: Date}> = [];

      for (const logFile of logFiles) {
        if (fs.existsSync(logFile)) {
          const content = fs.readFileSync(logFile, 'utf-8');
          const lines_array = content.split('\n')
            .filter((line: string) => line.trim() !== '')
            .slice(-(Number(lines) || 50));
          
          logs.push({
            file: path.basename(logFile),
            content: lines_array,
            timestamp: fs.statSync(logFile).mtime
          });
        }
      }

      res.json({
        success: true,
        logs,
        timestamp: new Date().toISOString(),
        totalFiles: logs.length
      });

    } catch (error) {
      logger.error('Error reading logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to read logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Teste real da API Monday.com
  testMonday = asyncHandler(async (req: Request, res: Response) => {
    try {
      const token = process.env.MONDAY_API_TOKEN;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!token || !boardId) {
        logger.warn('Monday.com credentials not configured', { 
          hasToken: !!token, 
          hasBoardId: !!boardId 
        });
        return res.json({
          success: false,
          error: 'Monday credentials not configured',
          configured: false
        });
      }

      logger.info('Testing Monday.com API connection', { 
        boardId,
        tokenFormat: token.substring(0, 20) + '...',
        tokenLength: token.length,
        tokenStartsWith: token.substring(0, 5)
      });

      // Teste real da API Monday.com
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      // Primeira tentativa: teste simples do board
      let response;
      let testQuery = `query { boards(ids: [${boardId}]) { id name } }`;
      
      try {
        response = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token // Monday.com não usa Bearer
          },
          body: JSON.stringify({
            query: testQuery
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        // Se falhar, tenta com Bearer
        logger.warn('First Monday.com test failed, trying with Bearer token');
        response = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: testQuery
          }),
          signal: controller.signal
        });
      }
      
      clearTimeout(timeoutId);

      const data: any = await response.json();
      
      // Log detalhado da resposta para debug
      logger.info('Monday.com API response', { 
        status: response.status, 
        statusText: response.statusText,
        data: data,
        hasData: !!data?.data,
        hasBoards: !!data?.data?.boards,
        boardsLength: data?.data?.boards?.length,
        errors: data?.errors
      });
      
      if (data?.data?.boards && Array.isArray(data.data.boards) && data.data.boards.length > 0) {
        // Se encontrou o board, faz uma query mais detalhada para verificar estrutura
        try {
          const detailedController = new AbortController();
          const detailedTimeoutId = setTimeout(() => detailedController.abort(), 15000);
          
          const detailedQuery = `
            query {
              boards(ids: [${boardId}]) {
                id
                name
                columns {
                  id
                  title
                  type
                }
                items_page(limit: 1) {
                  items {
                    id
                    name
                  }
                }
              }
            }
          `;
          
          const detailedResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
              query: detailedQuery
            }),
            signal: detailedController.signal
          });
          
          clearTimeout(detailedTimeoutId);
          const detailedData: any = await detailedResponse.json();
          
          logger.info('Monday.com detailed test response', {
            hasColumns: !!detailedData?.data?.boards?.[0]?.columns,
            columnsCount: detailedData?.data?.boards?.[0]?.columns?.length || 0,
            hasItems: !!detailedData?.data?.boards?.[0]?.items_page?.items,
            itemsCount: detailedData?.data?.boards?.[0]?.items_page?.items?.length || 0,
            columns: detailedData?.data?.boards?.[0]?.columns?.map((col: any) => ({ id: col.id, title: col.title, type: col.type }))
          });
          
          const board = detailedData?.data?.boards?.[0];
          
          return res.json({
            success: true,
            configured: true,
            boardName: board?.name || data.data.boards[0].name,
            boardId: board?.id || boardId,
            columnsCount: board?.columns?.length || 0,
            hasItems: (board?.items_page?.items?.length || 0) > 0,
            columns: board?.columns?.slice(0, 5) || [], // Primeiras 5 colunas para preview
            message: `Monday.com conectado! Board "${board?.name}" com ${board?.columns?.length || 0} colunas`
          });
        } catch (detailedError) {
          logger.warn('Detailed Monday.com test failed, but basic connection works', detailedError);
          return res.json({
          success: true,
          configured: true,
          boardName: data.data.boards[0].name,
            message: 'Monday.com conectado com sucesso (teste básico)'
        });
        }
      } else {
        // Se o board específico não foi encontrado, tenta uma query genérica para testar as credenciais
        try {
          const testController = new AbortController();
          const testTimeoutId = setTimeout(() => testController.abort(), 5000);
          
          const testResponse = await fetch('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({
              query: `query { me { id name } }`
            }),
            signal: testController.signal
          });
          
          clearTimeout(testTimeoutId);
          const testData: any = await testResponse.json();
          
          logger.info('Monday.com user test response', testData);
          
          if (testData?.data?.me) {
            return res.json({
              success: false,
              configured: true,
              error: `Board ID ${boardId} não encontrado ou sem permissão. Token válido para usuário: ${testData.data.me.name}`,
              details: { originalData: data, userTest: testData }
            });
          }
        } catch (testError) {
          logger.error('Monday.com user test failed', testError);
        }
        
        return res.json({
          success: false,
          configured: true,
          error: 'Board não encontrado ou sem permissão',
          details: data
        });
      }
    } catch (error) {
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout na conexão com Monday.com';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Erro de rede ao conectar com Monday.com';
        } else {
          errorMessage = error.message;
        }
      }
      
      return res.json({
        success: false,
        configured: true,
        error: errorMessage
      });
    }
  });

  // Teste real da Evolution API
  testEvolution = asyncHandler(async (req: Request, res: Response) => {
    try {
      const url = process.env.EVOLUTION_API_URL;
      const key = process.env.EVOLUTION_API_KEY;
      const instance = process.env.EVOLUTION_INSTANCE_NAME;
      
      if (!url || !key || !instance) {
        logger.warn('Evolution API credentials not configured', { 
          hasUrl: !!url, 
          hasKey: !!key, 
          hasInstance: !!instance 
        });
        return res.json({
          success: false,
          error: 'Evolution credentials not configured',
          configured: false
        });
      }

      logger.info('Testing Evolution API connection', { url, instance });

      // Teste real da Evolution API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      // Tenta diferentes endpoints que são comuns na Evolution API
      let testUrl = `${url}/instance/connectionState/${instance}`;
      
      // Remove barra dupla se existir
      testUrl = testUrl.replace(/([^:]\/)\/+/g, "$1");
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        return res.json({
          success: true,
          configured: true,
          state: data?.state || data?.instance?.state || 'unknown',
          message: 'Evolution API conectada com sucesso',
          instance: instance,
          url: testUrl
        });
      } else {
        // Tenta endpoint alternativo se o primeiro falhar
        try {
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), 5000);
          
          const altUrl = `${url}/instance/connect/${instance}`;
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            headers: {
              'apikey': key,
              'Content-Type': 'application/json'
            },
            signal: altController.signal
          });
          
          clearTimeout(altTimeoutId);
          
          if (altResponse.ok) {
            const altData: any = await altResponse.json();
            return res.json({
              success: true,
              configured: true,
              state: 'connected',
              message: 'Evolution API conectada (endpoint alternativo)',
              instance: instance,
              url: altUrl
            });
          }
        } catch (altError) {
          // Continua com o erro original
        }
        
        return res.json({
          success: false,
          configured: true,
          error: `HTTP ${response.status}: ${response.statusText}`,
          url: testUrl
        });
      }
    } catch (error) {
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout na conexão com Evolution API';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Erro de rede ao conectar com Evolution API';
        } else {
          errorMessage = error.message;
        }
      }
      
      return res.json({
        success: false,
        configured: true,
        error: errorMessage
      });
    }
  });

  // Teste da função de cálculo de 24 horas
  // Endpoint para testar logs
  testLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { logCrmAction } = require('../utils/logger');
      
      // Gerar alguns logs de teste
      await logCrmAction('test-lead-001', 'TEST_LOG', 'Este é um log de teste para verificar timezone', true, {
        testData: 'Dados de teste',
        userAgent: req.get('User-Agent')
      });
      
      await logCrmAction('test-lead-002', 'WEBHOOK_PROCESSED', 'Webhook processado com sucesso - teste', true);
      
      await logCrmAction('test-lead-003', 'SEND_TEXT_MESSAGE', 'Mensagem de teste enviada para +5511999888777', true, {
        messageLength: 50,
        recipient: '+5511999888777'
      });
      
      await logCrmAction('test-lead-004', 'VALIDATION_FAILED', 'Teste de falha na validação', false, {
        errors: ['Campo obrigatório', 'Formato inválido']
      });
      
      res.json({
        success: true,
        message: 'Logs de teste criados com sucesso',
        serverInfo: {
          timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
          currentTime: new Date().toISOString(),
          currentTimeBrasilia: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error creating test logs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  testCalculateTime = asyncHandler(async (req: Request, res: Response) => {
    try {
      const moment = require('moment-timezone');
      const { DEFAULT_CONFIG } = require('../config/constants');
      
      const timezone = process.env.TIMEZONE || DEFAULT_CONFIG.TIMEZONE;
      const now = moment().tz(timezone);
      let nextTime = now.clone().add(DEFAULT_CONFIG.INTERVALO_CONTATOS_HORAS, 'hours');

      const workStart = DEFAULT_CONFIG.WORK_START_HOUR;
      const workEnd = DEFAULT_CONFIG.WORK_END_HOUR;

      const originalNextTime = nextTime.format('YYYY-MM-DD HH:mm:ss');
      
      // Aplica as mesmas regras da função real
      if (nextTime.day() === 0) { // Domingo
        nextTime = nextTime.day(1).hour(workStart).minute(0).second(0);
      } else if (nextTime.day() === 6) { // Sábado
        nextTime = nextTime.day(8).hour(workStart).minute(0).second(0);
      }

      if (nextTime.hour() < workStart) {
        nextTime = nextTime.hour(workStart).minute(0).second(0);
      }

      if (nextTime.hour() >= workEnd) {
        nextTime = nextTime.add(1, 'day').hour(workStart).minute(0).second(0);
        
        if (nextTime.day() === 0) { // Domingo
          nextTime = nextTime.day(1);
        } else if (nextTime.day() === 6) { // Sábado
          nextTime = nextTime.day(8);
        }
      }

      res.json({
        success: true,
        test: 'calculateNextBusinessTime',
        now: now.format('YYYY-MM-DD HH:mm:ss dddd'),
        timezone,
        workHours: `${workStart}h às ${workEnd}h`,
        intervalHours: DEFAULT_CONFIG.INTERVALO_CONTATOS_HORAS,
        calculation: {
          originalNextTime,
          adjustedNextTime: nextTime.format('YYYY-MM-DD HH:mm:ss dddd'),
          hoursFromNow: nextTime.diff(now, 'hours', true).toFixed(2),
          dayOfWeek: {
            now: now.day(),
            next: nextTime.day()
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para listar clientes ativos e em processamento
  getActiveClients = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { leadService } = require('../services/leadService');
      const database = require('../database/connection').database;
      
      // Busca leads ativos
      const activeLeads = await database.all(`
        SELECT 
          id,
          nome,
          telefone,
          status_atual,
          proximo_disparo,
          tentativas,
          data_criacao,
          data_ultima_atualizacao,
          ativo,
          CASE 
            WHEN proximo_disparo IS NOT NULL AND datetime(proximo_disparo) <= datetime('now') THEN 1
            ELSE 0
          END as pendente_disparo
        FROM leads 
        WHERE ativo = 1 
        ORDER BY 
          pendente_disparo DESC,
          proximo_disparo ASC,
          data_ultima_atualizacao DESC
        LIMIT 50
      `);

      // Busca estatísticas
      const stats = await leadService.getLeadStats();

      // Busca últimas ações (últimos 30 logs) com informações detalhadas
      const recentActions = await database.all(`
        SELECT 
          la.id,
          la.lead_id,
          la.acao,
          la.detalhes,
          la.timestamp,
          la.sucesso,
          l.nome,
          l.telefone,
          l.status_atual
        FROM logs_acoes la
        LEFT JOIN leads l ON la.lead_id = l.id
        ORDER BY la.timestamp DESC
        LIMIT 30
      `);

      // Formatar dados dos leads
      const formattedLeads = activeLeads.map((lead: any) => ({
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        statusAtual: lead.status_atual,
        proximoDisparo: lead.proximo_disparo ? new Date(lead.proximo_disparo).toISOString() : null,
        proximoDisparoFormatted: lead.proximo_disparo ? 
          new Date(lead.proximo_disparo).toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : null,
        tentativas: lead.tentativas,
        dataCriacao: new Date(lead.data_criacao).toISOString(),
        dataUltimaAtualizacao: new Date(lead.data_ultima_atualizacao).toISOString(),
        ativo: Boolean(lead.ativo),
        pendenteDisparo: Boolean(lead.pendente_disparo),
        statusColor: this.getStatusColor(lead.status_atual),
        horasAteProximo: lead.proximo_disparo ? 
          Math.round((new Date(lead.proximo_disparo).getTime() - Date.now()) / (1000 * 60 * 60 * 24) * 24) / 24 : null
      }));

      // Formatar últimas ações com informações detalhadas
      const serverTimezone = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      
      const formattedActions = recentActions.map((action: any) => {
        const actionTimestamp = new Date(action.timestamp);
        const timeDiff = Math.round((now.getTime() - actionTimestamp.getTime()) / 1000); // diferença em segundos
        
        // Parse do detalhes se for JSON
        let parsedDetails = action.detalhes;
        let detailsObject = null;
        try {
          detailsObject = JSON.parse(action.detalhes);
          parsedDetails = detailsObject.details || action.detalhes;
        } catch (e) {
          // Se não for JSON, mantém como string
        }
        
        return {
          id: action.id,
          leadId: action.lead_id,
          nome: action.nome || 'Lead não encontrado',
          telefone: action.telefone || '-',
          statusAtual: action.status_atual || '-',
          acao: action.acao,
          detalhes: parsedDetails,
          detalhesCompletos: detailsObject,
          timestamp: actionTimestamp.toISOString(),
          timestampFormatted: actionTimestamp.toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          timestampRelative: this.getRelativeTime(timeDiff),
          sucesso: Boolean(action.sucesso),
          serverTimezone: detailsObject?.serverTimezone || serverTimezone,
          timestampBrasilia: detailsObject?.timestampBrasilia || actionTimestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        };
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        timestampBrasilia: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        serverInfo: {
          timezone: serverTimezone,
          resolvedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          processEnvTZ: process.env.TZ || 'not set',
          currentTime: now.toISOString(),
          currentTimeBrasilia: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        },
        stats: stats || {
          total: 0,
          ativos: 0,
          primeiro_contato: 0,
          segundo_contato: 0,
          terceiro_contato: 0,
          ultimo_contato: 0,
          pendentes: 0
        },
        activeLeads: formattedLeads,
        recentActions: formattedActions,
        totalActive: formattedLeads.length,
        pendingDispatch: formattedLeads.filter((l: any) => l.pendenteDisparo).length
      });

    } catch (error) {
      logger.error('Error getting active clients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active clients',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  private getStatusColor(status: string): string {
    switch (status) {
      case 'Primeiro Contato': return '#3b82f6'; // Blue
      case 'Segundo Contato': return '#f59e0b';  // Orange
      case 'Terceiro Contato': return '#ef4444'; // Red
      case 'Ultimo Contato': return '#8b5cf6';   // Purple
      default: return '#6b7280'; // Gray
    }
  }

  private getRelativeTime(secondsAgo: number): string {
    if (secondsAgo < 60) {
      return `${secondsAgo}s atrás`;
    } else if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes}min atrás`;
    } else if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(secondsAgo / 86400);
      return `${days}d atrás`;
    }
  }

  // 🎯 EXTERNAL SCHEDULER ENDPOINTS - Estratégia robusta para Vercel Hobby
  
  externalSchedulerProcess = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { externalScheduler } = require('../services/externalScheduler');
      const source = req.get('User-Agent') || req.body?.source || 'external-service';
      
      logger.info(`ExternalScheduler chamado por: ${source}`);
      
      const result = await externalScheduler.processScheduledContacts();
      
      res.json({
        ...result,
        source,
        message: result.success 
          ? `Processamento concluído: ${result.processed} contatos enviados, ${result.pending} pendentes`
          : 'Erro no processamento de contatos'
      });
    } catch (error) {
      logger.error('Error in externalSchedulerProcess:', error);
      res.status(500).json({
        success: false,
        processed: 0,
        pending: 0,
        details: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  externalSchedulerHealth = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { externalScheduler } = require('../services/externalScheduler');
      const health = await externalScheduler.healthCheck();
      
      res.json(health);
    } catch (error) {
      logger.error('Error in externalSchedulerHealth:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  externalSchedulerConfig = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { externalScheduler } = require('../services/externalScheduler');
      const configs = externalScheduler.getExternalSchedulingConfig();
      
      res.json({
        success: true,
        message: 'Configurações para serviços externos de cron',
        configs,
        instructions: {
          step1: 'Escolha um dos serviços externos listados',
          step2: 'Configure um cron job apontando para o endpoint fornecido',
          step3: 'Use o intervalo sugerido (pode ajustar conforme necessário)',
          step4: 'Monitore via /api/external-scheduler/health',
          note: 'Recomendado: EasyCron.com para facilidade ou cron-job.org para jobs ilimitados'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in externalSchedulerConfig:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para criar endpoints de cron para Vercel (mantido para compatibilidade)
  cronProcessContacts = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { contactService } = require('../services/contactService');
      const database = require('../database/connection').database;
      
      // Buscar contatos que precisam ser processados (próximo disparo <= agora)
      const pendingContacts = await database.all(`
        SELECT 
          id, nome, telefone, status_atual, proximo_disparo, tentativas
        FROM leads 
        WHERE ativo = 1 
          AND proximo_disparo IS NOT NULL 
          AND datetime(proximo_disparo) <= datetime('now')
        ORDER BY proximo_disparo ASC
        LIMIT 50
      `);
      
      logger.info('Processing scheduled contacts check', {
        pendingContacts: pendingContacts.length,
        timestamp: new Date().toISOString()
      });
      
      let processedCount = 0;
      let errors = [];
      
      for (const contact of pendingContacts) {
        try {
          // Log do contato a ser processado
          logger.info('Contact ready for processing', {
            id: contact.id,
            nome: contact.nome,
            status: contact.status_atual,
            scheduledFor: contact.proximo_disparo,
            now: new Date().toISOString()
          });
          
          // Por enquanto, apenas loggar - não disparar automaticamente
          // await contactService.processScheduledContact(contact.id);
          processedCount++;
          
        } catch (error) {
          logger.error('Error processing contact', { 
            contactId: contact.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          errors.push({
            contactId: contact.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      res.json({
        success: true,
        message: 'Scheduled contacts check completed',
        pendingContacts: pendingContacts.length,
        processedCount,
        errors: errors.length,
        errorDetails: errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in cron process contacts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  cronHealthCheck = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { leadService } = require('../services/leadService');
      const stats = await leadService.getLeadStats();
      
      res.json({
        success: true,
        message: 'Health check completed',
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in cron health check:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para carregar dados da Monday.com e sincronizar
  getMondayData = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { mondayService } = require('../services/mondayService');
      const database = require('../database/connection').database;
      
      const token = process.env.MONDAY_API_TOKEN;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!token || !boardId) {
        return res.status(400).json({
          success: false,
          error: 'Monday.com credentials not configured'
        });
      }

      // Query GraphQL para buscar todos os itens do board
      const query = `
        query {
          boards(ids: [${boardId}]) {
            id
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
                column_values {
                  id
                  text
                  value
                }
                created_at
                updated_at
              }
            }
          }
        }
      `;

      // Controle de timeout para o getMondayData
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos para queries mais pesadas

      logger.info('Fetching Monday.com data', { boardId, queryLimit: 100 });

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data: any = await response.json();
      
      if (!response.ok || data.errors) {
        logger.error('Monday.com API error:', data);
        return res.status(400).json({
          success: false,
          error: 'Failed to fetch Monday.com data',
          details: data.errors || 'API request failed'
        });
      }

      const board = data.data?.boards?.[0];
      if (!board) {
        return res.status(404).json({
          success: false,
          error: 'Board not found'
        });
      }

      // Processar e organizar os dados
      const items = board.items_page?.items || [];
      const columns = board.columns || [];
      
      // Mapear tipos de colunas para facilitar o processamento
      const columnMap: any = {};
      columns.forEach((col: any) => {
        columnMap[col.id] = {
          title: col.title,
          type: col.type
        };
      });

      // Processar cada item
      const processedItems = items.map((item: any) => {
        const itemData: any = {
          id: item.id,
          name: item.name,
          created_at: item.created_at,
          updated_at: item.updated_at,
          columns: {}
        };

        // Processar valores das colunas
        item.column_values.forEach((colValue: any) => {
          const columnInfo = columnMap[colValue.id];
          if (columnInfo) {
            itemData.columns[colValue.id] = {
              title: columnInfo.title,
              type: columnInfo.type,
              text: colValue.text,
              value: colValue.value ? JSON.parse(colValue.value) : null
            };
          }
        });

        return itemData;
      });

      // Sincronizar com banco local (se necessário)
      for (const item of processedItems) {
        try {
          // Buscar telefone e status nas colunas
          let telefone = '';
          let status = '';
          let nome = item.name;

          Object.values(item.columns).forEach((col: any) => {
            if (col.title.toLowerCase().includes('telefone') || col.title.toLowerCase().includes('phone')) {
              telefone = col.text || '';
            }
            if (col.title.toLowerCase().includes('contato') && col.title.toLowerCase().includes('sdr')) {
              status = col.text || '';
            }
          });

          // Se temos dados suficientes, sincronizar com banco local
          if (telefone && status && ['Primeiro Contato', 'Segundo Contato', 'Terceiro Contato', 'Ultimo Contato'].includes(status)) {
            const existingLead = await database.get(`
              SELECT * FROM leads WHERE id = ?
            `, [item.id]);

            if (!existingLead) {
              // Inserir novo lead
              await database.run(`
                INSERT INTO leads (id, nome, telefone, status_atual, data_criacao, data_ultima_atualizacao, ativo)
                VALUES (?, ?, ?, ?, ?, ?, 1)
              `, [
                item.id,
                nome,
                telefone,
                status,
                new Date(item.created_at).toISOString(),
                new Date(item.updated_at).toISOString()
              ]);
              
              logger.info('Lead synchronized from Monday.com:', { id: item.id, nome, status });
            } else {
              // Atualizar lead existente
              await database.run(`
                UPDATE leads 
                SET nome = ?, telefone = ?, status_atual = ?, data_ultima_atualizacao = ?
                WHERE id = ?
              `, [
                nome,
                telefone,
                status,
                new Date(item.updated_at).toISOString(),
                item.id
              ]);
              
              logger.info('Lead updated from Monday.com:', { id: item.id, nome, status });
            }
          }
        } catch (syncError) {
          logger.error('Error syncing item:', { id: item.id, error: syncError });
        }
      }

      return res.json({
        success: true,
        board: {
          id: board.id,
          name: board.name,
          columns: columns,
          totalItems: items.length
        },
        items: processedItems,
        synchronized: processedItems.filter((item: any) => {
          let hasPhone = false;
          let hasStatus = false;
          Object.values(item.columns).forEach((col: any) => {
            if (col.title.toLowerCase().includes('telefone') || col.title.toLowerCase().includes('phone')) {
              hasPhone = !!col.text;
            }
            if (col.title.toLowerCase().includes('contato') && col.title.toLowerCase().includes('sdr')) {
              hasStatus = ['Primeiro Contato', 'Segundo Contato', 'Terceiro Contato', 'Ultimo Contato'].includes(col.text);
            }
          });
          return hasPhone && hasStatus;
        }).length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting Monday.com data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get Monday.com data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para verificar se está pronto para produção
  getProductionReadiness = asyncHandler(async (req: Request, res: Response) => {
    const checks = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
        port: process.env.PORT || 'default (3002)'
      },
      requiredEnvVars: {
        MONDAY_API_TOKEN: !!process.env.MONDAY_API_TOKEN,
        MONDAY_BOARD_ID: !!process.env.MONDAY_BOARD_ID,
        EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
        EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
        EVOLUTION_INSTANCE_NAME: !!process.env.EVOLUTION_INSTANCE_NAME
      },
      database: {
        path: require('../config/constants').PATHS.DATABASE,
        accessible: false
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        retention: process.env.LOG_RETENTION_DAYS || '7'
      },
      apis: {
        monday: false,
        evolution: false
      },
      security: {
        helmet: true,
        cors: true,
        errorHandling: true
      }
    };

    // Verificar acesso ao banco
    try {
      const { database } = require('../database/connection');
      await database.get('SELECT 1');
      checks.database.accessible = true;
    } catch (error) {
      logger.warn('Database check failed:', error);
    }

    // Verificar APIs (tentativa rápida)
    try {
      const mondayResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.MONDAY_API_TOKEN || ''
        },
        body: JSON.stringify({ query: 'query { me { id } }' }),
        signal: AbortSignal.timeout(5000)
      });
      checks.apis.monday = mondayResponse.ok;
    } catch (error) {
      // Silently fail for this check
    }

    try {
      if (process.env.EVOLUTION_API_URL) {
        const evolutionResponse = await fetch(`${process.env.EVOLUTION_API_URL}/manager/getInstances`, {
          headers: { 'apikey': process.env.EVOLUTION_API_KEY || '' },
          signal: AbortSignal.timeout(5000)
        });
        checks.apis.evolution = evolutionResponse.ok;
      }
    } catch (error) {
      // Silently fail for this check
    }

    // Calcular score de prontidão
    const envVarsCount = Object.values(checks.requiredEnvVars).filter(Boolean).length;
    const totalEnvVars = Object.keys(checks.requiredEnvVars).length;
    const envScore = (envVarsCount / totalEnvVars) * 100;

    const isProductionReady = 
      checks.environment.isProduction &&
      envScore === 100 &&
      checks.database.accessible;

    res.json({
      ready: isProductionReady,
      score: {
        environment: checks.environment.isProduction ? 100 : 0,
        envVars: envScore,
        database: checks.database.accessible ? 100 : 0,
        apis: {
          monday: checks.apis.monday ? 100 : 0,
          evolution: checks.apis.evolution ? 100 : 0
        },
        overall: Math.round((
          (checks.environment.isProduction ? 25 : 0) +
          (envScore * 0.25) +
          (checks.database.accessible ? 25 : 0) +
          ((checks.apis.monday ? 12.5 : 0) + (checks.apis.evolution ? 12.5 : 0))
        ))
      },
      checks,
      recommendations: isProductionReady ? [] : [
        ...(!checks.environment.isProduction ? ['Configurar NODE_ENV=production'] : []),
        ...(envScore < 100 ? ['Configurar todas as variáveis de ambiente obrigatórias'] : []),
        ...(!checks.database.accessible ? ['Verificar acesso ao banco de dados'] : []),
        ...(!checks.apis.monday ? ['Verificar conectividade com Monday.com API'] : []),
        ...(!checks.apis.evolution ? ['Verificar conectividade com Evolution API'] : [])
      ],
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint para status dos serviços
  getStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = {
      monday: {
        configured: !!(process.env.MONDAY_API_TOKEN && process.env.MONDAY_BOARD_ID),
        token: process.env.MONDAY_API_TOKEN ? 'SET' : 'NOT_SET',
        boardId: process.env.MONDAY_BOARD_ID || 'NOT_SET'
      },
      evolution: {
        configured: !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE_NAME),
        url: process.env.EVOLUTION_API_URL || 'NOT_SET',
        key: process.env.EVOLUTION_API_KEY ? 'SET' : 'NOT_SET',
        instance: process.env.EVOLUTION_INSTANCE_NAME || 'NOT_SET'
      },
      database: {
        status: 'connected',
        path: './data/crm.db'
      },
      timestamp: new Date().toISOString()
    };

    res.json(status);
  });
}

export const dashboardController = new DashboardController();
