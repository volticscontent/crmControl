import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

class LeadsController {
  // Retorna o HTML da aba Leads com funcionalidades completas
  getLeadsTab = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!-- TAB: LEADS NO FUNIL -->
    <div id="leads" class="tab-content active">
        <!-- FILTROS E BUSCA -->
        <div class="card">
            <div class="card-title">
                <i class="fas fa-filter"></i>
                Filtros e Busca
            </div>
            <div class="grid grid-4">
                <div class="control-group">
                    <label class="control-label">Buscar Lead</label>
                    <input type="text" class="control-input" id="searchLead" placeholder="Nome ou telefone">
                </div>
                <div class="control-group">
                    <label class="control-label">Status</label>
                    <select class="control-input" id="filterStatus">
                        <option value="">Todos os Status</option>
                        <option value="Primeiro Contato">Primeiro Contato</option>
                        <option value="Segundo Contato">Segundo Contato</option>
                        <option value="Terceiro Contato">Terceiro Contato</option>
                        <option value="Ultimo Contato">Último Contato</option>
                        <option value="Aguardando Ligação">Aguardando Ligação</option>
                        <option value="Não Respondeu">Não Respondeu</option>
                    </select>
                </div>
                <div class="control-group">
                    <label class="control-label">Período</label>
                    <select class="control-input" id="filterPeriod">
                        <option value="">Todos</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mês</option>
                    </select>
                </div>
                <div class="control-group" style="display: flex; align-items: end;">
                    <button class="btn btn-primary" onclick="applyFilters()">
                        <i class="fas fa-search"></i>
                        Buscar
                    </button>
                    <button class="btn" onclick="clearFilters()" style="margin-left: 0.5rem;">
                        <i class="fas fa-times"></i>
                        Limpar
                    </button>
                </div>
            </div>
        </div>

        <!-- ESTATÍSTICAS DO FUNIL -->
        <div class="grid grid-5">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-play"></i>
                    Primeiro Contato
                </div>
                <div class="card-value" id="primeiroContatoCount">-</div>
                <div class="card-description">Leads iniciando funil</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-clock"></i>
                    Segundo Contato
                </div>
                <div class="card-value" id="segundoContatoCount">-</div>
                <div class="card-description">Follow-up enviado</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Terceiro Contato
                </div>
                <div class="card-value" id="terceiroContatoCount">-</div>
                <div class="card-description">Última chance</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-stop"></i>
                    Último Contato
                </div>
                <div class="card-value" id="ultimoContatoCount">-</div>
                <div class="card-description">Finalizando funil</div>
            </div>

            <div class="card">
                <div class="card-title">
                    <i class="fas fa-phone"></i>
                    Aguardando Ligação
                </div>
                <div class="card-value" id="aguardandoLigacaoCount">-</div>
                <div class="card-description">Responderam interesse</div>
            </div>
        </div>

        <div class="grid grid-2">
            <!-- LEADS ATIVOS -->
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-users"></i>
                    Leads Ativos no Funil
                    <button class="btn" onclick="refreshLeads()" style="margin-left: auto; font-size: 0.75rem;">
                        <i class="fas fa-sync"></i>
                        Atualizar
                    </button>
                </div>
                <div id="leadsContainer" style="max-height: 500px; overflow-y: auto;">
                    <div class="stats-item">
                        <span class="stats-label">Carregando leads...</span>
                        <span class="spinner"></span>
                    </div>
                </div>
            </div>

