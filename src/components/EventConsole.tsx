/**
 * Console de eventos e mensagens
 * Exibe logs em tempo real com timestamps e tipos
 */
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogEntry, LogType } from '@/hooks/useWebSocket';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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

  return (
    <div className="border border-border p-2 sm:p-3 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">Console</h2>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="font-mono text-[10px] px-1.5">
            {logs.length}
          </Badge>
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
        className="flex-1 border border-border bg-secondary/30"
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
  );
}
