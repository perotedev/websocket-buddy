/**
 * WebSocket Context - Store de dados compartilhado
 * Armazena logs, performance e info de conexão para acesso global
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LogEntry } from '@/hooks/useWebSocket';
import type { SessionStats, MetricSnapshot } from '@/lib/performance/types';

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

interface WebSocketContextValue {
  // Logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Performance
  stats: SessionStats;
  snapshots: MetricSnapshot[];
  updateStats: (stats: Partial<SessionStats>) => void;
  addSnapshot: (snapshot: MetricSnapshot) => void;
  resetStats: () => void;

  // Info da conexão
  connectionInfo: ConnectionInfo | null;
  setConnectionInfo: (info: ConnectionInfo | null) => void;

  // Configuração de conexão (para preservar formulário)
  connectionConfig: ConnectionConfig;
  setConnectionConfig: (config: ConnectionConfig) => void;
}

const defaultStats: SessionStats = {
  totalMessages: 0,
  messagesSent: 0,
  messagesReceived: 0,
  totalBytes: 0,
  bytesSent: 0,
  bytesReceived: 0,
  averageLatency: 0,
  minLatency: 0,
  maxLatency: 0,
  errors: 0,
  connectionDuration: 0,
  messagesPerSecond: 0,
  bytesPerSecond: 0,
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const defaultConnectionConfig: ConnectionConfig = {
  url: 'wss://echo.websocket.org',
  type: 'websocket',
};

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SessionStats>(defaultStats);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>(defaultConnectionConfig);

  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const updateStats = useCallback((newStats: Partial<SessionStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  const addSnapshot = useCallback((snapshot: MetricSnapshot) => {
    setSnapshots((prev) => {
      const updated = [...prev, snapshot];
      // Manter apenas os últimos 60 snapshots (1 minuto se captura a cada 1s)
      return updated.slice(-60);
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
    setSnapshots([]);
    setLogs([]);
    setConnectionInfo(null);
  }, []);

  const value: WebSocketContextValue = {
    logs,
    addLog,
    clearLogs,
    stats,
    snapshots,
    updateStats,
    addSnapshot,
    resetStats,
    connectionInfo,
    setConnectionInfo,
    connectionConfig,
    setConnectionConfig,
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
