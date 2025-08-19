import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

class MainDashboardController {
  // 🌙 DASHBOARD ESCURO PROFISSIONAL - Inspirado na Vercel
  dashboard = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRM Dashboard</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            /* 🌙 VERCEL DARK THEME */
            * { 
                box-sizing: border-box; 
                margin: 0; 
                padding: 0; 
            }
            
            :root {
                /* Vercel Dark Theme Colors */
                --bg-primary: #000000;
                --bg-secondary: #0a0a0a;
                --bg-tertiary: #171717;
                --bg-card: #111111;
                --text-primary: #fafafa;
                --text-secondary: #a3a3a3;
                --text-muted: #525252;
                --border: #262626;
                --border-hover: #404040;
                --border-focus: #525252;
                
                /* Status Colors - Vercel Style */
                --success: #00d9ff;
                --success-bg: rgba(0, 217, 255, 0.1);
                --warning: #f5a623;
                --warning-bg: rgba(245, 166, 35, 0.1);
                --error: #ff0080;
                --error-bg: rgba(255, 0, 128, 0.1);
                --info: #0070f3;
                --info-bg: rgba(0, 112, 243, 0.1);
                
                /* Vercel Typography */
                --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                
                /* Spacing & Sizing */
                --radius: 8px;
                --radius-sm: 6px;
                --radius-lg: 12px;
                --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            }
            
            body { 
                font-family: var(--font-sans);
                background: var(--bg-primary);
                color: var(--text-primary);
                line-height: 1.5;
                font-size: 14px;
                min-height: 100vh;
                font-feature-settings: "rlig" 1, "calt" 1;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
            }
            
