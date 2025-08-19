import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { analyticsService } from '../../services/analyticsService';
import { leadService } from '../../services/leadService';

class OverviewController {
  // Retorna o HTML da aba Overview
  getOverviewTab = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!-- TAB: VISÃO GERAL -->
    <div id="overview" class="tab-content active">
        <!-- 📊 MÉTRICAS PRINCIPAIS -->
        <div class="grid grid-4">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-bullseye"></i>
                    Leads Ativos
                </div>
                <div class="card-value" id="activeLeads">-</div>
                <div class="card-description">No funil automático</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-paper-plane"></i>
                    Contatos Enviados
                </div>
                <div class="card-value" id="contactsSent">-</div>
                <div class="card-description">Últimas 24h</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-reply"></i>
                    Respostas
                </div>
                <div class="card-value" id="responses">-</div>
                <div class="card-description">Aguardando ligação</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-clock"></i>
                    Uptime
                </div>
                <div class="card-value" id="uptime">-</div>
                <div class="card-description">Tempo online</div>
            </div>
        </div>

        <!-- 🔌 STATUS CONEXÕES -->
        <div class="grid grid-2">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-plug"></i>
                    Status das APIs
                </div>
                <div class="stats-item">
                    <span class="stats-label">Monday.com</span>
                    <span class="badge badge-success" id="mondayStatus">
                        <span class="spinner" style="display:none;"></span>
                        <i class="fas fa-check-circle"></i>
                        OK
                    </span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Evolution API</span>
                    <span class="badge badge-success" id="evolutionStatus">
                        <span class="spinner" style="display:none;"></span>
                        <i class="fas fa-check-circle"></i>
                        OK
                    </span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Database</span>
                    <span class="badge badge-success" id="dbStatus">
                        <span class="spinner" style="display:none;"></span>
                        <i class="fas fa-database"></i>
                        SQLite OK
                    </span>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    <i class="fas fa-tools"></i>
                    Ações Rápidas
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="testWebhook()">
                        <i class="fas fa-flask"></i>
                        Testar Webhook
                    </button>
                    <button class="btn" onclick="refreshOverviewData()">
                        <i class="fas fa-sync"></i>
                        Atualizar
                    </button>
                    <button class="btn" onclick="clearLogs()">
                        <i class="fas fa-trash-alt"></i>
                        Limpar
                    </button>
                    <button class="btn" onclick="downloadLogs()">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Overview tab
        function initOverview() {
            loadOverviewData();
            
            // Auto-refresh a cada 30 segundos
            if (window.overviewInterval) clearInterval(window.overviewInterval);
            window.overviewInterval = setInterval(loadOverviewData, 30000);
        }

        // 📊 Load Overview Data
        async function loadOverviewData() {
            try {
                const [statusRes, leadsRes] = await Promise.all([
                    fetch('/api/status'),
                    fetch('/api/leads')
                ]);

                if (statusRes.ok) {
                    const status = await statusRes.json();
                    updateMetrics(status);
                    updateApiStatus(status);
                }

                if (leadsRes.ok) {
                    const leads = await leadsRes.json();
                    updateActiveLeadsCount(leads.leads || []);
                }
            } catch (error) {
                console.error('Erro ao carregar dados da overview:', error);
            }
        }

        // Update Functions
        function updateMetrics(data) {
            document.getElementById('activeLeads').textContent = data.leads?.ativos || '0';
            document.getElementById('contactsSent').textContent = data.stats?.contactsSent || '0';
            document.getElementById('responses').textContent = data.stats?.responses || '0';
            
            if (data.uptime) {
                const hours = Math.floor(data.uptime / 3600);
                const minutes = Math.floor((data.uptime % 3600) / 60);
                document.getElementById('uptime').textContent = hours + 'h ' + minutes + 'm';
            }
        }

        function updateApiStatus(data) {
            const mondayEl = document.getElementById('mondayStatus');
            const evolutionEl = document.getElementById('evolutionStatus');
            
            if (data.monday?.connected) {
                mondayEl.className = 'badge badge-success';
                mondayEl.innerHTML = '<i class="fas fa-check-circle"></i> OK';
            } else {
                mondayEl.className = 'badge badge-error';
                mondayEl.innerHTML = '<i class="fas fa-times-circle"></i> Erro';
            }
            
            if (data.evolution?.connected) {
                evolutionEl.className = 'badge badge-success';
                evolutionEl.innerHTML = '<i class="fas fa-check-circle"></i> OK';
            } else {
                evolutionEl.className = 'badge badge-error';
                evolutionEl.innerHTML = '<i class="fas fa-times-circle"></i> Erro';
            }
        }

        function updateActiveLeadsCount(leads) {
            const count = leads.filter(lead => lead.ativo).length;
            document.getElementById('activeLeads').textContent = count.toString();
        }

        // Test Functions
        async function testWebhook() {
            try {
                const response = await fetch('/webhook/test/monday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: Date.now().toString(),
                        nome: 'Teste Dashboard',
                        telefone: '5511999999999'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Teste executado com sucesso!');
                } else {
                    alert('⚠️ Teste falhou: ' + result.message);
                }
                
                setTimeout(loadOverviewData, 1000);
            } catch (error) {
                alert('❌ Erro no teste: ' + error.message);
            }
        }

        async function refreshOverviewData() {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
            btn.disabled = true;
            
            try {
                await loadOverviewData();
                btn.innerHTML = '<i class="fas fa-check"></i> Atualizado!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
            } catch (error) {
                btn.innerHTML = '<i class="fas fa-times"></i> Erro';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        }

        async function clearLogs() {
            if (!confirm('Tem certeza que deseja limpar todos os logs?')) return;
            
            try {
                const response = await fetch('/api/logs/clear', { method: 'POST' });
                if (response.ok) {
                    alert('✅ Logs limpos com sucesso!');
                } else {
                    alert('❌ Erro ao limpar logs');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function downloadLogs() {
            try {
                const response = await fetch('/api/logs/download');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = \`crm-logs-\${new Date().toISOString().split('T')[0]}.txt\`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert('❌ Erro ao baixar logs');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // Cleanup on tab change
        window.addEventListener('beforeunload', () => {
            if (window.overviewInterval) clearInterval(window.overviewInterval);
        });
    </script>
    `;
    
    res.send(html);
  });

  // API endpoint para dados da overview
  getOverviewData = asyncHandler(async (req: Request, res: Response) => {
    try {
      const leads = await leadService.getActiveLeads();

      res.json({
        success: true,
        data: {
          activeLeads: leads.length,
          contactsSent: 0, // Será implementado no analytics service
          responses: 0, // Será implementado no analytics service  
          uptime: process.uptime(),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar dados da overview'
      });
    }
  });
}

export const overviewController = new OverviewController(); 