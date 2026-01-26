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
        className: 'bg-secondary text-secondary-foreground' 
      },
      MESSAGE: { 
        variant: 'default' as const, 
        className: 'bg-chart-2 text-primary-foreground' 
      },
      SENT: { 
        variant: 'outline' as const, 
        className: 'bg-chart-4 text-primary-foreground' 
      },
      ERROR: { 
        variant: 'destructive' as const, 
        className: 'bg-destructive text-destructive-foreground' 
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
    <div className="border-2 border-border p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Console</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {logs.length} evento(s)
          </Badge>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Área de logs */}
      <ScrollArea 
        className="flex-1 border-2 border-border bg-secondary/30 min-h-64" 
        ref={scrollRef}
      >
        <div className="p-2 space-y-1 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aguardando eventos...
            </div>
          ) : (
            logs.map((log) => {
              const config = getLogConfig(log.type);
              const isExpanded = expandedLogs.has(log.id);
              const hasData = !!log.data;

              return (
                <div key={log.id} className="border-b border-border/50 pb-1">
                  <div 
                    className={`flex items-start gap-2 ${hasData ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
                    onClick={() => hasData && toggleExpand(log.id)}
                  >
                    {/* Indicador de expansão */}
                    {hasData ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-4" />
                    )}

                    {/* Timestamp */}
                    <span className="text-muted-foreground text-xs flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Tipo */}
                    <Badge className={`${config.className} text-xs flex-shrink-0`}>
                      {log.type}
                    </Badge>

                    {/* Mensagem */}
                    <span className="break-all">{log.message}</span>
                  </div>

                  {/* Dados expandidos */}
                  {hasData && isExpanded && (
                    <div className="ml-6 mt-2 p-2 bg-background border border-border overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap break-all">
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
