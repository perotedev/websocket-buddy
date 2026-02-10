/**
 * Hook para tracking de performance e estatísticas
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SessionStats,
  LatencyMetric,
  MetricSnapshot,
  PerformanceTrackingConfig
} from '@/lib/performance/types';
import { ConnectionStatus } from './useWebSocket';

const DEFAULT_CONFIG: PerformanceTrackingConfig = {
  maxLatencyHistory: 100,
  snapshotInterval: 1000,
  enableDetailedTracking: true
};

export function usePerformanceTracking(config: Partial<PerformanceTrackingConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [stats, setStats] = useState<SessionStats>({
    connectionStartTime: null,
    connectionEndTime: null,
    connectionDuration: 0,
    status: 'disconnected',
    messagesSent: 0,
    messagesReceived: 0,
    totalMessages: 0,
    bytesSent: 0,
    bytesReceived: 0,
    totalBytes: 0,
    messagesPerSecond: 0,
    bytesPerSecond: 0,
    averageLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    latencyHistory: [],
    errorCount: 0,
    lastError: null
  });

  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotTimeRef = useRef<Date>(new Date());
  const messageTimestampsRef = useRef<Map<string, Date>>(new Map());

  /**
   * Registra início de conexão
   */
  const trackConnectionStart = useCallback(() => {
    const now = new Date();
    setStats(prev => ({
      ...prev,
      connectionStartTime: now,
      connectionEndTime: null,
      status: 'connecting'
    }));

    // Inicia snapshots periódicos
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }

    snapshotIntervalRef.current = setInterval(() => {
      const snapshot: MetricSnapshot = {
        timestamp: new Date(),
        messagesPerSecond: stats.messagesPerSecond,
        bytesPerSecond: stats.bytesPerSecond,
        averageLatency: stats.averageLatency,
        connectionStatus: stats.status
      };

      setSnapshots(prev => {
        const updated = [...prev, snapshot];
        // Mantém apenas últimos 60 snapshots (1 minuto se interval = 1s)
        return updated.slice(-60);
      });
    }, finalConfig.snapshotInterval);
  }, [finalConfig.snapshotInterval, stats]);

  /**
   * Registra fim de conexão
   */
  const trackConnectionEnd = useCallback(() => {
    const now = new Date();
    setStats(prev => {
      const duration = prev.connectionStartTime
        ? now.getTime() - prev.connectionStartTime.getTime()
        : 0;

      return {
        ...prev,
        connectionEndTime: now,
        connectionDuration: duration,
        status: 'disconnected'
      };
    });

    // Para snapshots
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  }, []);

  /**
   * Atualiza status da conexão
   */
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setStats(prev => ({ ...prev, status }));

    if (status === 'connected') {
      setStats(prev => ({
        ...prev,
        connectionStartTime: prev.connectionStartTime || new Date()
      }));
    }
  }, []);

  /**
   * Registra mensagem enviada
   */
  const trackMessageSent = useCallback((message: string, messageId?: string) => {
    const bytes = new Blob([message]).size;
    const id = messageId || crypto.randomUUID();
    const now = new Date();

    // Armazena timestamp para calcular latência quando receber resposta
    messageTimestampsRef.current.set(id, now);

    setStats(prev => {
      const newMessagesSent = prev.messagesSent + 1;
      const newBytesSent = prev.bytesSent + bytes;
      const newTotal = newMessagesSent + prev.messagesReceived;

      // Calcula taxa
      const timeSinceStart = prev.connectionStartTime
        ? (now.getTime() - prev.connectionStartTime.getTime()) / 1000
        : 1;

      return {
        ...prev,
        messagesSent: newMessagesSent,
        bytesSent: newBytesSent,
        totalMessages: newTotal,
        totalBytes: newBytesSent + prev.bytesReceived,
        messagesPerSecond: newTotal / Math.max(timeSinceStart, 1),
        bytesPerSecond: (newBytesSent + prev.bytesReceived) / Math.max(timeSinceStart, 1)
      };
    });

    return id;
  }, []);

  /**
   * Registra mensagem recebida
   */
  const trackMessageReceived = useCallback((message: string, relatedMessageId?: string) => {
    const bytes = new Blob([message]).size;
    const now = new Date();

    // Calcula latência se tiver mensagem relacionada
    let latency: number | null = null;
    if (relatedMessageId && messageTimestampsRef.current.has(relatedMessageId)) {
      const sentTime = messageTimestampsRef.current.get(relatedMessageId)!;
      latency = now.getTime() - sentTime.getTime();
      messageTimestampsRef.current.delete(relatedMessageId);
    }

    setStats(prev => {
      const newMessagesReceived = prev.messagesReceived + 1;
      const newBytesReceived = prev.bytesReceived + bytes;
      const newTotal = prev.messagesSent + newMessagesReceived;

      // Atualiza histórico de latência
      let newLatencyHistory = [...prev.latencyHistory];
      let newAvgLatency = prev.averageLatency;
      let newMinLatency = prev.minLatency;
      let newMaxLatency = prev.maxLatency;

      if (latency !== null) {
        const latencyMetric: LatencyMetric = {
          timestamp: now,
          latency,
          messageType: 'received'
        };

        newLatencyHistory.push(latencyMetric);
        // Mantém apenas últimos N pontos
        if (newLatencyHistory.length > finalConfig.maxLatencyHistory) {
          newLatencyHistory = newLatencyHistory.slice(-finalConfig.maxLatencyHistory);
        }

        // Recalcula estatísticas de latência
        const latencies = newLatencyHistory.map(l => l.latency);
        newAvgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        newMinLatency = Math.min(...latencies);
        newMaxLatency = Math.max(...latencies);
      }

      // Calcula taxa
      const timeSinceStart = prev.connectionStartTime
        ? (now.getTime() - prev.connectionStartTime.getTime()) / 1000
        : 1;

      return {
        ...prev,
        messagesReceived: newMessagesReceived,
        bytesReceived: newBytesReceived,
        totalMessages: newTotal,
        totalBytes: prev.bytesSent + newBytesReceived,
        messagesPerSecond: newTotal / Math.max(timeSinceStart, 1),
        bytesPerSecond: (prev.bytesSent + newBytesReceived) / Math.max(timeSinceStart, 1),
        latencyHistory: newLatencyHistory,
        averageLatency: newAvgLatency,
        minLatency: newMinLatency,
        maxLatency: newMaxLatency
      };
    });
  }, [finalConfig.maxLatencyHistory]);

  /**
   * Registra erro
   */
  const trackError = useCallback((error: string) => {
    setStats(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastError: error
    }));
  }, []);

  /**
   * Reseta estatísticas
   */
  const resetStats = useCallback(() => {
    setStats({
      connectionStartTime: null,
      connectionEndTime: null,
      connectionDuration: 0,
      status: 'disconnected',
      messagesSent: 0,
      messagesReceived: 0,
      totalMessages: 0,
      bytesSent: 0,
      bytesReceived: 0,
      totalBytes: 0,
      messagesPerSecond: 0,
      bytesPerSecond: 0,
      averageLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      latencyHistory: [],
      errorCount: 0,
      lastError: null
    });
    setSnapshots([]);
    messageTimestampsRef.current.clear();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, []);

  return {
    stats,
    snapshots,
    trackConnectionStart,
    trackConnectionEnd,
    updateConnectionStatus,
    trackMessageSent,
    trackMessageReceived,
    trackError,
    resetStats
  };
}
