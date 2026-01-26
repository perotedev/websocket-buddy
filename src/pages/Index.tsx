/**
 * WebSocket Tester - Página Principal
 * Ferramenta para testar e depurar conexões WebSocket e STOMP
 */
import { useState, useCallback } from 'react';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { ActionPanel } from '@/components/ActionPanel';
import { EventConsole } from '@/components/EventConsole';
import { Terminal } from 'lucide-react';

const Index = () => {
  // Estado dos logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Callback para adicionar logs
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
    ]);
  }, []);

  // Limpar logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Hook de WebSocket
  const {
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket({ onLog: addLog });

  const isConnected = status === 'connected';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-3 py-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight">
                WebSocket Tester
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-3 py-2 sm:py-3 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 h-full">
          {/* Coluna esquerda - Configuração e Controles */}
          <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 min-h-0">
            {/* Painel de Conexão */}
            <div className="flex-shrink-0">
              <ConnectionPanel
                status={status}
                onConnect={connect}
                onDisconnect={disconnect}
              />
            </div>

            {/* Painel de Ações (Inscrições e Mensagens com Tabs) */}
            <div className="flex-1 min-h-0">
              <ActionPanel
                subscribedTopics={subscribedTopics}
                connectionType={connectionType}
                isConnected={isConnected}
                onSubscribe={subscribe}
                onUnsubscribe={unsubscribe}
                onSendMessage={sendMessage}
              />
            </div>
          </div>

          {/* Coluna direita - Console */}
          <div className="lg:col-span-8 h-full overflow-hidden">
            <EventConsole logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-3 py-1.5 sm:py-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            WebSocket Tester • WebSocket & STOMP
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
