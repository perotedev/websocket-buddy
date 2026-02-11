/**
 * Timestamp Converter - Converte entre formatos de data/hora
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, Copy, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConvertFromTimestamp = () => {
    try {
      const num = parseInt(timestamp);
      if (isNaN(num)) {
        setDate(null);
        return;
      }

      // Detecta se é em segundos ou milissegundos
      const timestampMs = num.toString().length === 10 ? num * 1000 : num;
      setDate(new Date(timestampMs));
    } catch (error) {
      setDate(null);
    }
  };

  const handleUseNow = () => {
    const now = Date.now();
    setTimestamp(now.toString());
    setDate(new Date(now));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleConvertToTimestamp = (inputDate: string) => {
    try {
      const d = new Date(inputDate);
      if (!isNaN(d.getTime())) {
        setTimestamp(d.getTime().toString());
        setDate(d);
      }
    } catch (error) {
      // Ignora erro silenciosamente
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timestamp Converter
        </CardTitle>
        <CardDescription>
          Converte entre Unix timestamp e data legível
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relógio Atual */}
        <div className="border rounded-lg p-4 bg-muted">
          <div className="text-center space-y-2">
            <div className="text-2xl font-mono font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentTime, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
            </div>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xs bg-background px-2 py-1 rounded">
                {currentTime.getTime()}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(currentTime.getTime().toString())}
                className="h-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conversor de Timestamp para Data */}
        <div className="space-y-2">
          <Label htmlFor="timestamp" className="text-sm font-medium">
            Unix Timestamp (ms ou s)
          </Label>
          <div className="flex gap-2">
            <Input
              id="timestamp"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              onBlur={handleConvertFromTimestamp}
              placeholder="1704067200000"
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleUseNow}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Agora
            </Button>
          </div>
        </div>

        {/* Conversor de Data para Timestamp */}
        <div className="space-y-2">
          <Label htmlFor="datetime" className="text-sm font-medium">
            Data e Hora
          </Label>
          <Input
            id="datetime"
            type="datetime-local"
            onChange={(e) => handleConvertToTimestamp(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Resultado */}
        {date && !isNaN(date.getTime()) && (
          <div className="border rounded-lg p-3 space-y-3">
            <h4 className="font-semibold text-sm">Resultado da Conversão</h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ISO 8601:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {date.toISOString()}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(date.toISOString())}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Locale String:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {date.toLocaleString('pt-BR')}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(date.toLocaleString('pt-BR'))}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">UTC String:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {date.toUTCString()}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(date.toUTCString())}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Timestamp (ms):</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {date.getTime()}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(date.getTime().toString())}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Timestamp (s):</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {Math.floor(date.getTime() / 1000)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(Math.floor(date.getTime() / 1000).toString())}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Unix Timestamp:</strong> Número de milissegundos (ou segundos) desde 1 de janeiro de 1970 (UTC)</p>
          <p><strong>Dica:</strong> Timestamps com 10 dígitos são em segundos, com 13 dígitos são em milissegundos</p>
        </div>
      </CardContent>
    </Card>
  );
}
