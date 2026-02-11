/**
 * Tipos para Test Automation
 * Sistema de cenários de teste automatizados com import/export
 */

// Tipos de ações disponíveis
export type TestActionType =
  | 'connect'      // Conectar ao servidor
  | 'disconnect'   // Desconectar
  | 'subscribe'    // Inscrever em tópico
  | 'unsubscribe'  // Cancelar inscrição
  | 'send'         // Enviar mensagem
  | 'wait'         // Aguardar tempo
  | 'assert'       // Validar algo
  | 'log';         // Log customizado

// Tipos de assertions
export type AssertionType =
  | 'message_received'      // Verificar se mensagem foi recebida
  | 'message_contains'      // Verificar se mensagem contém texto
  | 'message_matches'       // Verificar se mensagem combina com regex
  | 'status_is'             // Verificar status da conexão
  | 'topic_subscribed'      // Verificar se inscrito em tópico
  | 'message_count'         // Verificar quantidade de mensagens
  | 'json_valid'            // Verificar se última mensagem é JSON válido
  | 'json_path';            // Verificar valor em JSON path

// Status do teste
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

// Configuração de uma ação
export interface TestAction {
  type: TestActionType;
  description?: string;

  // Parâmetros específicos por tipo
  url?: string;                    // Para connect
  connectionType?: 'websocket' | 'stomp';  // Para connect
  token?: string;                  // Para connect
  destination?: string;            // Para subscribe/unsubscribe/send
  message?: string;                // Para send
  headers?: Record<string, string>; // Para send/connect
  duration?: number;               // Para wait (ms)

  // Para assertions
  assertionType?: AssertionType;
  expected?: any;
  timeout?: number;                // Timeout para assertion (ms)

  // Controle de fluxo
  continueOnError?: boolean;       // Continuar mesmo se falhar
  skipIf?: string;                 // Condição para pular ação
}

// Resultado de execução de uma ação
export interface TestActionResult {
  action: TestAction;
  status: TestStatus;
  message: string;
  timestamp: Date;
  duration: number;  // tempo de execução em ms
  error?: string;
  data?: any;        // dados capturados durante execução
}

// Cenário de teste completo
export interface TestScenario {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];

  // Configurações globais
  config?: {
    timeout?: number;              // Timeout padrão para ações (ms)
    stopOnError?: boolean;         // Parar ao encontrar erro
    retryOnError?: number;         // Quantas vezes tentar novamente
    logLevel?: 'verbose' | 'normal' | 'quiet';
    manualValidation?: boolean;    // Pausar antes das validações e aguardar confirmação manual
  };

  // Variáveis que podem ser usadas nas ações
  variables?: Record<string, string>;

  // Sequência de ações
  actions: TestAction[];
}

// Resultado de execução do cenário
export interface TestScenarioResult {
  scenario: TestScenario;
  status: TestStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalActions: number;
  passedActions: number;
  failedActions: number;
  skippedActions: number;
  actionResults: TestActionResult[];
  summary?: string;
}

// Coleção de cenários
export interface TestCollection {
  name: string;
  description?: string;
  version?: string;
  scenarios: TestScenario[];
}

// Contexto de execução do teste
export interface TestExecutionContext {
  variables: Map<string, any>;
  messagesReceived: string[];
  lastMessage?: string;
  connectionStatus?: string;
  subscribedTopics: string[];
  startTime: Date;
}
