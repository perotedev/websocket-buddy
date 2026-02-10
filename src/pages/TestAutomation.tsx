/**
 * Página de Test Automation
 * Importa e executa cenários de teste automatizados
 * Usa a conexão ativa do contexto global (WebSocketContext)
 */
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, Play, Square, FileText, AlertCircle, CheckCircle2, XCircle, Wrench, Code, Wifi, WifiOff } from 'lucide-react';
import { parseTestScenario, exportTestScenario } from '@/lib/testAutomation';
import { TestScenario, TestScenarioResult } from '@/lib/testAutomation/types';
import { TestRunner, TestRunnerCallbacks } from '@/lib/testAutomation/TestRunner';
import { ConnectionType } from '@/hooks/useWebSocket';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { TestScenarioBuilder } from '@/components/testAutomation/TestScenarioBuilder';

const TestAutomation = () => {
  const [scenarioJson, setScenarioJson] = useState('');
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestScenarioResult | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<TestScenario | null>(null);

  const testRunnerRef = useRef<TestRunner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Usa a conexão global do contexto
  const {
    status,
    connectionType,
    subscribedTopics,
    logs,
    connect,
    disconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage,
  } = useWebSocketContext();

  // Auto-scroll dos logs de teste
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testLogs]);

  // Quando conectar após abrir o dialog, inicia o teste pendente
  useEffect(() => {
    if (status === 'connected' && pendingScenario && !isRunning) {
      setConnectionDialogOpen(false);
      // Aguarda um pouco para a conexão estabilizar antes de iniciar o teste
      setTimeout(() => {
        executeTest(pendingScenario);
        setPendingScenario(null);
      }, 500);
    }
  }, [status, pendingScenario, isRunning]);

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

  // Executa o teste diretamente (quando já conectado)
  const executeTest = async (scenario: TestScenario) => {
    setIsRunning(true);
    setTestResult(null);
    setTestLogs([]);

    // Cria callbacks para o TestRunner usando a conexão do contexto
    const callbacks: TestRunnerCallbacks = {
      connect: async (url: string, type: ConnectionType, token?: string) => {
        // Usa a conexão existente do contexto - não cria nova
        if (status !== 'connected') {
          connect(url, type, token);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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
      const result = await runner.runScenario(scenario);
      setTestResult(result);
    } catch (error) {
      setTestLogs(prev => [...prev, `[ERROR] ${error}`]);
    } finally {
      setIsRunning(false);
      testRunnerRef.current = null;
    }
  };

  // Handler principal para executar teste (verifica conexão)
  const handleRunTest = async () => {
    if (!currentScenario) return;

    if (status !== 'connected') {
      // Sem conexão ativa - abre dialog para conectar
      setPendingScenario(currentScenario);
      setConnectionDialogOpen(true);
      return;
    }

    executeTest(currentScenario);
  };

  // Parar teste
  const handleStopTest = () => {
    if (testRunnerRef.current) {
      testRunnerRef.current.stop();
    }
  };

  // Handler para executar teste do builder
  const handleRunTestFromBuilder = (scenario: TestScenario) => {
    setCurrentScenario(scenario);
    const json = exportTestScenario(scenario);
    setScenarioJson(json);

    if (status !== 'connected') {
      // Sem conexão ativa - abre dialog
      setPendingScenario(scenario);
      setConnectionDialogOpen(true);
      return;
    }

    setTimeout(() => executeTest(scenario), 100);
  };

  // Carregar exemplo
  const loadExample = () => {
    const example: TestScenario = {
      name: "Exemplo: Teste de envio e resposta",
      description: "Envia uma mensagem e verifica se recebeu resposta",
      version: "1.0.0",
      config: {
        stopOnError: true,
        logLevel: "normal"
      },
      actions: [
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
        }
      ]
    };

    const json = exportTestScenario(example);
    setScenarioJson(json);
    handleParseScenario(json);
  };

  const isConnected = status === 'connected';

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Test Automation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crie testes visualmente ou importe cenários JSON
              </p>
            </div>
            {/* Indicador de conexão */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="gap-1 text-[10px]">
                  <Wifi className="h-3 w-3" />
                  {connectionType === 'stomp' ? 'STOMP' : 'WebSocket'}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                  <WifiOff className="h-3 w-3" />
                  Sem conexão
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna Esquerda - Builder / Editor */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cenário de Teste</CardTitle>
                  <CardDescription>
                    Crie visualmente ou edite o JSON do teste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="builder" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="builder" className="text-xs">
                        <Wrench className="h-3 w-3 mr-2" />
                        Builder Visual
                      </TabsTrigger>
                      <TabsTrigger value="json" className="text-xs">
                        <Code className="h-3 w-3 mr-2" />
                        Editor JSON
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab: Builder Visual */}
                    <TabsContent value="builder" className="space-y-3 mt-0">
                      <TestScenarioBuilder onRunTest={handleRunTestFromBuilder} />
                    </TabsContent>

                    {/* Tab: Editor JSON */}
                    <TabsContent value="json" className="space-y-3 mt-0">
                      <div className="space-y-3">
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
                      </div>
                    </TabsContent>
                  </Tabs>
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
                  <div className="bg-zinc-950 dark:bg-zinc-900 text-green-400 dark:text-green-300 font-mono text-xs p-3 rounded h-[400px] overflow-auto border dark:border-zinc-700">
                    {testLogs.length === 0 ? (
                      <div className="text-zinc-500 dark:text-zinc-600">
                        Execute um teste para ver os logs aqui...
                      </div>
                    ) : (
                      testLogs.map((log, index) => (
                        <div
                          key={index}
                          className={`mb-1 ${
                            log.includes('[ERROR]')
                              ? 'text-red-400 dark:text-red-300'
                              : log.includes('[INFO]')
                              ? 'text-green-400 dark:text-green-300'
                              : 'text-zinc-300 dark:text-zinc-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Conexão - aparece quando tenta executar teste sem conexão */}
      <Dialog
        open={connectionDialogOpen}
        onOpenChange={(open) => {
          setConnectionDialogOpen(open);
          if (!open) {
            setPendingScenario(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase">Conexão Necessária</DialogTitle>
            <DialogDescription className="text-xs">
              Estabeleça uma conexão antes de executar os testes. O teste iniciará automaticamente após a conexão.
            </DialogDescription>
          </DialogHeader>
          <ConnectionPanel
            status={status}
            onConnect={connect}
            onDisconnect={disconnect}
            onCancelConnection={cancelConnection}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestAutomation;
