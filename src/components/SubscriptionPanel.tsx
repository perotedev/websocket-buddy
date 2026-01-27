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
import { Plus, X, Radio, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Handler para copiar tópico
  const handleCopy = async (topic: SubscribedTopic) => {
    try {
      await navigator.clipboard.writeText(topic.destination);
      setCopiedId(topic.id);
      toast({
        title: "Copiado!",
        description: "Destino copiado para área de transferência",
        duration: 2000,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para área de transferência",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">Inscrições</h2>
        <Badge variant="outline" className="font-mono text-[10px] px-1.5">
          {subscribedTopics.length}
        </Badge>
      </div>

      {/* Campo para novo tópico */}
      <div className="space-y-1 flex-shrink-0">
        <Label htmlFor="topic" className="text-xs font-medium uppercase">
          {connectionType === 'stomp' ? 'Destino' : 'Canal'}
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="topic"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={connectionType === 'stomp' ? '/topic/messages' : 'canal-1'}
            disabled={!isConnected}
            className="font-mono text-xs flex-1 h-8"
          />
          <Button
            onClick={handleSubscribe}
            disabled={!isConnected || !destination.trim()}
            size="icon"
            className="flex-shrink-0 h-8 w-8"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lista de tópicos inscritos */}
      <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        <Label className="text-xs font-medium uppercase flex-shrink-0">Ativos</Label>
        {subscribedTopics.length === 0 ? (
          <div className="border border-dashed border-muted p-2 text-center text-muted-foreground text-xs flex-shrink-0">
            Nenhuma inscrição
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden border border-border">
            <ScrollArea className="h-full">
              <div className="p-1.5 space-y-1">
                {subscribedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-start gap-1.5 bg-secondary p-1.5 border border-border"
                  >
                    <Radio className="h-2.5 w-2.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span
                      className="font-mono text-xs flex-1 break-all leading-tight"
                      title={topic.destination}
                    >
                      {topic.destination}
                    </span>
                    <Button
                      onClick={() => handleCopy(topic)}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      title="Copiar destino"
                    >
                      {copiedId === topic.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      onClick={() => onUnsubscribe(topic.id)}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      title="Remover inscrição"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
