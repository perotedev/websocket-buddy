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

  // Estado para headers customizados (sempre com uma linha vazia no final)
  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([
    { id: crypto.randomUUID(), key: '', value: '' }
  ]);
  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);

  // Handler para conectar
  const handleConnect = () => {
    if (url.trim()) {
      // Converte array de headers para objeto (ignora linhas vazias)
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

  // Atualizar header e gerenciar linhas automaticamente
  const handleUpdateHeader = (id: string, field: 'key' | 'value', newValue: string) => {
    // Não permite mudar key para Authorization
    if (field === 'key' && newValue.trim().toLowerCase() === 'authorization') return;

    setCustomHeaders((prev) => {
      // Atualiza o header
      let updated = prev.map((h) => (h.id === id ? { ...h, [field]: newValue } : h));

      // Se o último header não está mais vazio, adiciona uma nova linha vazia
      const lastHeader = updated[updated.length - 1];
      if (lastHeader && (lastHeader.key !== '' || lastHeader.value !== '')) {
        updated = [...updated, { id: crypto.randomUUID(), key: '', value: '' }];
      }

      // Remove linhas vazias do meio (mantém apenas a última vazia)
      updated = updated.filter((h, index) => {
        const isLast = index === updated.length - 1;
        const isEmpty = h.key === '' && h.value === '';
        // Mantém se não está vazia OU se é a última
        return !isEmpty || isLast;
      });

      // Garante que sempre tenha pelo menos uma linha vazia
      const hasEmptyRow = updated.some((h) => h.key === '' && h.value === '');
      if (!hasEmptyRow) {
        updated = [...updated, { id: crypto.randomUUID(), key: '', value: '' }];
      }

      return updated;
    });
  };

  // Remover header manualmente
  const handleRemoveHeader = (id: string) => {
    setCustomHeaders((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      // Garante que sempre tenha pelo menos uma linha vazia
      const hasEmptyRow = filtered.some((h) => h.key === '' && h.value === '');
      if (!hasEmptyRow || filtered.length === 0) {
        return [...filtered, { id: crypto.randomUUID(), key: '', value: '' }];
      }
      return filtered;
    });
  };

  // Verifica se um header está vazio (para estilização)
  const isHeaderEmpty = (header: CustomHeader) => header.key === '' && header.value === '';

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
            <div className="flex items-center gap-1 h-5">
              <button
                type="button"
                onClick={() => setHeadersDialogOpen(true)}
                disabled={isConnected || isConnecting}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                <span>Headers</span>
              </button>
              {customHeaders.filter((h) => h.key !== '' || h.value !== '').length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 cursor-pointer hover:bg-secondary/80"
                  onClick={() => !isConnected && !isConnecting && setHeadersDialogOpen(true)}
                >
                  +{customHeaders.filter((h) => h.key !== '' || h.value !== '').length}
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
          <DialogContent className="max-w-[488px]">
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
                    className="font-mono text-xs h-8 w-44 bg-muted"
                  />
                  <Input
                    value={token ? '••••••••••••' : '(não configurado)'}
                    disabled
                    className="font-mono text-xs h-8 flex-1 bg-muted"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Configure o token no campo acima. Não é possível editar aqui.
                </p>
              </div>

              {/* Lista de headers customizados */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Headers Customizados</Label>
                {customHeaders.map((header) => {
                  const isEmpty = isHeaderEmpty(header);
                  return (
                    <div key={header.id} className={`flex gap-2 items-center group ${isEmpty ? '[&:hover_input]:border-input' : ''}`}>
                      <Input
                        value={header.key}
                        placeholder="Nome"
                        onChange={(e) => handleUpdateHeader(header.id, 'key', e.target.value)}
                        disabled={isConnected || isConnecting}
                        className={`font-mono text-xs h-8 w-44 transition-colors ${isEmpty ? 'text-muted-foreground/50 placeholder:text-muted-foreground/50 border-muted-foreground/30' : ''}`}
                      />
                      <div className="relative flex-1">
                        <Input
                          value={header.value}
                          placeholder="Valor"
                          onChange={(e) => handleUpdateHeader(header.id, 'value', e.target.value)}
                          disabled={isConnected || isConnecting}
                          className={`font-mono text-xs h-8 w-full transition-colors ${isEmpty ? 'text-muted-foreground/50 placeholder:text-muted-foreground/50 border-muted-foreground/30' : 'pr-8'}`}
                          type={isEmpty ? 'text' : 'password'}
                        />
                        {!isEmpty && !isConnected && !isConnecting && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHeader(header.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
