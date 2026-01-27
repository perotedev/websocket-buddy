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
export type LogType = 'INFO' | 'MESSAGE' | 'ERROR' | 'SENT' | 'SUBSCRIBE' | 'UNSUBSCRIBE';

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
  const authTokenRef = useRef<string | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);

  // Referência para headers customizados
  const customHeadersRef = useRef<Record<string, string>>({});

  // Referência para timeout de conexão
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timeout de conexão em milissegundos (30 segundos)
  const CONNECTION_TIMEOUT = 30000;

  /**
   * Limpa o timeout de conexão
   */
  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Desconecta do servidor
   */
  const disconnect = useCallback(() => {
    console.log('[Disconnect] Iniciando desconexão...');
    clearConnectionTimeout();

    // Limpa inscrições STOMP
    subscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.warn('[Disconnect] Erro ao desinscrever:', e);
      }
    });
    subscriptionsRef.current.clear();
    setSubscribedTopics([]);

    // Fecha WebSocket puro
    if (wsRef.current) {
      console.log('[Disconnect] Fechando WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
    }

    // Desativa cliente STOMP
    if (stompClientRef.current) {
      console.log('[Disconnect] Desativando cliente STOMP...');
      try {
        stompClientRef.current.deactivate();
      } catch (e) {
        console.warn('[Disconnect] Erro ao desativar STOMP:', e);
      }
      stompClientRef.current = null;
    }

    // Limpa o token de autenticação e headers customizados
    authTokenRef.current = undefined;
    customHeadersRef.current = {};

    setStatus('disconnected');
  }, [clearConnectionTimeout]);

  /**
   * Cancela uma tentativa de conexão em andamento
   */
  const cancelConnection = useCallback(() => {
    console.log('[Cancel] Cancelando tentativa de conexão...');
    clearConnectionTimeout();

    // Fecha WebSocket puro se estiver tentando conectar
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Desativa cliente STOMP se estiver tentando conectar
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (e) {
        console.warn('[Cancel] Erro ao desativar STOMP:', e);
      }
      stompClientRef.current = null;
    }

    setStatus('disconnected');
    onLog({ type: 'INFO', message: 'Tentativa de conexão cancelada pelo usuário' });
  }, [onLog, clearConnectionTimeout]);

  /**
   * Conecta ao servidor WebSocket
   * @param url URL do servidor WebSocket
   * @param type Tipo de conexão (websocket puro ou STOMP)
   * @param token Token de autenticação (opcional, apenas para STOMP)
   * @param customHeaders Headers customizados (opcional, apenas para STOMP)
   */
  const connect = useCallback((url: string, type: ConnectionType, token?: string, customHeaders?: Record<string, string>) => {
    // Desconecta qualquer conexão existente
    disconnect();
    setConnectionType(type);
    setStatus('connecting');

    // Reseta contador de tentativas de reconexão ao iniciar nova conexão
    reconnectAttemptsRef.current = 0;

    // Armazena o token e headers customizados para uso nas mensagens
    authTokenRef.current = token;
    customHeadersRef.current = customHeaders || {};

    // Configura timeout de conexão (30 segundos)
    clearConnectionTimeout();
    connectionTimeoutRef.current = setTimeout(() => {
      console.log('[Timeout] Tempo limite de conexão atingido (30s)');
      onLog({ type: 'ERROR', message: 'Tempo limite de conexão atingido (30 segundos)' });
      cancelConnection();
    }, CONNECTION_TIMEOUT);

    if (type === 'websocket') {
      // Conexão WebSocket pura
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          clearConnectionTimeout();
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

        ws.onerror = () => {
          clearConnectionTimeout();
          setStatus('error');
          onLog({ type: 'ERROR', message: 'Erro na conexão WebSocket' });
        };

        ws.onclose = (event) => {
          clearConnectionTimeout();
          setStatus('disconnected');
          onLog({
            type: 'INFO',
            message: `Desconectado (código: ${event.code}, razão: ${event.reason || 'N/A'})`
          });
          wsRef.current = null;
        };
      } catch (error) {
        clearConnectionTimeout();
        setStatus('error');
        onLog({ type: 'ERROR', message: `Erro ao conectar: ${error}` });
      }
    } else {
      // Conexão STOMP sobre WebSocket
      console.log('[STOMP] Iniciando conexão para:', url);

      // Prepara headers de conexão
      const connectHeaders: Record<string, string> = { ...customHeadersRef.current };
      if (token) {
        // Adiciona "Bearer " automaticamente se não estiver presente
        connectHeaders['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        console.log('[STOMP] Token será enviado no frame CONNECT');
      }
      if (Object.keys(connectHeaders).length > 0) {
        console.log('[STOMP] Headers de conexão:', Object.keys(connectHeaders));
      }

      const client = new Client({
        // Usa webSocketFactory ao invés de brokerURL (compatível com Spring Boot)
        webSocketFactory: () => {
          console.log('[STOMP] Criando WebSocket para:', url);
          return new WebSocket(url);
        },
        // Headers enviados no frame CONNECT
        connectHeaders,
        debug: (str) => {
          // Log de debug do STOMP (pode ser habilitado para depuração)
          console.log('[STOMP Debug]', str);
        },
        reconnectDelay: 5000, // 5 segundos para reconexão (como no Angular)
        heartbeatIncoming: 10000, // Heartbeat do servidor (10s)
        heartbeatOutgoing: 10000, // Heartbeat do cliente (10s)
        beforeConnect: () => {
          // Limita tentativas de reconexão a 3
          if (reconnectAttemptsRef.current >= 3) {
            console.log('[STOMP] Limite de tentativas de reconexão atingido (3)');
            onLog({ type: 'ERROR', message: 'Limite de tentativas de reconexão atingido (3). Desativando reconexão automática.' });
            if (stompClientRef.current) {
              stompClientRef.current.deactivate();
            }
            return Promise.reject(new Error('Máximo de tentativas de reconexão atingido'));
          }
          return Promise.resolve();
        },
        onConnect: (frame) => {
          clearConnectionTimeout();
          console.log('[STOMP] Conectado com sucesso!', frame);
          reconnectAttemptsRef.current = 0; // Reseta contador ao conectar com sucesso
          setStatus('connected');
          onLog({ type: 'INFO', message: `STOMP conectado ao servidor: ${url}` });
        },
        onStompError: (frame) => {
          clearConnectionTimeout();
          console.error('[STOMP Error Frame]', frame);
          setStatus('error');
          const errorMessage = frame.headers['message'] || 'Erro desconhecido';
          const errorDetails = Object.entries(frame.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          // Detecta erro específico do servidor Spring
          let helpText = '';
          if (errorMessage.includes('ExecutorSubscribableChannel') || errorMessage.includes('clientInboundChannel')) {
            helpText = '\n\n⚠️ POSSÍVEIS CAUSAS:\n' +
              '1. Falta o header Authorization (configure o Token no painel de Conexão)\n' +
              '2. Token inválido ou expirado\n' +
              '3. Destino não existe no servidor (@MessageMapping)\n' +
              '4. Formato JSON incorreto\n' +
              '5. Campos obrigatórios ausentes no JSON';
          }

          onLog({
            type: 'ERROR',
            message: `Erro STOMP: ${errorMessage}`,
            data: `Headers:\n${errorDetails}\n\nBody:\n${frame.body || '(vazio)'}${helpText}`
          });
        },
        onWebSocketClose: (event) => {
          clearConnectionTimeout();
          console.log('[STOMP] WebSocket fechado', event);
          reconnectAttemptsRef.current++; // Incrementa contador de tentativas
          console.log(`[STOMP] Tentativa de reconexão ${reconnectAttemptsRef.current}/3`);
          setStatus('disconnected');
          onLog({
            type: 'INFO',
            message: `Conexão STOMP encerrada (código: ${event.code})${event.reason ? `, razão: ${event.reason}` : ''} - Tentativa ${reconnectAttemptsRef.current}/3`
          });
        },
        onWebSocketError: (event) => {
          clearConnectionTimeout();
          console.error('[STOMP] Erro no WebSocket', event);
          setStatus('error');
          onLog({ type: 'ERROR', message: `Erro na conexão WebSocket do STOMP - Tentativa ${reconnectAttemptsRef.current + 1}/3` });
        },
        onDisconnect: () => {
          console.log('[STOMP] Desconectado');
          setStatus('disconnected');
          onLog({ type: 'INFO', message: 'STOMP desconectado' });
        }
      });

      stompClientRef.current = client;

      try {
        console.log('[STOMP] Ativando cliente...');
        client.activate();
        onLog({ type: 'INFO', message: 'Ativando cliente STOMP...' });
      } catch (error) {
        clearConnectionTimeout();
        console.error('[STOMP] Erro ao ativar:', error);
        setStatus('error');
        onLog({ type: 'ERROR', message: `Erro ao ativar cliente STOMP: ${error}` });
      }
    }
  }, [onLog, disconnect, clearConnectionTimeout, cancelConnection]);

  /**
   * Inscreve em um tópico/canal
   * @param destination Destino para inscrição (ex: /topic/messages)
   */
  const subscribe = useCallback((destination: string) => {
    const id = crypto.randomUUID();

    if (connectionType === 'stomp') {
      if (!stompClientRef.current) {
        onLog({ type: 'ERROR', message: 'Cliente STOMP não inicializado' });
        return;
      }

      if (!stompClientRef.current.connected) {
        onLog({ type: 'ERROR', message: 'STOMP não conectado. Aguarde a conexão ser estabelecida.' });
        return;
      }

      try {
        // Inscrição STOMP
        const subscription = stompClientRef.current.subscribe(destination, (message: IMessage) => {
          console.log('[STOMP Received]', {
            destination,
            headers: message.headers,
            body: message.body
          });

          const headersInfo = Object.entries(message.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          onLog({
            type: 'MESSAGE',
            message: `← ${destination}`,
            data: `Headers:\n${headersInfo}\n\nBody:\n${message.body}`
          });
        });

        subscriptionsRef.current.set(id, subscription);
        setSubscribedTopics((prev) => [...prev, { id, destination }]);
        onLog({ type: 'SUBSCRIBE', message: `Inscrito em: ${destination}` });
      } catch (error) {
        onLog({ type: 'ERROR', message: `Erro ao se inscrever em ${destination}: ${error}` });
      }
    } else if (connectionType === 'websocket') {
      // Para WebSocket puro, apenas registramos o "tópico" para organização
      // As mensagens chegam pelo handler onmessage geral
      setSubscribedTopics((prev) => [...prev, { id, destination }]);
      onLog({ type: 'SUBSCRIBE', message: `Inscrição adicionada: ${destination} (WebSocket recebe todas as mensagens)` });
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
      onLog({ type: 'UNSUBSCRIBE', message: `Inscrição cancelada: ${topic.destination}` });
    }
  }, [connectionType, subscribedTopics, onLog]);

  /**
   * Envia uma mensagem
   * @param message Conteúdo da mensagem
   * @param destination Destino (apenas para STOMP)
   * @param headers Headers adicionais (apenas para STOMP)
   */
  const sendMessage = useCallback((message: string, destination?: string, headers?: Record<string, string>) => {
    if (connectionType === 'websocket') {
      if (!wsRef.current) {
        onLog({ type: 'ERROR', message: 'WebSocket não inicializado' });
        return;
      }
      if (wsRef.current.readyState !== WebSocket.OPEN) {
        onLog({ type: 'ERROR', message: 'WebSocket não está aberto. Estado atual: ' + wsRef.current.readyState });
        return;
      }
      // Envio via WebSocket puro
      try {
        wsRef.current.send(message);
        onLog({ type: 'SENT', message: 'Mensagem enviada', data: message });
      } catch (error) {
        onLog({ type: 'ERROR', message: `Erro ao enviar mensagem: ${error}` });
      }
    } else if (connectionType === 'stomp') {
      if (!stompClientRef.current) {
        onLog({ type: 'ERROR', message: 'Cliente STOMP não inicializado' });
        return;
      }
      if (!stompClientRef.current.connected) {
        onLog({ type: 'ERROR', message: 'STOMP não conectado' });
        return;
      }
      if (!destination) {
        onLog({ type: 'ERROR', message: 'Destino é obrigatório para STOMP' });
        return;
      }
      // Envio via STOMP
      try {
        // Prepara headers (combina headers customizados com headers específicos da mensagem)
        const finalHeaders = { ...customHeadersRef.current, ...headers };

        // Adiciona content-type se não foi especificado
        if (!finalHeaders['content-type'] && !finalHeaders['Content-Type']) {
          finalHeaders['content-type'] = 'application/json';
        }

        // Adiciona Authorization se tiver token configurado
        if (authTokenRef.current && !finalHeaders['Authorization']) {
          // Adiciona "Bearer " automaticamente se não estiver presente
          const token = authTokenRef.current;
          finalHeaders['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Log detalhado para debug
        console.log('[STOMP Send]', {
          destination,
          body: message,
          headers: finalHeaders
        });

        stompClientRef.current.publish({
          destination,
          body: message,
          headers: finalHeaders
        });

        onLog({
          type: 'SENT',
          message: `→ ${destination}`,
          data: `Headers: ${JSON.stringify(finalHeaders)}\n\nBody:\n${message}`
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        onLog({
          type: 'ERROR',
          message: `Erro ao enviar mensagem STOMP: ${errorMsg}`,
          data: `Destino: ${destination}\nMensagem: ${message}`
        });
      }
    }
  }, [connectionType, onLog]);

  return {
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage
  };
}
