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
  onConnect: (url: string, type: ConnectionType) => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ status, onConnect, onDisconnect }: ConnectionPanelProps) {
  // URL padrão para testes
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [type, setType] = useState<ConnectionType>('websocket');

  // Handler para conectar
  const handleConnect = () => {
    if (url.trim()) {
      onConnect(url.trim(), type);
    }
  };

  // Indicador de status visual
  const StatusIndicator = () => {
    const statusConfig = {
      disconnected: { 
        icon: WifiOff, 
        label: 'Desconectado', 
        className: 'text-muted-foreground' 
      },
      connecting: { 
        icon: Loader2, 
        label: 'Conectando...', 
        className: 'text-muted-foreground animate-spin' 
      },
      connected: { 
        icon: Wifi, 
        label: 'Conectado', 
        className: 'text-chart-2' 
      },
      error: { 
        icon: AlertCircle, 
        label: 'Erro', 
        className: 'text-destructive' 
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.className}`} />
        <span className={`text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className="border-2 border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Conexão</h2>
        <StatusIndicator />
      </div>

      <div className="space-y-4">
        {/* URL do WebSocket */}
        <div className="space-y-2">
          <Label htmlFor="ws-url" className="text-sm font-medium uppercase">
            URL do WebSocket
          </Label>
          <Input
            id="ws-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://seu-servidor.com/ws"
            disabled={isConnected || isConnecting}
            className="font-mono text-sm"
          />
        </div>

        {/* Tipo de conexão */}
        <div className="space-y-2">
          <Label className="text-sm font-medium uppercase">Tipo de Conexão</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => setType(value as ConnectionType)}
            disabled={isConnected || isConnecting}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="websocket" id="ws-pure" />
              <Label htmlFor="ws-pure" className="cursor-pointer">
                WebSocket Puro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stomp" id="ws-stomp" />
              <Label htmlFor="ws-stomp" className="cursor-pointer">
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
            className="flex-1 gap-2"
          >
            <Plug className="h-4 w-4" />
            Conectar
          </Button>
          <Button
            onClick={onDisconnect}
            disabled={!isConnected}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Unplug className="h-4 w-4" />
            Desconectar
          </Button>
        </div>
      </div>
    </div>
  );
}
