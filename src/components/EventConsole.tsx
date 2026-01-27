/**
 * Console de eventos e mensagens
 * Exibe logs em tempo real com timestamps e tipos
 */
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogEntry, LogType } from '@/hooks/useWebSocket';
import { Trash2, ChevronDown, ChevronRight, Download, ArrowUp, ArrowDown, Info, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface EventConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function EventConsole({ logs, onClear }: EventConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Auto-scroll para o final quando novos logs são adicionados
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-expandir logs do tipo MESSAGE
  useEffect(() => {
    const messageLogIds = logs
      .filter((log) => log.type === 'MESSAGE' && log.data)
      .map((log) => log.id);

    if (messageLogIds.length > 0) {
      setExpandedLogs((prev) => {
        const next = new Set(prev);
        messageLogIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [logs]);

  // Toggle expansão de log com dados
  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Configuração visual por tipo de log
  const getLogConfig = (type: LogType) => {
    const configs = {
      INFO: {
        variant: 'secondary' as const,
        className: 'bg-slate-500 text-white'
      },
      SUBSCRIBE: {
        variant: 'default' as const,
        className: 'bg-blue-500 text-white'
      },
      UNSUBSCRIBE: {
        variant: 'outline' as const,
        className: 'bg-orange-500 text-white'
      },
      MESSAGE: {
        variant: 'default' as const,
        className: 'bg-green-500 text-white'
      },
      SENT: {
        variant: 'outline' as const,
        className: 'bg-purple-500 text-white'
      },
      ERROR: {
        variant: 'destructive' as const,
        className: 'bg-red-500 text-white'
      }
    };
    return configs[type];
  };

  // Retorna o ícone de direção do fluxo baseado no tipo
  const getDirectionIcon = (type: LogType) => {
    // Mensagens recebidas (entrada/download)
    if (type === 'MESSAGE') {
      return <ArrowDown className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Mensagens enviadas
    if (type === 'SENT') {
      return <ArrowUp className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Inscrição em tópico
    if (type === 'SUBSCRIBE') {
      return <ArrowUp className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Cancelamento de inscrição
    if (type === 'UNSUBSCRIBE') {
      return <ArrowUp className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Informação geral
    if (type === 'INFO') {
      return <Info className="h-3 w-3 text-slate-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Erro
    if (type === 'ERROR') {
      return <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5 ml-1" />;
    }
    // Fallback
    return <span className="w-3 flex-shrink-0 ml-1" />;
  };

  // Formatar timestamp
  const formatTime = (date: Date) => {
    const time = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  // Exportar logs para arquivo TXT
  const exportLogs = () => {
    if (logs.length === 0) return;

    const content = logs.map((log) => {
      const time = formatTime(log.timestamp);
      let line = `[${time}] [${log.type}] ${log.message}`;
      if (log.data) {
        try {
          const formatted = JSON.stringify(JSON.parse(log.data), null, 2);
          line += `\n${formatted}`;
        } catch {
          line += `\n${log.data}`;
        }
      }
      return line;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `websocket-buddy-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-border shadow-sm h-full flex flex-col">
      <div className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">Console</h2>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px] px-1.5">
              {logs.length}
            </Badge>
            <Button
              onClick={exportLogs}
              variant="outline"
              size="sm"
              className="gap-1 h-7 px-2"
              disabled={logs.length === 0}
              title="Exportar logs"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Exportar</span>
            </Button>
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              className="gap-1 h-7 px-2"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Limpar</span>
            </Button>
          </div>
        </div>

        {/* Área de logs */}
        <ScrollArea
          className="flex-1 border border-border bg-secondary/30 min-h-0"
          ref={scrollRef}
        >
        <div className="p-1.5 space-y-0.5 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-xs">
              Aguardando eventos...
            </div>
          ) : (
            logs.map((log) => {
              const config = getLogConfig(log.type);
              const isExpanded = expandedLogs.has(log.id);
              const hasData = !!log.data;

              return (
                <div key={log.id} className="border-b border-border/50 pb-0.5">
                  <div
                    className={`flex items-start gap-1.5 ${hasData ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
                    onClick={() => hasData && toggleExpand(log.id)}
                  >
                    {/* Ícone de direção do fluxo */}
                    {getDirectionIcon(log.type)}

                    {/* Indicador de expansão */}
                    {hasData ? (
                      isExpanded ? (
                        <ChevronDown className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-3" />
                    )}

                    {/* Timestamp */}
                    <span className="text-muted-foreground text-[9px] flex-shrink-0 hidden sm:inline">
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Tipo */}
                    <Badge className={`${config.className} text-[9px] flex-shrink-0 px-1 py-0`}>
                      {log.type}
                    </Badge>

                    {/* Mensagem */}
                    <span className="break-all text-[10px]">{log.message}</span>
                  </div>

                  {/* Dados expandidos */}
                  {hasData && isExpanded && (
                    <div className="ml-3 sm:ml-4 mt-1 p-1.5 bg-background border border-border overflow-x-auto">
                      <pre className="text-[9px] whitespace-pre-wrap break-all">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(log.data!), null, 2);
                          } catch {
                            return log.data;
                          }
                        })()}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
