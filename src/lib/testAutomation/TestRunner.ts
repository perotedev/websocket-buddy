/**
 * Test Runner - Executa cenários de teste automatizados
 */
import {
  TestScenario,
  TestAction,
  TestActionResult,
  TestScenarioResult,
  TestStatus,
  TestExecutionContext,
  AssertionType
} from './types';
import { replaceVariables } from './parser';
import { ConnectionType } from '@/hooks/useWebSocket';

// Callbacks para interagir com o WebSocket
export interface TestRunnerCallbacks {
  connect: (url: string, type: ConnectionType, token?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (destination: string) => Promise<void>;
  unsubscribe: (topicId: string) => Promise<void>;
  sendMessage: (message: string, destination?: string) => Promise<void>;
  getConnectionStatus: () => string;
  getSubscribedTopics: () => Array<{ id: string; destination: string }>;
  getReceivedMessages: () => string[];
  onLog: (message: string, type?: string) => void;
}

export class TestRunner {
  private callbacks: TestRunnerCallbacks;
  private context: TestExecutionContext;
  private isRunning: boolean = false;
  private shouldStop: boolean = false;

  constructor(callbacks: TestRunnerCallbacks) {
    this.callbacks = callbacks;
    this.context = this.createContext();
  }

  /**
   * Cria um novo contexto de execução
   */
  private createContext(): TestExecutionContext {
    return {
      variables: new Map(),
      messagesReceived: [],
      subscribedTopics: [],
      startTime: new Date()
    };
  }

