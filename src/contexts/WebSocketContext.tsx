/**
 * WebSocket Context - Store de dados compartilhado e gerenciamento global da conexão
 * Armazena logs, performance, info de conexão e mantém WebSocket ativo globalmente
 */
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useWebSocket as useWebSocketHook, ConnectionType, ConnectionStatus } from '@/hooks/useWebSocket';
import type { LogEntry } from '@/hooks/useWebSocket';
import type { SessionStats, MetricSnapshot } from '@/lib/performance/types';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';

interface ConnectionInfo {
  url: string;
  protocol?: string;
  connectionType?: 'websocket' | 'stomp';
  connectedAt?: Date;
  disconnectedAt?: Date;
}

interface ConnectionConfig {
  url: string;
  type: 'websocket' | 'stomp';
  token?: string;
  headers?: Record<string, string>;
}

interface SubscribedTopic {
  id: string;
  destination: string;
}

interface WebSocketContextValue {
  // Logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Performance
  stats: SessionStats;
  snapshots: MetricSnapshot[];
  resetStats: () => void;

  // Info da conexão
  connectionInfo: ConnectionInfo | null;
  setConnectionInfo: (info: ConnectionInfo | null) => void;

  // Configuração de conexão (para preservar formulário)
  connectionConfig: ConnectionConfig;
  setConnectionConfig: (config: ConnectionConfig) => void;

  // Controle de WebSocket (mantido globalmente)
  status: ConnectionStatus;
  connectionType: ConnectionType;
  subscribedTopics: SubscribedTopic[];
  connect: (url: string, type: ConnectionType, token?: string, customHeaders?: Record<string, string>) => void;
  disconnect: () => void;
  cancelConnection: () => void;
  subscribe: (destination: string) => void;
  unsubscribe: (topicId: string) => void;
  sendMessage: (message: string, destination?: string) => void;

  // Estado do painel de ações (persistido entre navegações)
  actionPanelState: ActionPanelState;
  setActionPanelState: (state: Partial<ActionPanelState>) => void;
}

interface ActionPanelState {
  message: string;
  destination: string;
  headers: string;
  messageFormat: 'raw' | 'json';
  activeTab: string;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const defaultConnectionConfig: ConnectionConfig = {
  url: '',
  type: 'websocket',
};

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>(defaultConnectionConfig);
  const [actionPanelState, setActionPanelStateRaw] = useState<ActionPanelState>({
    message: '',
    destination: '',
    headers: '',
    messageFormat: 'json',
    activeTab: 'subscriptions',
  });

  const setActionPanelState = useCallback((partial: Partial<ActionPanelState>) => {
    setActionPanelStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

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
    resetStats: resetPerfStats,
  } = usePerformanceTracking({
    snapshotInterval: 1000,
    maxLatencyHistory: 60,
  });

  // Callback para adicionar logs e track performance
  const handleLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog]);

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
  }, [trackMessageSent, trackMessageReceived, trackError]);

  // Hook do WebSocket (mantido globalmente)
  const {
    status,
    connectionType,
    subscribedTopics,
    connect: wsConnect,
    disconnect: wsDisconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage,
  } = useWebSocketHook({ onLog: handleLog });

  // Sincronizar status de conexão com performance tracking
  useEffect(() => {
    updateConnectionStatus(status);
  }, [status, updateConnectionStatus]);

  // Atualizar connectionInfo quando conectar/desconectar
  const prevStatusRef = useRef<ConnectionStatus>('disconnected');
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Só executa na transição de status
    if (status === prevStatus) return;

    if (status === 'connected') {
      trackConnectionStart();
      setConnectionInfo({
        url: connectionConfig.url,
        connectionType,
        connectedAt: new Date(),
      });
    } else if (status === 'disconnected') {
      trackConnectionEnd();
      setConnectionInfo((prev) => prev?.connectedAt ? {
        ...prev,
        disconnectedAt: new Date(),
      } : prev);
    }
  }, [status, connectionType, connectionConfig.url, trackConnectionStart, trackConnectionEnd]);

  // Função wrapper para connect que salva config
  const connect = useCallback((url: string, type: ConnectionType, token?: string, customHeaders?: Record<string, string>) => {
    setConnectionConfig({
      url,
      type,
      token,
      headers: customHeaders,
    });
    wsConnect(url, type, token, customHeaders);
  }, [wsConnect]);

  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    handleLog(log);
  }, [handleLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetStats = useCallback(() => {
    resetPerfStats();
    setLogs([]);
    setConnectionInfo(null);
  }, [resetPerfStats]);

  const value: WebSocketContextValue = {
    logs,
    addLog,
    clearLogs,
    stats,
    snapshots,
    resetStats,
    connectionInfo,
    setConnectionInfo,
    connectionConfig,
    setConnectionConfig,
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect: wsDisconnect,
    cancelConnection,
    subscribe,
    unsubscribe,
    sendMessage,
    actionPanelState,
    setActionPanelState,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}
