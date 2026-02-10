/**
 * Painel de envio de mensagens
 * Permite enviar mensagens com suporte a headers STOMP
 */
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConnectionType } from "@/hooks/useWebSocket";
import { useTheme } from "@/hooks/useTheme";
import { Send, FileText, Braces, Plus } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import { EditorView } from "@codemirror/view";

type MessageFormat = "raw" | "json";

interface MessagePanelProps {
  connectionType: ConnectionType;
  isConnected: boolean;
  onSendMessage: (
    message: string,
    destination?: string,
    headers?: Record<string, string>,
  ) => void;
  message: string;
  setMessage: (message: string) => void;
  destination: string;
  setDestination: (destination: string) => void;
  headers: string;
  setHeaders: (headers: string) => void;
  messageFormat: MessageFormat;
  setMessageFormat: (format: MessageFormat) => void;
}

export function MessagePanel({
  connectionType,
  isConnected,
  onSendMessage,
  message,
  setMessage,
  destination,
  setDestination,
  headers,
  setHeaders,
  messageFormat,
  setMessageFormat,
}: MessagePanelProps) {
  const { theme } = useTheme();
  const [editorKey, setEditorKey] = useState(0);

  // Incrementa a key quando o tema muda para forçar re-montagem do editor
  useEffect(() => {
    setEditorKey((prev) => prev + 1);
  }, [theme]);

  // Extensões do editor para modo dark
  const darkExtensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      EditorView.theme(
        {
          "&": {
            backgroundColor: "#000000",
          },
          ".cm-content": {
            caretColor: "#00ff00",
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "#00ff00",
          },
          "&.cm-focused .cm-selectionBackground": {
            backgroundColor: "#264f78 !important",
          },
          ".cm-selectionBackground": {
            backgroundColor: "#264f78 !important",
          },
          ".cm-line ::selection": {
            backgroundColor: "#264f78 !important",
            color: "inherit !important",
          },
          "&.cm-focused .cm-selectionLayer .cm-selectionBackground": {
            backgroundColor: "#264f78 !important",
          },
          ".cm-gutters": {
            backgroundColor: "#1a1a1a",
            color: "#858585",
            border: "none",
            borderRight: "1px solid #333333",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#2a2a2a",
            color: "#ffffff",
            fontWeight: "bold",
          },
        },
        { dark: true },
      ),
    ],
    [theme],
  );

  // Extensões do editor para modo light
  const lightExtensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      EditorView.theme({
        ".cm-activeLineGutter": {
          backgroundColor: "#e0e0e0",
          color: "#000000",
          fontWeight: "bold",
        },
      }),
    ],
    [theme],
  );

  // Tema dark customizado com fundo totalmente preto
  const blackTheme = useMemo(
    () =>
      createTheme({
        theme: "dark",
        settings: {
          background: "#000000",
          foreground: "#e0e0e0",
          caret: "#00ff00",
          selection: "#264f78",
          selectionMatch: "#264f78",
          gutterBackground: "#1a1a1a",
          gutterForeground: "#858585",
          gutterBorder: "#333333",
          gutterActiveForeground: "#ffffff",
        },
        styles: [
          { tag: t.comment, color: "#6a9955" },
          { tag: t.variableName, color: "#9cdcfe" },
          { tag: [t.string, t.special(t.brace)], color: "#ce9178" },
          { tag: t.number, color: "#b5cea8" },
          { tag: t.bool, color: "#569cd6" },
          { tag: t.null, color: "#569cd6" },
          { tag: t.keyword, color: "#c586c0" },
          { tag: t.operator, color: "#d4d4d4" },
          { tag: t.className, color: "#4ec9b0" },
          { tag: t.definition(t.typeName), color: "#4ec9b0" },
          { tag: t.typeName, color: "#4ec9b0" },
          { tag: t.angleBracket, color: "#808080" },
          { tag: t.tagName, color: "#569cd6" },
          { tag: t.attributeName, color: "#9cdcfe" },
          { tag: t.propertyName, color: "#9cdcfe" },
        ],
      }),
    [theme],
  );

  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);

  // Conta headers válidos (tenta parsear JSON)
  const headerCount = useMemo(() => {
    if (!headers.trim()) return 0;
    try {
      const parsed = JSON.parse(headers);
      return Object.keys(parsed).length;
    } catch {
      return 0;
    }
  }, [headers]);

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
        console.warn("Headers inválidos:", e);
      }
    }

    if (connectionType === "stomp") {
      onSendMessage(message, destination, parsedHeaders);
    } else {
      onSendMessage(message);
    }

    // Não limpa a mensagem para permitir reenvio
  };

  // Handler para tecla Enter (com Ctrl/Cmd para enviar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Destino STOMP */}
      {connectionType === "stomp" && (
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
            Deve corresponder ao @MessageMapping do servidor
          </p>
        </div>
      )}

      {/* Campo de mensagem */}
      <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="message" className="text-xs font-medium uppercase">
              Mensagem
            </Label>
            {connectionType === "stomp" && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHeadersDialogOpen(true)}
                  disabled={!isConnected}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                  <span>Headers</span>
                </button>
                {headerCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 cursor-pointer hover:bg-secondary/80"
                    onClick={() => setHeadersDialogOpen(true)}
                  >
                    +{headerCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {/* Toggle entre Raw e JSON */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
            <Button
              onClick={() => setMessageFormat("raw")}
              variant={messageFormat === "raw" ? "default" : "ghost"}
              size="sm"
              className="h-5 text-[10px] gap-1 px-2"
            >
              <FileText className="h-3 w-3" />
              <span>Raw</span>
            </Button>
            <Button
              onClick={() => setMessageFormat("json")}
              variant={messageFormat === "json" ? "default" : "ghost"}
              size="sm"
              className="h-5 text-[10px] gap-1 px-2"
            >
              <Braces className="h-3 w-3" />
              <span>JSON</span>
            </Button>
          </div>
        </div>

        {/* Editor baseado no formato */}
        {messageFormat === "raw" ? (
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='{"type": "ping"}'
            disabled={!isConnected}
            className="font-mono text-xs resize-none flex-1 min-h-0"
          />
        ) : (
          <div
            className={`flex-1 min-h-0 border border-border rounded-md overflow-hidden flex flex-col ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <CodeMirror
              key={`codemirror-${editorKey}-${theme}`}
              value={message}
              onChange={(value) => setMessage(value)}
              extensions={theme === "dark" ? darkExtensions : lightExtensions}
              theme={theme === "dark" ? blackTheme : "light"}
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
                highlightActiveLine: false,
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
              style={{ fontSize: "12px" }}
              readOnly={!isConnected}
              editable={isConnected}
            />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground flex-shrink-0">
          Ctrl+Enter para enviar
        </p>
      </div>

      {/* Dialog de Headers STOMP */}
      {connectionType === "stomp" && (
        <Dialog open={headersDialogOpen} onOpenChange={setHeadersDialogOpen}>
          <DialogContent className="max-w-[488px]">
            <DialogHeader>
              <DialogTitle className="text-sm uppercase">Headers da Mensagem</DialogTitle>
              <DialogDescription className="text-xs">
                Headers customizados enviados junto com a mensagem STOMP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Headers (JSON)</Label>
              <Textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"custom-header": "valor"}'
                disabled={!isConnected}
                className="font-mono text-xs min-h-[120px] resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Formato JSON. content-type é adicionado automaticamente.
              </p>
            </div>
          </DialogContent>
        </Dialog>
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
