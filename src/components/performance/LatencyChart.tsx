/**
 * Gráfico de latência ao longo do tempo
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LatencyMetric } from '@/lib/performance/types';
import { format } from 'date-fns';

interface LatencyChartProps {
  data: LatencyMetric[];
  averageLatency: number;
}

export function LatencyChart({ data, averageLatency }: LatencyChartProps) {
  // Formata dados para o gráfico
  const chartData = data.map((metric) => ({
    time: format(metric.timestamp, 'HH:mm:ss'),
    latency: metric.latency,
    fullTime: metric.timestamp
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latência ao Longo do Tempo</CardTitle>
        <CardDescription>
          Média: {averageLatency.toFixed(2)}ms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Nenhum dado de latência disponível. Envie mensagens para ver o gráfico.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Latência (ms)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
