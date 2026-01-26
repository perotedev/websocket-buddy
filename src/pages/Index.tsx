/**
 * WebSocket Tester - Página Principal
 * Ferramenta para testar e depurar conexões WebSocket e STOMP
 */
import { useState, useCallback } from 'react';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { SubscriptionPanel } from '@/components/SubscriptionPanel';
import { MessagePanel } from '@/components/MessagePanel';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Terminal className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">
                WebSocket Tester
              </h1>
              <p className="text-sm text-muted-foreground">
                Ferramenta de depuração para WebSocket e STOMP
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna esquerda - Configuração e Controles */}
          <div className="lg:col-span-4 space-y-6">
            {/* Painel de Conexão */}
            <ConnectionPanel
              status={status}
              onConnect={connect}
              onDisconnect={disconnect}
            />

            {/* Painel de Inscrições */}
            <SubscriptionPanel
              subscribedTopics={subscribedTopics}
              connectionType={connectionType}
              isConnected={isConnected}
              onSubscribe={subscribe}
              onUnsubscribe={unsubscribe}
            />

            {/* Painel de Envio */}
            <MessagePanel
              connectionType={connectionType}
              isConnected={isConnected}
              onSendMessage={sendMessage}
            />
          </div>

          {/* Coluna direita - Console */}
          <div className="lg:col-span-8">
            <EventConsole logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            WebSocket Tester • Suporta WebSocket puro e STOMP sobre WebSocket
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
