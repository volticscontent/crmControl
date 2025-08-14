# 🤖 API CRM Automatizado

Sistema automatizado de contatos SDR integrado com Monday.com e Evolution API (WhatsApp).

## 📋 Funcionalidades

- ✅ **Webhooks**: Monday.com e Evolution API
- ✅ **Agendamento**: Contatos automáticos +24h em horário comercial
- ✅ **4 Tipos de Contato**: Primeiro, Segundo, Terceiro, Último
- ✅ **Monitoramento**: Dashboard web em tempo real
- ✅ **Logs**: Sistema completo de auditoria
- ✅ **Base de Dados**: SQLite para controle local
- ✅ **Assets**: Textos e áudios personalizados

## 🚀 Deploy Rápido

### 1. Clone e Instale
```bash
git clone <repo>
cd apiCrm
npm install
```

### 2. Configure Variáveis de Ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 3. Execute
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente Obrigatórias

```env
# Monday.com API
MONDAY_API_TOKEN=your_monday_api_token_here
MONDAY_BOARD_ID=your_board_id_here

# Evolution API (WhatsApp)  
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_API_KEY=your_evolution_api_key_here
EVOLUTION_INSTANCE_NAME=your_instance_name_here
```

### Estrutura Monday.com

O sistema espera estas colunas no seu board:
- **Nome**: Nome do lead
- **Telefone**: Número WhatsApp (campo phone)
- **Contato SDR Realizado**: Status dos contatos (ID: `color_mkt8t95b`)
- **Próximo ctt**: Data do próximo contato (ID: `date_mkt8ccx4`)

## 📱 Endpoints

### Webhooks
- `POST /webhook/monday` - Recebe mudanças do Monday.com
- `POST /webhook/evolution` - Recebe mensagens do WhatsApp

### Monitoramento
- `GET /monitor` - Dashboard web
- `GET /api/stats` - Estatísticas JSON
- `POST /api/manual-dispatch` - Disparo manual

### Assets
- `GET /assets/:filename` - Serve arquivos de texto/áudio

## 📁 Estrutura de Arquivos

```
assets/
├── primeiro-contato.txt    # Texto primeiro contato
├── primeiro-contato.mp3    # Áudio primeiro contato (opcional)
├── segundo-contato.txt     # Texto segundo contato
├── terceiro-contato.txt    # Texto terceiro contato
└── ultimo-contato.txt      # Texto último contato
```

### Personalização de Mensagens

Use `{nome}` nos arquivos .txt para personalizar:
```txt
Oi {nome}! 👋

Tudo bem? Aqui é da equipe...
```

## ⏰ Funcionamento

### Fluxo Automático
1. **Monday webhook** → Mudança status "Contato SDR Realizado"
2. **Sistema processa** → Lê arquivo de texto correspondente
3. **Envia mensagem** → WhatsApp via Evolution API
4. **Agenda próximo** → +24h em horário comercial
5. **Repete** → Até "Último Contato" ou resposta do cliente

### Horário Comercial
- **Segunda a Sexta**: 9h às 18h (Brasília)
- **Fins de semana**: Agenda para segunda-feira
- **Fora do horário**: Agenda para próximo dia útil

### Interrupção Automática
- **Cliente responde** → Status vira "Aguardando Ligação"
- **Sequência para** → Remove agendamentos futuros

## 🖥️ Dashboard

Acesse `/monitor` para ver:
- 📊 Estatísticas de leads
- 📋 Status dos contatos  
- 🔗 Status dos serviços
- ⚡ Ações manuais
- 📝 Logs do sistema

## 🔍 Monitoramento

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:3000/webhook/health  
curl http://localhost:3000/api/health
```

### Logs
- **Arquivo**: `logs/app.log`, `logs/error.log`, `logs/crm-actions.log`
- **Retenção**: 7 dias
- **API**: `GET /api/logs`

## 🛠️ Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção  
npm run start        # Executa build de produção
npm run lint         # Executa linter
npm run format       # Formata código
```

### Estrutura do Projeto
```
src/
├── controllers/     # Controladores das rotas
├── services/       # Lógica de negócio
├── routes/         # Definição de rotas
├── database/       # Conexão e queries do banco
├── middleware/     # Middlewares Express
├── types/          # Definições TypeScript
├── config/         # Constantes e configurações
└── utils/          # Utilitários gerais
```

## 🚀 Deploy Vercel

1. **Connect ao GitHub**
2. **Configure Environment Variables** (mesmo do .env)
3. **Deploy automático** ✅

O `vercel.json` já está configurado.

## 🔒 Segurança

- ✅ Headers de segurança (Helmet)
- ✅ Validação de webhooks
- ✅ Sanitização de inputs
- ✅ Rate limiting implícito
- ✅ Logs de auditoria

## 📞 Suporte

Para dúvidas:
1. Verifique logs: `/monitor` ou `logs/`
2. Health check: `/health`
3. Stats: `/api/stats`

## 📄 Licença

ISC License
