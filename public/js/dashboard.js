// Dashboard JavaScript - ES5 Compatible
// ============================================

// Global variables
var currentTab = 'overview';
var leadsData = null;
var analyticsData = null;

// Utility functions
function $(id) {
    return document.getElementById(id);
}

function ajax(url, options) {
    var xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', url, true);
    
    if (options.headers) {
        for (var key in options.headers) {
            xhr.setRequestHeader(key, options.headers[key]);
        }
    }
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                var response;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    response = xhr.responseText;
                }
                if (options.success) options.success(response);
            } else {
                if (options.error) options.error(xhr);
            }
        }
    };
    
    if (options.data) {
        xhr.send(JSON.stringify(options.data));
    } else {
        xhr.send();
    }
}

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    var tabContents = document.querySelectorAll('.tab-content');
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Remove active from all tabs
    var tabs = document.querySelectorAll('.tab');
    for (var j = 0; j < tabs.length; j++) {
        tabs[j].classList.remove('active');
    }
    
    // Show selected tab
    var targetTab = $(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active to clicked tab (using event delegation)
    var clickedTab = document.querySelector('.tab[onclick*="' + tabName + '"]');
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Load data if needed
    currentTab = tabName;
    
    if (tabName === 'leads') {
        loadLeadsData();
    } else if (tabName === 'analytics') {
        loadAnalyticsData();
    } else if (tabName === 'controls') {
        loadControlsData();
    } else if (tabName === 'complete-test') {
        loadCompleteTestData();
    }
}

// Data Loading Functions
function loadLeadsData() {
    ajax('/api/leads/dashboard', {
        method: 'GET',
        success: function(data) {
            leadsData = data;
            renderLeadsTable(data.leads);
        },
        error: function(xhr) {
            console.error('Erro ao carregar leads:', xhr);
            showError('Erro ao carregar dados dos leads');
        }
    });
}

function loadAnalyticsData() {
    ajax('/api/analytics/dashboard', {
        method: 'GET',
        success: function(data) {
            analyticsData = data;
            renderAnalyticsCharts(data);
        },
        error: function(xhr) {
            console.error('Erro ao carregar analytics:', xhr);
            showError('Erro ao carregar dados de analytics');
        }
    });
}

function loadControlsData() {
    // Controls tab doesn't need initial data loading
    console.log('Controls tab loaded');
}

function loadCompleteTestData() {
    ajax('/api/complete-test/status', {
        method: 'GET',
        success: function(data) {
            renderCompleteTestStatus(data);
        },
        error: function(xhr) {
            console.error('Erro ao carregar status do teste:', xhr);
        }
    });
}

// Render Functions
function renderLeadsTable(leads) {
    var container = $('leads-container');
    if (!container) return;
    
    if (!leads || leads.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum lead encontrado</div>';
        return;
    }
    
    var html = '<div class="leads-grid">';
    
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        var statusColor = getStatusColor(lead.statusAtual);
        var icon = getStatusIcon(lead.statusAtual);
        var nextDate = lead.proximoDisparo ? 
            new Date(lead.proximoDisparo).toLocaleDateString('pt-BR') : 
            'Sem agendamento';
        
        html += '<div class="lead-card">' +
                  '<div class="lead-header">' +
                    '<i class="fas ' + icon + '" style="color: ' + statusColor + ';"></i>' +
                    '<span class="lead-name">' + lead.nome + '</span>' +
                  '</div>' +
                  '<div class="lead-info">' +
                    '<div><i class="fas fa-phone"></i> ' + lead.telefone + '</div>' +
                    '<div><i class="fas fa-calendar"></i> ' + nextDate + '</div>' +
                  '</div>' +
                  '<div class="lead-status" style="background: ' + statusColor + '20; color: ' + statusColor + ';">' +
                    lead.statusAtual +
                  '</div>' +
                '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderAnalyticsCharts(data) {
    var container = $('analytics-container');
    if (!container) return;
    
    // Simple analytics rendering
    var html = '<div class="analytics-grid">' +
                 '<div class="metric-card">' +
                   '<h3>Total de Leads</h3>' +
                   '<div class="metric-value">' + (data.totalLeads || 0) + '</div>' +
                 '</div>' +
                 '<div class="metric-card">' +
                   '<h3>Conversões</h3>' +
                   '<div class="metric-value">' + (data.conversions || 0) + '</div>' +
                 '</div>' +
                 '<div class="metric-card">' +
                   '<h3>Taxa de Resposta</h3>' +
                   '<div class="metric-value">' + (data.responseRate || 0) + '%</div>' +
                 '</div>' +
               '</div>';
    
    container.innerHTML = html;
}

function renderCompleteTestStatus(data) {
    var container = $('complete-test-container');
    if (!container) return;
    
    var html = '<div class="test-status">' +
                 '<h3>Status do Teste Completo</h3>' +
                 '<div class="status-info">' +
                   '<div>Status: ' + (data.status || 'Inativo') + '</div>' +
                   '<div>Progresso: ' + (data.progress || 0) + '%</div>' +
                 '</div>' +
               '</div>';
    
    container.innerHTML = html;
}

// Utility Functions
function getStatusColor(status) {
    switch (status) {
        case 'Primeiro Contato':
            return 'var(--success)';
        case 'Segundo Contato':
            return 'var(--warning)';
        case 'Terceiro Contato':
            return 'var(--error)';
        case 'Ultimo Contato':
            return '#8b5cf6';
        default:
            return 'var(--text-secondary)';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'Primeiro Contato':
            return 'fa-play-circle';
        case 'Segundo Contato':
            return 'fa-clock';
        case 'Terceiro Contato':
            return 'fa-exclamation-triangle';
        case 'Ultimo Contato':
            return 'fa-stop-circle';
        default:
            return 'fa-circle';
    }
}

function showError(message) {
    console.error(message);
    // You can implement a toast notification here
}

// Test Functions
function startCompleteTest() {
    var interval = $('test-interval').value;
    
    ajax('/api/complete-test/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            interval: parseInt(interval)
        },
        success: function(response) {
            console.log('Teste iniciado:', response);
            loadCompleteTestData();
        },
        error: function(xhr) {
            console.error('Erro ao iniciar teste:', xhr);
            showError('Erro ao iniciar teste completo');
        }
    });
}

function stopCompleteTest() {
    ajax('/api/complete-test/stop', {
        method: 'POST',
        success: function(response) {
            console.log('Teste parado:', response);
            loadCompleteTestData();
        },
        error: function(xhr) {
            console.error('Erro ao parar teste:', xhr);
            showError('Erro ao parar teste completo');
        }
    });
}

// Initialize Dashboard
function initDashboard() {
    console.log('Dashboard initialized');
    
    // Load initial tab
    showTab('overview');
    
    // Set up periodic refresh for active data
    setInterval(function() {
        if (currentTab === 'leads') {
            loadLeadsData();
        } else if (currentTab === 'analytics') {
            loadAnalyticsData();
        } else if (currentTab === 'complete-test') {
            loadCompleteTestData();
        }
    }, 30000); // Refresh every 30 seconds
}

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

// Global functions for backward compatibility
window.showTab = showTab;
window.startCompleteTest = startCompleteTest;
window.stopCompleteTest = stopCompleteTest;
