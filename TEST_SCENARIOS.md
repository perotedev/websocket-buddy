# Test Scenarios - Documentação

Este documento descreve como criar cenários de teste automatizados para o WebSocket Buddy usando arquivos JSON.

## 📋 Índice

- [Estrutura Básica](#estrutura-básica)
- [Tipos de Ações](#tipos-de-ações)
- [Assertions](#assertions)
- [Variáveis](#variáveis)
- [Exemplos Completos](#exemplos-completos)

---

## Estrutura Básica

Um cenário de teste é um arquivo JSON com a seguinte estrutura:

```json
{
  "name": "Nome do Cenário",
  "description": "Descrição opcional do que o teste faz",
  "version": "1.0.0",
  "author": "Seu Nome",
  "tags": ["tag1", "tag2"],

  "config": {
    "timeout": 5000,
    "stopOnError": true,
    "retryOnError": 0,
    "logLevel": "normal"
  },

  "variables": {
    "SERVER_URL": "wss://seu-servidor.com/ws",
    "AUTH_TOKEN": "seu_token_aqui"
  },

  "actions": [
    // Array de ações a serem executadas
  ]
}
```

### Campos Principais

- **name** (obrigatório): Nome do cenário
- **description** (opcional): Descrição do teste
- **config** (opcional): Configurações do teste
  - `timeout`: Timeout padrão para ações em ms
  - `stopOnError`: Parar ao encontrar erro (default: true)
  - `retryOnError`: Número de tentativas em caso de erro
  - `logLevel`: "verbose", "normal" ou "quiet"
- **variables** (opcional): Variáveis que podem ser usadas nas ações com `${NOME_VARIAVEL}`
- **actions** (obrigatório): Array de ações a executar

---

## Tipos de Ações

### 1. Connect - Conectar ao Servidor

Conecta ao servidor WebSocket/STOMP.

```json
{
  "type": "connect",
  "description": "Conectar ao servidor de produção",
  "url": "${SERVER_URL}",
  "connectionType": "stomp",
  "token": "${AUTH_TOKEN}",
  "headers": {
    "Custom-Header": "valor"
  }
}
```

**Campos:**
- `url` (obrigatório): URL do servidor
- `connectionType` (opcional): "websocket" ou "stomp" (default: "websocket")
- `token` (opcional): Token de autenticação
- `headers` (opcional): Headers customizados para STOMP

### 2. Disconnect - Desconectar

Desconecta do servidor.

```json
{
  "type": "disconnect",
  "description": "Desconectar do servidor"
}
```

### 3. Subscribe - Inscrever em Tópico

Inscreve em um tópico/canal (STOMP).

```json
{
  "type": "subscribe",
  "description": "Inscrever no tópico de notificações",
  "destination": "/topic/notifications"
}
```

**Campos:**
- `destination` (obrigatório): Destino do tópico

### 4. Unsubscribe - Cancelar Inscrição

Cancela inscrição em um tópico.

```json
{
  "type": "unsubscribe",
  "description": "Cancelar inscrição do tópico",
  "destination": "/topic/notifications"
}
```

**Campos:**
- `destination` (obrigatório): Destino do tópico

### 5. Send - Enviar Mensagem

Envia uma mensagem.

```json
{
  "type": "send",
  "description": "Enviar mensagem de teste",
  "message": "{\"type\":\"greeting\",\"text\":\"Hello\"}",
  "destination": "/app/chat",
  "headers": {
    "priority": "high"
  }
}
```

**Campos:**
- `message` (obrigatório): Conteúdo da mensagem
- `destination` (opcional): Destino (obrigatório para STOMP)
- `headers` (opcional): Headers adicionais

### 6. Wait - Aguardar

Aguarda um tempo antes de continuar.

```json
{
  "type": "wait",
  "description": "Aguardar resposta do servidor",
  "duration": 2000
}
```

**Campos:**
- `duration` (obrigatório): Tempo em milissegundos

### 7. Assert - Validar

Valida uma condição.

```json
{
  "type": "assert",
  "description": "Verificar se recebeu mensagem",
  "assertionType": "message_received",
  "timeout": 5000
}
```

**Campos:**
- `assertionType` (obrigatório): Tipo de validação (veja [Assertions](#assertions))
- `expected` (opcional): Valor esperado
- `timeout` (opcional): Timeout para a validação

### 8. Log - Log Customizado

Adiciona um log customizado ao console.

```json
{
  "type": "log",
  "description": "Log de checkpoint",
  "message": "Chegou no checkpoint 1"
}
```

**Campos:**
- `message` (obrigatório): Mensagem do log

---

## Assertions

Tipos de validação disponíveis:

### message_received

Verifica se pelo menos uma mensagem foi recebida.

```json
{
  "type": "assert",
  "assertionType": "message_received"
}
```

### message_contains

Verifica se a última mensagem contém um texto.

```json
{
  "type": "assert",
  "assertionType": "message_contains",
  "expected": "success"
}
```

### message_count

Verifica a quantidade de mensagens recebidas.

```json
{
  "type": "assert",
  "assertionType": "message_count",
  "expected": 3
}
```

### status_is

Verifica o status da conexão.

```json
{
  "type": "assert",
  "assertionType": "status_is",
  "expected": "connected"
}
```

Valores possíveis: "connected", "disconnected", "connecting", "error"

### json_valid

Verifica se a última mensagem é um JSON válido.

```json
{
  "type": "assert",
  "assertionType": "json_valid"
}
```

---

## Variáveis

Use variáveis para reutilizar valores e facilitar manutenção:

```json
{
  "variables": {
    "BASE_URL": "wss://api.example.com",
    "TOPIC": "/topic/updates",
    "USER_ID": "12345"
  },

  "actions": [
    {
      "type": "connect",
      "url": "${BASE_URL}/ws"
    },
    {
      "type": "subscribe",
      "destination": "${TOPIC}"
    },
    {
      "type": "send",
      "message": "{\"userId\":\"${USER_ID}\"}",
      "destination": "/app/register"
    }
  ]
}
```

---

## Exemplos Completos

### Exemplo 1: Teste Básico de Echo

```json
{
  "name": "Echo Server Test",
  "description": "Testa servidor echo básico",
  "version": "1.0.0",

  "actions": [
    {
      "type": "connect",
      "url": "wss://echo.websocket.org",
      "connectionType": "websocket"
    },
    {
      "type": "wait",
      "duration": 1000
    },
    {
      "type": "assert",
      "assertionType": "status_is",
      "expected": "connected"
    },
    {
      "type": "send",
      "message": "Hello Echo!"
    },
    {
      "type": "wait",
      "duration": 2000
    },
    {
      "type": "assert",
      "assertionType": "message_received"
    },
    {
      "type": "disconnect"
    }
  ]
}
```

### Exemplo 2: Teste STOMP Completo

```json
{
  "name": "STOMP Chat Test",
  "description": "Testa chat com STOMP",
  "version": "1.0.0",

  "variables": {
    "SERVER": "wss://chat-server.com/ws",
    "TOKEN": "Bearer abc123xyz",
    "CHAT_ROOM": "/topic/room/general"
  },

  "config": {
    "stopOnError": true,
    "logLevel": "verbose"
  },

  "actions": [
    {
      "type": "log",
      "message": "Iniciando teste de chat"
    },
    {
      "type": "connect",
      "url": "${SERVER}",
      "connectionType": "stomp",
      "token": "${TOKEN}"
    },
    {
      "type": "wait",
      "duration": 1000
    },
    {
      "type": "assert",
      "assertionType": "status_is",
      "expected": "connected"
    },
    {
      "type": "subscribe",
      "destination": "${CHAT_ROOM}"
    },
    {
      "type": "wait",
      "duration": 500
    },
    {
      "type": "send",
      "message": "{\"user\":\"TestBot\",\"text\":\"Hello!\"}",
      "destination": "/app/chat/send"
    },
    {
      "type": "wait",
      "duration": 2000
    },
    {
      "type": "assert",
      "assertionType": "message_received"
    },
    {
      "type": "log",
      "message": "Mensagem recebida com sucesso"
    },
    {
      "type": "unsubscribe",
      "destination": "${CHAT_ROOM}"
    },
    {
      "type": "disconnect"
    },
    {
      "type": "log",
      "message": "Teste concluído com sucesso"
    }
  ]
}
```

### Exemplo 3: Teste de Mock Server

```json
{
  "name": "Mock Server Test",
  "description": "Testa funcionalidades do Mock Server",
  "version": "1.0.0",

  "actions": [
    {
      "type": "connect",
      "url": "mock://chatbot",
      "connectionType": "websocket"
    },
    {
      "type": "wait",
      "duration": 500
    },
    {
      "type": "send",
      "message": "Olá"
    },
    {
      "type": "wait",
      "duration": 1000
    },
    {
      "type": "assert",
      "assertionType": "message_contains",
      "expected": "bot"
    },
    {
      "type": "send",
      "message": "Que horas são?"
    },
    {
      "type": "wait",
      "duration": 1000
    },
    {
      "type": "assert",
      "assertionType": "message_count",
      "expected": 2
    },
    {
      "type": "disconnect"
    }
  ]
}
```

### Exemplo 4: Teste com Múltiplas Validações

```json
{
  "name": "Validation Test",
  "description": "Testa múltiplas validações",
  "version": "1.0.0",

  "actions": [
    {
      "type": "connect",
      "url": "mock://stream",
      "connectionType": "websocket"
    },
    {
      "type": "wait",
      "duration": 3000
    },
    {
      "type": "assert",
      "assertionType": "message_received",
      "description": "Deve ter recebido mensagens do stream"
    },
    {
      "type": "assert",
      "assertionType": "json_valid",
      "description": "Mensagens devem ser JSON válido"
    },
    {
      "type": "assert",
      "assertionType": "message_contains",
      "expected": "stream",
      "description": "Mensagem deve conter 'stream'"
    },
    {
      "type": "disconnect"
    }
  ]
}
```

---

## 🚀 Como Usar

### No WebSocket Buddy

1. Crie um arquivo JSON seguindo este formato
2. Na aba "Test Automation", clique em "Importar Cenário"
3. Selecione seu arquivo JSON
4. Clique em "Executar Teste"
5. Acompanhe a execução no console

### Exportar Cenário

1. Execute ações manualmente no WebSocket Buddy
2. Clique em "Exportar como Cenário de Teste"
3. Edite o JSON gerado conforme necessário
4. Salve e reutilize

---

## 💡 Dicas

1. **Use variáveis** para URLs, tokens e valores que mudam entre ambientes
2. **Adicione waits** após enviar mensagens para dar tempo do servidor responder
3. **Use assertions** para validar que tudo funcionou como esperado
4. **Adicione descriptions** para facilitar entender o que cada ação faz
5. **Configure stopOnError: false** se quiser que o teste continue mesmo com falhas
6. **Use logs** para marcar checkpoints importantes no teste

---

## 📝 Schema JSON

Para validação em editores, você pode usar este schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name", "actions"],
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "version": { "type": "string" },
    "author": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "variables": { "type": "object" },
    "actions": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "object", "required": ["type"] }
    }
  }
}
```

---

**WebSocket Buddy** - Teste suas conexões WebSocket com facilidade!
