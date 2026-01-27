# WebSocket Buddy

Uma ferramenta web moderna e intuitiva para testar, depurar e monitorar conexões WebSocket e STOMP em tempo real.

## Sobre o Projeto

WebSocket Buddy é uma aplicação web desenvolvida para facilitar o desenvolvimento e teste de aplicações que utilizam WebSocket e protocolo STOMP. Com uma interface limpa e responsiva, permite conectar-se a servidores, inscrever-se em tópicos, enviar mensagens e visualizar eventos em tempo real.

## Características Principais

### Conexões WebSocket

- Suporte para WebSocket puro e STOMP sobre WebSocket
- Autenticação via token (Bearer token automático para STOMP)
- Headers customizados para requisições STOMP
- Timeout de conexão configurável (30 segundos)
- Reconexão automática com limite de tentativas
- Cancelamento de tentativas de conexão

### Gerenciamento de Tópicos

- Inscrição em múltiplos tópicos simultaneamente
- Visualização de tópicos inscritos
- Cancelamento de inscrições individual

### Envio de Mensagens

- Editor JSON com validação automática
- Suporte para headers customizados por mensagem
- Histórico de mensagens enviadas
- Templates rápidos para mensagens comuns

### Console de Eventos

- Monitoramento em tempo real de todas as atividades
- Tipos de log diferenciados (INFO, MESSAGE, ERROR, SENT, SUBSCRIBE, UNSUBSCRIBE)
- Timestamps precisos para cada evento
- Visualização detalhada de headers e payloads
- Limpeza de logs com um clique
- Exportação de logs (planejado)

### Interface

- Design responsivo (mobile e desktop)
- Tema claro e escuro
- Layout otimizado para diferentes tamanhos de tela
- Navegação por tabs em dispositivos móveis

## Tecnologias Utilizadas

Este projeto foi construído com tecnologias modernas e robustas:

- **[React 18](https://react.dev/)** - Biblioteca JavaScript para construção de interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado de JavaScript
- **[Vite](https://vitejs.dev/)** - Build tool moderna e rápida
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI reutilizáveis e acessíveis
- **[Radix UI](https://www.radix-ui.com/)** - Primitivos UI não estilizados
- **[STOMP.js](https://stomp-js.github.io/stomp-websocket/)** - Cliente STOMP para JavaScript
- **[React Router](https://reactrouter.com/)** - Roteamento para React
- **[TanStack Query](https://tanstack.com/query/latest)** - Gerenciamento de estado assíncrono
- **[Vitest](https://vitest.dev/)** - Framework de testes unitários

## Instalação e Uso

### Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/perotedev/websocket-buddy.git
```

2. Navegue até o diretório do projeto:

```bash
cd websocket-buddy
```

3. Instale as dependências:

```bash
npm install
```

### Executando o Projeto

#### Modo de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:8080](http://localhost:8080)

#### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`

#### Preview da Build

```bash
npm run preview
```

### Executando Testes

```bash
# Executar testes uma vez
npm test

# Executar testes em modo watch
npm run test:watch
```

### Linting

```bash
npm run lint
```

## Como Usar

### Conectando a um Servidor

1. **Configure a URL do servidor**
   - Para WebSocket puro: `ws://seu-servidor/websocket` ou `wss://seu-servidor/websocket`
   - Para STOMP: `ws://seu-servidor/ws` ou `wss://seu-servidor/ws`

2. **Configure a autenticação (opcional)**
   - Insira seu token de autorização no campo apropriado
   - Para STOMP, o prefixo "Bearer" é adicionado automaticamente
   - Configure headers customizados se necessário

3. **Selecione o tipo de conexão**
   - **WebSocket**: Conexão WebSocket pura
   - **STOMP**: STOMP sobre WebSocket

4. **Clique em "Conectar"**

### Inscrevendo-se em Tópicos (STOMP)

1. Certifique-se de estar conectado
2. Na aba "Inscrições", insira o destino do tópico (ex: `/topic/messages`)
3. Clique em "Inscrever"
4. As mensagens recebidas aparecerão no console de eventos

### Enviando Mensagens

1. Na aba "Mensagens", escreva seu payload JSON
2. Para STOMP, configure o destino (ex: `/app/chat`)
3. Adicione headers customizados se necessário
4. Clique em "Enviar"

## Como Contribuir

Contribuições são bem-vindas! Se você deseja contribuir com o projeto, siga estas etapas:

### 1. Fork do Repositório

Crie um fork do projeto clicando no botão "Fork" no GitHub.

### 2. Clone o Fork

```bash
git clone https://github.com/perotedev/websocket-buddy.git
cd websocket-buddy
```

### 3. Crie uma Branch

Crie uma branch para sua feature ou correção:

```bash
git checkout -b feature/minha-nova-feature
```

ou

```bash
git checkout -b fix/correcao-de-bug
```

**Convenções de nomenclatura de branches:**

- `feature/` - Para novas funcionalidades
- `fix/` - Para correções de bugs
- `docs/` - Para atualizações de documentação
- `refactor/` - Para refatorações de código
- `test/` - Para adição ou correção de testes

### 4. Faça suas Alterações

- Mantenha o código limpo e bem documentado
- Siga as convenções de código do projeto
- Adicione testes para novas funcionalidades
- Certifique-se de que todos os testes passam

### 5. Commit suas Alterações

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
```

**Convenções de commit (Conventional Commits):**

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, ponto e vírgula faltando, etc
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Atualização de tarefas de build, configurações, etc

### 6. Push para o GitHub

```bash
git push origin feature/minha-nova-feature
```

### 7. Abra um Pull Request

1. Vá até o repositório original no GitHub
2. Clique em "Pull Requests" e depois em "New Pull Request"
3. Selecione sua branch e clique em "Create Pull Request"
4. Preencha o template do PR com:
   - Descrição clara das alterações
   - Referência a issues relacionadas (se houver)
   - Screenshots (se aplicável)
   - Checklist de testes realizados

### Diretrizes de Código

- Use TypeScript para tipagem estática
- Siga os padrões ESLint configurados no projeto
- Mantenha componentes pequenos e reutilizáveis
- Documente funções complexas com comentários JSDoc
- Escreva testes para funcionalidades críticas

### Código de Conduta

- Seja respeitoso e construtivo em discussões
- Aceite feedback de forma profissional
- Foque no código, não nas pessoas
- Mantenha um ambiente acolhedor para todos

## Reportando Issues

Encontrou um bug ou tem uma sugestão? Por favor, abra uma issue!

### Como Reportar um Bug

1. Vá até a [página de Issues](https://github.com/perotedev/websocket-buddy/issues)
2. Clique em "New Issue"
3. Selecione o template "Bug Report"
4. Preencha as informações:

```markdown
**Descrição do Bug**
Uma descrição clara e concisa do bug.

**Como Reproduzir**
Passos para reproduzir o comportamento:

1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
Uma descrição clara do que você esperava que acontecesse.

**Screenshots**
Se aplicável, adicione screenshots para ajudar a explicar o problema.

**Ambiente:**

- SO: [ex: Windows 11, macOS, Linux]
- Navegador: [ex: Chrome 120, Firefox 121]
- Versão: [ex: 1.0.0]

**Contexto Adicional**
Qualquer outra informação sobre o problema.
```

### Como Sugerir uma Feature

1. Vá até a [página de Issues](https://github.com/perotedev/websocket-buddy/issues)
2. Clique em "New Issue"
3. Selecione o template "Feature Request"
4. Descreva a feature desejada:

```markdown
**A feature está relacionada a um problema?**
Uma descrição clara do problema. Ex: Estou sempre frustrado quando [...]

**Descreva a solução que você gostaria**
Uma descrição clara e concisa do que você quer que aconteça.

**Descreva alternativas que você considerou**
Uma descrição clara de soluções ou features alternativas que você considerou.

**Contexto Adicional**
Qualquer outra informação ou screenshots sobre a feature.
```

## Roadmap

Funcionalidades planejadas para futuras versões:

- [ ] Exportação de logs em diferentes formatos (JSON, CSV, TXT)
- [ ] Salvamento de conexões favoritas
- [ ] Templates de mensagens personalizáveis
- [ ] Suporte para binário (ArrayBuffer, Blob)
- [ ] Histórico de mensagens enviadas/recebidas
- [ ] Filtros e busca no console de eventos
- [ ] Estatísticas de conexão (latência, mensagens/s)
- [ ] Modo offline com mock de servidor
- [ ] Internacionalização (i18n)

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Desenvolvido por [@perotedev](https://perotedev.com)

## Agradecimentos

- Comunidade open source por bibliotecas incríveis
- Todos os contribuidores do projeto
- Inspiração em ferramentas similares como Postman e Insomnia

---

**WebSocket Buddy** - Teste e depure suas conexões WebSocket com facilidade.

Se este projeto foi útil para você, considere dar uma ⭐️!