  /**
   * Executa um cenário de teste completo
   */
  async runScenario(scenario: TestScenario): Promise<TestScenarioResult> {
    if (this.isRunning) {
      throw new Error('Já existe um teste em execução');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.context = this.createContext();

    const startTime = new Date();
    const actionResults: TestActionResult[] = [];

    // Carrega variáveis do cenário
    if (scenario.variables) {
      Object.entries(scenario.variables).forEach(([key, value]) => {
        this.context.variables.set(key, value);
      });
    }

    this.callbacks.onLog(`🚀 Iniciando cenário: ${scenario.name}`, 'INFO');

    let overallStatus: TestStatus = 'passed';

    // Executa cada ação
    for (let i = 0; i < scenario.actions.length; i++) {
      if (this.shouldStop) {
        this.callbacks.onLog('⏹️ Execução interrompida pelo usuário', 'INFO');
        overallStatus = 'skipped';
        break;
      }

      const action = scenario.actions[i];
      const actionNumber = i + 1;

      this.callbacks.onLog(
        `\n📋 Ação ${actionNumber}/${scenario.actions.length}: ${action.type}`,
        'INFO'
      );

      if (action.description) {
        this.callbacks.onLog(`   ${action.description}`, 'INFO');
      }

      const result = await this.executeAction(action, scenario.config);
      actionResults.push(result);

      // Verifica resultado
      if (result.status === 'failed') {
        overallStatus = 'failed';
        this.callbacks.onLog(`❌ Ação falhou: ${result.message}`, 'ERROR');

        // Loga detalhes de esperado vs recebido
        if (result.data) {
          if (result.data.expected !== undefined) {
            this.callbacks.onLog(`   ➤ Esperado: ${JSON.stringify(result.data.expected)}`, 'ERROR');
          }
          if (result.data.actual !== undefined) {
            this.callbacks.onLog(`   ➤ Recebido: ${JSON.stringify(result.data.actual)}`, 'ERROR');
          }
          if (result.data.lastMessages !== undefined) {
            this.callbacks.onLog(`   ➤ Mensagens do servidor: ${JSON.stringify(result.data.lastMessages)}`, 'ERROR');
          }
        }

        // Para se configurado para parar em erro
        if (scenario.config?.stopOnError && !action.continueOnError) {
          this.callbacks.onLog('⏹️ Parando execução devido a erro', 'ERROR');
          break;
        }
      } else if (result.status === 'passed') {
        this.callbacks.onLog(`✅ ${result.message}`, 'INFO');
      } else if (result.status === 'skipped') {
        this.callbacks.onLog(`⏭️ Ação pulada`, 'INFO');
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const passedActions = actionResults.filter((r) => r.status === 'passed').length;
    const failedActions = actionResults.filter((r) => r.status === 'failed').length;
    const skippedActions = actionResults.filter((r) => r.status === 'skipped').length;

    const result: TestScenarioResult = {
      scenario,
      status: overallStatus,
      startTime,
      endTime,
      duration,
      totalActions: scenario.actions.length,
      passedActions,
      failedActions,
      skippedActions,
      actionResults,
      summary: this.generateSummary(scenario, passedActions, failedActions, skippedActions, duration)
    };

    this.callbacks.onLog(`\n${result.summary}`, overallStatus === 'passed' ? 'INFO' : 'ERROR');
    this.isRunning = false;

    return result;
  }

  /**
   * Para a execução do teste
   */
  stop(): void {
    this.shouldStop = true;
  }

  /**
   * Executa uma ação individual
   */
  private async executeAction(
    action: TestAction,
    config?: TestScenario['config']
  ): Promise<TestActionResult> {
    const startTime = Date.now();

    try {
      switch (action.type) {
        case 'connect':
          return await this.executeConnect(action, startTime);

        case 'disconnect':
          return await this.executeDisconnect(action, startTime);

        case 'subscribe':
          return await this.executeSubscribe(action, startTime);

        case 'unsubscribe':
          return await this.executeUnsubscribe(action, startTime);

        case 'send':
          return await this.executeSend(action, startTime);

        case 'wait':
          return await this.executeWait(action, startTime);

        case 'assert':
          return await this.executeAssert(action, startTime);

        case 'log':
          return this.executeLog(action, startTime);

        default:
          throw new Error(`Tipo de ação desconhecido: ${action.type}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        action,
        status: 'failed',
        message: `Erro ao executar ação: ${error}`,
        timestamp: new Date(),
        duration,
        error: String(error)
      };
    }
  }

  private async executeConnect(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.url) {
      throw new Error('URL é obrigatório para connect');
    }

    const url = this.replaceVars(action.url);
    const type = action.connectionType || 'websocket';
    const token = action.token ? this.replaceVars(action.token) : undefined;

    await this.callbacks.connect(url, type, token);

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Conectado a ${url} (${type})`,
      timestamp: new Date(),
      duration
    };
  }

  private async executeDisconnect(action: TestAction, startTime: number): Promise<TestActionResult> {
    await this.callbacks.disconnect();

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: 'Desconectado',
      timestamp: new Date(),
      duration
    };
  }

  private async executeSubscribe(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.destination) {
      throw new Error('Destination é obrigatório para subscribe');
    }

    const destination = this.replaceVars(action.destination);
    await this.callbacks.subscribe(destination);

    this.context.subscribedTopics.push(destination);

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Inscrito em ${destination}`,
      timestamp: new Date(),
      duration
    };
  }

  private async executeUnsubscribe(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.destination) {
      throw new Error('Destination é obrigatório para unsubscribe');
    }

    const destination = this.replaceVars(action.destination);
    const topics = this.callbacks.getSubscribedTopics();
    const topic = topics.find((t) => t.destination === destination);

    if (topic) {
      await this.callbacks.unsubscribe(topic.id);
    }

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Inscrição cancelada: ${destination}`,
      timestamp: new Date(),
      duration
    };
  }

  private async executeSend(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.message) {
      throw new Error('Message é obrigatório para send');
    }

    const message = this.replaceVars(action.message);
    const destination = action.destination ? this.replaceVars(action.destination) : undefined;

    await this.callbacks.sendMessage(message, destination);

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Mensagem enviada${destination ? ` para ${destination}` : ''}`,
      timestamp: new Date(),
      duration,
      data: { message, destination }
    };
  }

  private async executeWait(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.duration) {
      throw new Error('Duration é obrigatório para wait');
    }

    await new Promise((resolve) => setTimeout(resolve, action.duration));

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Aguardou ${action.duration}ms`,
      timestamp: new Date(),
      duration
    };
  }

  private async executeAssert(action: TestAction, startTime: number): Promise<TestActionResult> {
    if (!action.assertionType) {
      throw new Error('AssertionType é obrigatório para assert');
    }

    const result = this.evaluateAssertion(action.assertionType, action.expected);

    const duration = Date.now() - startTime;
    return {
      action,
      status: result.passed ? 'passed' : 'failed',
      message: result.message,
      timestamp: new Date(),
      duration,
      data: result.data
    };
  }

  private executeLog(action: TestAction, startTime: number): TestActionResult {
    if (!action.message) {
      throw new Error('Message é obrigatório para log');
    }

    const message = this.replaceVars(action.message);
    this.callbacks.onLog(`📝 ${message}`, 'INFO');

    const duration = Date.now() - startTime;
    return {
      action,
      status: 'passed',
      message: `Log: ${message}`,
      timestamp: new Date(),
      duration
    };
  }

