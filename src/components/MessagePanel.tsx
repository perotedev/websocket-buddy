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
import { Send, FileText, Braces } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';

interface MessagePanelProps {
  connectionType: ConnectionType;
  isConnected: boolean;
  onSendMessage: (message: string, destination?: string, headers?: Record<string, string>) => void;
}

type MessageFormat = 'raw' | 'json';

export function MessagePanel({ connectionType, isConnected, onSendMessage }: MessagePanelProps) {
  const [message, setMessage] = useState('');
  const [destination, setDestination] = useState('');
  const [headers, setHeaders] = useState('');
  const [showHeaders, setShowHeaders] = useState(false);
  const [messageFormat, setMessageFormat] = useState<MessageFormat>('json');

  // Handler para enviar mensagem
  const handleSend = () => {
    if (!message.trim()) return;

    // Parse headers se fornecidos (formato JSON)
    let parsedHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        // Ignora headers inválidos
        console.warn('Headers inválidos:', e);
      }
    }

    if (connectionType === 'stomp') {
      onSendMessage(message, destination, parsedHeaders);
    } else {
      onSendMessage(message);
    }

    // Não limpa a mensagem para permitir reenvio
  };

  // Handler para tecla Enter (com Ctrl/Cmd para enviar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide flex-shrink-0">Enviar</h2>

      {/* Destino STOMP */}
      {connectionType === 'stomp' && (
        <div className="space-y-1 flex-shrink-0">
          <Label htmlFor="dest" className="text-xs font-medium uppercase">
            Destino
          </Label>
          <Input
            id="dest"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="/app/send"
            disabled={!isConnected}
            className="font-mono text-xs h-8"
          />
          <p className="text-[10px] text-muted-foreground">
            Ex: /app/chat, /app/send, /app/message
            <br />
            Deve corresponder ao @MessageMapping do servidor
          </p>
        </div>
      )}

      {/* Campo de mensagem */}
      <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <Label htmlFor="message" className="text-xs font-medium uppercase">
            Mensagem
          </Label>
          {/* Toggle entre Raw e JSON */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
            <Button
              onClick={() => setMessageFormat('raw')}
              variant={messageFormat === 'raw' ? 'default' : 'ghost'}
              size="sm"
              className="h-5 text-[10px] gap-1 px-2"
            >
              <FileText className="h-3 w-3" />
              <span>Raw</span>
            </Button>
            <Button
              onClick={() => setMessageFormat('json')}
              variant={messageFormat === 'json' ? 'default' : 'ghost'}
              size="sm"
              className="h-5 text-[10px] gap-1 px-2"
            >
              <Braces className="h-3 w-3" />
              <span>JSON</span>
            </Button>
          </div>
        </div>

        {/* Editor baseado no formato */}
        {messageFormat === 'raw' ? (
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={!isConnected}
            className="font-mono text-xs resize-none flex-1 min-h-0"
          />
        ) : (
          <div className={`flex-1 min-h-0 border border-border rounded-md overflow-hidden flex flex-col ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <CodeMirror
              value={message}
              onChange={(value) => setMessage(value)}
              extensions={[json(), linter(jsonParseLinter())]}
              placeholder='{"type": "ping"}'
              height="100%"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
              className="flex-1"
              style={{ fontSize: '12px' }}
              readOnly={!isConnected}
              editable={isConnected}
            />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground flex-shrink-0">
          Ctrl+Enter para enviar
        </p>
      </div>

      {/* Headers STOMP (opcional) */}
      {connectionType === 'stomp' && (
        <div className="space-y-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowHeaders(!showHeaders)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showHeaders ? 'Ocultar headers' : '+ Headers (opcional)'}
          </button>
          {showHeaders && (
            <>
              <Textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"custom-header": "valor"}'
                disabled={!isConnected}
                className="font-mono text-xs min-h-12 resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Formato JSON. content-type é adicionado automaticamente
              </p>
            </>
          )}
        </div>
      )}

      {/* Botão de enviar */}
      <Button
        onClick={handleSend}
        disabled={!isConnected || !message.trim()}
        className="w-full gap-1.5 h-8 text-xs flex-shrink-0"
      >
        <Send className="h-3.5 w-3.5" />
        Enviar
      </Button>
    </div>
  );
}
