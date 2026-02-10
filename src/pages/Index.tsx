/**
 * WebSocket Buddy - Página Principal
 * Ferramenta para testar e depurar conexões WebSocket e STOMP
 */
import { useState, useCallback, useEffect } from 'react';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { ActionPanel } from '@/components/ActionPanel';
import { EventConsole } from '@/components/EventConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Settings, ScrollText } from 'lucide-react';

const Index = () => {
  // Contexto global
  const context = useWebSocketContext();

  // Performance tracking
  const {
    stats,
    snapshots,
    trackConnectionStart,
    trackConnectionEnd,
    updateConnectionStatus,
    trackMessageSent,
    trackMessageReceived,
    trackError,
  } = usePerformanceTracking({
    snapshotInterval: 1000,
    maxLatencyHistory: 60,
  });

  // Estado dos logs (local + contexto)
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Sincronizar stats e snapshots com o contexto
  useEffect(() => {
    context.updateStats({
      totalMessages: stats.totalMessages,
      messagesSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      totalBytes: stats.totalBytes,
      bytesSent: stats.bytesSent,
      bytesReceived: stats.bytesReceived,
      averageLatency: stats.averageLatency,
      minLatency: stats.minLatency,
      maxLatency: stats.maxLatency,
      errorCount: stats.errorCount,
      connectionDuration: stats.connectionDuration,
      messagesPerSecond: stats.messagesPerSecond,
      bytesPerSecond: stats.bytesPerSecond,
    });
  }, [stats, context]);

  useEffect(() => {
    if (snapshots.length > 0) {
      const latestSnapshot = snapshots[snapshots.length - 1];
      context.addSnapshot(latestSnapshot);
    }
  }, [snapshots, context]);

  // Callback para adicionar logs (local + contexto)
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setLogs((prev) => [...prev, newLog]);
    context.addLog(entry);

    // Track performance
    if (entry.type === 'SENT') {
      const message = entry.data || entry.message || '';
      trackMessageSent(message);
    } else if (entry.type === 'MESSAGE') {
      const message = entry.data || entry.message || '';
      trackMessageReceived(message);
    } else if (entry.type === 'ERROR') {
      trackError(entry.message);
    }
  }, [context, trackMessageSent, trackMessageReceived, trackError]);

  // Limpar logs (local + contexto)
  const clearLogs = useCallback(() => {
    setLogs([]);
    context.clearLogs();
  }, [context]);

  // Hook de WebSocket
  const {
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket({ onLog: addLog });

  const isConnected = status === 'connected';
  const isMobile = useIsMobile();

  // Sincronizar status de conexão com performance tracking
  useEffect(() => {
    updateConnectionStatus(status);
  }, [status, updateConnectionStatus]);

  // Atualizar connectionInfo no contexto quando conectar/desconectar
  useEffect(() => {
    if (status === 'connected') {
      trackConnectionStart();
      // Obter URL do ConnectionPanel (assumindo que está disponível)
      const urlElement = document.querySelector('input[placeholder*="ws://"]') as HTMLInputElement;
      const url = urlElement?.value || 'N/A';

      context.setConnectionInfo({
        url,
        connectionType,
        connectedAt: new Date(),
      });
    } else if (status === 'disconnected' && context.connectionInfo?.connectedAt) {
      trackConnectionEnd();
      context.setConnectionInfo({
        ...context.connectionInfo,
        disconnectedAt: new Date(),
      });
    }
  }, [status, connectionType, context, trackConnectionStart, trackConnectionEnd]);

  // Conteúdo do painel de configuração (conexão + ações) - inline para evitar re-mount
  const configPanelContent = (
    <div className="flex flex-col gap-2 sm:gap-3 h-full">
      {/* Painel de Conexão */}
      <div className="flex-shrink-0">
        <ConnectionPanel
          status={status}
          onConnect={connect}
          onDisconnect={disconnect}
          onCancelConnection={cancelConnection}
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
  );

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {isMobile ? (
        /* Layout Mobile com Tabs */
        <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <TabsContent value="config" className="h-full m-0 px-2 py-2 overflow-auto">
              {configPanelContent}
            </TabsContent>
            <TabsContent value="console" className="h-full m-0 px-2 py-2">
              <EventConsole logs={logs} onClear={clearLogs} />
            </TabsContent>
          </main>

          {/* Navegação Mobile - Bottom Tabs */}
          <div className="border-t border-border flex-shrink-0 bg-background">
            <TabsList className="w-full h-12 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="config"
                className="flex-1 h-full rounded-none gap-1.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">Configurações</span>
              </TabsTrigger>
              <TabsTrigger
                value="console"
                className="flex-1 h-full rounded-none gap-1.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                <ScrollText className="h-4 w-4" />
                <span className="text-xs">Console</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      ) : (
        /* Layout Desktop - Grid de duas colunas */
        <main className="container mx-auto px-2 sm:px-3 py-2 sm:py-3 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 h-full">
            {/* Coluna esquerda - Configuração e Controles */}
            <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 min-h-0">
              {configPanelContent}
            </div>

            {/* Coluna direita - Console */}
            <div className="lg:col-span-8 h-full min-h-0">
              <EventConsole logs={logs} onClear={clearLogs} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;
