/**
 * Página de Test Automation
 * Importa e executa cenários de teste automatizados
 * Usa a conexão ativa do contexto global (WebSocketContext)
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { Upload, Play, Square, FileText, AlertCircle, CheckCircle2, XCircle, Wrench, Code, Wifi, WifiOff, Download, Braces } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { EditorView } from '@codemirror/view';
import { parseTestScenario, exportTestScenario } from '@/lib/testAutomation';
import { TestScenario, TestScenarioResult } from '@/lib/testAutomation/types';
import { TestRunner, TestRunnerCallbacks } from '@/lib/testAutomation/TestRunner';
import { ConnectionType } from '@/hooks/useWebSocket';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { TestBuilderState, TestBuilderActionItem, TestBuilderAssertItem } from '@/contexts/WebSocketContext';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { TestScenarioBuilder } from '@/components/testAutomation/TestScenarioBuilder';

// Converte o estado do builder visual para JSON string do TestScenario
function builderStateToJson(state: TestBuilderState): string {
  const testActions = state.actions.map(({ type, params }) => {
    const action: any = { type };
    if (type === 'send') {
      if (params.message) action.message = params.message;
      if (params.destination) action.destination = params.destination;
    } else if (type === 'subscribe' || type === 'unsubscribe') {
      if (params.destination) action.destination = params.destination;
    } else if (type === 'wait') {
      action.duration = params.ms || 1000;
    } else if (type === 'wait-for-message') {
      action.type = 'wait';
      action.duration = params.timeout || 5000;
    }
    return action;
  });

  const testAssertions = state.assertions.map(({ type, params }) => {
    const action: any = { type: 'assert' };
    if (type === 'message-received') action.assertionType = 'message_received';
    else if (type === 'message-contains') {
      action.assertionType = 'message_contains';
      if (params.expected) action.expected = params.expected;
    } else if (type === 'no-errors') {
      action.assertionType = 'status_is';
      action.expected = 'connected';
    } else if (type === 'connection-closed') {
      action.assertionType = 'status_is';
      action.expected = 'disconnected';
    } else if (type === 'latency') {
      action.assertionType = 'message_received';
      action.timeout = params.maxLatency || 1000;
    }
    return action;
  });

  return JSON.stringify({
    name: state.name || 'Cenário sem nome',
    description: state.description || '',
    actions: [...testActions, ...testAssertions],
  }, null, 2);
}

// Converte JSON string do TestScenario para o estado do builder visual
function jsonToBuilderState(jsonStr: string): TestBuilderState | null {
  try {
    const scenario = JSON.parse(jsonStr);
    if (!scenario || !Array.isArray(scenario.actions)) return null;

    const actions: TestBuilderActionItem[] = [];
    const assertions: TestBuilderAssertItem[] = [];

    for (const action of scenario.actions) {
      if (action.type === 'assert') {
        let type: TestBuilderAssertItem['type'] = 'message-received';
        const params: Record<string, string | number | boolean> = {};

        switch (action.assertionType) {
          case 'message_received':
            if (action.timeout) {
              type = 'latency';
              params.maxLatency = action.timeout;
            } else {
              type = 'message-received';
            }
            break;
          case 'message_contains':
            type = 'message-contains';
            if (action.expected) params.expected = String(action.expected);
            break;
          case 'status_is':
            if (action.expected === 'connected') type = 'no-errors';
            else if (action.expected === 'disconnected') type = 'connection-closed';
            break;
        }

        assertions.push({ id: crypto.randomUUID(), type, params });
      } else if (['send', 'subscribe', 'unsubscribe', 'wait'].includes(action.type)) {
        const params: Record<string, string | number | boolean> = {};
        const type: TestBuilderActionItem['type'] = action.type;

        if (action.type === 'send') {
          if (action.message) params.message = String(action.message);
          if (action.destination) params.destination = String(action.destination);
        } else if (action.type === 'subscribe' || action.type === 'unsubscribe') {
          if (action.destination) params.destination = String(action.destination);
        } else if (action.type === 'wait') {
          params.ms = action.duration || 1000;
        }

        actions.push({ id: crypto.randomUUID(), type, params });
      }
    }

    return {
      name: scenario.name || '',
      description: scenario.description || '',
      actions,
      assertions,
    };
  } catch {
    return null;
  }
}

const TestAutomation = () => {
  const [scenarioJson, setScenarioJson] = useState('');
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestScenarioResult | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<TestScenario | null>(null);
  const [editorFormat, setEditorFormat] = useState<'raw' | 'json'>('json');

  const { theme } = useTheme();
  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => { setEditorKey(prev => prev + 1); }, [theme]);

  const darkExtensions = useMemo(() => [
    json(), linter(jsonParseLinter()),
    EditorView.theme({ '&': { backgroundColor: '#000000' }, '.cm-gutters': { backgroundColor: '#1a1a1a', color: '#858585', border: 'none', borderRight: '1px solid #333333' }, '.cm-activeLineGutter': { backgroundColor: '#2a2a2a', color: '#ffffff', fontWeight: 'bold' } }, { dark: true }),
  ], [theme]);

  const lightExtensions = useMemo(() => [
    json(), linter(jsonParseLinter()),
    EditorView.theme({ '.cm-activeLineGutter': { backgroundColor: '#e0e0e0', color: '#000000', fontWeight: 'bold' } }),
  ], [theme]);

  const blackTheme = useMemo(() => createTheme({
    theme: 'dark',
    settings: { background: '#000000', foreground: '#e0e0e0', caret: '#00ff00', selection: '#264f78', selectionMatch: '#264f78', gutterBackground: '#1a1a1a', gutterForeground: '#858585', gutterBorder: '#333333', gutterActiveForeground: '#ffffff' },
    styles: [
      { tag: t.comment, color: '#6a9955' }, { tag: t.variableName, color: '#9cdcfe' },
      { tag: [t.string, t.special(t.brace)], color: '#ce9178' }, { tag: t.number, color: '#b5cea8' },
      { tag: t.bool, color: '#569cd6' }, { tag: t.null, color: '#569cd6' },
      { tag: t.propertyName, color: '#9cdcfe' },
    ],
  }), [theme]);

  const testRunnerRef = useRef<TestRunner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const jsonEditorIsSourceRef = useRef(false);

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
    testBuilderState,
    setTestBuilderState,
  } = useWebSocketContext();

  // Sync: builder visual → JSON editor
  useEffect(() => {
    if (jsonEditorIsSourceRef.current) return;
    if (!testBuilderState.name && testBuilderState.actions.length === 0 && testBuilderState.assertions.length === 0) return;
    const jsonStr = builderStateToJson(testBuilderState);
    setScenarioJson(jsonStr);
    handleParseScenario(jsonStr);
  }, [testBuilderState]);

  // Handler unificado para mudanças no JSON (editor, import, exemplo)
  const handleJsonContentChange = useCallback((value: string) => {
    jsonEditorIsSourceRef.current = true;
    setScenarioJson(value);
    handleParseScenario(value);
    const state = jsonToBuilderState(value);
    if (state) {
      setTestBuilderState(state);
    }
    setTimeout(() => { jsonEditorIsSourceRef.current = false; }, 0);
  }, [setTestBuilderState]);

  // Auto-scroll dos logs de teste (apenas durante execução)
  useEffect(() => {
    if (isRunning && testLogs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [testLogs, isRunning]);

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
      handleJsonContentChange(content);
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
        const prefix = `[${type || 'INFO'}]`;
        const lines = message.split('\n').filter(l => l.trim() !== '');
        setTestLogs(prev => [...prev, ...lines.map(l => `${prefix} ${l}`)]);
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
    handleJsonContentChange(json);
  };

  const isConnected = status === 'connected';

  // Exportar resultado do teste em JSON
  const exportTestResultJSON = () => {
    if (!testResult) return;
    const data = {
      ...testResult,
      startTime: testResult.startTime instanceof Date ? testResult.startTime.toISOString() : testResult.startTime,
      endTime: testResult.endTime instanceof Date ? testResult.endTime.toISOString() : testResult.endTime,
      actionResults: testResult.actionResults.map(r => ({
        ...r,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
      })),
      logs: testLogs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-result-${testResult.scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportar resultado do teste em HTML
  const exportTestResultHTML = () => {
    if (!testResult) return;
    const startTime = testResult.startTime instanceof Date ? testResult.startTime : new Date(testResult.startTime);
    const statusColor = testResult.status === 'passed' ? '#22c55e' : '#ef4444';
    const statusLabel = testResult.status === 'passed' ? 'PASSED' : 'FAILED';

    const actionsHTML = testResult.actionResults.map((r, i) => {
      const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      const stColor = r.status === 'passed' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#eab308';
      return `<tr>
        <td>${i + 1}</td>
        <td><code>${r.action.type}</code>${r.action.description ? ` - ${r.action.description}` : ''}</td>
        <td><span style="color:${stColor};font-weight:600;">${r.status.toUpperCase()}</span></td>
        <td>${r.message}</td>
        <td>${r.duration}ms</td>
        <td style="font-size:11px;color:#999;">${format(ts, 'HH:mm:ss.SSS')}</td>
      </tr>`;
    }).join('');

    const logsHTML = testLogs.map(log => {
      const color = log.includes('[ERROR]') ? '#ef4444' : log.includes('[INFO]') ? '#22c55e' : '#a1a1aa';
      return `<div style="color:${color};margin-bottom:2px;">${log}</div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Result - ${testResult.scenario.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; color: #333; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px; }
    .header .app-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; opacity: 0.9; }
    .header .app-brand span { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .header h1 { font-size: 20px; margin-bottom: 6px; }
    .header p { opacity: 0.9; font-size: 13px; }
    .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; margin-top: 8px; }
    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section h2 { font-size: 15px; margin-bottom: 12px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat { text-align: center; }
    .stat .label { font-size: 11px; color: #999; text-transform: uppercase; }
    .stat .value { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .stat .value.green { color: #22c55e; }
    .stat .value.red { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #666; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    .logs { background: #18181b; color: #4ade80; font-family: monospace; font-size: 12px; padding: 16px; border-radius: 6px; max-height: 400px; overflow-y: auto; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="app-brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        <span>WebSocket Buddy</span>
      </div>
      <h1>${testResult.scenario.name}</h1>
      ${testResult.scenario.description ? `<p>${testResult.scenario.description}</p>` : ''}
      <div class="status-badge">${statusLabel}</div>
    </div>

    <div class="section">
      <h2>Resumo</h2>
      <div class="stats">
        <div class="stat">
          <div class="label">Total de Ações</div>
          <div class="value">${testResult.totalActions}</div>
        </div>
        <div class="stat">
          <div class="label">Duração</div>
          <div class="value">${testResult.duration}ms</div>
        </div>
        <div class="stat">
          <div class="label">Passou</div>
          <div class="value green">${testResult.passedActions}</div>
        </div>
        <div class="stat">
          <div class="label">Falhou</div>
          <div class="value red">${testResult.failedActions}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Detalhes das Ações (${testResult.actionResults.length})</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ação</th>
            <th>Status</th>
            <th>Mensagem</th>
            <th>Duração</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${actionsHTML}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Logs de Execução (${testLogs.length})</h2>
      <div class="logs">${logsHTML || '<div style="color:#71717a;">Nenhum log registrado.</div>'}</div>
    </div>

    <div class="footer">
      <p>WebSocket Buddy - Test Report</p>
      <p>Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | Iniciado em ${format(startTime, 'dd/MM/yyyy HH:mm:ss')}</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${testResult.scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="space-y-4">
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                    <div className="ml-auto flex items-center gap-1 border border-border rounded-md p-0.5">
                      <Button
                        onClick={() => setEditorFormat('raw')}
                        variant={editorFormat === 'raw' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-5 text-[10px] gap-1 px-2"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Raw</span>
                      </Button>
                      <Button
                        onClick={() => setEditorFormat('json')}
                        variant={editorFormat === 'json' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-5 text-[10px] gap-1 px-2"
                      >
                        <Braces className="h-3 w-3" />
                        <span>JSON</span>
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Editor */}
                  {editorFormat === 'raw' ? (
                    <Textarea
                      value={scenarioJson}
                      onChange={(e) => handleJsonContentChange(e.target.value)}
                      placeholder='{\n  "name": "Meu Teste",\n  "actions": [\n    ...\n  ]\n}'
                      className="font-mono text-xs min-h-[400px]"
                    />
                  ) : (
                    <div className="border border-border rounded-md overflow-hidden">
                      <CodeMirror
                        key={`scenario-cm-${editorKey}-${theme}`}
                        value={scenarioJson}
                        onChange={handleJsonContentChange}
                        extensions={theme === 'dark' ? darkExtensions : lightExtensions}
                        theme={theme === 'dark' ? blackTheme : 'light'}
                        placeholder='{"name": "Meu Teste", "actions": [...]}'
                        height="400px"
                        basicSetup={{
                          lineNumbers: true,
                          highlightActiveLineGutter: true,
                          foldGutter: true,
                          bracketMatching: true,
                          closeBrackets: true,
                          autocompletion: true,
                          highlightActiveLine: false,
                          syntaxHighlighting: true,
                        }}
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                  )}

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
                        {(currentScenario.actions?.length || 0)} ações definidas
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
                        variant="outline"
                        className={testResult.status === 'passed'
                          ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'}
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

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportTestResultHTML}
                        className="flex-1 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        Exportar HTML
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportTestResultJSON}
                        className="flex-1 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        Exportar JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logs do Teste */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Logs de Execução</CardTitle>
                      <CardDescription>
                        {isRunning ? 'Executando...' : `${testLogs.length} logs`}
                      </CardDescription>
                    </div>
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
