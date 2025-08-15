# 🤖 CRM Control - Sistema Automatizado de Contatos SDR

Sistema completo de automação de contatos SDR integrado com Monday.com e Evolution API (WhatsApp), com dashboard em tempo real e logs detalhados.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## ✨ Funcionalidades

### 🚀 **Core Features**
- ✅ **Webhooks Automáticos**: Monday.com e Evolution API
- ✅ **Agendamento Inteligente**: +24h em horário comercial (9h-18h)
- ✅ **4 Tipos de Contato**: Primeiro → Segundo → Terceiro → Último
- ✅ **Dashboard em Tempo Real**: Monitoramento completo
- ✅ **Logs Detalhados**: Auditoria completa com timezone Brasília
- ✅ **Base de Dados Local**: SQLite para controle offline

### 📊 **Dashboard Features**
- ✅ **Relógio Brasília**: Tempo real no header
- ✅ **Status APIs**: Monday.com e Evolution em tempo real
- ✅ **Visualização Monday.com**: Tabela sincronizada
- ✅ **Clientes Ativos**: Lista local com filtros
- ✅ **Últimas Ações**: Logs detalhados com timezone
- ✅ **Auto-refresh**: Intervalos otimizados

### 🔧 **Produção Ready**
- ✅ **Vercel Deploy**: Configuração completa
- ✅ **Cron Jobs**: Automação de tarefas
- ✅ **Error Handling**: Tratamento robusto
- ✅ **Security**: Helmet + CSP + CORS
- ✅ **Health Checks**: Monitoramento contínuo

## 🚀 Deploy Rápido

### **1. Clone e Instale**
```bash
git clone https://github.com/volticscontent/crmControl.git
cd crmControl
npm install
```

### **2. Configure Variáveis de Ambiente**
```env
# Ambiente
NODE_ENV=production
TZ=America/Sao_Paulo

# Monday.com API
MONDAY_API_TOKEN=seu_token_monday_aqui
MONDAY_BOARD_ID=id_do_board_aqui

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_chave_api_aqui
EVOLUTION_INSTANCE_NAME=nome_instancia_aqui
```

### **3. Deploy no Vercel**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis no dashboard Vercel
```

### **4. Configure Webhooks**
- **Monday.com**: `https://seudominio.com/webhook/monday`
- **Evolution API**: `https://seudominio.com/webhook/evolution`

## 📱 Endpoints

### **Dashboard e Monitoramento**
- `GET /dashboard` - Dashboard principal com relógio
- `GET /monitor` - Alias do dashboard
- `GET /health` - Health check básico
- `GET /api/production-ready` - Verificação completa

### **APIs de Dados**
- `GET /api/status` - Status das APIs
- `GET /api/clients` - Clientes ativos
- `GET /api/monday/data` - Dados Monday.com
- `GET /api/logs` - Logs do sistema

### **Webhooks**
- `POST /webhook/monday` - Recebe mudanças Monday.com
- `POST /webhook/evolution` - Recebe mensagens WhatsApp

### **Cron Jobs (Vercel)**
- `/api/cron/process-contacts` - Processa contatos (1h)
- `/api/cron/health-check` - Health check (10min)

## ⚙️ Configuração Monday.com

### **Board Structure**
| Coluna | ID | Tipo | Descrição |
|--------|----|----- |-----------|
| Nome | `name` | Text | Nome do lead |
| Telefone | `phone_mkt8s8kn` | Phone | WhatsApp |
| Contato SDR | `color_mkt8t95b` | Status | Etapa atual |
| Próximo Contato | `date_mkt8ccx4` | Date | Data agendada |

### **Status Possíveis**
- `Primeiro Contato` → `Segundo Contato`
- `Segundo Contato` → `Terceiro Contato`
- `Terceiro Contato` → `Ultimo Contato`
- `Ultimo Contato` → `Não Respondeu`
- `Aguardando Ligação` (cliente respondeu)

## 🕐 Sistema de Tempo

