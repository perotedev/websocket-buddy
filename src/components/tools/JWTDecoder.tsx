/**
 * JWT Decoder - Decodifica e valida tokens JWT
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, AlertCircle, CheckCircle2, Copy } from 'lucide-react';

interface DecodedJWT {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
  error?: string;
}

function decodeJWT(token: string): DecodedJWT {
  try {
    const parts = token.trim().split('.');

    if (parts.length !== 3) {
      throw new Error('Token JWT inválido: deve ter 3 partes separadas por ponto');
    }

    // Decodifica header
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

    // Decodifica payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Signature (não decodificamos, apenas mostramos)
    const signature = parts[2];

    // Verifica expiração
    let isValid = true;
    let error: string | undefined;

    if (payload.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();

      if (expirationDate < now) {
        isValid = false;
        error = `Token expirado em ${expirationDate.toLocaleString()}`;
      }
    }

    return { header, payload, signature, isValid, error };
  } catch (error) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValid: false,
      error: `Erro ao decodificar: ${error}`
    };
  }
}

export function JWTDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);

  const handleDecode = () => {
    if (!token.trim()) {
      setDecoded(null);
      return;
    }

    const result = decodeJWT(token);
    setDecoded(result);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          JWT Decoder
        </CardTitle>
        <CardDescription>
          Decodifica e valida tokens JWT (JSON Web Token)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Cole seu token JWT aqui (ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
            className="font-mono text-xs min-h-[100px]"
          />
          <Button onClick={handleDecode} size="sm" className="w-full">
            <Key className="h-4 w-4 mr-2" />
            Decodificar Token
          </Button>
        </div>

        {/* Resultado */}
        {decoded && (
          <div className="space-y-3">
            {/* Status */}
            {decoded.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {decoded.error}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className={decoded.isValid ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}>
                {decoded.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertDescription className={`text-xs ${decoded.isValid ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                  {decoded.isValid ? 'Token válido' : decoded.error || 'Token inválido'}
                </AlertDescription>
              </Alert>
            )}

            {/* Header */}
            {decoded.header && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Header</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px]">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
                <div className="flex gap-2 flex-wrap">
                  {decoded.header.alg && (
                    <Badge variant="outline" className="text-[10px]">
                      Algoritmo: {decoded.header.alg}
                    </Badge>
                  )}
                  {decoded.header.typ && (
                    <Badge variant="outline" className="text-[10px]">
                      Tipo: {decoded.header.typ}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Payload */}
            {decoded.payload && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Payload (Claims)</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>

                {/* Claims conhecidos */}
                <div className="space-y-1 text-xs">
                  {decoded.payload.iss && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issuer (iss):</span>
                      <span className="font-mono">{decoded.payload.iss}</span>
                    </div>
                  )}
                  {decoded.payload.sub && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subject (sub):</span>
                      <span className="font-mono">{decoded.payload.sub}</span>
                    </div>
                  )}
                  {decoded.payload.aud && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Audience (aud):</span>
                      <span className="font-mono">{decoded.payload.aud}</span>
                    </div>
                  )}
                  {decoded.payload.exp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires (exp):</span>
                      <span className="font-mono">{formatDate(decoded.payload.exp)}</span>
                    </div>
                  )}
                  {decoded.payload.iat && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issued At (iat):</span>
                      <span className="font-mono">{formatDate(decoded.payload.iat)}</span>
                    </div>
                  )}
                  {decoded.payload.nbf && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Not Before (nbf):</span>
                      <span className="font-mono">{formatDate(decoded.payload.nbf)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signature */}
            {decoded.signature && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Signature</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(decoded.signature)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {decoded.signature}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ⚠️ A assinatura não é validada neste decoder. Use uma biblioteca server-side para validação completa.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
