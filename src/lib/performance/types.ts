/**
 * Tipos para Performance & Stats
 */

// Métrica de latência individual
export interface LatencyMetric {
  timestamp: Date;
  latency: number; // em ms
  messageType: 'sent' | 'received';
}

// Estatísticas de sessão
export interface SessionStats {
  // Conexão
  connectionStartTime: Date | null;
  connectionEndTime: Date | null;
  connectionDuration: number; // em ms
  status: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Mensagens
  messagesSent: number;
  messagesReceived: number;
  totalMessages: number;

  // Bytes
  bytesSent: number;
  bytesReceived: number;
  totalBytes: number;

  // Taxa (calculado)
  messagesPerSecond: number;
  bytesPerSecond: number;

  // Latência
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  latencyHistory: LatencyMetric[];

  // Erros
  errorCount: number;
  lastError: string | null;
}

// Snapshot de métricas em um momento específico
export interface MetricSnapshot {
  timestamp: Date;
  messagesPerSecond: number;
  bytesPerSecond: number;
  averageLatency: number;
  connectionStatus: string;
}

// Configuração de tracking
export interface PerformanceTrackingConfig {
  maxLatencyHistory: number; // Máximo de pontos de latência a manter (default: 100)
  snapshotInterval: number; // Intervalo de snapshots em ms (default: 1000)
  enableDetailedTracking: boolean; // Track detalhado (default: true)
}
