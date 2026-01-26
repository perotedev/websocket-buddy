/**
 * Painel de gerenciamento de inscrições em tópicos/canais
 * Permite inscrever-se em tópicos e gerenciar inscrições ativas
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SubscribedTopic, ConnectionType } from '@/hooks/useWebSocket';
import { Plus, X, Radio } from 'lucide-react';

interface SubscriptionPanelProps {
  subscribedTopics: SubscribedTopic[];
  connectionType: ConnectionType;
  isConnected: boolean;
  onSubscribe: (destination: string) => void;
  onUnsubscribe: (id: string) => void;
}

export function SubscriptionPanel({
  subscribedTopics,
  connectionType,
  isConnected,
  onSubscribe,
  onUnsubscribe
}: SubscriptionPanelProps) {
  const [destination, setDestination] = useState('');

  // Handler para inscrever
  const handleSubscribe = () => {
    if (destination.trim()) {
      onSubscribe(destination.trim());
      setDestination('');
    }
  };

  // Handler para tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe();
    }
  };

  return (
    <div className="border-2 border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Inscrições</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {subscribedTopics.length} ativo(s)
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Campo para novo tópico */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium uppercase">
            {connectionType === 'stomp' ? 'Destino STOMP' : 'Filtro/Canal'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="topic"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connectionType === 'stomp' ? '/topic/messages' : 'canal-1'}
              disabled={!isConnected}
              className="font-mono text-sm flex-1"
            />
            <Button
              onClick={handleSubscribe}
              disabled={!isConnected || !destination.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {connectionType === 'stomp' && (
            <p className="text-xs text-muted-foreground">
              Exemplos: /topic/news, /queue/orders, /user/queue/replies
            </p>
          )}
        </div>

        {/* Lista de tópicos inscritos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium uppercase">Tópicos Ativos</Label>
          {subscribedTopics.length === 0 ? (
            <div className="border-2 border-dashed border-muted p-4 text-center text-muted-foreground text-sm">
              Nenhuma inscrição ativa
            </div>
          ) : (
            <ScrollArea className="h-32 border-2 border-border">
              <div className="p-2 space-y-2">
                {subscribedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between bg-secondary p-2 border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Radio className="h-3 w-3 text-chart-2 flex-shrink-0" />
                      <span className="font-mono text-sm truncate">
                        {topic.destination}
                      </span>
                    </div>
                    <Button
                      onClick={() => onUnsubscribe(topic.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
