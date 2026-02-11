/**
 * Tipos para exportação/importação
 */
import { LogEntry } from '@/hooks/useWebSocket';
import { SessionStats } from '@/lib/performance/types';

// Formato de conexão exportável
export interface ConnectionProfile {
  name: string;
  url: string;
  type: 'websocket' | 'stomp';
  token?: string;
  headers?: Record<string, string>;
  description?: string;
  createdAt: string;
  tags?: string[];
}

// Formato de sessão exportável
export interface SessionExport {
  sessionId: string;
  startTime: string;
  endTime?: string;
  connection: {
    url: string;
    type: string;
    status: string;
  };
  logs: LogEntry[];
  stats?: SessionStats;
  chartAverages?: {
    averageMessagesPerSecond: number;
    averageBytesPerSecond: number;
    peakMessagesPerSecond: number;
    peakBytesPerSecond: number;
    totalSnapshots: number;
  };
  metadata?: {
    appVersion: string;
    userAgent: string;
    exportedAt: string;
  };
}

// Formato de logs exportável
export interface LogsExport {
  exportedAt: string;
  totalLogs: number;
  logs: LogEntry[];
  filters?: {
    startDate?: string;
    endDate?: string;
    types?: string[];
  };
}

// Opções de exportação
export interface ExportOptions {
  includeData?: boolean;
  includeTimestamps?: boolean;
  includeTypes?: boolean;
  dateFormat?: 'iso' | 'locale' | 'timestamp';
}
