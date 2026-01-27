# Guia de Contribuição

Obrigado por considerar contribuir com o WebSocket Buddy! Este documento fornece diretrizes para contribuir com o projeto.

## Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT.md).

## Como Posso Contribuir?

### Reportando Bugs

Antes de criar um bug report, verifique se o bug já não foi reportado. Se encontrar uma issue similar, adicione um comentário com informações adicionais ao invés de criar uma nova issue.

**Como submeter um bom bug report:**

- Use um título claro e descritivo
- Descreva os passos exatos para reproduzir o problema
- Forneça exemplos específicos
- Descreva o comportamento observado e o comportamento esperado
- Inclua screenshots se possível
- Inclua informações sobre seu ambiente (SO, navegador, versão)
- Use o template de bug report fornecido

### Sugerindo Melhorias

Sugestões de melhorias são sempre bem-vindas! Antes de criar uma sugestão:

- Verifique se a feature já não foi sugerida
- Verifique se a feature não está no roadmap
- Forneça uma descrição clara e detalhada da feature
- Explique por que essa feature seria útil para a maioria dos usuários
- Use o template de feature request fornecido

### Pull Requests

#### Processo de Desenvolvimento

1. **Fork o repositório** e crie sua branch a partir da `main`
2. **Configure o ambiente** de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```
3. **Faça suas alterações** seguindo as diretrizes de código
4. **Adicione testes** se aplicável
5. **Execute os testes** e linting:
   ```bash
   npm test
   npm run lint
   ```
6. **Commit suas mudanças** seguindo o padrão de commits
7. **Push** para sua branch e **abra um Pull Request**

#### Diretrizes de Código

**Estilo de Código:**

- Use TypeScript para todo código novo
- Siga as configurações do ESLint do projeto
- Use 2 espaços para indentação
- Adicione ponto e vírgula no final das declarações
- Use aspas simples para strings
- Mantenha linhas com no máximo 120 caracteres

**Nomenclatura:**

- Use camelCase para variáveis e funções
- Use PascalCase para componentes React e interfaces
- Use UPPER_CASE para constantes
- Use nomes descritivos e significativos

**Componentes React:**

```typescript
// Bom
interface ConnectionPanelProps {
  status: ConnectionStatus;
  onConnect: (url: string) => void;
}

export function ConnectionPanel({ status, onConnect }: ConnectionPanelProps) {
  // ...
}

// Evite
export function CP(props: any) {
  // ...
}
```

**Hooks:**

- Sempre comece hooks customizados com "use"
- Documente parâmetros e retornos complexos
- Use TypeScript para tipar parâmetros e retornos

**Comentários:**

```typescript
// Bom - explica o "por quê"
// Limita tentativas de reconexão para evitar sobrecarga do servidor
if (reconnectAttempts >= 3) {
  return;
}

// Evite - explica o "o quê" (código auto-explicativo)
// Incrementa o contador
count++;
```

#### Padrão de Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

**Tipos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor`: Refatoração de código
- `perf`: Melhoria de performance
- `test`: Adição ou correção de testes
- `build`: Mudanças no build ou dependências
- `ci`: Mudanças em arquivos de CI
- `chore`: Outras mudanças que não modificam src ou testes

**Exemplos:**

```bash
feat(websocket): adiciona suporte para reconexão automática
fix(ui): corrige overflow no console de eventos
docs(readme): atualiza instruções de instalação
refactor(hooks): simplifica lógica de conexão
test(websocket): adiciona testes para timeout de conexão
```

#### Testes

- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes alta
- Use nomes descritivos para testes
- Teste casos extremos e de erro

```typescript
describe("useWebSocket", () => {
  it("should connect to WebSocket server", async () => {
    // Arrange
    const { result } = renderHook(() => useWebSocket({ onLog: jest.fn() }));

    // Act
    act(() => {
      result.current.connect("ws://localhost:8080", "websocket");
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });
  });
});
```

#### Revisão de Código

Seu PR será revisado por mantenedores. Durante a revisão:

- Seja receptivo ao feedback
- Responda a comentários de forma construtiva
- Faça as alterações solicitadas prontamente
- Mantenha discussões focadas e profissionais

**O que revisores verificam:**

- Funcionalidade: o código faz o que deveria?
- Testes: há testes adequados?
- Estilo: segue as convenções do projeto?
- Performance: há problemas de performance?
- Segurança: há vulnerabilidades?
- Documentação: mudanças estão documentadas?

## Estrutura do Projeto

```
websocket-buddy/
├── .github/              # Templates de issues e PRs
├── public/               # Arquivos estáticos
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes UI base (shadcn)
│   │   └── ...          # Componentes específicos
│   ├── hooks/           # Hooks customizados
│   ├── lib/             # Utilitários
│   ├── pages/           # Páginas da aplicação
│   ├── test/            # Configuração e testes
│   ├── App.tsx          # Componente raiz
│   └── main.tsx         # Ponto de entrada
├── README.md            # Documentação principal
├── CONTRIBUTING.md      # Este arquivo
└── package.json         # Dependências e scripts
```

## Ambiente de Desenvolvimento

### Requisitos

- Node.js 18+
- npm ou yarn
- Editor de código (recomendamos VS Code)

### Extensões Recomendadas (VS Code)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build           # Build de produção
npm run build:dev       # Build de desenvolvimento
npm run preview         # Preview da build

# Qualidade de código
npm run lint            # Executa ESLint
npm test                # Executa testes
npm run test:watch      # Executa testes em modo watch

# Dependências
npm install             # Instala dependências
npm update              # Atualiza dependências
```

## Dúvidas?

- Abra uma [Discussion](https://github.com/perotedev/websocket-buddy/discussions) para perguntas gerais
- Abra uma [Issue](https://github.com/perotedev/websocket-buddy/issues) para bugs ou feature requests
- Consulte a [documentação](README.md) para informações sobre o projeto

## Reconhecimento

Contribuidores serão reconhecidos no README e no histórico de commits. Obrigado por tornar o WebSocket Buddy melhor!
