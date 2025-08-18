# 🧪 Teste da Nova Abordagem

## Como Testar a Nova Implementação

### 1. Teste Manual do Webhook

```bash
# Teste com Primeiro Contato
curl -X POST http://localhost:3000/api/webhook/monday-test \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "123456789",
    "nome": "João Silva Teste",
    "telefone": "5511999999999"
  }'
```

**Resultado esperado:**
- ✅ Contato "Primeiro Contato" enviado via WhatsApp
- ✅ Data +24h marcada na coluna "Próximo ctt" do Monday.com
- ✅ Status permanece "Primeiro Contato" (será mudado pelo Monday.com)

### 2. Simulação Completa da Sequência

#### Passo 1: Primeiro Contato
```bash
curl -X POST http://localhost:3000/api/webhook/monday \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "update_column_value",
      "pulseId": 123456789,
      "columnId": "color_mkt8t95b",
      "value": {
        "label": {
          "text": "Primeiro Contato"
        }
      }
    }
  }'
```

#### Passo 2: Simular Automação Monday.com (depois de 24h)
```bash
curl -X POST http://localhost:3000/api/webhook/monday \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "update_column_value", 
      "pulseId": 123456789,
      "columnId": "color_mkt8t95b",
      "value": {
        "label": {
          "text": "Segundo Contato"
        }
      }
    }
  }'
```

### 3. Verificações no Monday.com

Após cada teste, verificar:

1. **Coluna "Próximo ctt"**:
   - ✅ Data foi marcada (+24h do momento atual)
   - ✅ Data está dentro do horário comercial
   - ✅ Data não cai em fim de semana

2. **Logs da Aplicação**:
   ```
   ✅ Contato Primeiro Contato enviado com sucesso
   ✅ Data do próximo contato marcada
   ✅ Monday.com atualizará status via automação
   ```

3. **WhatsApp**:
   - ✅ Mensagem chegou no número correto
   - ✅ Conteúdo está personalizado com nome
   - ✅ Formato está correto

### 4. Configuração das Automações Monday.com

#### Automação 1: Primeiro → Segundo
```
QUANDO: 
- Coluna "Próximo ctt" = Data de hoje
- E Status "Contato SDR Realizado" = "Primeiro Contato"

ENTÃO:
- Mudar "Contato SDR Realizado" para "Segundo Contato"
```

#### Automação 2: Segundo → Terceiro  
```
QUANDO:
- Coluna "Próximo ctt" = Data de hoje
- E Status "Contato SDR Realizado" = "Segundo Contato"

ENTÃO:
- Mudar "Contato SDR Realizado" para "Terceiro Contato"
```

#### Automação 3: Terceiro → Último
```
QUANDO:
- Coluna "Próximo ctt" = Data de hoje
- E Status "Contato SDR Realizado" = "Terceiro Contato"

ENTÃO:
- Mudar "Contato SDR Realizado" para "Ultimo Contato"
```

#### Automação 4: Finalização
```
QUANDO:
- Status "Contato SDR Realizado" = "Ultimo Contato"
- E Coluna "Próximo ctt" está vazia

ENTÃO:
- Mudar "Contato SDR Realizado" para "Não Respondeu"
```

### 5. Teste de Resposta do Cliente

```bash
# Simular resposta do cliente
curl -X POST http://localhost:3000/api/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "default",
    "data": {
      "key": {
        "remoteJid": "5511999999999@c.us",
        "fromMe": false,
        "id": "msg123"
      },
      "message": {
        "conversation": "Oi, tenho interesse sim!"
      }
    }
  }'
```

**Resultado esperado:**
- ✅ Status muda para "Aguardando Ligação"
- ✅ Data "Próximo ctt" é removida
- ✅ Sequência automática para

### 6. Monitoramento e Logs

Acompanhar logs em tempo real:
```bash
# Em produção
curl http://localhost:3000/api/dashboard/logs

# Durante desenvolvimento
tail -f logs/app.log
```

### 7. Checklist de Validação

- [ ] Webhook Monday.com funcionando
- [ ] Webhook Evolution funcionando  
- [ ] Contatos sendo enviados
- [ ] Datas sendo marcadas corretamente
- [ ] Automações Monday.com configuradas
- [ ] Sequência completa (4 contatos) funcionando
- [ ] Resposta do cliente para sequência
- [ ] Horário comercial respeitado
- [ ] Fim de semana tratado corretamente

### 8. Casos de Teste

#### Caso 1: Fluxo Normal
1. Primeiro Contato → Data +24h
2. Monday.com automação → Segundo Contato
3. Segundo Contato → Data +24h
4. Monday.com automação → Terceiro Contato  
5. Terceiro Contato → Data +24h
6. Monday.com automação → Último Contato
7. Último Contato → Remove data
8. Status final: "Não Respondeu"

#### Caso 2: Cliente Responde
1. Primeiro Contato enviado
2. Cliente responde no WhatsApp
3. Status muda para "Aguardando Ligação" 
4. Sequência para automaticamente

#### Caso 3: Horário Comercial
1. Contato marcado para 19h → Ajusta para 9h do próximo dia
2. Contato marcado para sábado → Ajusta para segunda 9h
3. Contato marcado para domingo → Ajusta para segunda 9h

---
*Documento criado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}*
