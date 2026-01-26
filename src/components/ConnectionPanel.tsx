/**
 * Painel de configuração de conexão WebSocket
 * Permite configurar URL, tipo de conexão e controlar a conexão
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ConnectionStatus, ConnectionType } from '@/hooks/useWebSocket';
import { Plug, Unplug, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  onConnect: (url: string, type: ConnectionType, token?: string) => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ status, onConnect, onDisconnect }: ConnectionPanelProps) {
  // URL padrão para testes
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ConnectionType>('websocket');
  const [token, setToken] = useState('');

  // Handler para conectar
  const handleConnect = () => {
    if (url.trim()) {
      onConnect(url.trim(), type, token.trim() || undefined);
    }
  };

  // Indicador de status visual
  const StatusIndicator = () => {
    const statusConfig = {
      disconnected: {
        icon: WifiOff,
        label: 'Desconectado',
        className: 'text-slate-400'
      },
      connecting: {
        icon: Loader2,
        label: 'Conectando...',
        className: 'text-yellow-500 animate-spin'
      },
      connected: {
        icon: Wifi,
        label: 'Conectado',
        className: 'text-green-500'
      },
      error: {
        icon: AlertCircle,
        label: 'Erro',
        className: 'text-red-500'
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.className}`} />
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
            placeholder={type === 'stomp' ? 'ws://localhost:8080/ws' : 'wss://echo.websocket.org'}
            disabled={isConnected || isConnecting}
            className="font-mono text-xs h-8"
          />
        </div>

        {/* Token de Autenticação (ambos os tipos) */}
        <div className="space-y-1">
          <Label htmlFor="ws-token" className="text-xs font-medium uppercase">
            Token de Autorização {type === 'websocket' && '(Opcional)'}
          </Label>
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

        {/* Tipo de conexão */}
        <div className="space-y-1">
          <Label className="text-xs font-medium uppercase">Tipo</Label>
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
