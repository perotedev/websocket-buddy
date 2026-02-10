/**
 * Página de Ferramentas Utilitárias
 * Conjunto de ferramentas úteis para desenvolvimento
 */
import { JWTDecoder } from '@/components/tools/JWTDecoder';
import { JSONFormatter } from '@/components/tools/JSONFormatter';
import { Base64Tool } from '@/components/tools/Base64Tool';
import { TimestampConverter } from '@/components/tools/TimestampConverter';

const Tools = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Ferramentas Utilitárias</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ferramentas úteis para desenvolvimento e depuração
            </p>
          </div>

          {/* Grid de Ferramentas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* JWT Decoder */}
            <JWTDecoder />

            {/* JSON Formatter */}
            <JSONFormatter />

            {/* Base64 Tool */}
            <Base64Tool />

            {/* Timestamp Converter */}
            <TimestampConverter />
          </div>

          {/* Info Footer */}
          <div className="border-t pt-4 mt-8">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">💡 Dicas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Todas as ferramentas funcionam offline, sem enviar dados para servidores externos</li>
                <li>Use o botão "Copiar" para copiar resultados rapidamente</li>
                <li>Dados não são salvos - tudo é processado apenas na sua sessão</li>
                <li>Perfeito para testar payloads de WebSocket, validar tokens JWT, etc.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
