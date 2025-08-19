import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { analyticsService } from '../../services/analyticsService';

class AnalyticsController {
  // Retorna o HTML da aba Analytics
  getAnalyticsTab = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!-- TAB: ANALYTICS -->
    <div id="analytics" class="tab-content active">
        <!-- 📊 SISTEMA DE SAÚDE -->
        <div class="grid grid-3">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-heartbeat"></i>
                    Saúde do Sistema
                </div>
                <div id="system-health-indicator" class="health-indicator">
                    <div class="card-value" id="health-status">✅ Saudável</div>
                    <div class="card-description" id="health-details">Todos os sistemas operacionais</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-percentage"></i>
                    Taxa de Sucesso
                </div>
                <div class="card-value" id="success-rate" style="color: var(--success);">95%</div>
                <div class="card-description">Últimas 24h</div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Taxa de Erro
                </div>
                <div class="card-value" id="error-rate" style="color: var(--error);">5%</div>
                <div class="card-description">Últimas 24h</div>
            </div>
        </div>

        <!-- 📈 MÉTRICAS DETALHADAS -->
        <div class="grid grid-2">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-chart-line"></i>
                    Atividade por Hora
                </div>
                <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-chart-area" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <div>Gráfico será implementado</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Chart.js em desenvolvimento</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-chart-pie"></i>
                    Distribuição por Categoria
                </div>
                <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-chart-pie" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <div>Gráfico será implementado</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Chart.js em desenvolvimento</div>
                </div>
            </div>
        </div>

        <!-- 🚨 LOGS RECENTES -->
        <div class="card">
            <div class="card-title">
                <i class="fas fa-bug"></i>
                Logs Recentes do Sistema
            </div>
            <div id="recent-logs" class="terminal-body" style="max-height: 300px;">
                <div class="log-line">
                    <span class="log-time">00:00:00</span>
                    <span class="log-level-info">INFO</span>
                    <span>Carregando logs recentes...</span>
                </div>
            </div>
        </div>

