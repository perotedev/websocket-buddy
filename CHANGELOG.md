# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Planejado

- Exportação de logs em diferentes formatos (JSON, CSV, TXT)
- Salvamento de conexões favoritas
- Templates de mensagens personalizáveis
- Suporte para binário (ArrayBuffer, Blob)
- Histórico de mensagens enviadas/recebidas
- Filtros e busca no console de eventos
- Estatísticas de conexão (latência, mensagens/s)
- Modo offline com mock de servidor
- Internacionalização (i18n)

## [1.0.0] - 2026-01-27

### Adicionado

- Suporte para conexões WebSocket puras
- Suporte para protocolo STOMP sobre WebSocket
- Autenticação via Bearer token
- Headers customizados para requisições STOMP
- Timeout de conexão configurável (30 segundos)
- Reconexão automática com limite de 3 tentativas
- Cancelamento de tentativas de conexão
- Inscrição em múltiplos tópicos simultaneamente
- Envio de mensagens com headers customizados
- Console de eventos em tempo real
- Tipos de log diferenciados (INFO, MESSAGE, ERROR, SENT, SUBSCRIBE, UNSUBSCRIBE)
- Timestamps em todos os eventos
- Visualização detalhada de headers e payloads
- Tema claro e escuro
- Interface responsiva para mobile e desktop
- Navegação por tabs em dispositivos móveis

### Componentes

- ConnectionPanel: gerenciamento de conexões
- SubscriptionPanel: gerenciamento de inscrições
- MessagePanel: envio de mensagens
- EventConsole: visualização de logs
- ActionPanel: painel integrado de ações
- ThemeToggle: alternador de temas

### Hooks

- useWebSocket: gerenciamento completo de conexões WebSocket e STOMP
- useTheme: gerenciamento de temas claro/escuro

### Documentação

- README.md completo com instruções de uso
- CONTRIBUTING.md com guia de contribuição
- CODE_OF_CONDUCT.md com código de conduta
- Templates de Issues (Bug Report e Feature Request)
- Template de Pull Request
- Licença MIT

### Tecnologias

- React 18 com TypeScript
- Vite como build tool
- Tailwind CSS para estilização
- shadcn/ui e Radix UI para componentes
- STOMP.js para protocolo STOMP
- React Router para roteamento
- TanStack Query para gerenciamento de estado
- Vitest para testes

---

## Tipos de Mudanças

- `Added` - para novas funcionalidades
- `Changed` - para mudanças em funcionalidades existentes
- `Deprecated` - para funcionalidades que serão removidas
- `Removed` - para funcionalidades removidas
- `Fixed` - para correções de bugs
- `Security` - para vulnerabilidades corrigidas

[Unreleased]: https://github.com/perotedev/websocket-buddy/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/perotedev/websocket-buddy/releases/tag/v1.0.0