            <!-- LOGS DE WEBHOOKS -->
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-exchange-alt"></i>
                    Logs de Webhooks Recentes
                    <button class="btn" onclick="refreshWebhookLogs()" style="margin-left: auto; font-size: 0.75rem;">
                        <i class="fas fa-sync"></i>
                        Atualizar
                    </button>
                </div>
                <div id="webhookLogsContainer" style="max-height: 500px; overflow-y: auto;">
                    <div class="stats-item">
                        <span class="stats-label">Carregando logs...</span>
                        <span class="spinner"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- AÇÕES RÁPIDAS -->
        <div class="card" style="margin-top: 1.5rem;">
            <div class="card-title">
                <i class="fas fa-tools"></i>
                Ações Rápidas
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <button class="btn btn-primary" onclick="syncWithMonday()">
                    <i class="fas fa-sync-alt"></i>
                    Sincronizar com Monday
                </button>
                <button class="btn" onclick="exportLeads()">
                    <i class="fas fa-download"></i>
                    Exportar Leads CSV
                </button>
                <button class="btn" onclick="sendManualReminder()">
                    <i class="fas fa-bell"></i>
                    Lembrete Manual
                </button>
                <button class="btn btn-warning" onclick="pauseActiveCampaigns()">
                    <i class="fas fa-pause"></i>
                    Pausar Campanhas
                </button>
            </div>
        </div>
    </div>

    <script>
        // Initialize Leads tab
        function initLeads() {
            loadLeadsData();
            loadWebhookLogs();
            loadFunnelStats();
            
            // Auto-refresh a cada 30 segundos
            if (window.leadsInterval) clearInterval(window.leadsInterval);
            window.leadsInterval = setInterval(() => {
                loadLeadsData();
                loadFunnelStats();
            }, 30000);
        }

        // LOAD DATA
        async function loadLeadsData() {
            try {
                const response = await fetch('/api/leads');
                const data = await response.json();
                
                if (data.success) {
                    displayLeads(data.leads || []);
                } else {
                    document.getElementById('leadsContainer').innerHTML = 
                        '<div class="error-message">Erro ao carregar leads: ' + data.error + '</div>';
                }
            } catch (error) {
                document.getElementById('leadsContainer').innerHTML = 
                    '<div class="error-message">Erro: ' + error.message + '</div>';
            }
        }

        async function loadWebhookLogs() {
            try {
                const response = await fetch('/api/webhook-logs');
                const data = await response.json();
                
                if (data.success) {
                    displayWebhookLogs(data.webhookLogs || []);
                } else {
                    document.getElementById('webhookLogsContainer').innerHTML = 
                        '<div class="error-message">Erro ao carregar logs: ' + data.error + '</div>';
                }
            } catch (error) {
                document.getElementById('webhookLogsContainer').innerHTML = 
                    '<div class="error-message">Erro: ' + error.message + '</div>';
            }
        }

        async function loadFunnelStats() {
            try {
                const response = await fetch('/api/leads/stats');
                const data = await response.json();
                
                if (data.success) {
                    updateFunnelStats(data.stats);
                } else {
                    console.error('Erro ao carregar estatísticas:', data.error);
                }
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            }
        }

