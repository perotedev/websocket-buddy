/**
 * Adaptador que simula um servidor WebSocket/STOMP
 * Funciona completamente no frontend sem necessidade de servidor real
 */
import {
  MockServerConfig,
  MockMessageCallback,
  MockServerStatus,
  MockStatusCallback
} from './types';
import {
  generateChatbotResponse,
  generateStreamData,
  generateNotification,
  generateStressMessage
} from './presets';

export class MockServerAdapter {
  private config: MockServerConfig;
  private status: MockServerStatus = 'disconnected';
  private intervalId?: number;
  private messageCounter = 0;
  private onMessageCallback?: MockMessageCallback;
  private onStatusCallback?: MockStatusCallback;

  constructor(config: MockServerConfig) {
    this.config = {
      latency: 50,
      messageRate: 1,
      autoRespond: true,
      ...config
    };
  }

  /**
   * Simula conexão ao servidor
   */
  async connect(
    onMessage: MockMessageCallback,
    onStatusChange: MockStatusCallback
  ): Promise<void> {
    this.onMessageCallback = onMessage;
    this.onStatusCallback = onStatusChange;

    // Simula estado "conectando"
    this.updateStatus('connecting');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.updateStatus('connected');
        this.startBehavior();
        resolve();
      }, this.config.latency);
    });
  }

  /**
   * Envia uma mensagem e aguarda resposta (se autoRespond estiver ativo)
   */
  async send(message: string): Promise<void> {
    if (this.status !== 'connected') {
      throw new Error('Mock server não está conectado');
    }

    // Se autoRespond estiver desabilitado, não faz nada
    if (!this.config.autoRespond) {
      return;
    }

    // Simula latência de rede
    setTimeout(() => {
      const response = this.processMessage(message);
      if (response && this.onMessageCallback) {
        this.onMessageCallback(response);
      }
    }, this.config.latency);
  }

  /**
   * Desconecta do servidor mock
   */
  disconnect(): void {
    this.stopBehavior();
    this.updateStatus('disconnected');
    this.onMessageCallback = undefined;
    this.onStatusCallback = undefined;
    this.messageCounter = 0;
  }

  /**
   * Obtém o status atual
   */
  getStatus(): MockServerStatus {
    return this.status;
  }

  /**
   * Atualiza o status e notifica callback
   */
  private updateStatus(status: MockServerStatus): void {
    this.status = status;
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  /**
   * Inicia comportamento automático baseado no preset
   */
  private startBehavior(): void {
    const { preset, messageRate } = this.config;

    // Presets que enviam mensagens periódicas
    if (preset === 'stream' || preset === 'stress' || preset === 'notification') {
      const interval = 1000 / (messageRate || 1);

      this.intervalId = window.setInterval(() => {
        if (this.status === 'connected' && this.onMessageCallback) {
          this.messageCounter++;

          let message: string;
          switch (preset) {
            case 'stream':
              message = generateStreamData(this.messageCounter);
              break;
            case 'stress':
              // Envia múltiplas mensagens de uma vez
              for (let i = 0; i < 10; i++) {
                const stressMsg = generateStressMessage(this.messageCounter * 10 + i);
                this.onMessageCallback(stressMsg);
              }
              return; // Já enviou todas as mensagens
            case 'notification':
              message = generateNotification();
              break;
            default:
              return;
          }

          this.onMessageCallback(message);
        }
      }, interval);
    }
  }

  /**
   * Para comportamento automático
   */
  private stopBehavior(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Processa uma mensagem enviada e gera resposta apropriada
   */
  private processMessage(message: string): string | null {
    const { preset } = this.config;

    switch (preset) {
      case 'echo':
        // Echo: retorna exatamente o que foi enviado
        return message;

      case 'chatbot':
        // Chatbot: gera resposta inteligente
        return generateChatbotResponse(message);

      case 'stream':
      case 'notification':
        // Stream/Notification: já enviam mensagens automaticamente
        // Responde com confirmação
        return JSON.stringify({
          type: 'ack',
          message: 'Mensagem recebida pelo mock server',
          received: message,
          timestamp: new Date().toISOString()
        });

      case 'stress':
        // Stress: responde com múltiplas mensagens rapidamente
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            if (this.onMessageCallback) {
              this.onMessageCallback(
                JSON.stringify({
                  type: 'stress_response',
                  index: i,
                  echo: message,
                  timestamp: new Date().toISOString()
                })
              );
            }
          }
        }, 10);
        return null; // Resposta assíncrona

      default:
        return JSON.stringify({
          type: 'unknown',
          message: 'Preset desconhecido',
          timestamp: new Date().toISOString()
        });
    }
  }

  /**
   * Simula um erro no servidor
   */
  simulateError(errorMessage: string): void {
    this.updateStatus('error');
    if (this.onMessageCallback) {
      this.onMessageCallback(
        JSON.stringify({
          type: 'error',
          message: errorMessage,
          timestamp: new Date().toISOString()
        })
      );
    }
    this.disconnect();
  }

  /**
   * Atualiza configuração do mock
   */
  updateConfig(newConfig: Partial<MockServerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Se estiver conectado e mudou preset/rate, reinicia comportamento
    if (this.status === 'connected') {
      this.stopBehavior();
      this.startBehavior();
    }
  }
}
