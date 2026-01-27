/**
 * Painel de configuração de conexão WebSocket
 * Permite configurar URL, tipo de conexão e controlar a conexão
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConnectionStatus, ConnectionType } from '@/hooks/useWebSocket';
import { Plug, Unplug, Wifi, WifiOff, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

// Interface para header customizado
interface CustomHeader {
  id: string;
  key: string;
  value: string;
}

interface ConnectionPanelProps {
  status: ConnectionStatus;
  onConnect: (url: string, type: ConnectionType, token?: string, customHeaders?: Record<string, string>) => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ status, onConnect, onDisconnect }: ConnectionPanelProps) {
  // URL padrão para testes
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ConnectionType>('websocket');
  const [token, setToken] = useState('');

  // Estado para headers customizados
  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([]);
  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Handler para conectar
  const handleConnect = () => {
    if (url.trim()) {
      // Converte array de headers para objeto
      const headersObj = customHeaders.reduce((acc, header) => {
        if (header.key.trim()) {
          acc[header.key.trim()] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const hasCustomHeaders = Object.keys(headersObj).length > 0;
      onConnect(url.trim(), type, token.trim() || undefined, hasCustomHeaders ? headersObj : undefined);
    }
  };

  // Adicionar novo header
  const handleAddHeader = () => {
    const keyTrimmed = newHeaderKey.trim();
    if (!keyTrimmed) return;

    // Não permite adicionar Authorization (já existe via token)
    if (keyTrimmed.toLowerCase() === 'authorization') return;

    // Não permite duplicados
    if (customHeaders.some((h) => h.key.toLowerCase() === keyTrimmed.toLowerCase())) return;

    setCustomHeaders((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: keyTrimmed, value: newHeaderValue }
    ]);
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  // Remover header
  const handleRemoveHeader = (id: string) => {
    setCustomHeaders((prev) => prev.filter((h) => h.id !== id));
  };

  // Máscara para exibir valor oculto
  const maskValue = (value: string) => {
    if (!value) return '(vazio)';
    if (value.length <= 4) return '••••';
    return '••••' + value.slice(-4);
  };

  // Indicador de status visual
  const StatusIndicator = () => {
    const statusConfig = {
      disconnected: {
        icon: WifiOff,
        label: 'Desconectado',
        className: 'text-slate-400',
        iconClassName: ''
      },
      connecting: {
        icon: Loader2,
        label: 'Conectando...',
        className: 'text-yellow-500',
        iconClassName: 'animate-spin'
      },
      connected: {
        icon: Wifi,
        label: 'Conectado',
        className: 'text-green-500',
        iconClassName: ''
      },
      error: {
        icon: AlertCircle,
        label: 'Erro',
        className: 'text-red-500',
        iconClassName: ''
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.className} ${config.iconClassName}`} />
        <span className={`text-xs sm:text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className="border border-border p-2 sm:p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">Conexão</h2>
        <StatusIndicator />
      </div>

      <div className="space-y-2">
        {/* URL do WebSocket */}
        <div className="space-y-1">
          <Label htmlFor="ws-url" className="text-xs font-medium uppercase">
            URL
          </Label>
          <Input
            id="ws-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={type === 'stomp' ? 'wss://seu-servidor/ws' : 'wss://echo.websocket.org'}
            disabled={isConnected || isConnecting}
            className="font-mono text-xs h-8"
          />
        </div>

        {/* Token de Autenticação (ambos os tipos) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-token" className="text-xs font-medium uppercase">
              Token de Autorização {type === 'websocket' && '(Opcional)'}
            </Label>
            {/* Headers Customizados */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setHeadersDialogOpen(true)}
                disabled={isConnected || isConnecting}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                <span>Headers</span>
              </button>
              {customHeaders.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 cursor-pointer hover:bg-secondary/80"
                  onClick={() => !isConnected && !isConnecting && setHeadersDialogOpen(true)}
                >
                  +{customHeaders.length}
                </Badge>
              )}
            </div>
          </div>
          <Input
            id="ws-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="seu_token_aqui"
            disabled={isConnected || isConnecting}
            className="font-mono text-xs h-8"
          />
          <p className="text-[10px] text-muted-foreground">
            {type === 'stomp'
              ? '"Bearer" adicionado automaticamente.'
              : 'Adicione à URL se necessário (ex: ?token=...)'}
          </p>
        </div>

        {/* Dialog de Headers */}
        <Dialog open={headersDialogOpen} onOpenChange={setHeadersDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm uppercase">Headers de Conexão</DialogTitle>
              <DialogDescription className="text-xs">
                {type === 'stomp'
                  ? 'Headers enviados na conexão STOMP e nas mensagens.'
                  : 'Headers para referência. WebSocket padrão não suporta headers customizados na conexão.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Header Authorization (sempre visível se tiver token) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Authorization (Token)</Label>
                <div className="flex gap-2">
                  <Input
                    value="Authorization"
                    disabled
                    className="font-mono text-xs h-8 flex-1 bg-muted"
                  />
                  <Input
                    value={token ? maskValue(`Bearer ${token}`) : '(não configurado)'}
                    disabled
                    className="font-mono text-xs h-8 flex-[2] bg-muted"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Configure o token no campo acima. Não é possível editar aqui.
                </p>
              </div>

              {/* Lista de headers customizados */}
              {customHeaders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Headers Customizados</Label>
                  {customHeaders.map((header) => (
                    <div key={header.id} className="flex gap-2 items-center">
                      <Input
                        value={header.key}
                        disabled
                        className="font-mono text-xs h-8 flex-1"
                      />
                      <Input
                        value={maskValue(header.value)}
                        disabled
                        className="font-mono text-xs h-8 flex-[2]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHeader(header.id)}
                        disabled={isConnected || isConnecting}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar novo header */}
              {!isConnected && !isConnecting && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-medium">Adicionar Header</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                      className="font-mono text-xs h-8 flex-1"
                    />
                    <Input
                      placeholder="Valor"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                      className="font-mono text-xs h-8 flex-[2]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddHeader}
                      disabled={!newHeaderKey.trim() || newHeaderKey.trim().toLowerCase() === 'authorization'}
                      className="h-8 px-3"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {newHeaderKey.trim().toLowerCase() === 'authorization' && (
                    <p className="text-[10px] text-destructive">
                      Use o campo Token para configurar Authorization.
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Tipo de conexão */}
        <div className="space-y-1 flex gap-3 items-center">
          <Label className="text-xs font-medium pt-1 uppercase">Tipo</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => setType(value as ConnectionType)}
            disabled={isConnected || isConnecting}
            className="flex gap-3 sm:gap-4"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="websocket" id="ws-pure" />
              <Label htmlFor="ws-pure" className="cursor-pointer text-xs">
                WebSocket
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="stomp" id="ws-stomp" />
              <Label htmlFor="ws-stomp" className="cursor-pointer text-xs">
                STOMP
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleConnect}
            disabled={isConnected || isConnecting || !url.trim()}
            className="flex-1 gap-1.5 h-8 text-xs"
          >
            <Plug className="h-3.5 w-3.5" />
            Conectar
          </Button>
          <Button
            onClick={onDisconnect}
            disabled={!isConnected}
            variant="outline"
            className="flex-1 gap-1.5 h-8 text-xs"
          >
            <Unplug className="h-3.5 w-3.5" />
            Desconectar
          </Button>
        </div>
      </div>
    </div>
  );
}
