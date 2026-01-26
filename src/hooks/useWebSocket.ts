/**
 * Hook personalizado para gerenciar conexões WebSocket (puro e STOMP)
 * Suporta inscrição em múltiplos tópicos e logging de eventos
 */
import { useState, useRef, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

// Tipos de conexão suportados
export type ConnectionType = 'websocket' | 'stomp';

// Status possíveis da conexão
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Tipos de log para o console de eventos
export type LogType = 'INFO' | 'MESSAGE' | 'ERROR' | 'SENT';

// Interface para entrada de log
export interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
  data?: string;
}

// Interface para tópico inscrito
export interface SubscribedTopic {
  id: string;
  destination: string;
}

// Parâmetros de configuração do hook
interface UseWebSocketParams {
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export function useWebSocket({ onLog }: UseWebSocketParams) {
  // Estado da conexão
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionType, setConnectionType] = useState<ConnectionType>('websocket');
  const [subscribedTopics, setSubscribedTopics] = useState<SubscribedTopic[]>([]);

  // Referências para as conexões
  const wsRef = useRef<WebSocket | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());

  /**
   * Conecta ao servidor WebSocket
   * @param url URL do servidor WebSocket
   * @param type Tipo de conexão (websocket puro ou STOMP)
   */
  const connect = useCallback((url: string, type: ConnectionType) => {
    // Desconecta qualquer conexão existente
    disconnect();
    setConnectionType(type);
    setStatus('connecting');

    if (type === 'websocket') {
      // Conexão WebSocket pura
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('connected');
          onLog({ type: 'INFO', message: `Conectado ao servidor: ${url}` });
        };

        ws.onmessage = (event) => {
          onLog({ 
            type: 'MESSAGE', 
            message: 'Mensagem recebida',
            data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data)
          });
        };

        ws.onerror = (error) => {
          setStatus('error');
          onLog({ type: 'ERROR', message: 'Erro na conexão WebSocket' });
        };

        ws.onclose = (event) => {
          setStatus('disconnected');
          onLog({ 
            type: 'INFO', 
            message: `Desconectado (código: ${event.code}, razão: ${event.reason || 'N/A'})`
          });
          wsRef.current = null;
        };
      } catch (error) {
        setStatus('error');
        onLog({ type: 'ERROR', message: `Erro ao conectar: ${error}` });
      }
    } else {
      // Conexão STOMP sobre WebSocket
      const client = new Client({
        brokerURL: url,
        debug: (str) => {
          // Log de debug do STOMP (pode ser habilitado para depuração)
          console.log('[STOMP Debug]', str);
        },
        reconnectDelay: 0, // Desabilita reconexão automática para controle manual
        onConnect: () => {
          setStatus('connected');
          onLog({ type: 'INFO', message: `STOMP conectado ao servidor: ${url}` });
        },
        onStompError: (frame) => {
          setStatus('error');
          onLog({ 
            type: 'ERROR', 
            message: `Erro STOMP: ${frame.headers['message'] || 'Erro desconhecido'}`,
            data: frame.body
          });
        },
        onWebSocketClose: (event) => {
          setStatus('disconnected');
          onLog({ type: 'INFO', message: 'Conexão STOMP encerrada' });
        },
        onDisconnect: () => {
          setStatus('disconnected');
          onLog({ type: 'INFO', message: 'STOMP desconectado' });
        }
      });

      stompClientRef.current = client;
      
      try {
        client.activate();
      } catch (error) {
        setStatus('error');
        onLog({ type: 'ERROR', message: `Erro ao ativar cliente STOMP: ${error}` });
      }
    }
  }, [onLog]);

  /**
   * Desconecta do servidor
   */
  const disconnect = useCallback(() => {
    // Limpa inscrições STOMP
    subscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        // Ignora erros ao desinscrever
      }
    });
    subscriptionsRef.current.clear();
    setSubscribedTopics([]);

    // Fecha WebSocket puro
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Desativa cliente STOMP
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  /**
   * Inscreve em um tópico/canal
   * @param destination Destino para inscrição (ex: /topic/messages)
   */
  const subscribe = useCallback((destination: string) => {
    const id = crypto.randomUUID();

    if (connectionType === 'stomp' && stompClientRef.current?.connected) {
      // Inscrição STOMP
      const subscription = stompClientRef.current.subscribe(destination, (message: IMessage) => {
        onLog({
          type: 'MESSAGE',
          message: `[${destination}] Mensagem recebida`,
          data: message.body
        });
      });

      subscriptionsRef.current.set(id, subscription);
      setSubscribedTopics((prev) => [...prev, { id, destination }]);
      onLog({ type: 'INFO', message: `Inscrito em: ${destination}` });
    } else if (connectionType === 'websocket') {
      // Para WebSocket puro, apenas registramos o "tópico" para organização
      // As mensagens chegam pelo handler onmessage geral
      setSubscribedTopics((prev) => [...prev, { id, destination }]);
      onLog({ type: 'INFO', message: `Filtro adicionado: ${destination} (WebSocket puro recebe todas as mensagens)` });
    } else {
      onLog({ type: 'ERROR', message: 'Não conectado. Conecte-se primeiro.' });
    }
  }, [connectionType, onLog]);

  /**
   * Remove inscrição de um tópico
   * @param id ID da inscrição
   */
  const unsubscribe = useCallback((id: string) => {
    const topic = subscribedTopics.find((t) => t.id === id);
    
    if (connectionType === 'stomp') {
      const subscription = subscriptionsRef.current.get(id);
      if (subscription) {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(id);
      }
    }

    setSubscribedTopics((prev) => prev.filter((t) => t.id !== id));
    if (topic) {
      onLog({ type: 'INFO', message: `Desinscrito de: ${topic.destination}` });
    }
  }, [connectionType, subscribedTopics, onLog]);

  /**
   * Envia uma mensagem
   * @param message Conteúdo da mensagem
   * @param destination Destino (apenas para STOMP)
   * @param headers Headers adicionais (apenas para STOMP)
   */
  const sendMessage = useCallback((message: string, destination?: string, headers?: Record<string, string>) => {
    if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      // Envio via WebSocket puro
      wsRef.current.send(message);
      onLog({ type: 'SENT', message: 'Mensagem enviada', data: message });
    } else if (connectionType === 'stomp' && stompClientRef.current?.connected && destination) {
      // Envio via STOMP
      stompClientRef.current.publish({
        destination,
        body: message,
        headers: headers || {}
      });
      onLog({ 
        type: 'SENT', 
        message: `Mensagem enviada para: ${destination}`,
        data: message
      });
    } else {
      onLog({ type: 'ERROR', message: 'Não foi possível enviar. Verifique a conexão.' });
    }
  }, [connectionType, onLog]);

  return {
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage
  };
}
