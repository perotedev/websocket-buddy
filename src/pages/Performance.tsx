/**
 * Página de Performance & Stats
 * Monitoramento em tempo real de métricas de conexão
 */
import { useWebSocketContext } from '@/contexts/WebSocketContext';
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
  // Dados do contexto global
  const { stats, snapshots, resetStats, connectionInfo } = useWebSocketContext();

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

  const isConnected = connectionInfo?.connectedAt && !connectionInfo?.disconnectedAt;
  const status = isConnected ? 'connected' : 'disconnected';

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="space-y-4">
          {/* Status Alert */}
          {status === 'disconnected' && stats.totalMessages === 0 && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Conecte-se na página principal para começar a coletar métricas de performance.
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Info */}
          {connectionInfo && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Informações da Conexão</CardTitle>
                <Button variant="outline" size="sm" onClick={resetStats} className="h-7 text-xs">
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Resetar
                </Button>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-mono">{connectionInfo.url}</span>
                </div>
                {connectionInfo.protocol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocolo:</span>
                    <span className="font-mono">{connectionInfo.protocol}</span>
                  </div>
                )}
                {connectionInfo.connectionType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-mono">{connectionInfo.connectionType}</span>
                  </div>
                )}
                {connectionInfo.connectedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conectado em:</span>
                    <span className="font-mono">{format(connectionInfo.connectedAt, 'HH:mm:ss dd/MM/yyyy')}</span>
                  </div>
                )}
                {connectionInfo.disconnectedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconectado em:</span>
                    <span className="font-mono">{format(connectionInfo.disconnectedAt, 'HH:mm:ss dd/MM/yyyy')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              title="Status"
              value={isConnected ? 'Conectado' : 'Desconectado'}
              subtitle={connectionInfo?.connectedAt ? `Desde ${format(connectionInfo.connectedAt, 'HH:mm:ss')}` : undefined}
              icon={Activity}
              trend={isConnected ? 'up' : 'neutral'}
            />

            <StatsCard
              title="Duração"
              value={formatDuration(stats.connectionDuration)}
              subtitle={connectionInfo?.connectedAt ? 'Tempo conectado' : 'Não conectado'}
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
              subtitle={stats.averageLatency > 0 ? `Min: ${stats.minLatency.toFixed(2)}ms | Max: ${stats.maxLatency.toFixed(2)}ms` : 'Sem dados'}
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
              data={stats.latencyHistory || []}
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
                  <h4 className="font-semibold mb-2">Métricas</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total de Mensagens:</dt>
                      <dd className="font-medium">{stats.totalMessages}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total de Bytes:</dt>
                      <dd className="font-medium">{formatBytes(stats.totalBytes)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Erros:</dt>
                      <dd className="font-medium">{stats.errorCount}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados Coletados</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pontos de Latência:</dt>
                      <dd className="font-medium">{stats.latencyHistory?.length || 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Snapshots:</dt>
                      <dd className="font-medium">{snapshots.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Duração:</dt>
                      <dd className="font-medium">{formatDuration(stats.connectionDuration)}</dd>
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