            /* 📱 LAYOUT */
            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem 1rem;
            }
            
            /* 🏠 HEADER - Vercel Style */
            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
            }
            
            .header h1 {
                font-size: 1.125rem;
                font-weight: 500;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                letter-spacing: -0.025em;
            }
            
            .status-indicator {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--success);
                flex-shrink: 0;
            }
            
            .time-display {
                font-family: var(--font-mono);
                font-size: 0.75rem;
                color: var(--text-muted);
                background: var(--bg-tertiary);
                padding: 0.375rem 0.75rem;
                border-radius: var(--radius-sm);
                border: 1px solid var(--border);
                font-weight: 400;
            }
            
            /* 📊 TABS NAVIGATION - Vercel Style */
            .tabs {
                display: flex;
                gap: 2px;
                margin-bottom: 2rem;
                background: var(--bg-secondary);
                padding: 4px;
                border-radius: var(--radius);
                border: 1px solid var(--border);
                overflow-x: auto;
            }
            
            .tab {
                flex: 1;
                min-width: fit-content;
                padding: 0.5rem 0.875rem;
                background: transparent;
                border: none;
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                font-size: 0.8125rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 150ms ease;
                display: flex;
                align-items: center;
                gap: 0.375rem;
                justify-content: center;
                white-space: nowrap;
                letter-spacing: -0.01em;
            }
            
            .tab.active {
                background: var(--bg-primary);
                color: var(--text-primary);
                box-shadow: var(--shadow);
            }
            
            .tab:hover:not(.active) {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            /* 📊 GRID SYSTEM */
            .grid {
                display: grid;
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
            .grid-3 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
            .grid-4 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            
            /* 🃏 CARDS - Vercel Style */
            .card {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1.5rem;
                transition: border-color 150ms ease;
                box-shadow: var(--shadow);
            }
            
            .card:hover {
                border-color: var(--border-hover);
            }
            
            .card-title {
                font-size: 0.8125rem;
                font-weight: 500;
                color: var(--text-secondary);
                letter-spacing: -0.01em;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .card-value {
                font-size: 1.875rem;
                font-weight: 600;
                color: var(--text-primary);
                line-height: 1.2;
                font-family: var(--font-mono);
                letter-spacing: -0.025em;
            }
            
            .card-description {
                font-size: 0.75rem;
                color: var(--text-muted);
                margin-top: 0.5rem;
            }
            
            /* 🟢 STATUS BADGES */
            .badge {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }
            
            .badge-success { background: var(--success-bg); color: var(--success); }
            .badge-error { background: var(--error-bg); color: var(--error); }
            .badge-warning { background: var(--warning-bg); color: var(--warning); }
            .badge-info { background: var(--info-bg); color: var(--info); }
            
            /* 🔘 BUTTONS - Vercel Style */
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                padding: 0.5rem 0.75rem;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-primary);
                font-size: 0.8125rem;
                font-weight: 500;
                margin-top: 10px;
                cursor: pointer;
                transition: all 150ms ease;
                text-decoration: none;
                letter-spacing: -0.01em;
                white-space: nowrap;
                outline: none;
                position: relative;
            }
            
            .btn:hover {
                background: var(--bg-primary);
                border-color: var(--border-hover);
            }
            
            .btn:focus {
                border-color: var(--border-focus);
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
            }
            
            .btn-primary {
                background: var(--text-primary);
                color: var(--bg-primary);
                border-color: var(--text-primary);
            }
            
            .btn-primary:hover {
                background: var(--text-secondary);
                border-color: var(--text-secondary);
            }
            
            .btn-danger {
                background: var(--error);
                color: var(--text-primary);
                border-color: var(--error);
            }
            
            .btn-danger:hover {
                background: #e60073;
                border-color: #e60073;
            }
            
            .btn-warning {
                background: var(--warning);
                color: white;
                border-color: var(--warning);
                margin-top: 25px;
            }
            
            .btn-warning:hover {
                background: #e6951e;
                border-color: #e6951e;
            }
            
            .btn-success {
                background: var(--success);
                color: var(--bg-primary);
                border-color: var(--success);
            }
            
            .btn-success:hover {
                background: #00c7e6;
                border-color: #00c7e6;
            }
            
            /* 📝 TERMINAL - Vercel Style */
            .terminal {
                background: var(--bg-secondary);
                border-radius: var(--radius);
                overflow: hidden;
                font-family: var(--font-mono);
                font-size: 0.75rem;
                border: 1px solid var(--border);
                box-shadow: var(--shadow);
            }
            
            .terminal-header {
                background: var(--bg-tertiary);
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                border-bottom: 1px solid var(--border);
            }
            
            .terminal-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .dot-red { background: #ff5f56; }
            .dot-yellow { background: #ffbd2e; }
            .dot-green { background: #27ca3f; }
            
            .terminal-body {
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
                line-height: 1.4;
                background: #0a0a0a;
            }
            
            .log-line {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }
            
            .log-time {
                color: var(--text-muted);
                flex-shrink: 0;
                opacity: 0.7;
            }
            
            .log-level-info { color: var(--success); }
            .log-level-warn { color: var(--warning); }
            .log-level-error { color: var(--error); }
            
            /* 📊 STATS ITEMS - Vercel Style */
            .stats-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--border);
                min-height: 2.5rem;
            }
            
            .stats-item:last-child { border-bottom: none; }
            
            .stats-label {
                color: var(--text-secondary);
                font-size: 0.8125rem;
                font-weight: 400;
                letter-spacing: -0.01em;
            }
            
            .stats-value {
                font-weight: 500;
                font-family: var(--font-mono);
                color: var(--text-primary);
                font-size: 0.8125rem;
                letter-spacing: -0.005em;
            }
            
            /* 🔄 SPINNER */
            .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid var(--border);
                border-top: 2px solid var(--success);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* TAB CONTENT */
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* 📱 RESPONSIVE - Mobile First */
            @media (max-width: 768px) {
                .container { 
                    padding: 1rem; 
                    max-width: 100%;
                }
                
                .header { 
                    flex-direction: column; 
                    gap: 1rem; 
                    align-items: flex-start;
                    padding: 1rem;
                }
                
                .header h1 {
                    font-size: 1rem;
                }
                
                .tabs {
                    padding: 2px;
                    gap: 1px;
                }
                
                .tab {
                    padding: 0.5rem;
                    font-size: 0.75rem;
                    min-width: auto;
                }
                
                .grid-2, .grid-3, .grid-4 { 
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .card { 
                    padding: 1rem;
                    margin-bottom: 0;
                }
                
                .btn {
                    padding: 0.5rem;
                    font-size: 0.75rem;
                    gap: 0.25rem;
                }
                
                .terminal-body {
                    max-height: 300px;
                    font-size: 0.7rem;
                }
                
                .card-value {
                    font-size: 1.5rem;
                }
            }
            
            @media (max-width: 480px) {
                .container {
                    padding: 0.75rem;
                }
                
                .header {
                    padding: 0.75rem;
                }
                
                .card {
                    padding: 0.75rem;
                }
                
                .stats-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.25rem;
                    padding: 0.5rem 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- 🏠 HEADER -->
            <header class="header">
                <h1>
                    <span class="status-indicator"></span>
                    <i class="fas fa-robot"></i>
                    CRM Dashboard
                </h1>
                <div class="time-display" id="timeDisplay">
                    <i class="fas fa-clock"></i>
                    00:00:00 BRT
                </div>
            </header>

            <!-- 📊 TABS NAVIGATION -->
            <div class="tabs">
                <button class="tab active" onclick="showTab('overview')">
                    <i class="fas fa-chart-line"></i>
                    Visão Geral
                </button>
                <button class="tab" onclick="showTab('analytics')">
                    <i class="fas fa-chart-bar"></i>
                    Analytics
                </button>
                <button class="tab" onclick="showTab('leads')">
                    <i class="fas fa-users"></i>
                    Leads no Funil
                </button>
                <button class="tab" onclick="showTab('files')">
                    <i class="fas fa-folder-open"></i>
                    Arquivos & Mensagens
                </button>
                <button class="tab" onclick="showTab('controls')">
                    <i class="fas fa-cogs"></i>
                    Controles
                </button>
                <button class="tab" onclick="showTab('logs')">
                    <i class="fas fa-terminal"></i>
                    Logs
                </button>
            </div>

            <!-- CONTEÚDO DAS ABAS SERÁ CARREGADO DINAMICAMENTE -->
            <div id="tabContent"></div>
        </div>

        <script>
            // 🚀 JAVASCRIPT FUNCTIONS
            
            // Tab Navigation
            function showTab(tabName) {
                // Remove active class from all tabs
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Add active class to clicked tab
                event.target.classList.add('active');
                
                // Load tab content dynamically
                loadTabContent(tabName);
            }
            
            // Load tab content via fetch
            async function loadTabContent(tabName) {
                try {
                    const response = await fetch('/api/dashboard/' + tabName);
                    const html = await response.text();
                    document.getElementById('tabContent').innerHTML = html;
                    
                    // Initialize tab-specific functionality
                    if (typeof window['init' + capitalize(tabName)] === 'function') {
                        window['init' + capitalize(tabName)]();
                    }
                } catch (error) {
                    console.error('Error loading tab content:', error);
                    document.getElementById('tabContent').innerHTML = 
                        '<div class="card"><p style="color: var(--error);">Erro ao carregar conteúdo da aba</p></div>';
                }
            }
            
            function capitalize(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
            
            // Time Clock
            function updateTime() {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    hour12: false
                }) + ' BRT';
                document.getElementById('timeDisplay').innerHTML = 
                    '<i class="fas fa-clock"></i> ' + timeStr;
            }
            
            setInterval(updateTime, 1000);
            updateTime();
            
            // Load initial tab (overview)
            loadTabContent('overview');
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
  });
}

export const mainDashboardController = new MainDashboardController(); 