/**
 * Página de Exportação e Importação
 * Exporta logs, conexões e relatórios
 */
import { useState, useRef } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  FileJson,
  FileText,
  FileCode,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  exportLogsAsJSON,
  exportLogsAsCSV,
  exportLogsAsTXT,
  exportConnectionProfile,
  exportSession,
  exportSessionReportHTML,
  importConnectionProfile,
  ConnectionProfile
} from '@/lib/export';

const Export = () => {
  const { logs, stats, connectionInfo } = useWebSocketContext();

  const [connectionName, setConnectionName] = useState('');
  const [connectionDescription, setConnectionDescription] = useState('');
  const [importedProfile, setImportedProfile] = useState<ConnectionProfile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Converter logs do contexto para o formato esperado pelas funções de export
  const convertedLogs = logs.map(log => ({
    id: log.id,
    timestamp: log.timestamp,
    type: log.type,
    message: log.message,
    data: log.data
  }));

  // Handlers de exportação de logs
  const handleExportLogsJSON = () => {
    exportLogsAsJSON(convertedLogs);
    showSuccessMessage('Logs exportados em JSON com sucesso!');
  };

  const handleExportLogsCSV = () => {
    exportLogsAsCSV(convertedLogs);
    showSuccessMessage('Logs exportados em CSV com sucesso!');
  };

  const handleExportLogsTXT = () => {
    exportLogsAsTXT(convertedLogs);
    showSuccessMessage('Logs exportados em TXT com sucesso!');
  };

  // Handler de exportação de sessão
  const handleExportSession = () => {
    exportSession(convertedLogs, stats, {
      url: connectionInfo?.url || 'N/A',
      type: connectionInfo?.connectionType || 'unknown'
    });
    showSuccessMessage('Sessão exportada com sucesso!');
  };

  // Handler de exportação de relatório HTML
  const handleExportReportHTML = () => {
    exportSessionReportHTML(convertedLogs, stats, {
      url: connectionInfo?.url || 'N/A',
      type: connectionInfo?.connectionType || 'unknown'
    });
    showSuccessMessage('Relatório HTML gerado com sucesso!');
  };

  // Handler de exportação de perfil de conexão
  const handleExportConnection = () => {
    if (!connectionName.trim()) {
      setImportError('Por favor, forneça um nome para a conexão');
      return;
    }

    const profile: ConnectionProfile = {
      name: connectionName,
      url: connectionInfo?.url || '',
      type: (connectionInfo?.connectionType as 'websocket' | 'stomp') || 'websocket',
      description: connectionDescription,
      createdAt: new Date().toISOString(),
      tags: []
    };

    exportConnectionProfile(profile);
    showSuccessMessage(`Perfil "${connectionName}" exportado com sucesso!`);
    setConnectionName('');
    setConnectionDescription('');
  };

  // Handler de importação de perfil de conexão
  const handleImportConnection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const profile = importConnectionProfile(content);
        setImportedProfile(profile);
        setImportError(null);
        showSuccessMessage(`Perfil "${profile.name}" importado com sucesso!`);
      } catch (error) {
        setImportError(`Erro ao importar: ${error}`);
        setImportedProfile(null);
      }
    };
    reader.readAsText(file);
  };

  // Mostra mensagem de sucesso temporária
  const showSuccessMessage = (message: string) => {
    setExportSuccess(message);
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const isConnected = connectionInfo?.connectedAt && !connectionInfo?.disconnectedAt;
  const status = isConnected ? 'connected' : 'disconnected';

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Exportação e Importação</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Exporte logs, conexões e relatórios ou importe configurações salvas
            </p>
          </div>

          {/* Success Alert */}
          {exportSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                {exportSuccess}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna Esquerda - Exportação */}
            <div className="space-y-4">
              {/* Exportar Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Logs
                  </CardTitle>
                  <CardDescription>
                    {logs.length} log(s) disponível(is) para exportação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportLogsJSON}
                      disabled={logs.length === 0}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <FileJson className="h-5 w-5" />
                      <span className="text-xs">JSON</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportLogsCSV}
                      disabled={logs.length === 0}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">CSV</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportLogsTXT}
                      disabled={logs.length === 0}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <FileCode className="h-5 w-5" />
                      <span className="text-xs">TXT</span>
                    </Button>
                  </div>

                  {logs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Conecte e use o WebSocket na página principal para gerar logs
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Exportar Sessão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Exportar Sessão Completa
                  </CardTitle>
                  <CardDescription>
                    Exporta logs + estatísticas + informações de conexão
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSession}
                    disabled={logs.length === 0}
                    className="w-full"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Exportar Sessão (JSON)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportReportHTML}
                    disabled={logs.length === 0}
                    className="w-full"
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Gerar Relatório (HTML)
                  </Button>
                </CardContent>
              </Card>

              {/* Exportar Perfil de Conexão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Criar Perfil de Conexão
                  </CardTitle>
                  <CardDescription>
                    Salve configurações de conexão para reutilizar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="conn-name" className="text-xs">
                      Nome do Perfil
                    </Label>
                    <Input
                      id="conn-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="Meu Servidor WebSocket"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-desc" className="text-xs">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id="conn-desc"
                      value={connectionDescription}
                      onChange={(e) => setConnectionDescription(e.target.value)}
                      placeholder="Servidor de desenvolvimento..."
                      className="text-xs min-h-[60px]"
                    />
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExportConnection}
                    disabled={!connectionName.trim()}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Perfil
                  </Button>

                  <p className="text-[10px] text-muted-foreground">
                    💡 O perfil incluirá a URL da conexão atual se houver
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Importação */}
            <div className="space-y-4">
              {/* Importar Perfil de Conexão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importar Perfil de Conexão
                  </CardTitle>
                  <CardDescription>
                    Carregue um perfil de conexão salvo anteriormente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportConnection}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo JSON
                  </Button>

                  {/* Erro de Importação */}
                  {importError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {importError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Perfil Importado */}
                  {importedProfile && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{importedProfile.name}</h4>
                          {importedProfile.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {importedProfile.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {importedProfile.type.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">URL:</span>
                          <span className="font-mono text-[10px]">{importedProfile.url || 'Não configurado'}</span>
                        </div>
                        {importedProfile.token && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Token:</span>
                            <span className="font-mono">••••••••</span>
                          </div>
                        )}
                        {importedProfile.headers && Object.keys(importedProfile.headers).length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Headers:</span>
                            <span>{Object.keys(importedProfile.headers).length} configurado(s)</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground text-center">
                        Use este perfil na página principal para se conectar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ℹ️ Sobre Exportação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Logs:</strong> Exporta todos os eventos registrados durante a sessão
                    em diferentes formatos (JSON, CSV, TXT).
                  </p>
                  <p>
                    <strong>Sessão:</strong> Inclui logs + estatísticas de performance + informações
                    da conexão em um único arquivo JSON.
                  </p>
                  <p>
                    <strong>Relatório HTML:</strong> Gera um relatório visual bonito que pode ser
                    aberto em qualquer navegador.
                  </p>
                  <p>
                    <strong>Perfil de Conexão:</strong> Salva configurações de URL, token e headers
                    para reutilizar em outras sessões.
                  </p>
                </CardContent>
              </Card>

              {/* Status da Conexão Atual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={status === 'connected' ? 'default' : 'outline'}>
                      {status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Logs coletados:</span>
                    <span className="font-semibold">{logs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de conexão:</span>
                    <span className="font-mono">{connectionInfo?.connectionType || 'N/A'}</span>
                  </div>
                  {connectionInfo?.url && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="font-mono text-[10px] truncate max-w-[200px]">{connectionInfo.url}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
