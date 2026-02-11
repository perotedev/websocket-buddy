/**
 * Painel de ações - Agrupa inscrições e envio de mensagens com tabs
 */
import { SubscriptionPanel } from "./SubscriptionPanel";
import { MessagePanel } from "./MessagePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscribedTopic, ConnectionType } from "@/hooks/useWebSocket";
import { Radio, Send } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface ActionPanelProps {
  subscribedTopics: SubscribedTopic[];
  connectionType: ConnectionType;
  isConnected: boolean;
  onSubscribe: (destination: string) => void;
  onUnsubscribe: (id: string) => void;
  onSendMessage: (
    message: string,
    destination?: string,
    headers?: Record<string, string>,
  ) => void;
}

export function ActionPanel({
  subscribedTopics,
  connectionType,
  isConnected,
  onSubscribe,
  onUnsubscribe,
  onSendMessage,
}: ActionPanelProps) {
  // Estado persistido no contexto global
  const { actionPanelState, setActionPanelState } = useWebSocketContext();
  const { message, destination, headers, messageFormat, activeTab } = actionPanelState;

  return (
    <div className="border border-border shadow-sm h-full flex flex-col">
      <div className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActionPanelState({ activeTab: value })}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full grid grid-cols-2 h-8 sm:h-10 flex-shrink-0">
            <TabsTrigger
              value="subscriptions"
              className="text-xs sm:text-sm gap-1.5"
            >
              <Radio className="h-3 w-3 sm:h-4 sm:w-4" />
              Inscrições{" "}
              <span className="text-xs">({subscribedTopics.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="text-xs sm:text-sm gap-1.5"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              Mensagem
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="subscriptions"
            className="flex-1 mt-2 min-h-0"
            asChild
          >
            <div className="h-full overflow-hidden">
              <SubscriptionPanel
                subscribedTopics={subscribedTopics}
                connectionType={connectionType}
                isConnected={isConnected}
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="flex-1 mt-2 min-h-0" asChild>
            <div className="h-full overflow-hidden">
              <MessagePanel
                connectionType={connectionType}
                isConnected={isConnected}
                onSendMessage={onSendMessage}
                message={message}
                setMessage={(v) => setActionPanelState({ message: v })}
                destination={destination}
                setDestination={(v) => setActionPanelState({ destination: v })}
                headers={headers}
                setHeaders={(v) => setActionPanelState({ headers: v })}
                messageFormat={messageFormat}
                setMessageFormat={(v) => setActionPanelState({ messageFormat: v })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
