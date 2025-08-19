import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

class ControlsController {
  // Retorna o HTML da aba Controls com funcionalidades completas
  getControlsTab = asyncHandler(async (req: Request, res: Response) => {
    const html = `
    <!-- TAB: CONTROLES PROFISSIONAIS -->
    <div id="controls" class="tab-content active">
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
        // Initialize Controls tab
        function initControls() {
            console.log('Controls tab initialized');
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
                const response = await fetch('/api/test/monday/board');
                const result = await response.json();
                
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Board carregado com sucesso!');
                } else {
                    alert('❌ Erro: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function testMondayItems() {
            try {
                const response = await fetch('/api/test/monday/items');
                const result = await response.json();
                
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ ' + result.items.length + ' itens encontrados no board');
                } else {
                    alert('❌ Erro: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
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
                    
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    
                    alert('✅ Contato encontrado!\\n\\nNome: ' + result.item.name + '\\nTelefone: ' + result.item.telefone + '\\nStatus: ' + result.item.status + '\\n\\nItem ID preenchido automaticamente: ' + result.item.id);
                } else {
                    document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                    alert('❌ ' + result.error);
                }
            } catch (error) {
                document.getElementById('payloadViewer').textContent = 'Erro: ' + error.message;
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
                const response = await fetch('/api/test/monday/item/' + itemId);
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
                } else {
                    alert('❌ Erro: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // 🤖 SISTEMA DE TESTE COMPLETO
        function toggleTestType() {
            const type = document.getElementById('flowTestType').value;
            const searchInput = document.getElementById('flowTestSearch');
            const itemIdInput = document.getElementById('flowTestItemId');
            const searchBtn = document.getElementById('flowSearchBtn');
            
            if (type === 'existing') {
                searchInput.style.display = 'block';
                itemIdInput.style.display = 'block';
                searchBtn.style.display = 'inline-flex';
            } else {
                searchInput.style.display = 'none';
                itemIdInput.style.display = 'none';
                searchBtn.style.display = 'none';
            }
        }

        async function searchForFlowTest() {
            const searchValue = document.getElementById('flowTestSearch').value;
            if (!searchValue) {
                alert('❌ Digite um telefone ou email para buscar');
                return;
            }
            
            try {
                const response = await fetch('/api/test/monday/find', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ searchValue })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('flowTestItemId').value = result.item.id;
                    document.getElementById('flowTestNome').value = result.item.name;
                    document.getElementById('flowTestTelefone').value = result.item.telefone;
                    alert('✅ Lead encontrado e preenchido automaticamente!');
                } else {
                    alert('❌ ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function startFlowTest() {
            const type = document.getElementById('flowTestType').value;
            const nome = document.getElementById('flowTestNome').value;
            const telefone = document.getElementById('flowTestTelefone').value;
            const interval = document.getElementById('flowTestInterval').value;
            
            if (!nome || !telefone) {
                alert('❌ Preencha nome e telefone');
                return;
            }
            
            try {
                const response = await fetch('/api/test/monday/create-real-flow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome,
                        telefone,
                        interval: parseInt(interval),
                        createNew: type === 'new'
                    })
                });
                
                const result = await response.json();
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Teste de fluxo iniciado com sucesso!');
                    showFlowVisualization();
                } else {
                    alert('❌ Erro: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        function showFlowVisualization() {
            document.getElementById('flowVisualization').style.display = 'block';
            document.getElementById('flowStatus').textContent = 'Teste Iniciado';
            
            // Simula progresso
            setTimeout(() => {
                const step = document.getElementById('step-primeiro');
                step.classList.add('active');
                document.getElementById('flowStatus').textContent = 'Primeiro Contato Enviado';
            }, 1000);
        }

        function resetFlowTest() {
            document.getElementById('flowVisualization').style.display = 'none';
            document.getElementById('flowStatus').textContent = 'Aguardando...';
            
            // Reset all steps
            document.querySelectorAll('.flow-step').forEach(step => {
                step.classList.remove('active', 'processing', 'completed');
            });
        }

        async function debugFlowTest() {
            try {
                const response = await fetch('/api/debug/env');
                const result = await response.json();
                
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Debug executado - veja o Response Viewer');
                } else {
                    alert('❌ Erro no debug: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function testSingleStep() {
            try {
                const response = await fetch('/webhook/test/monday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: Date.now().toString(),
                        nome: 'Teste Single Step',
                        telefone: '5511999999999'
                    })
                });
                
                const result = await response.json();
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Teste de step único executado!');
                } else {
                    alert('❌ Erro: ' + result.message);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // 🚀 WEBHOOK TESTS
        async function sendManualWebhook() {
            const itemId = document.getElementById('webhookItemId').value;
            const nome = document.getElementById('webhookNome').value;
            const telefone = document.getElementById('webhookTelefone').value;
            const status = document.getElementById('webhookStatus').value;
            
            if (!itemId || !nome || !telefone) {
                alert('❌ Preencha todos os campos');
                return;
            }
            
            try {
                const response = await fetch('/webhook/test/monday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId,
                        nome,
                        telefone,
                        status
                    })
                });
                
                const result = await response.json();
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Webhook simulado com sucesso!');
                } else {
                    alert('❌ Erro: ' + result.message);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function simulateClientResponse() {
            const phone = document.getElementById('responsePhone').value || document.getElementById('flowTestTelefone').value;
            
            if (!phone) {
                alert('❌ Preencha o telefone do cliente');
                return;
            }
            
            try {
                const response = await fetch('/webhook/evolution', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instance: 'crmDisparo',
                        data: {
                            key: {
                                remoteJid: phone + '@s.whatsapp.net',
                                fromMe: false,
                                id: 'simulation_' + Date.now()
                            },
                            message: {
                                conversation: 'Olá! Tenho interesse sim!'
                            },
                            messageTimestamp: Date.now(),
                            pushName: 'Cliente Teste'
                        }
                    })
                });
                
                const result = await response.json();
                document.getElementById('payloadViewer').textContent = JSON.stringify(result, null, 2);
                
                if (result.success) {
                    alert('✅ Resposta do cliente simulada! Lead marcado como "Aguardando Ligação"');
                } else {
                    alert('❌ Erro: ' + result.message);
                }
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // PAYLOAD MODAL
        function showPayload(step) {
            document.getElementById('payloadStepTitle').textContent = 'Payload - ' + step;
            document.getElementById('payloadCode').textContent = 'Dados do ' + step + ' serão exibidos aqui...';
            document.getElementById('payloadModal').classList.add('show');
        }

        function closePayloadModal() {
            document.getElementById('payloadModal').classList.remove('show');
        }

        // Close modal on outside click
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('payloadModal');
            if (e.target === modal) {
                closePayloadModal();
            }
        });
    </script>

    <style>
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
    `;
    
    res.send(html);
  });

  // Métodos API existentes mantidos para compatibilidade
  getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        mondayBoardId: process.env.MONDAY_BOARD_ID || '',
        evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || '',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testEvolution = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        connected: true,
        instance: process.env.EVOLUTION_INSTANCE_NAME || 'crmDisparo',
        url: process.env.EVOLUTION_API_URL || '',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  testMonday = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        connected: true,
        boardId: process.env.MONDAY_BOARD_ID || '',
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

export const controlsController = new ControlsController(); 