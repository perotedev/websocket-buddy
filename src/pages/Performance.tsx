/**
 * Página de Performance & Stats
 * Monitoramento em tempo real de métricas de conexão
 */
import { useState, useCallback, useEffect } from 'react';
import { useWebSocket, LogEntry, ConnectionType } from '@/hooks/useWebSocket';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatsCard } from '@/components/performance/StatsCard';
import { LatencyChart } from '@/components/performance/LatencyChart';
import { ThroughputChart } from '@/components/performance/ThroughputChart';
import {
  Activity,
  ArrowDownUp,
  Clock,
  Database,
  MessageSquare,
  RotateCcw,
  Zap,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const Performance = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
    ]);
  }, []);

  // Hook do WebSocket
  const {
    status,
    connectionType,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket({ onLog: addLog });

  // Hook de Performance Tracking
  const {
    stats,
    snapshots,
    trackConnectionStart,
    trackConnectionEnd,
    updateConnectionStatus,
    trackMessageSent,
    trackMessageReceived,
    trackError,
    resetStats
  } = usePerformanceTracking();

  // Sincroniza status da conexão
  useEffect(() => {
    updateConnectionStatus(status);

    if (status === 'connecting') {
      trackConnectionStart();
    } else if (status === 'disconnected') {
      trackConnectionEnd();
    }
  }, [status, trackConnectionStart, trackConnectionEnd, updateConnectionStatus]);

  // Monitora novos logs para tracking
  useEffect(() => {
    if (logs.length === 0) return;

    const lastLog = logs[logs.length - 1];

    switch (lastLog.type) {
      case 'SENT':
        trackMessageSent(lastLog.data || lastLog.message);
        break;

      case 'MESSAGE':
        trackMessageReceived(lastLog.data || lastLog.message);
        break;

      case 'ERROR':
        trackError(lastLog.message);
        break;
    }
  }, [logs, trackMessageSent, trackMessageReceived, trackError]);

  // Formata duração
  const formatDuration = (ms: number): string => {
    if (ms === 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Formata bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Calcula duração atual se conectado
  const currentDuration = stats.connectionStartTime && status === 'connected'
    ? Date.now() - stats.connectionStartTime.getTime()
    : stats.connectionDuration;

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Performance & Estatísticas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento em tempo real de métricas de conexão
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetStats}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>

          {/* Status Alert */}
          {status === 'disconnected' && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Conecte-se na página principal para começar a coletar métricas de performance.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              title="Status"
              value={status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando' : 'Desconectado'}
              subtitle={stats.connectionStartTime ? `Desde ${format(stats.connectionStartTime, 'HH:mm:ss')}` : undefined}
              icon={Activity}
              trend={status === 'connected' ? 'up' : status === 'error' ? 'down' : 'neutral'}
            />

            <StatsCard
              title="Duração"
              value={formatDuration(currentDuration)}
              subtitle={stats.connectionStartTime ? 'Tempo conectado' : 'Não conectado'}
              icon={Clock}
            />

            <StatsCard
              title="Mensagens"
              value={stats.totalMessages}
              subtitle={`↑ ${stats.messagesSent} | ↓ ${stats.messagesReceived}`}
              icon={MessageSquare}
            />

            <StatsCard
              title="Dados"
              value={formatBytes(stats.totalBytes)}
              subtitle={`↑ ${formatBytes(stats.bytesSent)} | ↓ ${formatBytes(stats.bytesReceived)}`}
              icon={Database}
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatsCard
              title="Latência Média"
              value={`${stats.averageLatency.toFixed(2)} ms`}
              subtitle={stats.latencyHistory.length > 0 ? `Min: ${stats.minLatency.toFixed(2)}ms | Max: ${stats.maxLatency.toFixed(2)}ms` : 'Sem dados'}
              icon={Zap}
            />

            <StatsCard
              title="Taxa de Mensagens"
              value={`${stats.messagesPerSecond.toFixed(2)} /s`}
              subtitle="Mensagens por segundo"
              icon={ArrowDownUp}
            />

            <StatsCard
              title="Taxa de Dados"
              value={`${formatBytes(stats.bytesPerSecond)}/s`}
              subtitle="Throughput de dados"
              icon={TrendingUp}
            />
          </div>

          {/* Errors */}
          {stats.errorCount > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Erros Detectados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>Total:</strong> {stats.errorCount}
                </p>
                {stats.lastError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Último:</strong> {stats.lastError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LatencyChart
              data={stats.latencyHistory}
              averageLatency={stats.averageLatency}
            />

            <ThroughputChart data={snapshots} />
          </div>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Sessão</CardTitle>
              <CardDescription>Informações detalhadas da conexão atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Conexão</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tipo:</dt>
                      <dd className="font-medium">{connectionType || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-medium">{stats.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Inscrições:</dt>
                      <dd className="font-medium">{subscribedTopics.length}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Métricas</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pontos de Latência:</dt>
                      <dd className="font-medium">{stats.latencyHistory.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Snapshots:</dt>
                      <dd className="font-medium">{snapshots.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Erros:</dt>
                      <dd className="font-medium">{stats.errorCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Performance;
