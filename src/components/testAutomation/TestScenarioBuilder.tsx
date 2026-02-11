/**
 * TestScenarioBuilder - Interface visual para criar cenários de teste
 * Gera JSON de teste automaticamente
 */
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Play, Copy, FileText, Braces } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { EditorView } from '@codemirror/view';
import type { TestScenario } from '@/lib/testAutomation/types';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { TestBuilderActionItem, TestBuilderAssertItem } from '@/contexts/WebSocketContext';

interface TestScenarioBuilderProps {
  onRunTest: (scenario: TestScenario) => void;
}

type ActionType = 'send' | 'subscribe' | 'unsubscribe' | 'wait' | 'wait-for-message';
type AssertType = 'message-received' | 'message-contains' | 'no-errors' | 'connection-closed' | 'latency';

type ActionItem = TestBuilderActionItem;
type AssertItem = TestBuilderAssertItem;

type MessageFormat = 'raw' | 'json';

export function TestScenarioBuilder({ onRunTest }: TestScenarioBuilderProps) {
  const { testBuilderState, setTestBuilderState } = useWebSocketContext();
  const { name, description, actions, assertions } = testBuilderState;

  const setName = (v: string) => setTestBuilderState({ name: v });
  const setDescription = (v: string) => setTestBuilderState({ description: v });
  const setActions = (v: ActionItem[]) => setTestBuilderState({ actions: v });
  const setAssertions = (v: AssertItem[]) => setTestBuilderState({ assertions: v });

  const [selectedAction, setSelectedAction] = useState<ActionType | ''>('');
  const [selectedAssertion, setSelectedAssertion] = useState<AssertType | ''>('');

  // Adicionar ação
  const handleAddAction = () => {
    if (!selectedAction) return;
    addAction(selectedAction);
    setSelectedAction('');
  };

  const addAction = (type: ActionType) => {
    const params = getDefaultActionParams(type);

    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      type,
      params,
    };
    setActions([...actions, newAction]);
  };

  // Adicionar assertion via botão +
  const handleAddAssertion = () => {
    if (!selectedAssertion) return;
    addAssertion(selectedAssertion);
    setSelectedAssertion('');
  };

  // Adicionar assertion
  const addAssertion = (type: AssertType) => {
    const newAssertion: AssertItem = {
      id: crypto.randomUUID(),
      type,
      params: getDefaultAssertParams(type),
    };
    setAssertions([...assertions, newAssertion]);
  };

  // Remover ação
  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  // Remover assertion
  const removeAssertion = (id: string) => {
    setAssertions(assertions.filter((a) => a.id !== id));
  };

  // Atualizar parâmetro de ação
  const updateActionParam = (id: string, key: string, value: any) => {
    setActions(actions.map((a) => a.id === id ? { ...a, params: { ...a.params, [key]: value } } : a));
  };

  // Atualizar parâmetro de assertion
  const updateAssertParam = (id: string, key: string, value: any) => {
    setAssertions(assertions.map((a) => a.id === id ? { ...a, params: { ...a.params, [key]: value } } : a));
  };

  // Gerar JSON do cenário
  const generateJSON = (): TestScenario => {
    const testActions = actions.map(({ type, params }) => {
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

    const testAssertions = assertions.map(({ type, params }) => {
      const action: any = { type: 'assert' };
      if (type === 'message-received') {
        action.assertionType = 'message_received';
      } else if (type === 'message-contains') {
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

    return {
      name: name || 'Cenário sem nome',
      description: description || '',
      actions: [...testActions, ...testAssertions],
    };
  };

  // Exportar JSON
  const exportJSON = () => {
    const scenario = generateJSON();
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name || 'test-scenario'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copiar JSON
  const copyJSON = () => {
    const scenario = generateJSON();
    navigator.clipboard.writeText(JSON.stringify(scenario, null, 2));
  };

  // Executar teste
  const runTest = () => {
    const scenario = generateJSON();
    onRunTest(scenario);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Cenário de Teste</CardTitle>
        <CardDescription>Monte seu teste visualmente - o JSON é gerado automaticamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do Cenário */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="test-name" className="text-xs">Nome do Teste</Label>
            <Input
              id="test-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Teste de conexão básica"
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-desc" className="text-xs">Descrição (opcional)</Label>
            <Textarea
              id="test-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Verifica se a conexão funciona corretamente..."
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Ações</Label>
            <div className="flex items-center gap-1">
              <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as ActionType)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Selecionar ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send">Enviar Mensagem</SelectItem>
                  <SelectItem value="subscribe">Inscrever em Tópico</SelectItem>
                  <SelectItem value="unsubscribe">Desinscrever de Tópico</SelectItem>
                  <SelectItem value="wait">Aguardar</SelectItem>
                  <SelectItem value="wait-for-message">Aguardar Mensagem</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAction}
                disabled={!selectedAction}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {actions.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                Nenhuma ação adicionada. Clique em "Adicionar ação" acima.
              </div>
            )}

            {actions.map((action, index) => (
              <ActionEditor
                key={action.id}
                action={action}
                index={index}
                onUpdate={(key, value) => updateActionParam(action.id, key, value)}
                onRemove={() => removeAction(action.id)}
              />
            ))}
          </div>
        </div>

        {/* Assertions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Validações</Label>
            <div className="flex items-center gap-1">
              <Select value={selectedAssertion} onValueChange={(value) => setSelectedAssertion(value as AssertType)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Selecionar validação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message-received">Mensagem Recebida</SelectItem>
                  <SelectItem value="message-contains">Mensagem Contém</SelectItem>
                  <SelectItem value="no-errors">Sem Erros</SelectItem>
                  <SelectItem value="connection-closed">Conexão Fechada</SelectItem>
                  <SelectItem value="latency">Latência Máxima</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAssertion}
                disabled={!selectedAssertion}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {assertions.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                Nenhuma validação adicionada. Clique em "Adicionar validação" acima.
              </div>
            )}

            {assertions.map((assertion, index) => (
              <AssertionEditor
                key={assertion.id}
                assertion={assertion}
                index={index}
                onUpdate={(key, value) => updateAssertParam(assertion.id, key, value)}
                onRemove={() => removeAssertion(assertion.id)}
              />
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={runTest}
            disabled={!name || actions.length === 0}
            size="sm"
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Executar Teste
          </Button>

          <Button
            onClick={exportJSON}
            disabled={!name || actions.length === 0}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>

          <Button
            onClick={copyJSON}
            disabled={!name || actions.length === 0}
            size="sm"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para editar ação
function ActionEditor({
  action,
  index,
  onUpdate,
  onRemove,
}: {
  action: ActionItem;
  index: number;
  onUpdate: (key: string, value: any) => void;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  const [messageFormat, setMessageFormat] = useState<MessageFormat>(action.params.messageFormat || 'json');
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    setEditorKey(prev => prev + 1);
  }, [theme]);

  const darkExtensions = useMemo(() => [
    json(), linter(jsonParseLinter()),
    EditorView.theme({ '&': { backgroundColor: '#000000' }, '.cm-gutters': { backgroundColor: '#1a1a1a', color: '#858585', border: 'none', borderRight: '1px solid #333333' } }, { dark: true }),
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

  const actionLabels: Record<ActionType, string> = {
    send: 'Enviar',
    subscribe: 'Inscrever',
    unsubscribe: 'Desinscrever',
    wait: 'Aguardar',
    'wait-for-message': 'Aguardar Mensagem',
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">#{index + 1}</Badge>
          <span className="text-xs font-semibold">{actionLabels[action.type]}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {action.type === 'send' && (
          <>
            <Input
              value={action.params.destination || ''}
              onChange={(e) => onUpdate('destination', e.target.value)}
              placeholder="Destino STOMP (ex: /app/chat) - opcional para WebSocket puro"
              className="text-xs h-7"
            />
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                <Button onClick={() => setMessageFormat('raw')} variant={messageFormat === 'raw' ? 'default' : 'ghost'} size="sm" className="h-5 text-[10px] gap-1 px-2">
                  <FileText className="h-3 w-3" /><span>Raw</span>
                </Button>
                <Button onClick={() => setMessageFormat('json')} variant={messageFormat === 'json' ? 'default' : 'ghost'} size="sm" className="h-5 text-[10px] gap-1 px-2">
                  <Braces className="h-3 w-3" /><span>JSON</span>
                </Button>
              </div>
            </div>
            {messageFormat === 'raw' ? (
              <Textarea
                value={action.params.message || ''}
                onChange={(e) => onUpdate('message', e.target.value)}
                placeholder='{"type": "ping"}'
                className="text-xs min-h-[60px]"
              />
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <CodeMirror
                  key={`action-cm-${editorKey}-${theme}`}
                  value={action.params.message || ''}
                  onChange={(value) => onUpdate('message', value)}
                  extensions={theme === 'dark' ? darkExtensions : lightExtensions}
                  theme={theme === 'dark' ? blackTheme : 'light'}
                  placeholder='{"type": "ping"}'
                  height="80px"
                  basicSetup={{ lineNumbers: true, foldGutter: true, bracketMatching: true, closeBrackets: true, autocompletion: true, highlightActiveLine: false, syntaxHighlighting: true }}
                  style={{ fontSize: '12px' }}
                />
              </div>
            )}
          </>
        )}

        {action.type === 'subscribe' && (
          <Input
            value={action.params.destination || ''}
            onChange={(e) => onUpdate('destination', e.target.value)}
            placeholder="/topic/messages"
            className="text-xs h-7"
          />
        )}

        {action.type === 'unsubscribe' && (
          <Input
            value={action.params.destination || ''}
            onChange={(e) => onUpdate('destination', e.target.value)}
            placeholder="/topic/messages"
            className="text-xs h-7"
          />
        )}

        {action.type === 'wait' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={action.params.ms || 1000}
              onChange={(e) => onUpdate('ms', parseInt(e.target.value))}
              className="text-xs h-7"
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        )}

        {action.type === 'wait-for-message' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={action.params.timeout || 5000}
              onChange={(e) => onUpdate('timeout', parseInt(e.target.value))}
              placeholder="Timeout (ms)"
              className="text-xs h-7"
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para editar assertion
function AssertionEditor({
  assertion,
  index,
  onUpdate,
  onRemove,
}: {
  assertion: AssertItem;
  index: number;
  onUpdate: (key: string, value: any) => void;
  onRemove: () => void;
}) {
  const assertLabels: Record<AssertType, string> = {
    'message-received': 'Mensagem Recebida',
    'message-contains': 'Mensagem Contém',
    'no-errors': 'Sem Erros',
    'connection-closed': 'Conexão Fechada',
    'latency': 'Latência',
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-[10px]">✓ {index + 1}</Badge>
          <span className="text-xs font-semibold">{assertLabels[assertion.type]}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {assertion.type === 'message-contains' && (
          <Input
            value={assertion.params.expected || ''}
            onChange={(e) => onUpdate('expected', e.target.value)}
            placeholder='Texto esperado na mensagem'
            className="text-xs h-7"
          />
        )}

        {assertion.type === 'latency' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={assertion.params.maxLatency || 1000}
              onChange={(e) => onUpdate('maxLatency', parseInt(e.target.value))}
              className="text-xs h-7"
            />
            <span className="text-xs text-muted-foreground">ms max</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Funções auxiliares
function getDefaultActionParams(type: ActionType): Record<string, any> {
  switch (type) {
    case 'send':
      return { message: '' };
    case 'subscribe':
      return { destination: '' };
    case 'unsubscribe':
      return { destination: '' };
    case 'wait':
      return { ms: 1000 };
    case 'wait-for-message':
      return { timeout: 5000 };
    default:
      return {};
  }
}

function getDefaultAssertParams(type: AssertType): Record<string, any> {
  switch (type) {
    case 'message-contains':
      return { expected: '' };
    case 'latency':
      return { maxLatency: 1000 };
    default:
      return {};
  }
}
