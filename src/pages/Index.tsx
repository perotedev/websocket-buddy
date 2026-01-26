/**
 * WebSocket Buddy - Página Principal
 * Ferramenta para testar e depurar conexões WebSocket e STOMP
 */
import { useState, useCallback } from 'react';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { ActionPanel } from '@/components/ActionPanel';
import { EventConsole } from '@/components/EventConsole';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Terminal, Settings, ScrollText } from 'lucide-react';

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
  const isMobile = useIsMobile();

  // Conteúdo do painel de configuração (conexão + ações)
  const ConfigPanel = () => (
    <div className="flex flex-col gap-2 sm:gap-3 h-full">
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
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight">
                  WebSocket Buddy
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {isMobile ? (
        /* Layout Mobile com Tabs */
        <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <TabsContent value="config" className="h-full m-0 px-2 py-2 overflow-auto">
              <ConfigPanel />
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
        <>
          <main className="container mx-auto px-2 sm:px-3 py-2 sm:py-3 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 h-full">
              {/* Coluna esquerda - Configuração e Controles */}
              <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 min-h-0">
                <ConfigPanel />
              </div>

              {/* Coluna direita - Console */}
              <div className="lg:col-span-8 h-full min-h-0">
                <EventConsole logs={logs} onClear={clearLogs} />
              </div>
            </div>
          </main>

          {/* Footer - apenas no desktop */}
          <footer className="border-t border-border flex-shrink-0">
            <div className="container mx-auto px-2 sm:px-3 py-1.5 sm:py-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                WebSocket Buddy • <a target="_blank" href="https://perotedev.com">@perotedev</a>
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
