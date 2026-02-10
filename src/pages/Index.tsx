/**
 * WebSocket Buddy - Página Principal
 * Ferramenta para testar e depurar conexões WebSocket e STOMP
 */
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { ActionPanel } from '@/components/ActionPanel';
import { EventConsole } from '@/components/EventConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Settings, ScrollText } from 'lucide-react';

const Index = () => {
  // Usa contexto global para tudo
  const {
    logs,
    clearLogs,
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage,
  } = useWebSocketContext();

  const isConnected = status === 'connected';
  const isMobile = useIsMobile();

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