        // DISPLAY FUNCTIONS
        function displayLeads(leads) {
            const container = document.getElementById('leadsContainer');
            
            if (!leads || leads.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum lead ativo no funil</div>';
                return;
            }
            
            let html = '<div class="leads-list">';
            
            leads.forEach(lead => {
                const statusClass = getStatusClass(lead.status);
                const nextContact = lead.proximoContato ? new Date(lead.proximoContato).toLocaleString('pt-BR') : 'Não agendado';
                
                html += '<div class="lead-item">' +
                    '<div class="lead-info">' +
                        '<div class="lead-name">' + lead.nome + '</div>' +
                        '<div class="lead-phone">' + lead.telefone + '</div>' +
                        '<div class="lead-details">Próximo: ' + nextContact + '</div>' +
                    '</div>' +
                    '<div class="lead-status">' +
                        '<span class="status-badge ' + statusClass + '">' + lead.status + '</span>' +
                    '</div>' +
                    '<div class="lead-actions">' +
                        '<button class="btn btn-sm" onclick="viewLeadDetails(\'' + lead.id + '\')" title="Ver detalhes">' +
                            '<i class="fas fa-eye"></i>' +
                        '</button>' +
                        '<button class="btn btn-sm" onclick="sendImmediateContact(\'' + lead.id + '\')" title="Contato imediato">' +
                            '<i class="fas fa-paper-plane"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        function displayWebhookLogs(logs) {
            const container = document.getElementById('webhookLogsContainer');
            
            if (!logs || logs.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum log de webhook recente</div>';
                return;
            }
            
            let html = '<div class="webhook-logs">';
            
            logs.forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
                const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
                const typeIcon = log.type === 'monday_webhook' ? 'fa-calendar-alt' : 'fa-whatsapp';
                
                html += '<div class="webhook-log-item">' +
                    '<div class="log-icon"><i class="fas ' + typeIcon + '"></i></div>' +
                    '<div class="log-info">' +
                        '<div class="log-type">' + log.type.replace('_', ' ').toUpperCase() + '</div>' +
                        '<div class="log-time">' + time + ' - ' + date + '</div>' +
                        '<div class="log-description">' + getLogDescription(log) + '</div>' +
                    '</div>' +
                    '<div class="log-status">' +
                        '<span class="status-indicator ' + (log.response?.success ? 'success' : 'error') + '"></span>' +
                    '</div>' +
                '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        function updateFunnelStats(stats) {
            document.getElementById('primeiroContatoCount').textContent = stats.primeiroContato || 0;
            document.getElementById('segundoContatoCount').textContent = stats.segundoContato || 0;
            document.getElementById('terceiroContatoCount').textContent = stats.terceiroContato || 0;
            document.getElementById('ultimoContatoCount').textContent = stats.ultimoContato || 0;
            document.getElementById('aguardandoLigacaoCount').textContent = stats.aguardandoLigacao || 0;
        }

        // FILTER FUNCTIONS
        function applyFilters() {
            const search = document.getElementById('searchLead').value;
            const status = document.getElementById('filterStatus').value;
            const period = document.getElementById('filterPeriod').value;
            
            let url = '/api/leads?';
            if (search) url += 'search=' + encodeURIComponent(search) + '&';
            if (status) url += 'status=' + encodeURIComponent(status) + '&';
            if (period) url += 'period=' + period + '&';
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayLeads(data.leads);
                    }
                })
                .catch(error => console.error('Erro na busca:', error));
        }

        function clearFilters() {
            document.getElementById('searchLead').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterPeriod').value = '';
            loadLeadsData();
        }

        // ACTION FUNCTIONS
        async function viewLeadDetails(leadId) {
            try {
                const response = await fetch('/api/leads/' + leadId);
                const data = await response.json();
                
                if (data.success) {
                    const lead = data.lead;
                    alert('📋 Detalhes do Lead\\n\\n' +
                        'Nome: ' + lead.nome + '\\n' +
                        'Telefone: ' + lead.telefone + '\\n' +
                        'Status: ' + lead.status + '\\n' +
                        'Criado em: ' + new Date(lead.createdAt).toLocaleString('pt-BR') + '\\n' +
                        'Próximo contato: ' + (lead.proximoContato ? new Date(lead.proximoContato).toLocaleString('pt-BR') : 'Não agendado'));
                } else {
                    alert('❌ Erro ao carregar detalhes: ' + data.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function sendImmediateContact(leadId) {
            if (!confirm('Deseja enviar um contato imediato para este lead?')) return;
            
            try {
                const response = await fetch('/api/leads/' + leadId + '/contact-now', {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Contato enviado com sucesso!');
                    loadLeadsData();
                } else {
                    alert('❌ Erro ao enviar contato: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function syncWithMonday() {
            try {
                const response = await fetch('/api/leads/sync-monday', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Sincronização com Monday.com concluída!');
                    loadLeadsData();
                    loadFunnelStats();
                } else {
                    alert('❌ Erro na sincronização: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function exportLeads() {
            try {
                const response = await fetch('/api/leads/export');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'leads-funil-' + new Date().toISOString().split('T')[0] + '.csv';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    alert('✅ Leads exportados com sucesso!');
                } else {
                    alert('❌ Erro ao exportar leads');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        function sendManualReminder() {
            const phone = prompt('Digite o telefone do lead para enviar lembrete:');
            if (!phone) return;
            
            const message = prompt('Digite a mensagem do lembrete:');
            if (!message) return;
            
            fetch('/api/leads/manual-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, message })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Lembrete enviado com sucesso!');
                } else {
                    alert('❌ Erro ao enviar lembrete: ' + result.error);
                }
            })
            .catch(error => alert('❌ Erro: ' + error.message));
        }

        async function pauseActiveCampaigns() {
            if (!confirm('⚠️ Deseja pausar todas as campanhas ativas? Esta ação interromperá o envio automático.')) return;
            
            try {
                const response = await fetch('/api/campaigns/pause-all', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('⏸️ Todas as campanhas foram pausadas com sucesso!');
                } else {
                    alert('❌ Erro ao pausar campanhas: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // REFRESH FUNCTIONS
        async function refreshLeads() {
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            
            try {
                await loadLeadsData();
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
            } catch (error) {
                btn.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        }

        async function refreshWebhookLogs() {
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            
            try {
                await loadWebhookLogs();
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
            } catch (error) {
                btn.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        }

        // HELPER FUNCTIONS
        function getStatusClass(status) {
            switch (status) {
                case 'Primeiro Contato': return 'status-primary';
                case 'Segundo Contato': return 'status-info';
                case 'Terceiro Contato': return 'status-warning';
                case 'Ultimo Contato': return 'status-danger';
                case 'Aguardando Ligação': return 'status-success';
                case 'Não Respondeu': return 'status-muted';
                default: return 'status-default';
            }
        }

        function getLogDescription(log) {
            if (log.type === 'monday_webhook') {
                return 'Status atualizado para: ' + (log.payload?.event?.value?.label?.text || 'N/A');
            } else if (log.type === 'evolution_webhook') {
                return 'Mensagem recebida do cliente';
            }
            return 'Evento de webhook processado';
        }

        // Cleanup on tab change
        window.addEventListener('beforeunload', () => {
            if (window.leadsInterval) clearInterval(window.leadsInterval);
        });
    </script>

    <style>
        /* LEADS & FUNNEL - Vercel Style */
        .control-group {
            margin-bottom: 1rem;
        }

        .control-label {
            display: block;
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            letter-spacing: -0.01em;
        }

        .control-input {
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

        .control-input:focus {
            outline: none;
            border-color: var(--border-focus);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
        }

        .leads-list {
            display: grid;
            gap: 0.75rem;
        }

        .lead-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }

        .lead-item:hover {
            background: var(--bg-secondary);
            border-color: var(--border-hover);
        }

        .lead-info {
            flex: 1;
            min-width: 0;
        }

        .lead-name {
            font-weight: 500;
            color: var(--text-primary);
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }

        .lead-phone {
            color: var(--text-secondary);
            font-size: 0.8125rem;
            font-family: var(--font-mono);
            margin-bottom: 0.25rem;
        }

        .lead-details {
            color: var(--text-muted);
            font-size: 0.75rem;
        }

        .lead-status {
            flex-shrink: 0;
        }

        .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-xs);
            font-size: 0.75rem;
            font-weight: 500;
            white-space: nowrap;
        }

        .status-primary { background: var(--primary-bg); color: var(--primary); }
        .status-info { background: var(--info-bg); color: var(--info); }
        .status-warning { background: var(--warning-bg); color: var(--warning); }
        .status-danger { background: var(--error-bg); color: var(--error); }
        .status-success { background: var(--success-bg); color: var(--success); }
        .status-muted { background: var(--bg-secondary); color: var(--text-muted); }

        .lead-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .webhook-logs {
            display: grid;
            gap: 0.75rem;
        }

        .webhook-log-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }

        .webhook-log-item:hover {
            background: var(--bg-secondary);
            border-color: var(--border-hover);
        }

        .log-icon {
            width: 2.5rem;
            height: 2.5rem;
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            flex-shrink: 0;
        }

        .log-info {
            flex: 1;
            min-width: 0;
        }

        .log-type {
            font-weight: 500;
            color: var(--text-primary);
            font-size: 0.8125rem;
            margin-bottom: 0.25rem;
        }

        .log-time {
            color: var(--text-muted);
            font-size: 0.75rem;
            font-family: var(--font-mono);
            margin-bottom: 0.25rem;
        }

        .log-description {
            color: var(--text-secondary);
            font-size: 0.75rem;
        }

        .log-status {
            flex-shrink: 0;
        }

        .status-indicator {
            width: 0.75rem;
            height: 0.75rem;
            border-radius: 50%;
            display: inline-block;
        }

        .status-indicator.success {
            background: var(--success);
        }

        .status-indicator.error {
            background: var(--error);
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

        @media (max-width: 768px) {
            .lead-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .lead-actions {
                align-self: stretch;
                justify-content: space-between;
            }
            
            .webhook-log-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
        }
    </style>
    `;
    
    res.send(html);
  });

  // API endpoint para logs do sistema
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { getMemoryLogs } = await import('../../utils/logger');
      const logs = getMemoryLogs();
      
      res.json({
        success: true,
        logs: logs.slice(-50) // Últimos 50 logs
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to get logs' 
      });
    }
  });

  // API endpoint para logs de webhooks
  getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
      const webhookLogs = [
        {
          timestamp: new Date().toISOString(),
          type: 'monday_webhook',
          payload: {
            event: {
              type: 'update_column_value',
              pulseId: 123456789,
              columnId: 'color_mkt8t95b',
              value: { label: { text: 'Primeiro Contato' } }
            }
          },
          response: { success: true, action: 'sent_and_scheduled' }
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'evolution_webhook',
          payload: {
            data: {
              key: { remoteJid: '5511999999999@s.whatsapp.net' },
              message: { conversation: 'Olá! Tenho interesse sim!' }
            }
          },
          response: { success: true, action: 'marked_as_waiting' }
        },
        {
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'monday_webhook',
          payload: {
            event: {
              type: 'update_column_value',
              pulseId: 987654321,
              columnId: 'color_mkt8t95b',
              value: { label: { text: 'Segundo Contato' } }
            }
          },
          response: { success: true, action: 'sent_and_scheduled' }
        }
      ];

      res.json({
        success: true,
        webhookLogs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to get webhook logs' 
      });
    }
  });

  // API endpoint para obter leads
  getLeads = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { search, status, period } = req.query;
      
      // Mock data - implementar lógica real de busca
      let leads = [
        {
          id: '1',
          nome: 'João Silva',
          telefone: '5511999999999',
          status: 'Primeiro Contato',
          proximoContato: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'Maria Santos',
          telefone: '5511888888888',
          status: 'Segundo Contato',
          proximoContato: new Date(Date.now() + 172800000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          nome: 'Pedro Costa',
          telefone: '5511777777777',
          status: 'Aguardando Ligação',
          proximoContato: null,
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '4',
          nome: 'Ana Lima',
          telefone: '5511666666666',
          status: 'Terceiro Contato',
          proximoContato: new Date(Date.now() + 259200000).toISOString(),
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      // Aplicar filtros
      if (search) {
        leads = leads.filter(lead => 
          lead.nome.toLowerCase().includes(search.toString().toLowerCase()) ||
          lead.telefone.includes(search.toString())
        );
      }

      if (status) {
        leads = leads.filter(lead => lead.status === status);
      }

      res.json({
        success: true,
        leads,
        total: leads.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // API endpoint para estatísticas do funil
  getLeadsStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = {
        primeiroContato: 15,
        segundoContato: 8,
        terceiroContato: 3,
        ultimoContato: 2,
        aguardandoLigacao: 5,
        naoRespondeu: 12,
        total: 45
      };

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

export const leadsController = new LeadsController(); 