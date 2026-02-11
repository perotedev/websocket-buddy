/**
 * JSON Formatter/Validator - Formata e valida JSON
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileJson, AlertCircle, CheckCircle2, Copy, Minimize2, Maximize2 } from 'lucide-react';

export function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleFormat = () => {
    if (!input.trim()) {
      setError('Por favor, insira algum JSON');
      setIsValid(false);
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setError(null);
      setIsValid(true);
    } catch (e: any) {
      setError(`Erro de parsing: ${e.message}`);
      setIsValid(false);
      setOutput('');
    }
  };

  const handleMinify = () => {
    if (!input.trim()) {
      setError('Por favor, insira algum JSON');
      setIsValid(false);
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError(null);
      setIsValid(true);
    } catch (e: any) {
      setError(`Erro de parsing: ${e.message}`);
      setIsValid(false);
      setOutput('');
    }
  };

  const handleValidate = () => {
    if (!input.trim()) {
      setError('Por favor, insira algum JSON');
      setIsValid(false);
      return;
    }

    try {
      JSON.parse(input);
      setError(null);
      setIsValid(true);
      setOutput('');
    } catch (e: any) {
      setError(`JSON inválido: ${e.message}`);
      setIsValid(false);
      setOutput('');
    }
  };

  const handleCopy = () => {
    const textToCopy = output || input;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setIsValid(null);
  };

  const exampleJSON = {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "address": {
      "street": "123 Main St",
      "city": "New York"
    },
    "hobbies": ["reading", "coding", "gaming"]
  };

  const handleLoadExample = () => {
    setInput(JSON.stringify(exampleJSON, null, 2));
    setOutput('');
    setError(null);
    setIsValid(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          JSON Formatter/Validator
        </CardTitle>
        <CardDescription>
          Formata, minifica e valida JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Input JSON</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadExample}
              className="text-xs h-7"
            >
              Carregar Exemplo
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value", "number": 123}'
            className="font-mono text-xs min-h-[150px]"
          />
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={handleFormat} size="sm" variant="default">
            <Maximize2 className="h-4 w-4 mr-1" />
            Formatar
          </Button>
          <Button onClick={handleMinify} size="sm" variant="outline">
            <Minimize2 className="h-4 w-4 mr-1" />
            Minificar
          </Button>
          <Button onClick={handleValidate} size="sm" variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Validar
          </Button>
          <Button onClick={handleClear} size="sm" variant="outline">
            Limpar
          </Button>
        </div>

        {/* Status */}
        {isValid !== null && (
          <Alert className={isValid ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`text-xs ${isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {isValid ? 'JSON válido ✓' : error}
            </AlertDescription>
          </Alert>
        )}

        {/* Output */}
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Output</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
            <Textarea
              value={output}
              readOnly
              className="font-mono text-xs min-h-[150px] bg-muted"
            />
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Formatar:</strong> Identa o JSON com 2 espaços</p>
          <p><strong>Minificar:</strong> Remove espaços e quebras de linha</p>
          <p><strong>Validar:</strong> Verifica se o JSON é válido</p>
        </div>
      </CardContent>
    </Card>
  );
}
