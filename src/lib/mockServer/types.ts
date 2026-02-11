/**
 * Tipos e interfaces para o Mock Server
 */

// Tipos de presets disponíveis
export type MockPresetType = 'echo' | 'chatbot' | 'stream' | 'stress' | 'notification';

// Status do mock server
export type MockServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Configuração do mock server
export interface MockServerConfig {
  preset: MockPresetType;
  latency?: number; // latência simulada em ms (padrão: 50ms)
  messageRate?: number; // mensagens por segundo para presets stream (padrão: 1)
  autoRespond?: boolean; // responder automaticamente a mensagens (padrão: true)
}

// Callback para mensagens recebidas
export type MockMessageCallback = (data: string) => void;

// Callback para mudança de status
export type MockStatusCallback = (status: MockServerStatus) => void;

// Informações sobre um preset
export interface MockPresetInfo {
  id: MockPresetType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: Partial<MockServerConfig>;
}