        <!-- 📊 ESTATÍSTICAS DETALHADAS -->
        <div class="grid grid-2">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-list-ol"></i>
                    Operações por Tipo
                </div>
                <div id="top-operations">
                    <div class="stats-item">
                        <span class="stats-label">Webhooks Monday</span>
                        <span class="stats-value" id="webhook-count">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">Mensagens Enviadas</span>
                        <span class="stats-value" id="messages-count">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">APIs Consultadas</span>
                        <span class="stats-value" id="api-calls-count">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">Leads Processados</span>
                        <span class="stats-value" id="leads-processed-count">-</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-tags"></i>
                    Performance do Sistema
                </div>
                <div id="performance-stats">
                    <div class="stats-item">
                        <span class="stats-label">Tempo Médio de Resposta</span>
                        <span class="stats-value" id="avg-response-time">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">Uso de Memória</span>
                        <span class="stats-value" id="memory-usage">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">CPU Load</span>
                        <span class="stats-value" id="cpu-load">-</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">Requests/min</span>
                        <span class="stats-value" id="requests-per-min">-</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 🔄 CONTROLES DE ATUALIZAÇÃO -->
        <div class="card">
            <div class="card-title">
                <i class="fas fa-sync-alt"></i>
                Controles de Analytics
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="refreshAnalytics()">
                    <i class="fas fa-sync"></i>
                    Atualizar Dados
                </button>
                <button class="btn" onclick="exportAnalytics()">
                    <i class="fas fa-download"></i>
                    Exportar Relatório
                </button>
                <button class="btn" onclick="clearAnalytics()">
                    <i class="fas fa-trash-alt"></i>
                    Limpar Cache
                </button>
                <button class="btn" onclick="toggleAutoRefresh()">
                    <i class="fas fa-play" id="autoRefreshIcon"></i>
                    <span id="autoRefreshText">Iniciar Auto-refresh</span>
                </button>
            </div>
            <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted);">
                Última atualização: <span id="lastAnalyticsUpdate">-</span>
            </div>
        </div>
    </div>

    <script>
        let analyticsAutoRefreshInterval = null;

        // Initialize Analytics tab
        function initAnalytics() {
            loadAnalyticsData();
        }

        // 📊 Load Analytics Data
        async function loadAnalyticsData() {
            try {
                const response = await fetch('/api/analytics');
                const data = await response.json();
                
                if (data.success) {
                    updateAnalyticsDisplay(data.analytics);
                    loadRecentLogs();
                } else {
                    console.error('Erro ao carregar analytics:', data.error);
                }
            } catch (error) {
                console.error('Erro ao carregar dados de analytics:', error);
            }
        }

        function updateAnalyticsDisplay(analytics) {
            // Update success/error rates
            const successRate = analytics.successRate || 95;
            const errorRate = 100 - successRate;
            
            document.getElementById('success-rate').textContent = successRate.toFixed(1) + '%';
            document.getElementById('error-rate').textContent = errorRate.toFixed(1) + '%';
            
            // Update operation counts
            document.getElementById('webhook-count').textContent = analytics.webhookCount || 0;
            document.getElementById('messages-count').textContent = analytics.messagesCount || 0;
            document.getElementById('api-calls-count').textContent = analytics.apiCallsCount || 0;
            document.getElementById('leads-processed-count').textContent = analytics.leadsProcessed || 0;
            
            // Update performance stats
            document.getElementById('avg-response-time').textContent = (analytics.avgResponseTime || 0) + 'ms';
            document.getElementById('memory-usage').textContent = formatBytes(analytics.memoryUsage || 0);
            document.getElementById('cpu-load').textContent = (analytics.cpuLoad || 0).toFixed(1) + '%';
            document.getElementById('requests-per-min').textContent = analytics.requestsPerMin || 0;
            
            // Update health status
            const healthStatus = document.getElementById('health-status');
            const healthDetails = document.getElementById('health-details');
            
            if (successRate > 90) {
                healthStatus.textContent = '✅ Saudável';
                healthStatus.style.color = 'var(--success)';
                healthDetails.textContent = 'Todos os sistemas operacionais';
            } else if (successRate > 70) {
                healthStatus.textContent = '⚠️ Atenção';
                healthStatus.style.color = 'var(--warning)';
                healthDetails.textContent = 'Alguns problemas detectados';
            } else {
                healthStatus.textContent = '❌ Crítico';
                healthStatus.style.color = 'var(--error)';
                healthDetails.textContent = 'Múltiplos problemas detectados';
            }
            
            // Update last update time
            document.getElementById('lastAnalyticsUpdate').textContent = 
                new Date().toLocaleTimeString('pt-BR');
        }

        async function loadRecentLogs() {
            try {
                const response = await fetch('/api/logs?limit=20');
                const data = await response.json();
                
                if (data.success && data.logs) {
                    const container = document.getElementById('recent-logs');
                    container.innerHTML = '';
                    
                    data.logs.forEach(log => {
                        const logLine = document.createElement('div');
                        logLine.className = 'log-line';
                        
                        const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
                        const level = log.level || 'info';
                        const levelClass = 'log-level-' + level.toLowerCase();
                        
                        logLine.innerHTML = 
                            '<span class="log-time">' + time + '</span>' +
                            '<span class="' + levelClass + '">' + level.toUpperCase() + '</span>' +
                            '<span>' + (log.message || log.detalhes || 'Log sem mensagem') + '</span>';
                        
                        container.appendChild(logLine);
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar logs:', error);
            }
        }

        // Helper function to format bytes
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Control Functions
        async function refreshAnalytics() {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
            btn.disabled = true;
            
            try {
                await loadAnalyticsData();
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

        async function exportAnalytics() {
            try {
                const response = await fetch('/api/analytics/export');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`analytics-report-\${new Date().toISOString().split('T')[0]}.json\`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert('❌ Erro ao exportar relatório');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function clearAnalytics() {
            if (!confirm('Tem certeza que deseja limpar o cache de analytics?')) return;
            
            try {
                const response = await fetch('/api/analytics/clear', { method: 'POST' });
                if (response.ok) {
                    alert('✅ Cache de analytics limpo!');
                    loadAnalyticsData();
                } else {
                    alert('❌ Erro ao limpar cache');
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        function toggleAutoRefresh() {
            const icon = document.getElementById('autoRefreshIcon');
            const text = document.getElementById('autoRefreshText');
            
            if (analyticsAutoRefreshInterval) {
                clearInterval(analyticsAutoRefreshInterval);
                analyticsAutoRefreshInterval = null;
                icon.className = 'fas fa-play';
                text.textContent = 'Iniciar Auto-refresh';
            } else {
                analyticsAutoRefreshInterval = setInterval(loadAnalyticsData, 60000); // 1 minuto
                icon.className = 'fas fa-pause';
                text.textContent = 'Parar Auto-refresh';
            }
        }

        // Cleanup on tab change
        window.addEventListener('beforeunload', () => {
            if (analyticsAutoRefreshInterval) {
                clearInterval(analyticsAutoRefreshInterval);
            }
        });
    </script>
    `;
    
    res.send(html);
  });

  // API endpoint para dados de analytics
  getAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
    try {
      const analytics = {
        successRate: 95,
        webhookCount: 150,
        messagesCount: 120,
        apiCallsCount: 300,
        leadsProcessed: 85,
        avgResponseTime: 250,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuLoad: 15.5,
        requestsPerMin: 45
      };

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar dados de analytics'
      });
    }
  });
}

export const analyticsController = new AnalyticsController(); 