  /**
   * Avalia uma assertion
   */
  private evaluateAssertion(
    type: AssertionType,
    expected: any
  ): { passed: boolean; message: string; data?: any } {
    const messages = this.callbacks.getReceivedMessages();
    const status = this.callbacks.getConnectionStatus();
    const topics = this.callbacks.getSubscribedTopics();

    switch (type) {
      case 'status_is':
        return {
          passed: status === expected,
          message: `Status ${status === expected ? 'correto' : 'incorreto'}: esperado "${expected}", obtido "${status}"`,
          data: { expected, actual: status }
        };

      case 'message_received':
        return {
          passed: messages.length > 0,
          message: messages.length > 0 ? `${messages.length} mensagem(ns) recebida(s)` : 'Nenhuma mensagem recebida',
          data: {
            expected: 'ao menos 1 mensagem',
            actual: `${messages.length} mensagem(ns)`,
            ...(messages.length > 0 ? { lastMessages: messages.slice(-3) } : {})
          }
        };

      case 'message_count':
        const count = messages.length;
        return {
          passed: count === expected,
          message: `${count === expected ? 'Quantidade correta' : 'Quantidade incorreta'}: esperado ${expected}, obtido ${count}`,
          data: { expected, actual: count }
        };

      case 'message_contains':
        // Verifica se alguma mensagem contém o texto esperado
        // Normaliza conteúdo para lidar com JSON escapado e formatação STOMP
        const matchedMsg = messages.find(msg => this.messageContains(msg, expected));
        const lastMsgForDisplay = messages[messages.length - 1];
        return {
          passed: !!matchedMsg,
          message: matchedMsg
            ? `Mensagem contém "${expected}"`
            : `Nenhuma mensagem contém "${expected}"`,
          data: {
            expected,
            actual: matchedMsg || lastMsgForDisplay || '(nenhuma mensagem recebida)',
            lastMessages: messages.slice(-3)
          }
        };

      case 'json_valid':
        const msg = messages[messages.length - 1];
        try {
          JSON.parse(msg || '');
          return {
            passed: true,
            message: 'JSON válido',
            data: { actual: msg }
          };
        } catch {
          return {
            passed: false,
            message: 'JSON inválido',
            data: {
              expected: 'JSON válido',
              actual: msg || '(nenhuma mensagem recebida)'
            }
          };
        }

      default:
        return {
          passed: false,
          message: `Tipo de assertion não implementado: ${type}`
        };
    }
  }

  /**
   * Verifica se uma mensagem contém o texto esperado,
   * normalizando JSON escapado e conteúdo formatado (ex: STOMP com Headers/Body)
   */
  private messageContains(message: string, expected: string): boolean {
    if (!message) return false;

    // 1. Verificação direta
    if (message.includes(expected)) return true;

    // 2. Tenta extrair o body de mensagens STOMP formatadas (Headers:\n...\n\nBody:\n...)
    const bodyMatch = message.match(/Body:\n([\s\S]*)/);
    if (bodyMatch) {
      const body = bodyMatch[1].trim();
      if (body.includes(expected)) return true;
      // Tenta parsear o body como JSON
      try {
        const parsed = JSON.parse(body);
        const flat = JSON.stringify(parsed);
        if (flat.includes(expected)) return true;
      } catch { /* ignora */ }
    }

    // 3. Tenta parsear a mensagem inteira como JSON (lida com double-encoding)
    try {
      const parsed = JSON.parse(message);
      const normalized = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      if (normalized.includes(expected)) return true;
      // Se o parsed for string, tenta parsear de novo (triple-encoding)
      if (typeof parsed === 'string') {
        try {
          const inner = JSON.parse(parsed);
          if (JSON.stringify(inner).includes(expected)) return true;
        } catch { /* ignora */ }
      }
    } catch { /* ignora */ }

    // 4. Normaliza removendo escapes comuns e verifica
    const unescaped = message
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    if (unescaped.includes(expected)) return true;

    return false;
  }

  /**
   * Substitui variáveis em uma string
   */
  private replaceVars(text: string): string {
    const vars: Record<string, string> = {};
    this.context.variables.forEach((value, key) => {
      vars[key] = String(value);
    });
    return replaceVariables(text, vars);
  }

  /**
   * Gera resumo do teste
   */
  private generateSummary(
    scenario: TestScenario,
    passed: number,
    failed: number,
    skipped: number,
    duration: number
  ): string {
    const total = passed + failed + skipped;
    const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${status}: ${scenario.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ações Executadas: ${total}
  ✅ Passou: ${passed}
  ❌ Falhou: ${failed}
  ⏭️  Pulou: ${skipped}
Duração: ${duration}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}
