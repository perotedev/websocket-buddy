/**
 * Página de Test Automation
 * Importa e executa cenários de teste automatizados
 */
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Square, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { parseTestScenario, exportTestScenario } from '@/lib/testAutomation';
import { TestScenario, TestScenarioResult } from '@/lib/testAutomation/types';
import { TestRunner, TestRunnerCallbacks } from '@/lib/testAutomation/TestRunner';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';

const TestAutomation = () => {
  const [scenarioJson, setScenarioJson] = useState('');
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestScenarioResult | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const testRunnerRef = useRef<TestRunner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook do WebSocket para o runner usar
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
    ]);
  }, []);

  const {
    status,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket({ onLog: addLog });

  // Handler para carregar arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setScenarioJson(content);
      handleParseScenario(content);
    };
    reader.readAsText(file);
  };

  // Parse do JSON
  const handleParseScenario = (json: string) => {
    try {
      const scenario = parseTestScenario(json);
      setCurrentScenario(scenario);
      setParseError(null);
    } catch (error) {
      setParseError(String(error));
      setCurrentScenario(null);
    }
  };

  // Executar teste
  const handleRunTest = async () => {
    if (!currentScenario) return;

    setIsRunning(true);
    setTestResult(null);
    setTestLogs([]);
    setLogs([]); // Limpa logs anteriores

    // Cria callbacks para o TestRunner
    const callbacks: TestRunnerCallbacks = {
      connect: async (url: string, type: ConnectionType, token?: string) => {
        await new Promise<void>((resolve) => {
          connect(url, type, token);
          // Aguarda um pouco para conexão estabelecer
          setTimeout(resolve, 1000);
        });
      },
      disconnect: async () => {
        disconnect();
        await new Promise(resolve => setTimeout(resolve, 500));
      },
      subscribe: async (destination: string) => {
        subscribe(destination);
        await new Promise(resolve => setTimeout(resolve, 300));
      },
      unsubscribe: async (topicId: string) => {
        unsubscribe(topicId);
        await new Promise(resolve => setTimeout(resolve, 300));
      },
      sendMessage: async (message: string, destination?: string) => {
        sendMessage(message, destination);
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      getConnectionStatus: () => status,
      getSubscribedTopics: () => subscribedTopics,
      getReceivedMessages: () => logs.map(l => l.data || l.message),
      onLog: (message: string, type?: string) => {
        setTestLogs(prev => [...prev, `[${type || 'INFO'}] ${message}`]);
      }
    };

    // Cria e executa o runner
    const runner = new TestRunner(callbacks);
    testRunnerRef.current = runner;

    try {
      const result = await runner.runScenario(currentScenario);
      setTestResult(result);
    } catch (error) {
      setTestLogs(prev => [...prev, `[ERROR] ${error}`]);
    } finally {
      setIsRunning(false);
      testRunnerRef.current = null;
    }
  };

  // Parar teste
  const handleStopTest = () => {
    if (testRunnerRef.current) {
      testRunnerRef.current.stop();
    }
  };

  // Carregar exemplo
  const loadExample = () => {
    const example: TestScenario = {
      name: "Exemplo: Teste Mock Server",
      description: "Testa o chatbot do mock server",
      version: "1.0.0",
      config: {
        stopOnError: true,
        logLevel: "normal"
      },
      actions: [
        {
          type: "connect",
          url: "mock://chatbot",
          connectionType: "websocket",
          description: "Conecta ao mock chatbot"
        },
        {
          type: "wait",
          duration: 1000,
          description: "Aguarda conexão estabelecer"
        },
        {
          type: "assert",
          assertionType: "status_is",
          expected: "connected",
          description: "Verifica se conectou"
        },
        {
          type: "send",
          message: "Olá",
          description: "Envia saudação"
        },
        {
          type: "wait",
          duration: 1500,
          description: "Aguarda resposta"
        },
        {
          type: "assert",
          assertionType: "message_received",
          description: "Verifica se recebeu resposta"
        },
        {
          type: "disconnect",
          description: "Desconecta"
        }
      ]
    };

    const json = exportTestScenario(example);
    setScenarioJson(json);
    handleParseScenario(json);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Test Automation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Importe e execute cenários de teste automatizados
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna Esquerda - Editor */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cenário de Teste (JSON)</CardTitle>
                  <CardDescription>
                    Cole ou carregue um arquivo JSON de cenário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Botões de Ação */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadExample}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Carregar Exemplo
                    </Button>
                    <a
                      href="/TEST_SCENARIOS.md"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentação
                      </Button>
                    </a>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Editor de JSON */}
                  <Textarea
                    value={scenarioJson}
                    onChange={(e) => {
                      setScenarioJson(e.target.value);
                      handleParseScenario(e.target.value);
                    }}
                    placeholder='{\n  "name": "Meu Teste",\n  "actions": [\n    ...\n  ]\n}'
                    className="font-mono text-xs min-h-[400px]"
                  />

                  {/* Erro de Parse */}
                  {parseError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {parseError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Info do Cenário */}
                  {currentScenario && !parseError && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>{currentScenario.name}</strong>
                        {currentScenario.description && (
                          <> - {currentScenario.description}</>
                        )}
                        <br />
                        {currentScenario.actions.length} ações definidas
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Botões de Execução */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRunTest}
                      disabled={!currentScenario || isRunning}
                      className="flex-1"
                    >
                      {isRunning ? (
                        <>
                          <Square className="h-4 w-4 mr-2 animate-pulse" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Executar Teste
                        </>
                      )}
                    </Button>
                    {isRunning && (
                      <Button
                        onClick={handleStopTest}
                        variant="destructive"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Parar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Resultado */}
            <div className="space-y-4">
              {/* Resultado do Teste */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Resultado do Teste</CardTitle>
                      <Badge
                        variant={testResult.status === 'passed' ? 'default' : 'destructive'}
                      >
                        {testResult.status === 'passed' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {testResult.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Total de Ações</p>
                        <p className="font-semibold">{testResult.totalActions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Duração</p>
                        <p className="font-semibold">{testResult.duration}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Passou</p>
                        <p className="font-semibold text-green-600">{testResult.passedActions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Falhou</p>
                        <p className="font-semibold text-red-600">{testResult.failedActions}</p>
                      </div>
                    </div>

                    {testResult.summary && (
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {testResult.summary}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Logs do Teste */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logs de Execução</CardTitle>
                  <CardDescription>
                    {isRunning ? 'Executando...' : `${testLogs.length} logs`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-green-400 font-mono text-xs p-3 rounded h-[400px] overflow-auto">
                    {testLogs.length === 0 ? (
                      <div className="text-muted-foreground">
                        Execute um teste para ver os logs aqui...
                      </div>
                    ) : (
                      testLogs.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAutomation;
