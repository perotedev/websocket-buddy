# Test Scenarios - Documentação

Este documento descreve como criar cenários de teste automatizados no WebSocket Buddy usando arquivos JSON. Os cenários são executados na página "Test Automation" e usam a conexão ativa do app.

## Índice

- [Estrutura Básica](#estrutura-básica)
- [Campos e Configuração](#campos-e-configuração)
- [Ações Suportadas](#ações-suportadas)
- [Assertions](#assertions)
- [Variáveis](#variáveis)
- [Limitações e Comportamento Atual](#limitações-e-comportamento-atual)
- [Exemplos Completos](#exemplos-completos)
- [Como Usar](#como-usar)
- [Schema JSON (Simplificado)](#schema-json-simplificado)

---

## Estrutura Básica

Um cenário de teste é um arquivo JSON. JSON não aceita comentários.

```json
{
  "name": "Nome do Cenário",
  "description": "Descrição opcional do que o teste faz",
  "version": "1.0.0",
  "author": "Seu Nome",
  "tags": ["smoke", "stomp"],

  "config": {
    "stopOnError": true,
    "timeout": 5000,
    "retryOnError": 0,
    "logLevel": "normal"
  },

  "variables": {
    "SERVER_URL": "wss://seu-servidor.com/ws",
    "AUTH_TOKEN": "seu_token_aqui"
  },

  "actions": [
    { "type": "connect", "url": "${SERVER_URL}", "connectionType": "stomp", "token": "${AUTH_TOKEN}" },
    { "type": "subscribe", "destination": "/topic/updates" },
    { "type": "send", "destination": "/app/ping", "message": "{\"type\":\"ping\"}" },
    { "type": "wait", "duration": 1000 },
    { "type": "assert", "assertionType": "message_received" },
    { "type": "disconnect" }
  ]
}
```

---

## Campos e Configuração

- `name` (obrigatório): nome do cenário.
- `description` (opcional): descrição do teste.
- `version` (opcional): versão do cenário.
- `author` (opcional): autor do cenário.
- `tags` (opcional): tags para organização.
- `config` (opcional): configurações globais.
- `variables` (opcional): variáveis para uso em ações.
- `actions` (obrigatório): lista de ações em ordem de execução.

Configurações disponíveis:

- `stopOnError`: se `true`, interrompe na primeira falha.
- `timeout`, `retryOnError`, `logLevel`: aceitos no JSON, mas não alteram a execução atualmente.

---

## Ações Suportadas

### connect

Conecta ao servidor ou a um mock.

```json
{ "type": "connect", "url": "${SERVER_URL}", "connectionType": "stomp", "token": "${AUTH_TOKEN}" }
```

- `url` (obrigatório): URL do servidor.
- `connectionType` (opcional): "websocket" ou "stomp" (default "websocket").
- `token` (opcional): usado em conexões STOMP.

Mocks disponíveis: `mock://echo`, `mock://chatbot`, `mock://stream`, `mock://stress`, `mock://notification`.

Observação: os testes usam a conexão ativa do app. Se já estiver conectado, a ação `connect` não troca a conexão.

### disconnect

Desconecta do servidor.

```json
{ "type": "disconnect" }
```

### subscribe

Inscreve em um tópico/canal (STOMP). Em WebSocket puro, a inscrição é apenas organizacional.

```json
{ "type": "subscribe", "destination": "/topic/notifications" }
```

- `destination` (obrigatório): destino do tópico.

### unsubscribe

Cancela inscrição em um tópico.

```json
{ "type": "unsubscribe", "destination": "/topic/notifications" }
```

- `destination` (obrigatório): destino do tópico.

### send

Envia uma mensagem.

```json
{ "type": "send", "message": "{\"type\":\"greeting\",\"text\":\"Hello\"}", "destination": "/app/chat" }
```

- `message` (obrigatório): conteúdo da mensagem.
- `destination` (opcional): obrigatório para STOMP, opcional para WebSocket.

### wait

Aguarda um tempo antes de continuar.

```json
{ "type": "wait", "duration": 2000 }
```

- `duration` (obrigatório): tempo em milissegundos.

### assert

Valida uma condição.

```json
{ "type": "assert", "assertionType": "message_contains", "expected": "success" }
```

- `assertionType` (obrigatório): tipo de validação.
- `expected` (opcional): valor esperado, depende do tipo de validação.
- `timeout` (opcional): aceito no JSON, mas não é aplicado atualmente.

### log

Adiciona uma mensagem ao log de execução.

```json
{ "type": "log", "message": "Checkpoint 1 alcançado" }
```

- `message` (obrigatório): mensagem do log.

Campos adicionais por ação:

- `continueOnError` (opcional): quando `true`, a execução continua mesmo se a ação falhar (desde que `config.stopOnError` seja `true`).
- `skipIf` (opcional): aceito no JSON, mas não é aplicado atualmente.

---

## Assertions

Tipos de validação disponíveis:

### status_is

Verifica o status da conexão.

```json
{ "type": "assert", "assertionType": "status_is", "expected": "connected" }
```

Valores esperados: "connected", "connecting", "disconnected", "error".

### message_received

Verifica se pelo menos uma mensagem foi recebida.

```json
{ "type": "assert", "assertionType": "message_received" }
```

### message_count

Verifica a quantidade de mensagens recebidas.

```json
{ "type": "assert", "assertionType": "message_count", "expected": 3 }
```

`expected` deve ser número.

### message_contains

Verifica se alguma mensagem contém o texto esperado. O verificador tenta normalizar JSON e mensagens STOMP com `Headers/Body`.

```json
{ "type": "assert", "assertionType": "message_contains", "expected": "success" }
```

### json_valid

Verifica se a última mensagem é um JSON válido.

```json
{ "type": "assert", "assertionType": "json_valid" }
```

Observação: em mensagens STOMP o log inclui headers e body, então essa validação geralmente falha. Funciona melhor em WebSocket puro ou Mock.

Tipos presentes nos tipos mas não implementados hoje: `message_matches`, `topic_subscribed`, `json_path`.

---

## Variáveis

Use `${NOME}` para substituir valores. Atualmente as substituições são feitas em:

- `url`, `token`, `destination`, `message` e `log.message`.

Substituições não são aplicadas em `expected`, `config` ou outros campos.

Exemplo:

```json
{
  "variables": {
    "BASE_URL": "wss://api.example.com",
    "TOPIC": "/topic/updates",
    "USER_ID": "12345"
  },
  "actions": [
    { "type": "connect", "url": "${BASE_URL}/ws" },
    { "type": "subscribe", "destination": "${TOPIC}" },
    { "type": "send", "destination": "/app/register", "message": "{\"userId\":\"${USER_ID}\"}" }
  ]
}
```

---

## Limitações e Comportamento Atual

- A execução usa a conexão global do app. Se não houver conexão, o sistema solicita conexão antes de rodar o teste.
- `connect` não troca a conexão se já estiver conectado.
- `headers` em ações `connect` e `send` são aceitos no JSON, mas não são aplicados atualmente.
- `timeout`, `retryOnError` e `logLevel` não alteram a execução.
- `skipIf` não é avaliado.
- `message_matches`, `topic_subscribed` e `json_path` ainda não são suportados.
- No Builder Visual, "Aguardar Mensagem" gera uma ação `wait` simples; não há espera ativa por mensagem.

---

## Exemplos Completos

### Exemplo 1: Echo com Mock

```json
{
  "name": "Echo Mock Test",
  "description": "Testa echo usando mock integrado",
  "version": "1.0.0",
  "actions": [
    { "type": "connect", "url": "mock://echo" },
    { "type": "send", "message": "Hello Echo!" },
    { "type": "wait", "duration": 500 },
    { "type": "assert", "assertionType": "message_contains", "expected": "Hello Echo!" },
    { "type": "disconnect" }
  ]
}
```

### Exemplo 2: STOMP Completo

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
  "config": { "stopOnError": true },
  "actions": [
    { "type": "connect", "url": "${SERVER}", "connectionType": "stomp", "token": "${TOKEN}" },
    { "type": "subscribe", "destination": "${CHAT_ROOM}" },
    { "type": "send", "destination": "/app/chat/send", "message": "{\"user\":\"TestBot\",\"text\":\"Hello!\"}" },
    { "type": "wait", "duration": 2000 },
    { "type": "assert", "assertionType": "message_contains", "expected": "Hello!" },
    { "type": "unsubscribe", "destination": "${CHAT_ROOM}" },
    { "type": "disconnect" }
  ]
}
```

### Exemplo 3: Chatbot Mock

```json
{
  "name": "Mock Chatbot Test",
  "description": "Testa respostas do mock chatbot",
  "version": "1.0.0",
  "actions": [
    { "type": "connect", "url": "mock://chatbot" },
    { "type": "send", "message": "Que horas são?" },
    { "type": "wait", "duration": 1000 },
    { "type": "assert", "assertionType": "message_contains", "expected": "mockServer" },
    { "type": "disconnect" }
  ]
}
```

### Exemplo 4: Contagem de Mensagens

```json
{
  "name": "Message Count Test",
  "description": "Valida quantidade de mensagens recebidas",
  "version": "1.0.0",
  "actions": [
    { "type": "connect", "url": "mock://echo" },
    { "type": "send", "message": "msg-1" },
    { "type": "send", "message": "msg-2" },
    { "type": "wait", "duration": 500 },
    { "type": "assert", "assertionType": "message_count", "expected": 2 },
    { "type": "disconnect" }
  ]
}
```

---

## Como Usar

1. Vá para a página "Test Automation".
2. Use o Builder Visual ou o Editor JSON.
3. Importe um JSON ou edite diretamente no editor.
4. Conecte quando solicitado.
5. Execute o teste e acompanhe os logs e o resultado.
6. Após a execução, exporte o resultado em JSON ou HTML se necessário.

---

## Schema JSON (Simplificado)

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
    "config": {
      "type": "object",
      "properties": {
        "timeout": { "type": "number" },
        "stopOnError": { "type": "boolean" },
        "retryOnError": { "type": "number" },
        "logLevel": { "type": "string" }
      }
    },
    "variables": { "type": "object" },
    "actions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "type": "string" },
          "description": { "type": "string" },
          "url": { "type": "string" },
          "connectionType": { "type": "string" },
          "token": { "type": "string" },
          "destination": { "type": "string" },
          "message": { "type": "string" },
          "headers": { "type": "object" },
          "duration": { "type": "number" },
          "assertionType": { "type": "string" },
          "expected": {},
          "timeout": { "type": "number" },
          "continueOnError": { "type": "boolean" },
          "skipIf": { "type": "string" }
        }
      }
    }
  }
}
```

---

WebSocket Buddy - Teste suas conexões WebSocket com facilidade!
