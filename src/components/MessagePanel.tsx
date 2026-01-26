/**
 * Painel de envio de mensagens
 * Permite enviar mensagens com suporte a headers STOMP
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConnectionType } from '@/hooks/useWebSocket';
import { Send, Braces } from 'lucide-react';

interface MessagePanelProps {
  connectionType: ConnectionType;
  isConnected: boolean;
  onSendMessage: (message: string, destination?: string, headers?: Record<string, string>) => void;
}

export function MessagePanel({ connectionType, isConnected, onSendMessage }: MessagePanelProps) {
  const [message, setMessage] = useState('');
  const [destination, setDestination] = useState('/app/send');
  const [headers, setHeaders] = useState('');
  const [showHeaders, setShowHeaders] = useState(false);

  // Handler para enviar mensagem
  const handleSend = () => {
    if (!message.trim()) return;

    // Parse headers se fornecidos (formato JSON)
    let parsedHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        // Ignora headers inválidos, mas poderia mostrar erro
        console.warn('Headers inválidos:', e);
      }
    }

    if (connectionType === 'stomp') {
      onSendMessage(message, destination, parsedHeaders);
    } else {
      onSendMessage(message);
    }

    setMessage('');
  };

  // Handler para tecla Enter (com Ctrl/Cmd para enviar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  };

  // Formatar JSON no campo de mensagem
  const formatJson = () => {
    try {
      const parsed = JSON.parse(message);
      setMessage(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Não é JSON válido, ignora
    }
  };

  return (
    <div className="border-2 border-border p-4 shadow-sm">
      <h2 className="text-lg font-bold uppercase tracking-wide mb-4">Enviar Mensagem</h2>

      <div className="space-y-4">
        {/* Destino STOMP */}
        {connectionType === 'stomp' && (
          <div className="space-y-2">
            <Label htmlFor="dest" className="text-sm font-medium uppercase">
              Destino
            </Label>
            <Input
              id="dest"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="/app/send"
              disabled={!isConnected}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* Campo de mensagem */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message" className="text-sm font-medium uppercase">
              Mensagem
            </Label>
            <Button
              onClick={formatJson}
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1"
            >
              <Braces className="h-3 w-3" />
              Formatar JSON
            </Button>
          </div>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='{"type": "ping", "data": "hello"}'
            disabled={!isConnected}
            className="font-mono text-sm min-h-24 resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter para enviar
          </p>
        </div>

        {/* Headers STOMP (opcional) */}
        {connectionType === 'stomp' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowHeaders(!showHeaders)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {showHeaders ? 'Ocultar headers' : 'Adicionar headers'}
            </button>
            {showHeaders && (
              <Textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"content-type": "application/json"}'
                disabled={!isConnected}
                className="font-mono text-sm min-h-16"
              />
            )}
          </div>
        )}

        {/* Botão de enviar */}
        <Button
          onClick={handleSend}
          disabled={!isConnected || !message.trim()}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          Enviar
        </Button>
      </div>
    </div>
  );
}
