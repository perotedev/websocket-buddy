# Política de Segurança

## Versões Suportadas

Nós fornecemos atualizações de segurança para as seguintes versões do WebSocket Buddy:

| Versão | Suportada          |
| ------ | ------------------ |
| 1.x.x  | :white_check_mark: |
| < 1.0  | :x:                |

## Reportando uma Vulnerabilidade

A segurança do WebSocket Buddy é levada a sério. Se você descobriu uma vulnerabilidade de segurança, agradecemos seus esforços para divulgá-la de forma responsável.

### Como Reportar

**Por favor, NÃO reporte vulnerabilidades de segurança através de issues públicas do GitHub.**

Em vez disso, envie um e-mail para: [seu-email@exemplo.com]

Você deve receber uma resposta dentro de 48 horas. Se por algum motivo você não receber, por favor, acompanhe via e-mail para garantir que recebemos sua mensagem original.

### O que incluir no relatório

Para nos ajudar a entender melhor a natureza e o escopo do possível problema, por favor inclua o máximo de informações possível:

- Tipo de problema (ex: injeção de código, XSS, CSRF, etc.)
- Caminhos completos dos arquivos relacionados ao problema
- Localização do código-fonte afetado (tag/branch/commit ou URL direto)
- Qualquer configuração especial necessária para reproduzir o problema
- Instruções passo a passo para reproduzir o problema
- Prova de conceito ou código de exploit (se possível)
- Impacto do problema, incluindo como um atacante poderia explorar o problema

### Processo de Divulgação

1. **Recebimento**: Confirmamos o recebimento do seu relatório dentro de 48 horas
2. **Avaliação**: Avaliamos a vulnerabilidade e determinamos sua severidade
3. **Correção**: Desenvolvemos e testamos uma correção
4. **Lançamento**: Lançamos a correção e publicamos um aviso de segurança
5. **Crédito**: Creditamos você pela descoberta (se desejar)

### Linha do Tempo

- **Resposta inicial**: 48 horas
- **Avaliação completa**: 7 dias
- **Correção e lançamento**: 30 dias (dependendo da complexidade)

## Boas Práticas de Segurança

### Para Usuários

1. **Sempre use HTTPS/WSS**: Nunca envie dados sensíveis através de conexões não criptografadas
2. **Proteja seus tokens**: Não compartilhe ou exponha tokens de autenticação
3. **Mantenha atualizado**: Use sempre a versão mais recente do WebSocket Buddy
4. **Validação de entrada**: Valide todos os dados antes de enviá-los
5. **Headers customizados**: Tenha cuidado ao adicionar headers customizados que podem expor informações sensíveis

### Para Desenvolvedores

1. **Validação de entrada**: Sempre valide e sanitize entradas do usuário
2. **Escape de output**: Escape adequadamente todos os dados exibidos na UI
3. **Dependências**: Mantenha todas as dependências atualizadas
4. **Revisão de código**: Revise código cuidadosamente antes de fazer merge
5. **Testes de segurança**: Execute testes de segurança regularmente

## Vulnerabilidades Conhecidas

Atualmente não há vulnerabilidades conhecidas. Este arquivo será atualizado se alguma for descoberta.

## Atualizações de Segurança

Atualizações de segurança serão publicadas através de:

- [Releases do GitHub](https://github.com/perotedev/websocket-buddy/releases)
- [Security Advisories](https://github.com/perotedev/websocket-buddy/security/advisories)
- CHANGELOG.md

## Configurações de Segurança Recomendadas

### WebSocket/STOMP

- Use sempre WSS (WebSocket Secure) em produção
- Implemente autenticação adequada no servidor
- Use tokens com tempo de expiração
- Implemente rate limiting no servidor
- Valide origem das conexões (CORS)
- Use certificados SSL/TLS válidos

### Aplicação

- Configure CSP (Content Security Policy) apropriado
- Implemente validação de entrada robusta
- Use HTTPS para servir a aplicação
- Mantenha dependências atualizadas
- Realize auditorias de segurança regulares

## Escopo de Segurança

Este projeto é uma ferramenta de desenvolvimento e teste. Ela foi projetada para:

- ✅ Testar conexões WebSocket em ambientes de desenvolvimento
- ✅ Depurar problemas de comunicação em tempo real
- ✅ Validar implementações de servidores WebSocket/STOMP

Ela **NÃO** foi projetada para:

- ❌ Armazenar dados sensíveis permanentemente
- ❌ Ser usada como proxy de produção
- ❌ Processar dados confidenciais sem criptografia adequada
- ❌ Ser exposta publicamente sem autenticação adicional

## Conformidade

Este projeto segue as melhores práticas de segurança recomendadas por:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP WebSocket Security](https://owasp.org/www-community/vulnerabilities/WebSocket_security)
- [CWE/SANS Top 25](https://www.sans.org/top25-software-errors/)

## Agradecimentos

Agradecemos a todos os pesquisadores de segurança que contribuem para tornar o WebSocket Buddy mais seguro.

### Hall da Fama de Segurança

<!-- Lista de pesquisadores que reportaram vulnerabilidades será adicionada aqui -->

Nenhum relatório até o momento.

---

**Última atualização**: 2026-01-27