### **Horário Comercial**
- **Segunda a Sexta**: 9h às 18h (Brasília)
- **Fim de semana**: Agenda para segunda-feira 9h
- **Fora do horário**: Próximo dia útil 9h

### **Relógio Dashboard**
- **Localização**: Header principal
- **Formato**: HH:MM:SS (24h)
- **Timezone**: America/Sao_Paulo
- **Atualização**: 1 segundo

### **Logs com Timezone**
- **Horário exato**: Brasília
- **Tempo relativo**: "5min atrás"
- **Servidor info**: Timezone interpretado

## 📊 Dashboard Features

### **🕐 Relógio em Tempo Real**
```
🤖 Dashboard CRM Automatizado    🕐 Brasília: 14:30:25
```

### **📈 Auto-refresh**
- **Logs**: 30s
- **Clientes**: 15s  
- **Monday.com**: 1h
- **Status APIs**: 2min

### **🔧 Status dos Serviços**
- Monday.com API: Status em tempo real
- Evolution API: Conectividade
- Database SQLite: Local
- Scheduler: Cron jobs

## 🔍 Monitoramento

### **Health Checks**
```bash
# Básico
curl https://seudominio.com/health

# Prontidão para produção
curl https://seudominio.com/api/production-ready

# Status das APIs
curl https://seudominio.com/api/status
```

### **Dashboard Web**
- **URL**: `https://seudominio.com/dashboard`
- **Funcionalidades**: Tempo real, filtros, logs
- **Mobile**: Responsivo

## 📁 Estrutura do Projeto

```
src/
├── controllers/          # Controladores das rotas
│   ├── dashboardController.ts    # Dashboard com relógio
│   └── webhookController.ts      # Webhooks Monday/Evolution
├── services/             # Lógica de negócio
│   ├── leadService.ts            # Gestão de leads + tempo
│   ├── mondayService.ts          # API Monday.com
│   └── evolutionService.ts       # API Evolution
├── database/             # SQLite
│   └── connection.ts             # Conexão e schemas
├── utils/                # Utilitários
│   └── logger.ts                 # Logs com timezone
├── config/               # Configurações
│   └── constants.ts              # Constantes e horários
└── index.ts              # Servidor principal
```

## 🛡️ Segurança

### **Headers de Segurança**
```javascript
// Helmet.js configurado
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"]
  }
}
```

### **Tratamento de Erros**
- **Uncaught Exceptions**: Logged e restart
- **Unhandled Rejections**: Logged e restart
- **API Errors**: Sanitizados em produção
- **Database Errors**: Retry automático

## 🚀 Performance

### **Vercel Optimizations**
- **Região**: Brasil (gru1)
- **Timeout**: 30s para funções pesadas
- **Caching**: Headers otimizados
- **Cron Jobs**: Background automático

### **Database**
- **SQLite**: Leve e rápido
- **Índices**: Otimizados para queries
- **Path**: `/tmp/crm.db` (produção)

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Hot reload
npm run start:prod       # Produção local

# Verificações
npm run production-check # Prontidão
npm run health-check     # Health básico

# Code quality
npm run lint             # ESLint
npm run format           # Prettier
```

## 🔧 Troubleshooting

### **Problemas Comuns**

1. **APIs não conectam**
   ```bash
   # Verificar variáveis
   curl /api/production-ready
   
   # Testar conexões
   curl /api/test/monday
   curl /api/test/evolution
   ```

2. **Webhook não funciona**
   ```bash
   # Testar endpoint
   curl -X POST /webhook/monday -d '{"test":true}'
   ```

3. **Relógio não atualiza**
   - Verificar JavaScript habilitado
   - Console do navegador para erros
   - Timezone do sistema

### **Logs de Debug**
```bash
# Vercel logs
vercel logs --follow

# Local logs
tail -f logs/app.log
```

## 📄 License

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/volticscontent/crmControl/issues)
- **Documentação**: Este README
- **Dashboard**: `/dashboard` para monitoramento

---

🤖 **CRM Control** - Automação inteligente para SDRs com monitoramento em tempo real.