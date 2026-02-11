/**
 * Funções de exportação em diferentes formatos
 */
import { LogEntry } from '@/hooks/useWebSocket';
import { SessionStats, MetricSnapshot } from '@/lib/performance/types';
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
  filename: string = `session-${Date.now()}.json`,
  snapshots?: MetricSnapshot[]
) {
  // Calcula médias dos gráficos
  const chartAverages = snapshots && snapshots.length > 0 ? {
    averageMessagesPerSecond: parseFloat((snapshots.reduce((sum, s) => sum + s.messagesPerSecond, 0) / snapshots.length).toFixed(2)),
    averageBytesPerSecond: parseFloat((snapshots.reduce((sum, s) => sum + s.bytesPerSecond, 0) / snapshots.length).toFixed(2)),
    peakMessagesPerSecond: parseFloat(Math.max(...snapshots.map(s => s.messagesPerSecond)).toFixed(2)),
    peakBytesPerSecond: parseFloat(Math.max(...snapshots.map(s => s.bytesPerSecond)).toFixed(2)),
    totalSnapshots: snapshots.length,
  } : undefined;

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
    chartAverages,
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
  filename: string = `report-${Date.now()}.html`,
  snapshots?: MetricSnapshot[]
) {
  // Gera SVG do gráfico de throughput
  const generateThroughputSVG = (data: MetricSnapshot[]): string => {
    if (!data || data.length < 2) return '<p style="color:#999;text-align:center;padding:40px 0;">Dados insuficientes para gerar gráfico.</p>';
    const width = 800, height = 250, padding = 50;
    const values = data.map(d => d.messagesPerSecond);
    const maxVal = Math.ceil(Math.max(...values) * 1.2) || 1;
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.messagesPerSecond / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    });
    const areaPoints = `${padding},${height - padding} ${points.join(' ')} ${padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)},${height - padding}`;
    const labels = data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1);
    return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;max-width:${width}px;font-family:sans-serif;">
      <rect fill="#f8f9fa" width="${width}" height="${height}" rx="6"/>
      <polygon points="${areaPoints}" fill="rgba(102,126,234,0.2)"/>
      <polyline points="${points.join(' ')}" fill="none" stroke="#667eea" stroke-width="2"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd"/>
      <text x="${padding - 5}" y="${padding + 4}" text-anchor="end" font-size="10" fill="#999">${maxVal.toFixed(1)}</text>
      <text x="${padding - 5}" y="${height - padding + 4}" text-anchor="end" font-size="10" fill="#999">0</text>
      <text x="${padding}" y="${height - padding + 20}" font-size="10" fill="#999">${labels.length > 0 ? format(labels[0].timestamp, 'HH:mm:ss') : ''}</text>
      <text x="${width - padding}" y="${height - padding + 20}" text-anchor="end" font-size="10" fill="#999">${labels.length > 0 ? format(labels[labels.length - 1].timestamp, 'HH:mm:ss') : ''}</text>
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#666">Mensagens/s ao longo do tempo</text>
    </svg>`;
  };

  // Gera SVG do gráfico de latência
  const generateLatencySVG = (latencyHistory: typeof stats.latencyHistory): string => {
    if (!latencyHistory || latencyHistory.length < 2) return '<p style="color:#999;text-align:center;padding:40px 0;">Dados insuficientes para gerar gráfico.</p>';
    const width = 800, height = 250, padding = 50;
    const values = latencyHistory.map(d => d.latency);
    const maxVal = Math.ceil(Math.max(...values) * 1.2) || 1;
    const points = latencyHistory.map((d, i) => {
      const x = padding + (i / (latencyHistory.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.latency / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    });
    return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;max-width:${width}px;font-family:sans-serif;">
      <rect fill="#f8f9fa" width="${width}" height="${height}" rx="6"/>
      <polyline points="${points.join(' ')}" fill="none" stroke="#764ba2" stroke-width="2"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd"/>
      <text x="${padding - 5}" y="${padding + 4}" text-anchor="end" font-size="10" fill="#999">${maxVal.toFixed(1)}ms</text>
      <text x="${padding - 5}" y="${height - padding + 4}" text-anchor="end" font-size="10" fill="#999">0</text>
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#666">Latência (ms) ao longo do tempo</text>
    </svg>`;
  };
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
    .header .app-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; opacity: 0.9; }
    .header .app-brand span { font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
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
      <div class="app-brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        <span>WebSocket Buddy</span>
      </div>
      <h1>Session Report</h1>
      <p>${format(new Date(), 'PPpp')}</p>
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

    ${(snapshots && snapshots.length >= 2) || (stats?.latencyHistory && stats.latencyHistory.length >= 2) ? `
    <div class="section">
      <h2>Performance Charts</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:20px;">
        ${snapshots && snapshots.length >= 2 ? generateThroughputSVG(snapshots) : ''}
        ${stats?.latencyHistory && stats.latencyHistory.length >= 2 ? generateLatencySVG(stats.latencyHistory) : ''}
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
