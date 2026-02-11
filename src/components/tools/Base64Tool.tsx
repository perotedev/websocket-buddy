/**
 * Base64 Encoder/Decoder - Converte de/para Base64
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock, Copy, AlertCircle } from 'lucide-react';

export function Base64Tool() {
  const [encodeInput, setEncodeInput] = useState('');
  const [encodeOutput, setEncodeOutput] = useState('');

  const [decodeInput, setDecodeInput] = useState('');
  const [decodeOutput, setDecodeOutput] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Encoder
  const handleEncode = () => {
    if (!encodeInput) {
      setEncodeOutput('');
      return;
    }

    try {
      const encoded = btoa(encodeInput);
      setEncodeOutput(encoded);
    } catch (error) {
      setEncodeOutput('Erro: Caracteres inválidos para codificação');
    }
  };

  const handleEncodeUTF8 = () => {
    if (!encodeInput) {
      setEncodeOutput('');
      return;
    }

    try {
      // Suporta caracteres UTF-8
      const encoded = btoa(unescape(encodeURIComponent(encodeInput)));
      setEncodeOutput(encoded);
    } catch (error) {
      setEncodeOutput('Erro ao codificar');
    }
  };

  // Decoder
  const handleDecode = () => {
    if (!decodeInput.trim()) {
      setDecodeOutput('');
      setDecodeError(null);
      return;
    }

    try {
      const decoded = atob(decodeInput.trim());
      setDecodeOutput(decoded);
      setDecodeError(null);
    } catch (error) {
      setDecodeOutput('');
      setDecodeError('Base64 inválido. Verifique se o texto está corretamente codificado.');
    }
  };

  const handleDecodeUTF8 = () => {
    if (!decodeInput.trim()) {
      setDecodeOutput('');
      setDecodeError(null);
      return;
    }

    try {
      // Suporta caracteres UTF-8
      const decoded = decodeURIComponent(escape(atob(decodeInput.trim())));
      setDecodeOutput(decoded);
      setDecodeError(null);
    } catch (error) {
      setDecodeOutput('');
      setDecodeError('Base64 inválido ou erro de UTF-8.');
    }
  };

  const handleCopyEncode = () => {
    navigator.clipboard.writeText(encodeOutput);
  };

  const handleCopyDecode = () => {
    navigator.clipboard.writeText(decodeOutput);
  };

  const handleLoadExample = () => {
    setEncodeInput('Hello, WebSocket Buddy! 🚀');
    setEncodeOutput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Base64 Encoder/Decoder
        </CardTitle>
        <CardDescription>
          Codifica texto para Base64 ou decodifica Base64 para texto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="encode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode">
              <Lock className="h-4 w-4 mr-2" />
              Codificar
            </TabsTrigger>
            <TabsTrigger value="decode">
              <Unlock className="h-4 w-4 mr-2" />
              Decodificar
            </TabsTrigger>
          </TabsList>

          {/* Encode Tab */}
          <TabsContent value="encode" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Texto Original</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadExample}
                  className="text-xs h-7"
                >
                  Exemplo
                </Button>
              </div>
              <Textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                placeholder="Digite o texto para codificar..."
                className="font-mono text-xs min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleEncode} size="sm" variant="default">
                <Lock className="h-4 w-4 mr-2" />
                Codificar (ASCII)
              </Button>
              <Button onClick={handleEncodeUTF8} size="sm" variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Codificar (UTF-8)
              </Button>
            </div>

            {encodeOutput && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Base64 Codificado</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEncode}
                    className="h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <Textarea
                  value={encodeOutput}
                  readOnly
                  className="font-mono text-xs min-h-[100px] bg-muted"
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p><strong>ASCII:</strong> Para texto simples em inglês</p>
              <p><strong>UTF-8:</strong> Suporta acentos e caracteres especiais (português, emojis, etc.)</p>
            </div>
          </TabsContent>

          {/* Decode Tab */}
          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Base64 para Decodificar</label>
              <Textarea
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder="Cole o texto Base64 aqui..."
                className="font-mono text-xs min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDecode} size="sm" variant="default">
                <Unlock className="h-4 w-4 mr-2" />
                Decodificar (ASCII)
              </Button>
              <Button onClick={handleDecodeUTF8} size="sm" variant="outline">
                <Unlock className="h-4 w-4 mr-2" />
                Decodificar (UTF-8)
              </Button>
            </div>

            {decodeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {decodeError}
                </AlertDescription>
              </Alert>
            )}

            {decodeOutput && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Texto Decodificado</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDecode}
                    className="h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <Textarea
                  value={decodeOutput}
                  readOnly
                  className="font-mono text-xs min-h-[100px] bg-muted"
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>💡 Use UTF-8 se o texto contiver acentos ou caracteres especiais</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
