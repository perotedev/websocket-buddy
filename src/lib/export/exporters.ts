/**
 * Funções de exportação em diferentes formatos
 */
import { LogEntry } from '@/hooks/useWebSocket';
import { SessionStats } from '@/lib/performance/types';
import { ConnectionProfile, SessionExport, LogsExport, ExportOptions } from './types';
import { format } from 'date-fns';

/**
 * Faz download de um arquivo
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formata data baseado nas opções
 */
function formatDate(date: Date | string, dateFormat: ExportOptions['dateFormat'] = 'iso'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (dateFormat) {
    case 'locale':
      return d.toLocaleString();
    case 'timestamp':
      return d.getTime().toString();
    case 'iso':
    default:
      return d.toISOString();
  }
}

// ============================================
// EXPORTAÇÃO DE LOGS
// ============================================

/**
 * Exporta logs em formato JSON
 */
export function exportLogsAsJSON(
  logs: LogEntry[],
  filename: string = `websocket-logs-${Date.now()}.json`,
  options: ExportOptions = {}
) {
  const exportData: LogsExport = {
    exportedAt: new Date().toISOString(),
    totalLogs: logs.length,
    logs: logs.map(log => ({
      ...log,
      timestamp: options.dateFormat ? formatDate(log.timestamp, options.dateFormat) : log.timestamp
    }))
  };

  const content = JSON.stringify(exportData, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Exporta logs em formato CSV
 */
export function exportLogsAsCSV(
  logs: LogEntry[],
  filename: string = `websocket-logs-${Date.now()}.csv`,
  options: ExportOptions = {}
) {
  const headers = ['Timestamp', 'Type', 'Message', 'Data'];
  const rows = logs.map(log => [
    formatDate(log.timestamp, options.dateFormat || 'locale'),
    log.type,
    `"${log.message.replace(/"/g, '""')}"`, // Escape aspas
    log.data ? `"${String(log.data).replace(/"/g, '""')}"` : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Exporta logs em formato TXT
 */
export function exportLogsAsTXT(
  logs: LogEntry[],
  filename: string = `websocket-logs-${Date.now()}.txt`,
  options: ExportOptions = {}
) {
  const lines = logs.map(log => {
    const timestamp = formatDate(log.timestamp, options.dateFormat || 'locale');
    const dataStr = log.data ? `\n  Data: ${log.data}` : '';
    return `[${timestamp}] [${log.type}] ${log.message}${dataStr}`;
  });

  const content = [
    '='.repeat(80),
    `WebSocket Buddy - Log Export`,
    `Exported at: ${new Date().toLocaleString()}`,
    `Total entries: ${logs.length}`,
    '='.repeat(80),
    '',
    ...lines
  ].join('\n');

  downloadFile(content, filename, 'text/plain');
}

// ============================================
// EXPORTAÇÃO DE CONEXÕES
// ============================================

/**
 * Exporta perfil de conexão
 */
export function exportConnectionProfile(
  profile: ConnectionProfile,
  filename: string = `connection-${profile.name}-${Date.now()}.json`
) {
  const content = JSON.stringify(profile, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Exporta múltiplos perfis de conexão
 */
export function exportConnectionProfiles(
  profiles: ConnectionProfile[],
  filename: string = `connections-${Date.now()}.json`
) {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalProfiles: profiles.length,
    profiles
  };

  const content = JSON.stringify(exportData, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Importa perfil de conexão de JSON
 */
export function importConnectionProfile(jsonString: string): ConnectionProfile {
  const data = JSON.parse(jsonString);

  // Valida campos obrigatórios
  if (!data.name || !data.url || !data.type) {
    throw new Error('Arquivo inválido: campos obrigatórios ausentes');
  }

  if (data.type !== 'websocket' && data.type !== 'stomp') {
    throw new Error('Tipo de conexão inválido');
  }

  return data as ConnectionProfile;
}

/**
 * Importa múltiplos perfis de conexão
 */
export function importConnectionProfiles(jsonString: string): ConnectionProfile[] {
  const data = JSON.parse(jsonString);

  if (!data.profiles || !Array.isArray(data.profiles)) {
    throw new Error('Formato inválido: esperado array de profiles');
  }

  return data.profiles.map((profile: any, index: number) => {
    try {
      return importConnectionProfile(JSON.stringify(profile));
    } catch (error) {
      throw new Error(`Erro no perfil ${index + 1}: ${error}`);
    }
  });
}

// ============================================
// EXPORTAÇÃO DE SESSÃO
// ============================================

/**
 * Exporta sessão completa
 */
export function exportSession(
  logs: LogEntry[],
  stats: SessionStats | null,
  connectionInfo: { url: string; type: string },
  filename: string = `session-${Date.now()}.json`
) {
  const sessionData: SessionExport = {
    sessionId: crypto.randomUUID(),
    startTime: stats?.connectionStartTime?.toISOString() || new Date().toISOString(),
    endTime: stats?.connectionEndTime?.toISOString(),
    connection: {
      url: connectionInfo.url,
      type: connectionInfo.type,
      status: stats?.status || 'unknown'
    },
    logs,
    stats: stats || undefined,
    metadata: {
      appVersion: '1.0.0',
      userAgent: navigator.userAgent,
      exportedAt: new Date().toISOString()
    }
  };

  const content = JSON.stringify(sessionData, null, 2);
  downloadFile(content, filename, 'application/json');
}

// ============================================
// EXPORTAÇÃO DE RELATÓRIO HTML
// ============================================

/**
 * Gera relatório HTML da sessão
 */
export function exportSessionReportHTML(
  logs: LogEntry[],
  stats: SessionStats | null,
  connectionInfo: { url: string; type: string },
  filename: string = `report-${Date.now()}.html`
) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket Buddy - Session Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .section {
      padding: 30px;
      border-bottom: 1px solid #eee;
    }
    .section:last-child { border-bottom: none; }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #667eea;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .stat-card .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .connection-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .connection-info dt {
      font-weight: bold;
      margin-top: 10px;
      color: #667eea;
    }
    .connection-info dt:first-child { margin-top: 0; }
    .connection-info dd { margin-left: 20px; color: #666; }
    .logs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .logs-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
    }
    .logs-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .logs-table tr:hover { background: #f8f9fa; }
    .log-type {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .log-type.INFO { background: #e3f2fd; color: #1976d2; }
    .log-type.MESSAGE { background: #e8f5e9; color: #388e3c; }
    .log-type.ERROR { background: #ffebee; color: #d32f2f; }
    .log-type.SENT { background: #fff3e0; color: #f57c00; }
    .log-type.SUBSCRIBE { background: #f3e5f5; color: #7b1fa2; }
    .log-type.UNSUBSCRIBE { background: #fce4ec; color: #c2185b; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
    .data-preview {
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 WebSocket Session Report</h1>
      <p>Generated by WebSocket Buddy • ${format(new Date(), 'PPpp')}</p>
    </div>

    <div class="section">
      <h2>Connection Information</h2>
      <div class="connection-info">
        <dl>
          <dt>URL</dt>
          <dd>${connectionInfo.url}</dd>
          <dt>Type</dt>
          <dd>${connectionInfo.type.toUpperCase()}</dd>
          <dt>Status</dt>
          <dd>${stats?.status || 'Unknown'}</dd>
          ${stats?.connectionStartTime ? `
          <dt>Connection Started</dt>
          <dd>${format(stats.connectionStartTime, 'PPpp')}</dd>
          ` : ''}
          ${stats?.connectionEndTime ? `
          <dt>Connection Ended</dt>
          <dd>${format(stats.connectionEndTime, 'PPpp')}</dd>
          ` : ''}
        </dl>
      </div>
    </div>

    ${stats ? `
    <div class="section">
      <h2>Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Messages Sent</div>
          <div class="value">${stats.messagesSent}</div>
        </div>
        <div class="stat-card">
          <div class="label">Messages Received</div>
          <div class="value">${stats.messagesReceived}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Messages</div>
          <div class="value">${stats.totalMessages}</div>
        </div>
        <div class="stat-card">
          <div class="label">Average Latency</div>
          <div class="value">${stats.averageLatency.toFixed(2)} ms</div>
        </div>
        <div class="stat-card">
          <div class="label">Bytes Sent</div>
          <div class="value">${(stats.bytesSent / 1024).toFixed(2)} KB</div>
        </div>
        <div class="stat-card">
          <div class="label">Bytes Received</div>
          <div class="value">${(stats.bytesReceived / 1024).toFixed(2)} KB</div>
        </div>
        <div class="stat-card">
          <div class="label">Errors</div>
          <div class="value">${stats.errorCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">Messages/Second</div>
          <div class="value">${stats.messagesPerSecond.toFixed(2)}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>Activity Log (${logs.length} entries)</h2>
      <table class="logs-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Message</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${format(log.timestamp, 'HH:mm:ss.SSS')}</td>
              <td><span class="log-type ${log.type}">${log.type}</span></td>
              <td>${log.message}</td>
              <td class="data-preview">${log.data || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Generated with ❤️ by <strong>WebSocket Buddy</strong></p>
      <p>Report generated at ${format(new Date(), 'PPpp')}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  downloadFile(html, filename, 'text/html');
}
