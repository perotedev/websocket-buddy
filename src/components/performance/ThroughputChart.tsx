/**
 * Gráfico de throughput (mensagens/segundo) ao longo do tempo
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricSnapshot } from '@/lib/performance/types';
import { format } from 'date-fns';

interface ThroughputChartProps {
  data: MetricSnapshot[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  // Formata dados para o gráfico
  const chartData = data.map((snapshot) => ({
    time: format(snapshot.timestamp, 'HH:mm:ss'),
    messagesPerSecond: parseFloat(snapshot.messagesPerSecond.toFixed(2)),
    bytesPerSecond: parseFloat((snapshot.bytesPerSecond / 1024).toFixed(2)), // KB/s
    fullTime: snapshot.timestamp
  }));

  const currentRate = data.length > 0
    ? data[data.length - 1].messagesPerSecond.toFixed(2)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Throughput</CardTitle>
        <CardDescription>
          Taxa atual: {currentRate} mensagens/segundo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Conecte e envie mensagens para ver o throughput em tempo real.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{
                  value: 'Mensagens/s',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} msg/s`, 'Taxa']}
              />
              <Area
                type="monotone"
                dataKey="messagesPerSecond"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
