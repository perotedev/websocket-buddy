/**
 * TestScenarioBuilder - Interface visual para criar cenários de teste
 * Gera JSON de teste automaticamente
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Play, Copy } from 'lucide-react';
import type { TestScenario } from '@/lib/testAutomation/types';

interface TestScenarioBuilderProps {
  onRunTest: (scenario: TestScenario) => void;
}

type ActionType = 'connect' | 'send' | 'subscribe' | 'unsubscribe' | 'wait' | 'disconnect' | 'close' | 'wait-for-message';
type AssertType = 'message-received' | 'message-contains' | 'no-errors' | 'connection-closed' | 'latency';

interface ActionItem {
  id: string;
  type: ActionType;
  params: Record<string, any>;
}

interface AssertItem {
  id: string;
  type: AssertType;
  params: Record<string, any>;
}

export function TestScenarioBuilder({ onRunTest }: TestScenarioBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [assertions, setAssertions] = useState<AssertItem[]>([]);

  // Adicionar ação
  const addAction = (type: ActionType) => {
    const params = getDefaultActionParams(type);

    // Se for uma ação connect e temos URL do servidor, preenche automaticamente
    if (type === 'connect' && serverUrl) {
      params.url = serverUrl;
    }

    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      type,
      params,
    };
    setActions([...actions, newAction]);
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
    return {
      name: name || 'Cenário sem nome',
      description: description || '',
      steps: [
        {
          name: 'Test Steps',
          actions: actions.map(({ type, params }) => ({ type, ...params })),
          assertions: assertions.map(({ type, params }) => ({ type, ...params })),
        },
      ],
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

          <div className="space-y-2">
            <Label htmlFor="server-url" className="text-xs font-semibold">URL do Servidor de Teste</Label>
            <Input
              id="server-url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://localhost:8080 ou mock://chatbot"
              className="text-xs h-8 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              💡 Defina a URL padrão que será usada nas ações de conexão
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Ações</Label>
            <Select onValueChange={(value) => addAction(value as ActionType)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Adicionar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="connect">Conectar</SelectItem>
                <SelectItem value="send">Enviar Mensagem</SelectItem>
                <SelectItem value="subscribe">Inscrever em Tópico</SelectItem>
                <SelectItem value="wait">Aguardar</SelectItem>
                <SelectItem value="wait-for-message">Aguardar Mensagem</SelectItem>
                <SelectItem value="disconnect">Desconectar</SelectItem>
              </SelectContent>
            </Select>
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
            <Select onValueChange={(value) => addAssertion(value as AssertType)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Adicionar validação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message-received">Mensagem Recebida</SelectItem>
                <SelectItem value="message-contains">Mensagem Contém</SelectItem>
                <SelectItem value="no-errors">Sem Erros</SelectItem>
                <SelectItem value="connection-closed">Conexão Fechada</SelectItem>
                <SelectItem value="latency">Latência Máxima</SelectItem>
              </SelectContent>
            </Select>
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
  const actionLabels: Record<ActionType, string> = {
    connect: 'Conectar',
    send: 'Enviar',
    subscribe: 'Inscrever',
    unsubscribe: 'Desinscrever',
    wait: 'Aguardar',
    disconnect: 'Desconectar',
    close: 'Fechar',
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
        {action.type === 'connect' && (
          <Input
            value={action.params.url || ''}
            onChange={(e) => onUpdate('url', e.target.value)}
            placeholder="ws://localhost:8080"
            className="text-xs h-7"
          />
        )}

        {action.type === 'send' && (
          <Textarea
            value={action.params.message || ''}
            onChange={(e) => onUpdate('message', e.target.value)}
            placeholder='{"type": "ping"}'
            className="text-xs min-h-[60px]"
          />
        )}

        {action.type === 'subscribe' && (
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
    case 'connect':
      return { url: '' };
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
