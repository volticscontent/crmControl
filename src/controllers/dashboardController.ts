import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { leadService } from '../services/leadService';
import { analyticsService } from '../services/analyticsService';

class DashboardController {
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
                
                .control-input {
                    font-size: 16px; /* Prevents zoom on iOS */
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
                
                .payload-viewer {
                    font-size: 0.7rem;
                    padding: 0.75rem;
                }
            }
            
            /* TAB CONTENT */
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* CONTROLES PROFISSIONAIS - Vercel Style */
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
            
            .payload-viewer {
                background: var(--bg-tertiary);
                border: 1px solid var(--border);
                border-radius: 0.375rem;
                padding: 1rem;
                font-family: var(--font-mono);
                font-size: 0.75rem;
                max-height: 300px;
                overflow-y: auto;
                white-space: pre-wrap;
                color: var(--text-secondary);
            }
            
            /* 📋 MODAL DA TABELA CRM */
            .table-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .table-modal.show {
                display: flex;
            }
            
            .table-container {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                width: 95%;
                height: 90%;
                max-width: 1400px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: var(--shadow-lg);
            }
            
            .table-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-secondary);
            }
            
            .table-title {
                font-size: 1.125rem;
                font-weight: 500;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .table-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
            }
            
            .table-close:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            .table-wrapper {
                flex: 1;
                overflow: auto;
                padding: 1rem;
            }
            
            .crm-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.875rem;
                background: var(--bg-card);
            }
            
            .crm-table th {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                font-weight: 500;
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid var(--border);
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .crm-table td {
                padding: 0.75rem;
                border-bottom: 1px solid var(--border);
                color: var(--text-secondary);
                vertical-align: top;
            }
            
            .crm-table tr:hover {
                background: var(--bg-tertiary);
            }
            
            .table-cell-name {
                font-weight: 500;
                color: var(--text-primary);
                max-width: 200px;
                word-break: break-word;
            }
            
            .table-cell-status {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
            }
            
            .status-primeiro { background: var(--info-bg); color: var(--info); }
            .status-segundo { background: var(--warning-bg); color: var(--warning); }
            .status-terceiro { background: var(--error-bg); color: var(--error); }
            .status-ultimo { background: var(--success-bg); color: var(--success); }
            .status-aguardando { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
            
            .table-loading {
                text-align: center;
                padding: 3rem;
                color: var(--text-secondary);
            }
            
            .table-error {
                text-align: center;
                padding: 3rem;
                color: var(--error);
                background: var(--error-bg);
                margin: 1rem;
                border-radius: var(--radius);
            }
            
            .table-stats {
                padding: 1rem 1.5rem;
                border-top: 1px solid var(--border);
                background: var(--bg-secondary);
                color: var(--text-secondary);
                font-size: 0.875rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            /* 🤖 SISTEMA DE TESTE COMPLETO */
            .flow-visualization {
                margin-top: 1.5rem;
                padding: 1.5rem;
                background: var(--bg-secondary);
                border-radius: var(--radius);
                border: 1px solid var(--border);
            }
            
            .flow-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border);
            }
            
            .flow-header h4 {
                color: var(--text-primary);
                font-size: 1rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0;
            }
            
            .flow-status {
                padding: 0.375rem 0.75rem;
                border-radius: var(--radius-sm);
                font-size: 0.8125rem;
                font-weight: 500;
                background: var(--info-bg);
                color: var(--info);
                font-family: var(--font-mono);
            }
            
            .flow-timeline {
                display: flex;
                flex-direction: column;
                gap: 0;
                position: relative;
            }
            
            .flow-step {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 0;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .flow-step.active {
                background: var(--success-bg);
                border-radius: var(--radius-sm);
                padding: 1rem;
                margin: 0.25rem 0;
            }
            
            .flow-step.processing {
                background: var(--warning-bg);
                border-radius: var(--radius-sm);
                padding: 1rem;
                margin: 0.25rem 0;
            }
            
            .flow-step.completed {
                opacity: 0.7;
            }
            
            .step-circle {
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
                background: var(--bg-tertiary);
                border: 2px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
                font-size: 1rem;
                flex-shrink: 0;
                transition: all 0.3s ease;
                z-index: 2;
                position: relative;
            }
            
            .flow-step.active .step-circle {
                background: var(--success);
                border-color: var(--success);
                color: var(--bg-primary);
                animation: pulse 2s infinite;
            }
            
            .flow-step.processing .step-circle {
                background: var(--warning);
                border-color: var(--warning);
                color: var(--bg-primary);
                animation: spin 2s linear infinite;
            }
            
            .flow-step.completed .step-circle {
                background: var(--success);
                border-color: var(--success);
                color: var(--bg-primary);
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .step-content {
                flex: 1;
                min-width: 0;
            }
            
            .step-title {
                font-weight: 500;
                color: var(--text-primary);
                font-size: 0.9375rem;
                margin-bottom: 0.25rem;
            }
            
            .step-description {
                color: var(--text-secondary);
                font-size: 0.8125rem;
                margin-bottom: 0.25rem;
            }
            
            .step-time {
                color: var(--text-muted);
                font-size: 0.75rem;
                font-family: var(--font-mono);
            }
            
            .step-payload {
                width: 2rem;
                height: 2rem;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                border: 1px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .step-payload:hover {
                background: var(--bg-primary);
                border-color: var(--border-hover);
                color: var(--text-primary);
                transform: scale(1.1);
            }
            
            .flow-connector {
                width: 2px;
                height: 1rem;
                background: var(--border);
                margin-left: 1.5rem;
                position: relative;
                z-index: 1;
            }
            
            .flow-step.completed + .flow-connector {
                background: var(--success);
            }
            
            .flow-controls {
                display: flex;
                gap: 0.75rem;
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border);
                justify-content: center;
            }
            
            /* 📋 MODAL PAYLOAD */
            .payload-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 2000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .payload-modal.show {
                display: flex;
            }
            
            .payload-content {
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
            
            .payload-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-secondary);
            }
            
            .payload-title {
                font-size: 1.125rem;
                font-weight: 500;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .payload-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
            }
            
            .payload-close:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            .payload-body {
                flex: 1;
                overflow: auto;
                padding: 1.5rem;
            }
            
            .payload-code {
                background: var(--bg-tertiary);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 1rem;
                font-family: var(--font-mono);
                font-size: 0.8125rem;
                color: var(--text-secondary);
                white-space: pre-wrap;
                max-height: 400px;
                overflow-y: auto;
                line-height: 1.4;
            }
            
            /* 📱 RESPONSIVE FLOW */
            @media (max-width: 768px) {
                .flow-step {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 1rem 0.5rem;
                }
                
                .step-circle {
                    align-self: center;
                }
                
                .step-content {
                    text-align: center;
                }
                
                .step-payload {
                    align-self: center;
                }
                
                .flow-connector {
                    align-self: center;
                    height: 0.5rem;
                }
                
                .flow-controls {
                    flex-direction: column;
                    align-items: center;
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
                            <button class="btn" onclick="refreshData()">
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

            <!-- TAB: ANALYTICS -->
            <div id="analytics" class="tab-content">
                <!-- 📊 SISTEMA DE SAÚDE -->
                <div class="grid grid-3">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-heartbeat"></i> Saúde do Sistema</h3>
                        </div>
                        <div class="card-content">
                            <div id="system-health-indicator" class="health-indicator">
                                <div class="health-status" id="health-status">Verificando...</div>
                                <div class="health-details" id="health-details"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-percentage"></i> Taxa de Sucesso</h3>
                        </div>
                        <div class="card-content">
                            <div class="metric-big" id="success-rate">0%</div>
                            <div class="metric-subtitle">Últimas 24h</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-exclamation-triangle"></i> Taxa de Erro</h3>
                        </div>
                        <div class="card-content">
                            <div class="metric-big error" id="error-rate">0%</div>
                            <div class="metric-subtitle">Últimas 24h</div>
                        </div>
                    </div>
                </div>

                <!-- 📈 GRÁFICOS -->
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-area"></i> Atividade por Hora</h3>
                        </div>
                        <div class="card-content">
                            <canvas id="hourly-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-pie"></i> Distribuição por Categoria</h3>
                        </div>
                        <div class="card-content">
                            <canvas id="category-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 🚨 ERROS RECENTES -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-bug"></i> Erros Recentes</h3>
                    </div>
                    <div class="card-content">
                        <div id="recent-errors">Carregando...</div>
                    </div>
                </div>

                <!-- 📊 ESTATÍSTICAS DETALHADAS -->
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-list-ol"></i> Top Operações</h3>
                        </div>
                        <div class="card-content">
                            <div id="top-operations">Carregando...</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-tags"></i> Eventos por Categoria</h3>
                        </div>
                        <div class="card-content">
                            <div id="category-breakdown">Carregando...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB: LEADS NO FUNIL -->
            <div id="leads" class="tab-content">
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-users"></i>
                            Leads no Funil
                        </div>
                        <div id="leadsContainer">
                            <div class="stats-item">
                                <span class="stats-label">Carregando...</span>
                                <span class="spinner"></span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-exchange-alt"></i>
                            Logs de Webhooks
                        </div>
                        <div id="webhookLogsContainer" style="max-height: 400px; overflow-y: auto;">
                            <div class="stats-item">
                                <span class="stats-label">Carregando...</span>
                                <span class="spinner"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB: ARQUIVOS & MENSAGENS -->
            <div id="files" class="tab-content">
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
            </div>

            <!-- TAB: CONTROLES PROFISSIONAIS -->
            <div id="controls" class="tab-content">
                <div class="grid grid-2">
                    <!-- EVOLUTION API TESTS -->
                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-whatsapp"></i>
                            Evolution API - Testes Reais
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">1. Status da Instância</label>
                            <button class="btn btn-primary" onclick="testEvolutionStatus()">
                                <i class="fas fa-signal"></i>
                                Verificar Status
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">2. Informações da Instância</label>
                            <button class="btn" onclick="testEvolutionInfo()">
                                <i class="fas fa-info-circle"></i>
                                Ver Detalhes
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">3. Teste de Mensagem Real</label>
                            <input type="text" class="control-input" id="testPhone" placeholder="Número de teste (5511999999999)" value="5511999999999">
                            <input type="text" class="control-input" id="testMessage" placeholder="Mensagem de teste" value="Oi! Este é um teste do sistema de CRM.">
                            <button class="btn btn-warning" onclick="sendTestMessage()">
                                <i class="fas fa-paper-plane"></i>
                                Enviar Mensagem
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">4. Teste de Áudio (Playbook)</label>
                            <input type="text" class="control-input" id="testPhoneAudio" placeholder="Número para áudio">
                            <button class="btn" onclick="sendTestAudio()">
                                <i class="fas fa-volume-up"></i>
                                Enviar Áudio Primeiro Contato
                            </button>
                        </div>
                    </div>

                    <!-- MONDAY.COM API TESTS -->
                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-calendar-alt"></i>
                            Monday.com API - Testes Reais
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">1. Verificar Board</label>
                            <button class="btn btn-primary" onclick="testMondayBoard()">
                                <i class="fas fa-table"></i>
                                Ver Board CRM
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">2. Listar Itens Recentes</label>
                            <button class="btn" onclick="testMondayItems()">
                                <i class="fas fa-list"></i>
                                Últimos 10 Itens
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">3. Buscar Item por Contato</label>
                            <input type="text" class="control-input" id="testContactSearch" placeholder="Telefone (5531982354127) ou Email" value="5531982354127">
                            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                <button class="btn" onclick="findMondayContact()">
                                    <i class="fas fa-search"></i>
                                    Buscar por Contato
                                </button>
                                <button class="btn" onclick="testMondayItem()">
                                    <i class="fas fa-eye"></i>
                                    Ver Detalhes
                                </button>
                            </div>
                            <input type="text" class="control-input" id="testItemId" placeholder="Item ID (preenchido automaticamente)" style="margin-top: 0.5rem; background: var(--bg-secondary);" readonly>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">4. Atualizar Status Teste</label>
                            <input type="text" class="control-input" id="updateItemId" placeholder="ID do Item">
                            <select class="control-input" id="updateStatus">
                                <option value="">Selecionar Status</option>
                                <option value="Primeiro Contato">Primeiro Contato</option>
                                <option value="Segundo Contato">Segundo Contato</option>
                                <option value="Terceiro Contato">Terceiro Contato</option>
                                <option value="Ultimo Contato">Ultimo Contato</option>
                                <option value="Aguardando Ligação">Aguardando Ligação</option>
                                <option value="Não Respondeu">Não Respondeu</option>
                            </select>
                            <button class="btn btn-warning" onclick="updateMondayStatus()">
                                <i class="fas fa-edit"></i>
                                Atualizar Status
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- SISTEMA DE TESTE COMPLETO -->
                <div class="card" style="margin-top: 1.5rem;">
                    <div class="card-title">
                        <i class="fas fa-robot"></i>
                        Sistema de Teste Completo - Fluxo Real
                        <button class="btn" onclick="resetFlowTest()" style="margin-left: auto; font-size: 0.75rem;">
                            <i class="fas fa-sync"></i>
                            Reset
                        </button>
                    </div>
                    
                    <div class="control-group">
                        <label class="control-label">Tipo de Teste</label>
                        <select class="control-input" id="flowTestType" onchange="toggleTestType()">
                            <option value="new">🆕 Criar Novo Lead (recomendado)</option>
                            <option value="existing">✏️ Usar Lead Existente</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label class="control-label">Configuração do Teste</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <input type="text" class="control-input" id="flowTestSearch" placeholder="🔍 Telefone/Email (para buscar)" style="display: none;">
                            <input type="text" class="control-input" id="flowTestItemId" placeholder="Item ID Monday (auto)" style="display: none;" readonly>
                            <input type="text" class="control-input" id="flowTestNome" placeholder="Nome do Lead" value="Cliente Teste Fluxo">
                            <input type="text" class="control-input" id="flowTestTelefone" placeholder="Telefone (5531982354127)" value="5531982354127">
                            <select class="control-input" id="flowTestInterval">
                                <option value="600000">10 minutos (Teste)</option>
                                <option value="300000">5 minutos (Rápido)</option>
                                <option value="60000">1 minuto (Debug)</option>
                                <option value="86400000">24 horas (Real)</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="btn" id="flowSearchBtn" onclick="searchForFlowTest()" style="display: none;">
                                <i class="fas fa-search"></i>
                                Buscar Lead
                            </button>
                                                    <button class="btn btn-primary" onclick="startFlowTest()">
                            <i class="fas fa-play"></i>
                            Iniciar Teste Completo
                        </button>
                        <button class="btn" onclick="debugFlowTest()">
                            <i class="fas fa-bug"></i>
                            Debug
                        </button>
                        <button class="btn btn-warning" onclick="testSingleStep()">
                            <i class="fas fa-play-circle"></i>
                            Teste 1 Step
                        </button>
                        </div>
                    </div>
                    
                    <!-- VISUALIZAÇÃO DO FLUXO -->
                    <div class="flow-visualization" id="flowVisualization" style="display: none;">
                        <div class="flow-header">
                            <h4><i class="fas fa-chart-line"></i> Progresso do Teste</h4>
                            <div class="flow-status" id="flowStatus">Aguardando...</div>
                        </div>
                        
                        <div class="flow-timeline">
                            <div class="flow-step" id="step-primeiro" data-step="primeiro">
                                <div class="step-circle">
                                    <i class="fas fa-play"></i>
                                </div>
                                <div class="step-content">
                                    <div class="step-title">Primeiro Contato</div>
                                    <div class="step-description">Mensagem + Áudio playbook</div>
                                    <div class="step-time">--:--</div>
                                </div>
                                <div class="step-payload" onclick="showPayload('primeiro')">
                                    <i class="fas fa-code"></i>
                                </div>
                            </div>
                            
                            <div class="flow-connector"></div>
                            
                            <div class="flow-step" id="step-segundo" data-step="segundo">
                                <div class="step-circle">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="step-content">
                                    <div class="step-title">Segundo Contato</div>
                                    <div class="step-description">Follow-up interesse</div>
                                    <div class="step-time">--:--</div>
                                </div>
                                <div class="step-payload" onclick="showPayload('segundo')">
                                    <i class="fas fa-code"></i>
                                </div>
                            </div>
                            
                            <div class="flow-connector"></div>
                            
                            <div class="flow-step" id="step-terceiro" data-step="terceiro">
                                <div class="step-circle">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="step-content">
                                    <div class="step-title">Terceiro Contato</div>
                                    <div class="step-description">Última chance</div>
                                    <div class="step-time">--:--</div>
                                </div>
                                <div class="step-payload" onclick="showPayload('terceiro')">
                                    <i class="fas fa-code"></i>
                                </div>
                            </div>
                            
                            <div class="flow-connector"></div>
                            
                            <div class="flow-step" id="step-ultimo" data-step="ultimo">
                                <div class="step-circle">
                                    <i class="fas fa-stop"></i>
                                </div>
                                <div class="step-content">
                                    <div class="step-title">Último Contato</div>
                                    <div class="step-description">Despedida final</div>
                                    <div class="step-time">--:--</div>
                                </div>
                                <div class="step-payload" onclick="showPayload('ultimo')">
                                    <i class="fas fa-code"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flow-controls">
                            <button class="btn btn-warning" onclick="simulateClientResponse()">
                                <i class="fas fa-reply"></i>
                                Simular Resposta Cliente
                            </button>
                            <button class="btn btn-danger" onclick="stopFlowTest()">
                                <i class="fas fa-stop"></i>
                                Parar Teste
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- WEBHOOK TESTS -->
                <div class="grid grid-2" style="margin-top: 1.5rem;">
                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-exchange-alt"></i>
                            Testes de Webhook Manual
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">Simular Webhook Monday</label>
                            <input type="text" class="control-input" id="webhookItemId" placeholder="Item ID (ex: 7892347843)" value="7969088147">
                            <input type="text" class="control-input" id="webhookNome" placeholder="Nome do Lead" value="Cliente Teste">
                            <input type="text" class="control-input" id="webhookTelefone" placeholder="Telefone (5511999999999)" value="5511999999999">
                            <select class="control-input" id="webhookStatus">
                                <option value="Primeiro Contato">Primeiro Contato</option>
                                <option value="Segundo Contato">Segundo Contato</option>
                                <option value="Terceiro Contato">Terceiro Contato</option>
                                <option value="Ultimo Contato">Ultimo Contato</option>
                            </select>
                            <button class="btn btn-primary" onclick="sendManualWebhook()">
                                <i class="fas fa-rocket"></i>
                                Simular Webhook
                            </button>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">Simular Resposta Cliente</label>
                            <input type="text" class="control-input" id="responsePhone" placeholder="Telefone do cliente">
                            <button class="btn btn-success" onclick="simulateClientResponse()">
                                <i class="fas fa-reply"></i>
                                Cliente Respondeu
                            </button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">
                            <i class="fas fa-code"></i>
                            Response Viewer
                        </div>
                        <div class="payload-viewer" id="payloadViewer">
                            Nenhuma resposta para exibir...
                            
                            <div style="margin-top: 1rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 0.25rem;">
                                <strong>Dicas:</strong><br>
                                • Use números reais para testes (ex: 5511999999999)<br>
                                • IDs do Monday podem ser encontrados na URL do item<br>
                                • Webhooks simulados criam leads reais no sistema<br>
                                • Respostas de clientes param o funil automaticamente
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB: LOGS -->
            <div id="logs" class="tab-content">
                <div class="card">
                    <div class="card-title">
                        <i class="fas fa-terminal"></i>
                        Logs do Sistema
                    </div>
                    <div class="terminal">
                        <div class="terminal-header">
                            <div class="terminal-dot dot-red"></div>
                            <div class="terminal-dot dot-yellow"></div>
                            <div class="terminal-dot dot-green"></div>
                            <span style="margin-left: 0.5rem; color: var(--text-muted); font-size: 0.75rem;">
                                logs — última atualização: <span id="lastUpdate">agora</span>
                            </span>
                        </div>
                        <div class="terminal-body" id="logsContainer">
                            <div class="log-line">
                                <span class="log-time">00:00:00</span>
                                <span class="log-level-info">INFO</span>
                                <span>Carregando logs do sistema...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 📋 MODAL PAYLOAD -->
        <div class="payload-modal" id="payloadModal">
            <div class="payload-content">
                <div class="payload-header">
                    <div class="payload-title">
                        <i class="fas fa-code"></i>
                        <span id="payloadStepTitle">Payload do Webhook</span>
                    </div>
                    <button class="payload-close" onclick="closePayloadModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="payload-body">
                    <div class="payload-code" id="payloadCode">
                        Aguardando dados...
                    </div>
                </div>
            </div>
        </div>

        <script>
            // 🚀 JAVASCRIPT FUNCTIONS
            
            // Tab Navigation
            function showTab(tabName) {
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected tab
                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
                
                // Load data if needed
                if (tabName === 'leads') {
                    loadLeadsData();
                } else if (tabName === 'analytics') {
                    loadAnalyticsData();
                } else if (tabName === 'logs') {
                    loadLogsData();
                } else if (tabName === 'files') {
                    refreshFiles();
                }
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

            // 📊 Load Dashboard Data
            async function loadDashboardData() {
                try {
                    const [statusRes, leadsRes, webhookLogsRes] = await Promise.all([
                        fetch('/api/status'),
                        fetch('/api/leads'),
                        fetch('/api/webhook-logs')
                    ]);

                    if (statusRes.ok) {
                        const status = await statusRes.json();
                        updateMetrics(status);
                        updateApiStatus(status);
                    }

                    if (leadsRes.ok) {
                        const leads = await leadsRes.json();
                        updateLeads(leads.leads || []);
                    }

                    if (webhookLogsRes.ok) {
                        const webhookLogs = await webhookLogsRes.json();
                        updateWebhookLogs(webhookLogs.webhookLogs || []);
                    }
                } catch (error) {
                    console.error('Erro ao carregar dados:', error);
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

            function updateLeads(leads) {
                const container = document.getElementById('leadsContainer');
                container.innerHTML = '';
                
                if (!leads || leads.length === 0) {
                    container.innerHTML = '<div class="stats-item"><span class="stats-label">Nenhum lead ativo no funil</span></div>';
                    return;
                }
                
                leads.forEach(lead => {
                    const item = document.createElement('div');
                    item.className = 'stats-item';
                    
                    let statusColor = 'var(--success)';
                    let icon = 'fa-play-circle';
                    if (lead.statusAtual === 'Segundo Contato') {
                        statusColor = 'var(--warning)';
                        icon = 'fa-clock';
                    }
                    if (lead.statusAtual === 'Terceiro Contato') {
                        statusColor = 'var(--error)';
                        icon = 'fa-exclamation-triangle';
                    }
                    if (lead.statusAtual === 'Ultimo Contato') {
                        statusColor = '#8b5cf6';
                        icon = 'fa-stop-circle';
                    }
                    
                    const nextDate = lead.proximoDisparo ? 
                        new Date(lead.proximoDisparo).toLocaleDateString('pt-BR') : 
                        'Sem agendamento';
                    
                    item.innerHTML = \`
                        <div>
                            <div style="font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas \${icon}" style="color: \${statusColor};"></i>
                                \${lead.nome}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                <i class="fas fa-phone"></i> \${lead.telefone} • 
                                <i class="fas fa-calendar"></i> \${nextDate}
                            </div>
                        </div>
                        <div class="badge" style="background: \${statusColor}20; color: \${statusColor};">
                            \${lead.statusAtual}
                        </div>
                    \`;
                    
                    container.appendChild(item);
                });
            }

            function updateWebhookLogs(webhookLogs) {
                const container = document.getElementById('webhookLogsContainer');
                container.innerHTML = '';
                
                if (!webhookLogs || webhookLogs.length === 0) {
                    container.innerHTML = '<div class="stats-item"><span class="stats-label">Nenhum webhook recebido</span></div>';
                    return;
                }
                
                webhookLogs.forEach(log => {
                    const item = document.createElement('div');
                    item.className = 'stats-item';
                    item.style.flexDirection = 'column';
                    item.style.alignItems = 'flex-start';
                    
                    const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
                    
                    item.innerHTML = \`
                        <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600;">
                                <i class="fas fa-exchange-alt"></i>
                                \${log.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">\${time}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); width: 100%;">
                            <details>
                                <summary style="cursor: pointer;">
                                    <i class="fas fa-code"></i> Ver payload
                                </summary>
                                <pre style="margin-top: 0.5rem; background: var(--bg-tertiary); padding: 0.5rem; border-radius: 0.25rem; overflow-x: auto;">\${JSON.stringify(log.payload, null, 2)}</pre>
                            </details>
                        </div>
                    \`;
                    
                    container.appendChild(item);
                });
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
                    
                    setTimeout(loadDashboardData, 1000);
                } catch (error) {
                    alert('❌ Erro no teste: ' + error.message);
                }
            }

            // 🔍 EVOLUTION API TESTS
            async function testEvolutionStatus() {
                try {
                    const response = await fetch('/api/test/evolution/status');
                    const result = await response.json();
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success && result.connected) {
                        alert('✅ Evolution API: Instância conectada e ativa!');
                    } else {
                        alert('⚠️ Evolution API: ' + (result.message || 'Instância não conectada'));
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                    document.getElementById('payloadViewer').textContent = 'Erro: ' + error.message;
                }
            }

            async function testEvolutionInfo() {
                try {
                    const response = await fetch('/api/test/evolution/info');
                    const result = await response.json();
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Informações da instância carregadas!');
                    } else {
                        alert('❌ Erro ao obter informações: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function sendTestMessage() {
                const phone = document.getElementById('testPhone').value;
                const message = document.getElementById('testMessage').value;
                
                if (!phone || !message) {
                    alert('❌ Preencha telefone e mensagem');
                    return;
                }
                
                try {
                    const response = await fetch('/api/test/evolution/message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, message })
                    });
                    
                    const result = await response.json();
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Mensagem enviada com sucesso!');
                        document.getElementById('testPhone').value = '';
                        document.getElementById('testMessage').value = '';
                    } else {
                        alert('❌ Falha no envio: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function sendTestAudio() {
                const phone = document.getElementById('testPhoneAudio').value;
                
                if (!phone) {
                    alert('❌ Preencha o número do telefone');
                    return;
                }
                
                try {
                    const response = await fetch('/api/test/evolution/audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone })
                    });
                    
                    const result = await response.json();
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Áudio do Playbook enviado!');
                        document.getElementById('testPhoneAudio').value = '';
                    } else {
                        alert('❌ Falha no envio: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            // 📋 MONDAY.COM API TESTS
            async function testMondayBoard() {
                try {
                    // Abre o modal da tabela
                    openTableModal();
                    
                    // Busca os dados completos do board
                    const response = await fetch('/api/monday/full-board');
                    const result = await response.json();
                    
                    // Exibe no payload viewer também
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        displayBoardTable(result.items, result.columns);
                    } else {
                        displayTableError(result.error || 'Erro desconhecido');
                    }
                } catch (error) {
                    displayTableError(error.message);
                }
            }

            async function findMondayContact() {
                try {
                    const searchValue = document.getElementById('testContactSearch').value;
                    
                    if (!searchValue) {
                        alert('❌ Digite um telefone ou email para buscar');
                        return;
                    }
                    
                    document.getElementById('payloadViewer').textContent = 'Buscando contato no Monday...';
                    
                    const response = await fetch('/api/test/monday/find', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchValue })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Preenche automaticamente o Item ID encontrado
                        document.getElementById('testItemId').value = result.item.id;
                        document.getElementById('updateItemId').value = result.item.id;
                        
                        // Mostra resultado detalhado
                        const displayResult = {
                            success: true,
                            searchValue: result.searchValue,
                            foundItem: {
                                id: result.item.id,
                                name: result.item.name,
                                telefone: result.item.telefone,
                                status: result.item.status
                            },
                            message: '✅ Contato encontrado! Item ID preenchido automaticamente.'
                        };
                        
                        document.getElementById('payloadViewer').textContent = JSON.stringify(displayResult, null, 2);
                        
                        alert(\`✅ Contato encontrado!\\n\\nNome: \${result.item.name}\\nTelefone: \${result.item.telefone}\\nStatus: \${result.item.status}\\n\\nItem ID preenchido automaticamente: \${result.item.id}\`);
                    } else {
                        document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                        alert(\`❌ \${result.error}\`);
                    }
                } catch (error) {
                    document.getElementById('payloadViewer').textContent = 'Erro: ' + error.message;
                    alert('❌ Erro: ' + error.message);
                }
            }
            
            function openTableModal() {
                const modal = document.getElementById('tableModal');
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
            
            function closeTableModal() {
                const modal = document.getElementById('tableModal');
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
            
            function displayTableError(error) {
                const wrapper = document.getElementById('tableWrapper');
                wrapper.innerHTML = \`
                    <div class="table-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div style="margin-top: 0.5rem;">
                            <strong>Erro ao carregar dados:</strong><br>
                            \${error}
                        </div>
                    </div>
                \`;
                document.getElementById('tableStats').style.display = 'none';
            }
            
            function displayBoardTable(items, columns) {
                const wrapper = document.getElementById('tableWrapper');
                const stats = document.getElementById('tableStats');
                
                if (!items || items.length === 0) {
                    wrapper.innerHTML = \`
                        <div class="table-loading">
                            <i class="fas fa-info-circle"></i>
                            Nenhum registro encontrado no board.
                        </div>
                    \`;
                    stats.style.display = 'none';
                    return;
                }
                
                // Monta o cabeçalho da tabela
                let tableHTML = \`
                    <table class="crm-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Status</th>
                                <th>Telefone</th>
                                <th>Próximo Contato</th>
                                <th>Criado</th>
                                <th>Atualizado</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                // Adiciona as linhas da tabela
                items.forEach(item => {
                    const name = item.name || 'Sem nome';
                    const status = getColumnText(item, 'contato_sdr_realizado') || 'N/A';
                    const phone = getColumnText(item, 'telefone') || 'N/A';
                    const nextContact = getColumnText(item, 'pr_ximo_contato') || 'N/A';
                    const created = new Date(item.created_at).toLocaleDateString('pt-BR');
                    const updated = new Date(item.updated_at).toLocaleDateString('pt-BR');
                    
                    const statusClass = getStatusClass(status);
                    
                    tableHTML += \`
                        <tr>
                            <td>\${item.id}</td>
                            <td class="table-cell-name">\${name}</td>
                            <td><span class="table-cell-status \${statusClass}">\${status}</span></td>
                            <td>\${phone}</td>
                            <td>\${nextContact}</td>
                            <td>\${created}</td>
                            <td>\${updated}</td>
                        </tr>
                    \`;
                });
                
                tableHTML += \`
                        </tbody>
                    </table>
                \`;
                
                wrapper.innerHTML = tableHTML;
                
                // Atualiza as estatísticas
                document.getElementById('totalItems').textContent = items.length;
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR');
                stats.style.display = 'flex';
            }
            
            function getColumnText(item, columnId) {
                const column = item.column_values.find(col => col.id === columnId);
                return column ? column.text : null;
            }
            
            function getStatusClass(status) {
                if (!status) return '';
                const statusLower = status.toLowerCase();
                if (statusLower.includes('primeiro')) return 'status-primeiro';
                if (statusLower.includes('segundo')) return 'status-segundo';
                if (statusLower.includes('terceiro')) return 'status-terceiro';
                if (statusLower.includes('ultimo') || statusLower.includes('último')) return 'status-ultimo';
                if (statusLower.includes('aguardando')) return 'status-aguardando';
                return '';
            }
            
            // Fecha modal ao clicar fora dele
            document.addEventListener('click', function(e) {
                const modal = document.getElementById('tableModal');
                if (e.target === modal) {
                    closeTableModal();
                }
            });
            
            // Fecha modal com ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeTableModal();
                }
            });

            async function testMondayItems() {
                try {
                    const response = await fetch('/api/test/monday/items');
                    const result = await response.json();
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert(\`✅ \${result.items.length} itens encontrados no board\`);
                    } else {
                        alert('❌ Erro: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function testMondayItem() {
                const itemId = document.getElementById('testItemId').value;
                
                if (!itemId) {
                    alert('❌ Preencha o ID do item');
                    return;
                }
                
                try {
                    const response = await fetch(\`/api/test/monday/item/\${itemId}\`);
                    const result = await response.json();
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Item encontrado: ' + result.item.name);
                    } else {
                        alert('❌ Erro: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function updateMondayTestStatus() {
                const itemId = document.getElementById('testItemId').value;
                if (!itemId) {
                    alert('❌ Por favor, insira um ID de item válido');
                    return;
                }
                
                try {
                    const response = await fetch('/api/test/monday/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            itemId: itemId,
                            status: 'Segundo Contato'
                        })
                    });
                    const result = await response.json();
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert(\`✅ Status atualizado para "Segundo Contato" no item \${itemId}\`);
                    } else {
                        alert('❌ Erro: ' + result.error);
                    }
                } catch (error) {
                    console.error('Erro na atualização Monday:', error);
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function updateMondayStatus() {
                const itemId = document.getElementById('updateItemId').value;
                const status = document.getElementById('updateStatus').value;
                
                if (!itemId || !status) {
                    alert('❌ Preencha ID do item e status');
                    return;
                }
                
                try {
                    const response = await fetch('/api/test/monday/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId, status })
                    });
                    
                    const result = await response.json();
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Status atualizado com sucesso!');
                        document.getElementById('updateItemId').value = '';
                        document.getElementById('updateStatus').value = '';
                    } else {
                        alert('❌ Erro: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            // 🚀 WEBHOOK TESTS
            async function simulateClientResponse() {
                const phone = document.getElementById('responsePhone').value;
                
                if (!phone) {
                    alert('❌ Preencha o telefone do cliente');
                    return;
                }
                
                try {
                    const response = await fetch('/webhook/evolution', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'messages.upsert',
                            data: {
                                key: { remoteJid: phone + '@s.whatsapp.net' },
                                message: { conversation: 'Olá, tenho interesse!' },
                                messageType: 'conversation',
                                owner: phone
                            }
                        })
                    });
                    
                    const result = await response.json();
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success || response.ok) {
                        alert('✅ Resposta do cliente simulada! Lead deve ser marcado como "Aguardando Ligação"');
                        document.getElementById('responsePhone').value = '';
                    } else {
                        alert('❌ Erro na simulação: ' + result.message);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            async function sendManualWebhook() {
                const itemId = document.getElementById('webhookItemId').value;
                const nome = document.getElementById('webhookNome').value;
                const telefone = document.getElementById('webhookTelefone').value;
                
                if (!itemId || !nome || !telefone) {
                    alert('❌ Preencha todos os campos');
                    return;
                }
                
                try {
                    const response = await fetch('/webhook/test/monday', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId, nome, telefone })
                    });
                    
                    const result = await response.json();
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    if (result.success) {
                        alert('✅ Webhook enviado com sucesso!');
                        // Clear inputs
                        document.getElementById('webhookItemId').value = '';
                        document.getElementById('webhookNome').value = '';
                        document.getElementById('webhookTelefone').value = '';
                    } else {
                        alert('❌ Erro no webhook: ' + result.message);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            function refreshData() {
                loadDashboardData();
            }

            function clearLogs() {
                if (confirm('Tem certeza que deseja limpar os logs?')) {
                    document.getElementById('logsContainer').innerHTML = 
                        '<div class="log-line"><span class="log-time">--:--:--</span><span class="log-level-info">INFO</span><span><i class="fas fa-trash"></i> Logs limpos pelo usuário</span></div>';
                }
            }

            function downloadLogs() {
                window.open('/api/logs/detailed?download=true', '_blank');
            }

            async function loadLeadsData() {
                // Load leads when tab is selected
                loadDashboardData();
            }

            async function loadAnalyticsData() {
                try {
                    // Carregar dados de analytics
                    const [analyticsResponse, healthResponse] = await Promise.all([
                        fetch('/api/analytics?hours=24'),
                        fetch('/api/system-health')
                    ]);
                    
                    const analytics = await analyticsResponse.json();
                    const health = await healthResponse.json();
                    
                    if (analytics.success) {
                        updateAnalyticsUI(analytics.data);
                    }
                    
                    if (health.success) {
                        updateSystemHealth(health.health);
                    }
                } catch (error) {
                    console.error('Erro ao carregar analytics:', error);
                }
            }

            function updateAnalyticsUI(data) {
                // Atualizar métricas principais
                document.getElementById('success-rate').textContent = data.success_rate + '%';
                document.getElementById('error-rate').textContent = data.error_rate + '%';
                
                // Atualizar lista de erros recentes
                const errorsContainer = document.getElementById('recent-errors');
                if (data.recent_errors && data.recent_errors.length > 0) {
                    errorsContainer.innerHTML = data.recent_errors.map(error => \`
                        <div style="padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                            <div style="font-size: 0.75rem; color: var(--text-muted);">\${new Date(error.timestamp).toLocaleString()}</div>
                            <div style="color: var(--error); font-weight: 500;">\${error.operation || 'Operação desconhecida'}</div>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);">\${error.error || 'Erro sem descrição'}</div>
                        </div>
                    \`).join('');
                } else {
                    errorsContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Nenhum erro nas últimas 24h 🎉</div>';
                }
                
                // Atualizar top operações
                const operationsContainer = document.getElementById('top-operations');
                if (data.operations && data.operations.length > 0) {
                    operationsContainer.innerHTML = data.operations.map(op => \`
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                            <span style="color: var(--text-secondary);">\${op.operation}</span>
                            <span style="color: var(--text-primary); font-family: var(--font-mono);">\${op.count}</span>
                        </div>
                    \`).join('');
                } else {
                    operationsContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 1rem;">Nenhuma operação registrada</div>';
                }
                
                // Atualizar categorias
                const categoriesContainer = document.getElementById('category-breakdown');
                if (data.categories && Object.keys(data.categories).length > 0) {
                    categoriesContainer.innerHTML = Object.entries(data.categories).map(([category, count]) => \`
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                            <span style="color: var(--text-secondary);">\${category}</span>
                            <span style="color: var(--text-primary); font-family: var(--font-mono);">\${count}</span>
                        </div>
                    \`).join('');
                } else {
                    categoriesContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 1rem;">Nenhuma categoria registrada</div>';
                }
            }

            function updateSystemHealth(health) {
                const healthStatus = document.getElementById('health-status');
                const healthDetails = document.getElementById('health-details');
                
                if (health) {
                    healthStatus.textContent = health.status || 'Verificando...';
                    healthStatus.style.color = health.status === 'healthy' ? 'var(--success)' : 'var(--error)';
                    
                    if (health.details) {
                        healthDetails.innerHTML = Object.entries(health.details).map(([key, value]) => \`
                            <div style="font-size: 0.75rem; margin: 0.25rem 0;">
                                <span style="color: var(--text-muted);">\${key}:</span>
                                <span style="color: var(--text-secondary);">\${value}</span>
                            </div>
                        \`).join('');
                    }
                } else {
                    healthStatus.textContent = 'Dados indisponíveis';
                    healthStatus.style.color = 'var(--text-muted)';
                }
            }
                
                // Atualizar top operações
                const operationsContainer = document.getElementById('top-operations');
                if (data.operations && Object.keys(data.operations).length > 0) {
                    operationsContainer.innerHTML = Object.entries(data.operations)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([operation, count]) => \`
                            <div class="operation-item">
                                <span class="operation-name">\${operation}</span>
                                <span class="operation-count">\${count}</span>
                            </div>
                        \`).join('');
                } else {
                    operationsContainer.innerHTML = '<div class="no-data">Nenhuma operação registrada</div>';
                }
                
                // Atualizar categorias
                const categoriesContainer = document.getElementById('category-breakdown');
                if (data.categories && Object.keys(data.categories).length > 0) {
                    categoriesContainer.innerHTML = Object.entries(data.categories)
                        .map(([category, count]) => \`
                            <div class="category-item">
                                <span class="category-name">\${category.replace('_', ' ')}</span>
                                <span class="category-count">\${count}</span>
                            </div>
                        \`).join('');
                } else {
                    categoriesContainer.innerHTML = '<div class="no-data">Nenhuma categoria registrada</div>';
                }
            }
            




            function updateAnalyticsUI(analytics, health) {
                // Atualiza métricas principais
                document.getElementById('success-rate').textContent = analytics.success_rate + '%';
                document.getElementById('error-rate').textContent = analytics.error_rate + '%';
                
                // Atualiza status de saúde
                const healthStatus = document.getElementById('health-status');
                const healthDetails = document.getElementById('health-details');
                
                healthStatus.textContent = health.status === 'healthy' ? 'Saudável' : 
                                         health.status === 'warning' ? 'Atenção' : 'Crítico';
                healthStatus.className = 'health-status ' + health.status;
                
                healthDetails.innerHTML = health.issues.length > 0 ? 
                    health.issues.map(issue => '<div class="health-issue">' + issue + '</div>').join('') :
                    '<div class="health-ok">Sistema funcionando normalmente</div>';
                
                // Atualiza erros recentes
                const recentErrors = document.getElementById('recent-errors');
                if (analytics.recent_errors && analytics.recent_errors.length > 0) {
                    recentErrors.innerHTML = analytics.recent_errors.map(error => 
                        '<div class="error-item">' +
                            '<div class="error-time">' + new Date(error.timestamp).toLocaleString() + '</div>' +
                            '<div class="error-operation">' + error.operation + '</div>' +
                            '<div class="error-message">' + error.error_message + '</div>' +
                        '</div>'
                    ).join('');
                } else {
                    recentErrors.innerHTML = '<div class="no-errors">Nenhum erro recente 🎉</div>';
                }
                
                // Atualiza operações
                const topOperations = document.getElementById('top-operations');
                if (analytics.operations) {
                    topOperations.innerHTML = Object.entries(analytics.operations)
                        .map(function(entry) { 
                            return '<div class="operation-item">' + entry[0] + ': ' + entry[1] + '</div>'; 
                        })
                        .join('');
                } else {
                    topOperations.innerHTML = '<div>Nenhuma operação registrada</div>';
                }
                
                // Atualiza categorias
                const categoryBreakdown = document.getElementById('category-breakdown');
                if (analytics.categories) {
                    categoryBreakdown.innerHTML = Object.entries(analytics.categories)
                        .map(function(entry) { 
                            return '<div class="category-item">' + entry[0] + ': ' + entry[1] + '</div>'; 
                        })
                        .join('');
                } else {
                    categoryBreakdown.innerHTML = '<div>Nenhuma categoria registrada</div>';
                }
            }

            async function loadLogsData() {
                try {
                    const response = await fetch('/api/logs/detailed');
                    const logs = await response.json();
                    updateLogs(logs.logs || logs);
                } catch (error) {
                    console.error('Erro ao carregar logs:', error);
                }
            }

            function updateLogs(logs) {
                const container = document.getElementById('logsContainer');
                container.innerHTML = '';
                
                if (!Array.isArray(logs)) {
                    logs = [];
                }
                
                logs.slice(-50).forEach(log => {
                    const line = document.createElement('div');
                    line.className = 'log-line';
                    
                    const time = new Date(log.timestamp || Date.now());
                    const timeStr = time.toLocaleTimeString('pt-BR', { hour12: false });
                    
                    let levelClass = 'log-level-info';
                    let level = 'INFO';
                    let icon = 'fa-info-circle';
                    
                    if (log.level) {
                        if (log.level.includes('warn')) {
                            levelClass = 'log-level-warn';
                            level = 'WARN';
                            icon = 'fa-exclamation-triangle';
                        }
                        if (log.level.includes('error')) {
                            levelClass = 'log-level-error';
                            level = 'ERROR';
                            icon = 'fa-times-circle';
                        }
                    }
                    
                    line.innerHTML = \`
                        <span class="log-time">\${timeStr}</span>
                        <span class="\${levelClass}">
                            <i class="fas \${icon}"></i> \${level}
                        </span>
                        <span>\${log.message || log}</span>
                    \`;
                    
                    container.appendChild(line);
                });
                
                container.scrollTop = container.scrollHeight;
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR');
            }

            // 📁 FILE MANAGEMENT FUNCTIONS
            
            async function loadMessageTemplate() {
                const messageType = document.getElementById('messageType').value;
                if (!messageType) {
                    document.getElementById('messageContent').value = '';
                    return;
                }
                
                try {
                    const response = await fetch('/api/message-templates');
                    const result = await response.json();
                    
                    if (result.success) {
                        const template = result.templates.find(t => t.tipo === messageType);
                        if (template) {
                            document.getElementById('messageContent').value = template.textoPersonalizado || '';
                            document.getElementById('availableVariables').textContent = 
                                template.variaveis.map(v => \`{\${v}}\`).join(', ');
                        }
                    }
                } catch (error) {
                    console.error('Erro ao carregar template:', error);
                }
            }
            
            async function saveMessageTemplate() {
                const messageType = document.getElementById('messageType').value;
                const messageContent = document.getElementById('messageContent').value;
                
                if (!messageType || !messageContent) {
                    alert('❌ Selecione o tipo de contato e digite a mensagem');
                    return;
                }
                
                try {
                    const response = await fetch('/api/message-templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tipo: messageType,
                            novoTexto: messageContent
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ Mensagem salva com sucesso!');
                    } else {
                        alert('❌ Erro ao salvar: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }
            
            function previewMessage() {
                const messageContent = document.getElementById('messageContent').value;
                if (!messageContent) {
                    alert('❌ Digite uma mensagem primeiro');
                    return;
                }
                
                const preview = messageContent.replace(/\{nome\}/g, 'João Silva');
                alert('📝 Prévia da mensagem:\\n\\n' + preview);
            }
            
            async function uploadFile() {
                const fileInput = document.getElementById('fileUpload');
                const contactType = document.getElementById('uploadContactType').value;
                
                if (!fileInput.files || fileInput.files.length === 0) {
                    alert('❌ Selecione um arquivo');
                    return;
                }
                
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                if (contactType) {
                    formData.append('contactType', contactType);
                }
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert(\`✅ Arquivo enviado: \${result.originalName}\`);
                        fileInput.value = '';
                        refreshFiles();
                    } else {
                        alert('❌ Erro no upload: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }
            
            async function refreshFiles() {
                try {
                    const response = await fetch('/api/files');
                    const result = await response.json();
                    
                    if (result.success) {
                        updateFilesDisplay(result.files, result.stats);
                    }
                } catch (error) {
                    console.error('Erro ao carregar arquivos:', error);
                }
            }
            
            function updateFilesDisplay(files, stats) {
                const container = document.getElementById('filesContainer');
                container.innerHTML = '';
                
                // Stats header
                const statsDiv = document.createElement('div');
                statsDiv.className = 'stats-item';
                statsDiv.innerHTML = \`
                    <span class="stats-label">
                        <i class="fas fa-info-circle"></i>
                        Total: \${stats.total} arquivos • \${stats.textFiles} textos • \${stats.audioFiles} áudios • \${(stats.totalSize / 1024).toFixed(1)} KB
                    </span>
                \`;
                container.appendChild(statsDiv);
                
                if (files.length === 0) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'stats-item';
                    emptyDiv.innerHTML = '<span class="stats-label">Nenhum arquivo encontrado</span>';
                    container.appendChild(emptyDiv);
                    return;
                }
                
                files.forEach(file => {
                    const item = document.createElement('div');
                    item.className = 'stats-item';
                    
                    let icon = 'fa-file';
                    let typeColor = 'var(--text-secondary)';
                    
                    if (file.type === 'text') {
                        icon = 'fa-file-text';
                        typeColor = 'var(--success)';
                    } else if (file.type === 'audio') {
                        icon = 'fa-file-audio';
                        typeColor = 'var(--warning)';
                    }
                    
                    const date = new Date(file.lastModified).toLocaleDateString('pt-BR');
                    const size = (file.size / 1024).toFixed(1);
                    
                    item.innerHTML = \`
                        <div>
                            <div style="font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas \${icon}" style="color: \${typeColor};"></i>
                                \${file.name}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                📁 \${file.path} • 📅 \${date} • 📏 \${size} KB
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.25rem;">
                            \${file.type === 'text' ? \`
                                <button class="btn" onclick="viewFile('\${file.path}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            \` : ''}
                            <button class="btn btn-danger" onclick="deleteFile('\${file.path}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    \`;
                    
                    container.appendChild(item);
                });
            }
            
            async function viewFile(filePath) {
                try {
                    const response = await fetch(\`/api/files/read/\${encodeURIComponent(filePath)}\`);
                    const result = await response.json();
                    
                    if (result.success && result.content) {
                        document.getElementById('payloadViewer').textContent = result.content;
                        // Switch to controls tab to show the content
                        showTab('controls');
                    } else {
                        alert('❌ Erro ao ler arquivo: ' + (result.error || 'Conteúdo vazio'));
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }
            
            async function deleteFile(filePath) {
                if (!confirm(\`Tem certeza que deseja deletar o arquivo: \${filePath}?\`)) {
                    return;
                }
                
                try {
                    const response = await fetch(\`/api/files/\${encodeURIComponent(filePath)}\`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ Arquivo deletado com sucesso!');
                        refreshFiles();
                    } else {
                        alert('❌ Erro ao deletar: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Erro: ' + error.message);
                }
            }

            // 🤖 SISTEMA DE TESTE COMPLETO
            
            let flowTestState = {
                active: false,
                currentStep: 0,
                interval: null,
                timeouts: [],
                startTime: null,
                payloads: {},
                config: null
            };

            function toggleTestType() {
                const testType = document.getElementById('flowTestType').value;
                const searchField = document.getElementById('flowTestSearch');
                const itemIdField = document.getElementById('flowTestItemId');
                const searchBtn = document.getElementById('flowSearchBtn');
                
                if (testType === 'existing') {
                    searchField.style.display = 'block';
                    searchField.value = '5531982354127'; // Valor exemplo
                    itemIdField.style.display = 'block';
                    searchBtn.style.display = 'inline-flex';
                } else {
                    searchField.style.display = 'none';
                    searchField.value = '';
                    itemIdField.style.display = 'none';
                    itemIdField.value = '';
                    searchBtn.style.display = 'none';
                }
            }

            async function searchForFlowTest() {
                try {
                    const searchValue = document.getElementById('flowTestSearch').value;
                    
                    if (!searchValue) {
                        alert('❌ Digite um telefone ou email para buscar');
                        return;
                    }
                    
                    const response = await fetch('/api/test/monday/find', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchValue })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Preenche automaticamente os campos
                        document.getElementById('flowTestItemId').value = result.item.id;
                        document.getElementById('flowTestNome').value = result.item.name;
                        document.getElementById('flowTestTelefone').value = result.item.telefone || searchValue;
                        
                        alert(\`✅ Lead encontrado!\\n\\nNome: \${result.item.name}\\nTelefone: \${result.item.telefone}\\nStatus: \${result.item.status}\\n\\nCampos preenchidos automaticamente!\`);
                    } else {
                        alert(\`❌ \${result.error}\\n\\nTente com outro telefone/email ou use "Criar Novo Lead".\`);
                    }
                } catch (error) {
                    alert('❌ Erro na busca: ' + error.message);
                }
            }

            function debugFlowTest() {
                console.log('🐛 DEBUG: Estado do flowTestState:', flowTestState);
                console.log('🐛 DEBUG: Elementos DOM:', {
                    flowVisualization: !!document.getElementById('flowVisualization'),
                    stepPrimeiro: !!document.getElementById('step-primeiro'),
                    stepSegundo: !!document.getElementById('step-segundo'),
                    stepTerceiro: !!document.getElementById('step-terceiro'),
                    stepUltimo: !!document.getElementById('step-ultimo'),
                    flowStatus: !!document.getElementById('flowStatus')
                });
                
                // Testar uma requisição simples
                fetch('/webhook/test/monday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: 'DEBUG_TEST',
                        nome: 'Debug Test',
                        telefone: '5531982354127',
                        status: 'Primeiro Contato',
                        createNew: true
                    })
                })
                .then(response => {
                    console.log('🐛 DEBUG: Response status:', response.status);
                    return response.json();
                })
                .then(result => {
                    console.log('🐛 DEBUG: Response data:', result);
                    alert('Debug completo - veja o console');
                })
                .catch(error => {
                    console.error('🐛 DEBUG: Error:', error);
                    alert('Debug erro: ' + error.message);
                });
            }

            async function testSingleStep() {
                console.log('🧪 Testando apenas um step...');
                
                // Mostrar visualização
                document.getElementById('flowVisualization').style.display = 'block';
                updateFlowStatus('Testando um step único...');
                
                // Reset qualquer estado anterior
                document.querySelectorAll('.flow-step').forEach(step => {
                    step.classList.remove('processing', 'active', 'completed', 'error');
                });
                
                const nome = document.getElementById('flowTestNome').value || 'Cliente Teste Single';
                const telefone = document.getElementById('flowTestTelefone').value || '5531982354127';
                
                // Testar apenas o primeiro step
                await executeFlowStep('TEST_SINGLE_' + Date.now(), nome, telefone, 'Primeiro Contato', 0);
            }

            async function startFlowTest() {
                console.log('🚀 Iniciando teste de fluxo...');
                
                const testType = document.getElementById('flowTestType').value;
                const itemId = document.getElementById('flowTestItemId').value;
                const nome = document.getElementById('flowTestNome').value;
                const telefone = document.getElementById('flowTestTelefone').value;
                const interval = parseInt(document.getElementById('flowTestInterval').value);

                console.log('📋 Parâmetros do teste:', { testType, itemId, nome, telefone, interval });

                // Validação baseada no tipo de teste
                if (testType === 'existing') {
                    if (!itemId || !nome || !telefone) {
                        alert('❌ Para teste com lead existente, preencha: Item ID, Nome e Telefone');
                        return;
                    }
                } else {
                    if (!nome || !telefone) {
                        alert('❌ Para criar novo lead, preencha: Nome e Telefone');
                        return;
                    }
                }

                if (flowTestState.active) {
                    alert('❌ Já existe um teste em andamento. Pare o teste atual primeiro.');
                    return;
                }

                // Reset estado
                resetFlowTest();
                
                flowTestState.active = true;
                flowTestState.startTime = new Date();
                
                // Show visualization
                document.getElementById('flowVisualization').style.display = 'block';
                updateFlowStatus('Iniciando teste...');
                
                // Determinar Item ID para usar
                let finalItemId = itemId;
                
                if (testType === 'new') {
                    // Criar lead REAL no Monday primeiro
                    updateFlowStatus('🆕 Criando lead real no Monday...');
                    updateStepDescription('Primeiro Contato', 'Criando cliente na Monday');
                    updateStepTime('Primeiro Contato', 'Aguardando...');
                    
                    try {
                        const response = await fetch('/api/test/monday/create-real-flow', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                nome: nome, 
                                telefone: telefone, 
                                intervalMinutes: interval / 60000 
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            finalItemId = result.itemId; // Usar ID real do Monday
                            updateFlowStatus(\`✅ Lead criado no Monday: \${finalItemId}\`);
                            updateStepDescription('Primeiro Contato', 'Cliente criado - Marcando próximo ctt');
                            console.log('🆕 Lead real criado:', result);
                            
                            // Verificar se próximo contato foi marcado
                            setTimeout(() => {
                                updateStepDescription('Primeiro Contato', 'Aguardando webhook da Monday');
                                updateStepTime('Primeiro Contato', 'Webhook esperado em ' + formatTimeFromNow(result.proximoContato));
                            }, 2000);
                            
                        } else {
                            alert('❌ Erro ao criar lead no Monday: ' + result.error);
                            stopFlowTest();
                            return;
                        }
                    } catch (error) {
                        alert('❌ Erro de rede ao criar lead: ' + error.message);
                        stopFlowTest();
                        return;
                    }
                } else {
                    finalItemId = itemId;
                    updateFlowStatus('Usando lead existente: ' + itemId);
                }

                // Armazenar config do teste
                flowTestState.config = {
                    testType: testType,
                    itemId: finalItemId,
                    originalItemId: itemId,
                    nome: nome,
                    telefone: telefone,
                    interval: interval
                };

                // Executar teste
                const steps = [
                    { type: 'Primeiro Contato', delay: 0 },
                    { type: 'Segundo Contato', delay: interval },
                    { type: 'Terceiro Contato', delay: interval * 2 },
                    { type: 'Ultimo Contato', delay: interval * 3 }
                ];

                if (testType === 'new') {
                    // Para leads reais, aguardamos os webhooks da Monday
                    document.getElementById('step-primeiro').classList.add('active');
                    
                    // Iniciar monitoramento de webhooks
                    startWebhookMonitoring(finalItemId);
                    
                    // Iniciar temporizadores visuais
                    startFlowTimers(steps);
                    
                } else {
                    // Para leads existentes, simular imediatamente
                    steps.forEach((step, index) => {
                        const timeoutId = setTimeout(async () => {
                            if (!flowTestState.active) return;
                            
                            await executeFlowStep(finalItemId, nome, telefone, step.type, index);
                        }, step.delay);
                        
                        flowTestState.timeouts.push(timeoutId);
                    });
                }

                // Atualizar UI inicial
                updateFlowUI();
            }

            async function executeFlowStep(itemId, nome, telefone, stepType, stepIndex) {
                // Mapear nomes de step para IDs corretos
                const stepIds = {
                    'Primeiro Contato': 'step-primeiro',
                    'Segundo Contato': 'step-segundo', 
                    'Terceiro Contato': 'step-terceiro',
                    'Ultimo Contato': 'step-ultimo'
                };
                
                const stepElementId = stepIds[stepType];
                if (!stepElementId) {
                    console.error('❌ Step ID não encontrado para:', stepType);
                    updateFlowStatus('Erro: Step ID não encontrado para ' + stepType);
                    return;
                }
                
                const stepElement = document.getElementById(stepElementId);
                if (!stepElement) {
                    console.error('❌ Elemento step não encontrado:', stepElementId);
                    updateFlowStatus('Erro: Elemento step não encontrado ' + stepElementId);
                    return;
                }
                
                // Marcar como processando
                stepElement.classList.add('processing');
                updateStepTime(stepType, 'Processando...');
                updateFlowStatus('Executando ' + stepType + '...');

                try {
                    console.log('📡 Executando step para lead existente:', { 
                        itemId, 
                        nome, 
                        telefone, 
                        stepType 
                    });
                    
                    // Simular webhook Monday real com lead já existente
                    const response = await fetch('/webhook/test/monday', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            itemId: itemId, 
                            nome: nome, 
                            telefone: telefone,
                            status: stepType,
                            createNew: false // Sempre false pois lead já foi criado no startFlowTest
                        })
                    });

                    console.log('📡 Resposta webhook - Status:', response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ Resposta de erro:', errorText);
                        throw new Error(\`HTTP \${response.status}: \${errorText}\`);
                    }
                    
                    const result = await response.json();
                    console.log('📡 Resposta webhook - Dados:', result);
                    
                    if (!result) {
                        throw new Error('Resposta vazia do servidor');
                    }
                    
                    // Armazenar payload com chave correta
                    const payloadKeys = {
                        'Primeiro Contato': 'primeiro',
                        'Segundo Contato': 'segundo',
                        'Terceiro Contato': 'terceiro',
                        'Ultimo Contato': 'ultimo'
                    };
                    
                    const payloadKey = payloadKeys[stepType];
                    flowTestState.payloads[payloadKey] = {
                        request: { itemId: itemId, nome: nome, telefone: telefone, status: stepType },
                        response: result,
                        timestamp: new Date()
                    };

                    if (result.success) {
                        console.log('✅ Step executado com sucesso:', stepType);
                        
                        // Marcar como completo
                        stepElement.classList.remove('processing');
                        stepElement.classList.add('completed');
                        updateStepTime(stepType, new Date().toLocaleTimeString());
                        
                        console.log('📋 Step index:', stepIndex, 'de 4 total');
                        
                        // Se for o último step, finalizar teste
                        if (stepIndex === 3) {
                            console.log('🏁 Último step concluído, finalizando teste...');
                            setTimeout(function() {
                                completeFlowTest();
                            }, 2000);
                        } else {
                            console.log('⏭️ Aguardando próximo step...');
                        }
                    } else {
                        console.error('❌ Step falhou:', stepType, result);
                        // Marcar erro
                        stepElement.classList.remove('processing');
                        stepElement.classList.add('error');
                        updateStepTime(stepType, 'ERRO');
                        updateFlowStatus('Erro no ' + stepType + ': ' + (result.error || result.message || 'Desconhecido'));
                        
                        // Parar o teste em caso de erro
                        flowTestState.active = false;
                    }

                } catch (error) {
                    // Marcar erro
                    stepElement.classList.remove('processing');
                    stepElement.classList.add('error');
                    updateStepTime(stepType, 'ERRO');
                    updateFlowStatus('Erro de rede: ' + error.message);
                }
            }

            function updateStepTime(stepType, time) {
                // Mapear nomes de step para IDs corretos
                const stepIds = {
                    'Primeiro Contato': 'step-primeiro',
                    'Segundo Contato': 'step-segundo', 
                    'Terceiro Contato': 'step-terceiro',
                    'Ultimo Contato': 'step-ultimo'
                };
                
                const stepElementId = stepIds[stepType];
                if (!stepElementId) {
                    console.error('❌ Step ID não encontrado para:', stepType);
                    return;
                }
                
                const stepElement = document.getElementById(stepElementId);
                if (!stepElement) {
                    console.error('❌ Elemento step não encontrado:', stepElementId);
                    return;
                }
                
                const timeElement = stepElement.querySelector('.step-time');
                if (!timeElement) {
                    console.error('❌ Elemento time não encontrado em:', stepElementId);
                    return;
                }
                
                timeElement.textContent = time;
            }

            function updateStepDescription(stepType, description) {
                // Mapear nomes de step para IDs corretos
                const stepIds = {
                    'Primeiro Contato': 'step-primeiro',
                    'Segundo Contato': 'step-segundo', 
                    'Terceiro Contato': 'step-terceiro',
                    'Ultimo Contato': 'step-ultimo'
                };
                
                const stepElementId = stepIds[stepType];
                if (!stepElementId) {
                    console.error('❌ Step ID não encontrado para:', stepType);
                    return;
                }
                
                const stepElement = document.getElementById(stepElementId);
                if (!stepElement) {
                    console.error('❌ Elemento step não encontrado:', stepElementId);
                    return;
                }
                
                const descElement = stepElement.querySelector('.step-description');
                if (!descElement) {
                    console.error('❌ Elemento description não encontrado em:', stepElementId);
                    return;
                }
                
                descElement.textContent = description;
            }

            function formatTimeFromNow(targetDate) {
                if (!targetDate) return '?';
                
                const now = new Date();
                const target = new Date(targetDate);
                const diffMs = target.getTime() - now.getTime();
                
                if (diffMs <= 0) return 'agora';
                
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                
                if (diffMinutes > 0) {
                    return \`\${diffMinutes}m \${diffSeconds}s\`;
                } else {
                    return \`\${diffSeconds}s\`;
                }
            }

            function startWebhookMonitoring(itemId) {
                console.log('🕵️ Iniciando monitoramento de webhooks para:', itemId);
                
                // Monitorar a cada 10 segundos se chegou webhook
                const monitorInterval = setInterval(async () => {
                    if (!flowTestState.active) {
                        clearInterval(monitorInterval);
                        return;
                    }
                    
                    try {
                        // Verificar se lead apareceu no funil local (isso indica que webhook chegou)
                        const response = await fetch('/api/leads');
                        const result = await response.json();
                        
                        if (result.leads) {
                            const leadEncontrado = result.leads.find(lead => lead.id === itemId);
                            
                            if (leadEncontrado) {
                                console.log('✅ Webhook recebido! Lead encontrado no funil:', leadEncontrado);
                                clearInterval(monitorInterval);
                                
                                // Atualizar UI para mostrar que webhook foi recebido
                                updateStepDescription('Primeiro Contato', 'Webhook recebido - Mensagem enviada');
                                updateStepTime('Primeiro Contato', new Date().toLocaleTimeString());
                                
                                const stepElement = document.getElementById('step-primeiro');
                                stepElement.classList.remove('active');
                                stepElement.classList.add('completed');
                                
                                updateFlowStatus('✅ Primeiro contato processado - Aguardando próximo');
                                
                                return;
                            }
                        }
                        
                        // Atualizar contador visual
                        const configs = flowTestState.config;
                        if (configs && configs.interval) {
                            // Calcular tempo restante baseado no intervalo configurado
                            const elapsed = Date.now() - flowTestState.startTime.getTime();
                            const remaining = Math.max(0, configs.interval - elapsed);
                            
                            if (remaining > 0) {
                                const minutes = Math.floor(remaining / 60000);
                                const seconds = Math.floor((remaining % 60000) / 1000);
                                updateStepTime('Primeiro Contato', \`\${minutes}m \${seconds}s restantes\`);
                            }
                        }
                        
                    } catch (error) {
                        console.error('❌ Erro no monitoramento:', error);
                    }
                }, 10000); // A cada 10 segundos
                
                // Salvar referência para poder cancelar depois
                flowTestState.monitoringInterval = monitorInterval;
            }

            function startFlowTimers(steps) {
                console.log('⏱️ Iniciando temporizadores visuais para steps');
                
                steps.forEach((step, index) => {
                    const stepIds = {
                        'Primeiro Contato': 'step-primeiro',
                        'Segundo Contato': 'step-segundo', 
                        'Terceiro Contato': 'step-terceiro',
                        'Ultimo Contato': 'step-ultimo'
                    };
                    
                    const stepElementId = stepIds[step.type];
                    if (!stepElementId) return;
                    
                    // Calcular quando este step deve ser executado
                    const executionTime = flowTestState.startTime.getTime() + step.delay;
                    
                    // Iniciar contador regressivo visual
                    const countdownInterval = setInterval(() => {
                        if (!flowTestState.active) {
                            clearInterval(countdownInterval);
                            return;
                        }
                        
                        const now = Date.now();
                        const remaining = Math.max(0, executionTime - now);
                        
                        if (remaining > 0) {
                            const minutes = Math.floor(remaining / 60000);
                            const seconds = Math.floor((remaining % 60000) / 1000);
                            
                            updateStepTime(step.type, \`\${minutes}m \${seconds}s\`);
                            
                            // Atualizar descrição baseada no tempo
                            if (remaining > 60000) {
                                updateStepDescription(step.type, 'Aguardando intervalo programado');
                            } else {
                                updateStepDescription(step.type, 'Execução iminente...');
                            }
                        } else {
                            clearInterval(countdownInterval);
                            
                            // Marcar como pronto para execução
                            updateStepTime(step.type, 'Pronto');
                            updateStepDescription(step.type, 'Aguardando webhook Monday');
                            
                            const stepElement = document.getElementById(stepElementId);
                            if (stepElement && index === 0) {
                                // Só o primeiro step fica ativo inicialmente
                                stepElement.classList.add('active');
                            }
                        }
                        
                    }, 1000); // Atualizar a cada segundo
                    
                    // Salvar referência do intervalo
                    flowTestState.timers = flowTestState.timers || [];
                    flowTestState.timers.push(countdownInterval);
                });
            }

            function updateFlowStatus(status) {
                document.getElementById('flowStatus').textContent = status;
            }

            function updateFlowUI() {
                // Marcar primeiro step como ativo
                document.getElementById('step-primeiro').classList.add('active');
            }

            function completeFlowTest() {
                flowTestState.active = false;
                updateFlowStatus('Teste completo! Todos os contatos enviados.');
                
                // Limpar timeouts restantes
                flowTestState.timeouts.forEach(id => clearTimeout(id));
                flowTestState.timeouts = [];
            }

            function stopFlowTest() {
                if (!flowTestState.active) {
                    alert('❌ Nenhum teste ativo para parar');
                    return;
                }

                flowTestState.active = false;
                updateFlowStatus('Teste interrompido pelo usuário');
                
                // Limpar todos os timeouts
                flowTestState.timeouts.forEach(id => clearTimeout(id));
                flowTestState.timeouts = [];
                
                // Remover classes de processamento
                document.querySelectorAll('.flow-step').forEach(step => {
                    step.classList.remove('processing', 'active');
                });
            }

            function resetFlowTest() {
                // Parar teste se ativo
                if (flowTestState.active) {
                    stopFlowTest();
                }
                
                // Limpar intervalos e timeouts
                if (flowTestState.monitoringInterval) {
                    clearInterval(flowTestState.monitoringInterval);
                }
                
                if (flowTestState.timers) {
                    flowTestState.timers.forEach(timer => clearInterval(timer));
                }
                
                flowTestState.timeouts?.forEach(id => clearTimeout(id));
                
                // Reset estado
                flowTestState = {
                    active: false,
                    currentStep: 0,
                    interval: null,
                    timeouts: [],
                    startTime: null,
                    payloads: {},
                    config: null,
                    monitoringInterval: null,
                    timers: []
                };
                
                // Reset UI
                document.querySelectorAll('.flow-step').forEach(step => {
                    step.classList.remove('processing', 'active', 'completed', 'error');
                    step.querySelector('.step-time').textContent = '--:--';
                    
                    // Reset descrições para o padrão
                    const stepTitle = step.querySelector('.step-title').textContent;
                    const stepDesc = step.querySelector('.step-description');
                    
                    if (stepTitle.includes('Primeiro')) {
                        stepDesc.textContent = 'Mensagem + Áudio playbook';
                    } else if (stepTitle.includes('Segundo')) {
                        stepDesc.textContent = 'Follow-up interesse';
                    } else if (stepTitle.includes('Terceiro')) {
                        stepDesc.textContent = 'Última chance';
                    } else if (stepTitle.includes('Último')) {
                        stepDesc.textContent = 'Despedida final';
                    }
                });
                
                document.getElementById('flowVisualization').style.display = 'none';
                updateFlowStatus('Aguardando...');
            }

            // 📋 MODAL PAYLOAD
            
            function showPayload(stepType) {
                const payload = flowTestState.payloads[stepType];
                
                if (!payload) {
                    alert('❌ Nenhum payload disponível para este step');
                    return;
                }
                
                const stepNames = {
                    'primeiro': 'Primeiro Contato',
                    'segundo': 'Segundo Contato', 
                    'terceiro': 'Terceiro Contato',
                    'ultimo': 'Último Contato'
                };
                
                document.getElementById('payloadStepTitle').textContent = 'Payload - ' + stepNames[stepType];
                
                const fullPayload = {
                    step: stepNames[stepType],
                    timestamp: payload.timestamp,
                    request: payload.request,
                    response: payload.response
                };
                
                document.getElementById('payloadCode').textContent = JSON.stringify(fullPayload, null, 2);
                document.getElementById('payloadModal').classList.add('show');
            }

            function closePayloadModal() {
                document.getElementById('payloadModal').classList.remove('show');
            }

            // Fechar modal clicando fora
            document.addEventListener('click', function(e) {
                if (e.target.id === 'payloadModal') {
                    closePayloadModal();
                }
            });

            // Fechar modal com ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closePayloadModal();
                }
            });

            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                loadDashboardData();
                setInterval(loadDashboardData, 30000); // Auto-refresh every 30s
            });
        </script>
        
        <!-- 📋 MODAL DA TABELA CRM -->
        <div id="tableModal" class="table-modal">
            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">
                        <i class="fas fa-table"></i>
                        Board CRM - Monday.com
                    </div>
                    <button class="table-close" onclick="closeTableModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="table-wrapper" id="tableWrapper">
                    <div class="table-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Carregando dados do board...
                    </div>
                </div>
                <div class="table-stats" id="tableStats" style="display: none;">
                    <span>Total de registros: <strong id="totalItems">0</strong></span>
                    <span>Última atualização: <strong id="lastUpdate">--</strong></span>
                </div>
            </div>
        </div>
    </body>
    </html>`;
    
    res.send(html);
  });

  // APIs existentes...
  getStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await leadService.getLeadStats();
      
      const status = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        leads: stats,
        monday: {
          connected: true,
          boardId: process.env.MONDAY_BOARD_ID
        },
        evolution: {
          connected: true,
          instance: process.env.EVOLUTION_INSTANCE_NAME
        },
        database: {
          connected: true,
          type: 'SQLite'
        }
      };

      res.json(status);
    } catch (error) {
      logger.error('Error getting status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  getLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { getMemoryLogs } = await import('../utils/logger');
      const logs = getMemoryLogs();
      
      res.json({
        success: true,
        logs: logs.slice(-50) // Últimos 50 logs
      });
    } catch (error) {
      logger.error('Error getting logs:', error);
      res.status(500).json({ error: 'Failed to get logs' });
    }
  });

  getDetailedLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { getMemoryLogs } = await import('../utils/logger');
      const logs = getMemoryLogs();
      
      res.json({
        success: true,
        logs: logs.slice(-100) // Últimos 100 logs detalhados
      });
    } catch (error) {
      logger.error('Error getting detailed logs:', error);
      res.status(500).json({ error: 'Failed to get detailed logs' });
    }
  });

  getLeads = asyncHandler(async (req: Request, res: Response) => {
    try {
      const leads = await leadService.getActiveLeads();
      res.json({
        success: true,
        leads,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting leads:', error);
      res.status(500).json({ error: 'Failed to get leads' });
    }
  });

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
        }
      ];

      res.json({
        success: true,
        webhookLogs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting webhook logs:', error);
      res.status(500).json({ error: 'Failed to get webhook logs' });
    }
  });

  // Novos endpoints de teste
  testEvolution = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Testa conexão real com Evolution API
      const { evolutionService } = await import('../services/evolutionService');
      const isConnected = await evolutionService.checkConnection();
      
      res.json({
        success: isConnected,
        connected: isConnected,
        instance: process.env.EVOLUTION_INSTANCE_NAME || 'crmDisparo',
        url: process.env.EVOLUTION_API_URL || 'https://evolutionapi.landcriativa.com',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  testMonday = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Testa conexão real com Monday API
      const { mondayService } = await import('../services/mondayService');
      const testResult = await mondayService.testConnection();
      
      res.json({
        success: testResult.success,
        connected: testResult.success,
        boardId: process.env.MONDAY_BOARD_ID || '9678658244',
        boardName: testResult.boardName || 'CRM',
        timestamp: new Date().toISOString(),
        details: testResult.details
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // 📊 ANALYTICS E MÉTRICAS
  
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const hours = parseInt(req.query.hours as string) || 24;
    const analytics = await analyticsService.getAnalytics(hours);
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  });

  getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    const health = await analyticsService.getSystemHealth();
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  });

  // 🔍 NOVOS ENDPOINTS DE TESTE DETALHADOS
  
  // Debug Environment Variables
  debugEnvVars = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      envVars: {
        MONDAY_API_TOKEN: process.env.MONDAY_API_TOKEN ? `${process.env.MONDAY_API_TOKEN.substring(0, 20)}...` : 'NOT SET',
        MONDAY_BOARD_ID: process.env.MONDAY_BOARD_ID || 'NOT SET',
        EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'NOT SET',
        EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? `${process.env.EVOLUTION_API_KEY.substring(0, 10)}...` : 'NOT SET',
        EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || 'NOT SET'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Evolution API Tests
  testEvolutionStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { evolutionService } = await import('../services/evolutionService');
      const status = await evolutionService.getInstanceStatus();
      
      res.json({
        success: true,
        connected: status.state === 'open',
        status: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      });
    }
  });

  testEvolutionInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { evolutionService } = await import('../services/evolutionService');
      const info = await evolutionService.getInstanceInfo();
      
      res.json({
        success: true,
        instance: info,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testEvolutionMessage = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required' });
      }

      const { evolutionService } = await import('../services/evolutionService');
      const sent = await evolutionService.sendTextMessage(phone, message);
      
      return res.json({
        success: sent,
        phone,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testEvolutionAudio = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone is required' });
      }

      const { evolutionService } = await import('../services/evolutionService');
      const { CONTATOS_CONFIG, PATHS } = await import('../config/constants');
      const fs = await import('fs');
      const path = await import('path');
      
      const audioPath = CONTATOS_CONFIG['Primeiro Contato'].arquivoAudio;
      if (!audioPath) {
        return res.status(400).json({ success: false, error: 'Audio file not configured' });
      }

      // Verifica se o arquivo existe e coleta informações
      const audioFullPath = path.join(PATHS.ASSETS, audioPath);
      const fileExists = fs.existsSync(audioFullPath);
      
      let fileInfo = {};
      if (fileExists) {
        const stats = fs.statSync(audioFullPath);
        fileInfo = {
          size: stats.size,
          extension: path.extname(audioPath),
          exists: true,
          fullPath: audioFullPath
        };
      } else {
        fileInfo = {
          exists: false,
          fullPath: audioFullPath
        };
      }

      // Tenta enviar o áudio
      const sent = await evolutionService.sendAudioMessage(phone, audioPath, 'Teste de áudio via API v2 - Primeiro Contato');
      
      return res.json({
        success: sent,
        phone,
        audioPath,
        fileInfo,
        method: 'Evolution API v2 (sendWhatsAppAudio + fallback sendMedia)',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Monday.com API Tests
  testMondayBoard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { mondayService } = await import('../services/mondayService');
      const result = await mondayService.testConnection();
      
      res.json({
        success: result.success,
        boardName: result.boardName,
        boardId: process.env.MONDAY_BOARD_ID,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testMondayItems = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { mondayService } = await import('../services/mondayService');
      const items = await mondayService.getBoardItems(10); // Últimos 10 itens
      
      res.json({
        success: true,
        items: items || [],
        count: items?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testMondayItem = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      
      if (!itemId) {
        return res.status(400).json({ success: false, error: 'Item ID is required' });
      }

      const { mondayService } = await import('../services/mondayService');
      const item = await mondayService.getItem(itemId);
      
      return res.json({
        success: !!item,
        item,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testMondayUpdate = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { itemId, status } = req.body;
      
      if (!itemId || !status) {
        return res.status(400).json({ success: false, error: 'Item ID and status are required' });
      }

      const { mondayService } = await import('../services/mondayService');
      const updated = await mondayService.updateStatus(itemId, status);
      
      return res.json({
        success: updated,
        itemId,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // 🔍 Buscar item por telefone/email
  // 🧹 LIMPAR DADOS DE TESTE E SINCRONIZAR COM MONDAY
  cleanAndSyncDatabase = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { database } = await import('../database/connection');
      const { mondayService } = await import('../services/mondayService');
      
      // 1. Primeiro, obter dados reais do Monday
      const mondayResult = await mondayService.getFullBoard();
      
      if (!mondayResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao conectar com Monday.com: ' + mondayResult.error
        });
      }
      
      // 2. Limpar tabela de leads (remover dados de teste)
      await database.run('DELETE FROM leads');
      await database.run('DELETE FROM logs_acoes');
      await database.run('DELETE FROM revisoes_manuais');
      
      // 3. Resetar auto-increment
      await database.run('DELETE FROM sqlite_sequence WHERE name IN ("logs_acoes", "revisoes_manuais")');
      
      return res.json({
        success: true,
        message: 'Banco de dados limpo com sucesso',
        mondayItems: mondayResult.items.length,
        localLeadsRemoved: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error cleaning database:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // 🚀 CRIAR LEAD REAL NO MONDAY COM FLUXO COMPLETO
  createRealFlowTest = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { nome, telefone, intervalMinutes } = req.body;
      
      if (!nome || !telefone) {
        return res.status(400).json({
          success: false,
          error: 'Nome e telefone são obrigatórios',
          required: ['nome', 'telefone'],
          optional: ['intervalMinutes']
        });
      }

      const interval = intervalMinutes || 10; // Default 10 minutos
      
      logger.info('🚀 Criando lead real no Monday com fluxo completo:', {
        nome,
        telefone,
        intervalMinutes: interval
      });

      // Usar o novo método que cria + configura tudo
      const { mondayService } = await import('../services/mondayService');
      const result = await mondayService.createRealLeadWithStatus(nome, telefone, interval);
      
      if (result.success) {
        logger.info('✅ Lead real criado e configurado:', {
          itemId: result.item?.id,
          nome,
          telefone,
          statusConfigured: result.item?.statusConfigured,
          dateConfigured: result.item?.dateConfigured
        });
        
        return res.json({
          success: true,
          message: 'Lead criado e configurado no Monday com sucesso',
          itemId: result.item?.id,
          proximoContato: result.item?.proximoContato,
          statusConfigured: result.item?.statusConfigured,
          dateConfigured: result.item?.dateConfigured,
          awaiting: 'webhook_from_monday',
          nextStep: 'Aguardando webhook da Monday para disparar Primeiro Contato',
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao criar lead no Monday',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      logger.error('Error creating real flow test:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
    }
  });

  findMondayContact = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { searchValue } = req.body;
      
      if (!searchValue) {
        return res.status(400).json({
          success: false,
          error: 'searchValue é obrigatório',
          usage: 'POST /api/test/monday/find com { "searchValue": "telefone ou email" }'
        });
      }

      const { mondayService } = await import('../services/mondayService');
      const result = await mondayService.findItemByContact(searchValue);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          searchValue
        });
      }

      const item = result.item!;
      const telefone = mondayService.getInstance().getPhoneNumber(item);
      const status = mondayService.getInstance().getCurrentStatus(item);

      return res.json({
        success: true,
        item: {
          id: item.id,
          name: item.name,
          telefone,
          status,
          columns: item.column_values
        },
        searchValue,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 📁 FILE MANAGEMENT ENDPOINTS
  
  getFiles = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fileManager } = await import('../services/fileManager');
      const files = await fileManager.listFiles();
      const stats = await fileManager.getFileStats();
      
      res.json({
        success: true,
        files,
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

  getMessageTemplates = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fileManager } = await import('../services/fileManager');
      
      const templates = await Promise.all([
        fileManager.getMessageTemplate('Primeiro Contato'),
        fileManager.getMessageTemplate('Segundo Contato'),
        fileManager.getMessageTemplate('Terceiro Contato'),
        fileManager.getMessageTemplate('Ultimo Contato')
      ]);
      
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

  updateMessageTemplate = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { tipo, novoTexto, nomeArquivo } = req.body;
      
      if (!tipo || !novoTexto) {
        return res.status(400).json({ success: false, error: 'Tipo e novo texto são obrigatórios' });
      }

      const { fileManager } = await import('../services/fileManager');
      const arquivoTexto = nomeArquivo || `${tipo}/TXT ${tipo.toUpperCase()}.txt`;
      
      const updated = await fileManager.updateMessageTemplate(tipo, novoTexto, arquivoTexto);
      
      return res.json({
        success: updated,
        tipo,
        arquivoTexto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Este endpoint será usado com multer middleware para upload
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
      }

      const { fileManager } = await import('../services/fileManager');
      const { contactType } = req.body;
      
      const savedPath = await fileManager.saveUploadedFile(
        req.file.buffer,
        req.file.originalname,
        contactType
      );
      
      return res.json({
        success: true,
        filePath: savedPath,
        originalName: req.file.originalname,
        size: req.file.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { filePath } = req.params;
      
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'Caminho do arquivo é obrigatório' });
      }

      const { fileManager } = await import('../services/fileManager');
      const deleted = await fileManager.deleteFile(decodeURIComponent(filePath));
      
      return res.json({
        success: deleted,
        filePath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  readTextFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { filePath } = req.params;
      
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'Caminho do arquivo é obrigatório' });
      }

      const { fileManager } = await import('../services/fileManager');
      const content = await fileManager.readTextFile(decodeURIComponent(filePath));
      
      return res.json({
        success: !!content,
        content,
        filePath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // 📋 Buscar tabela completa do Monday CRM
  getFullMondayBoard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { mondayService } = await import('../services/mondayService');
      const result = await mondayService.getFullBoard();
      
      return res.json({
        success: result.success,
        items: result.items,
        columns: result.columns,
        totalItems: result.items.length,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        columns: []
      });
    }
  });
}

export const dashboardController = new DashboardController();