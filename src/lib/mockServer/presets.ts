/**
 * Presets de comportamento para o Mock Server
 */
import { MockPresetInfo } from './types';

// Informações sobre cada preset disponível
export const MOCK_PRESETS: Record<string, MockPresetInfo> = {
  echo: {
    id: 'echo',
    name: 'Echo Server',
    description: 'Retorna exatamente o que você enviar',
    icon: '🔄',
    defaultConfig: {
      preset: 'echo',
      latency: 50,
      autoRespond: true
    }
  },
  chatbot: {
    id: 'chatbot',
    name: 'Chat Bot',
    description: 'Bot inteligente que responde perguntas',
    icon: '🤖',
    defaultConfig: {
      preset: 'chatbot',
      latency: 100,
      autoRespond: true
    }
  },
  stream: {
    id: 'stream',
    name: 'Data Stream',
    description: 'Envia dados em tempo real (1 msg/s)',
    icon: '📊',
    defaultConfig: {
      preset: 'stream',
      latency: 50,
      messageRate: 1,
      autoRespond: true
    }
  },
  stress: {
    id: 'stress',
    name: 'Stress Test',
    description: 'Envia muitas mensagens rapidamente',
    icon: '⚡',
    defaultConfig: {
      preset: 'stress',
      latency: 10,
      messageRate: 10,
      autoRespond: true
    }
  },
  notification: {
    id: 'notification',
    name: 'Notifications',
    description: 'Simula sistema de notificações',
    icon: '🔔',
    defaultConfig: {
      preset: 'notification',
      latency: 50,
      messageRate: 0.2, // 1 notificação a cada 5 segundos
      autoRespond: true
    }
  }
};

// Respostas do chatbot baseadas em palavras-chave
export const chatbotResponses: Record<string, string[]> = {
  greeting: [
    'Olá! 👋 Sou um bot simulado. Como posso ajudar?',
    'Oi! Bem-vindo ao Mock Server! Em que posso ajudar?',
    'Olá! Estou aqui para simular respostas WebSocket.'
  ],
  name: [
    'Meu nome é MockBot, o servidor de testes integrado do WebSocket Buddy! 🤖',
    'Pode me chamar de MockBot! Sou um servidor simulado para testes.',
    'Sou o MockBot v1.0, sempre pronto para ajudar nos seus testes!'
  ],
  time: [
    `A hora atual é ${new Date().toLocaleTimeString('pt-BR')} ⏰`,
    `Agora são ${new Date().toLocaleTimeString('pt-BR')}`,
    `O horário neste momento é ${new Date().toLocaleTimeString('pt-BR')}`
  ],
  date: [
    `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 📅`,
    `A data de hoje é ${new Date().toLocaleDateString('pt-BR')}`,
    `Estamos em ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  ],
  help: [
    'Você pode me perguntar sobre: hora, data, nome, ou simplesmente conversar! 💬',
    'Comandos disponíveis: "hora", "data", "nome", "ajuda", ou envie qualquer mensagem!',
    'Experimente perguntar "que horas são?" ou "qual é seu nome?"'
  ],
  thanks: [
    'Por nada! Estou aqui para ajudar! 😊',
    'De nada! Sempre à disposição para testes!',
    'Fico feliz em ajudar! Continue testando! ✨'
  ],
  bye: [
    'Até logo! Volte sempre! 👋',
    'Tchau! Bons testes! 🚀',
    'Até a próxima! Foi um prazer ajudar! 😊'
  ],
  default: [
    'Recebi sua mensagem! Sou apenas um mock server. 📨',
    'Mensagem recebida e processada com sucesso! ✅',
    'Interessante! Sou um servidor simulado, então minhas respostas são limitadas. 🤔',
    'Entendi! Estou aqui para simular um servidor real. 💡'
  ]
};

// Detecta a intenção da mensagem
export function detectIntent(message: string): string {
  const msg = message.toLowerCase().trim();

  // Saudações
  if (/^(oi|olá|ola|hey|hi|hello|opa)/.test(msg)) {
    return 'greeting';
  }

  // Nome
  if (/nome|chama|quem (é|e) você/.test(msg)) {
    return 'name';
  }

  // Hora
  if (/hora|horas|horário|horario/.test(msg)) {
    return 'time';
  }

  // Data
  if (/data|dia|hoje/.test(msg)) {
    return 'date';
  }

  // Ajuda
  if (/ajuda|help|comando|o que você (faz|sabe)/.test(msg)) {
    return 'help';
  }

  // Agradecimento
  if (/obrigad|valeu|thanks|thank you/.test(msg)) {
    return 'thanks';
  }

  // Despedida
  if (/tchau|adeus|bye|até/.test(msg)) {
    return 'bye';
  }

  return 'default';
}

// Gera resposta do chatbot
export function generateChatbotResponse(message: string): string {
  const intent = detectIntent(message);
  const responses = chatbotResponses[intent] || chatbotResponses.default;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return JSON.stringify({
    type: 'chatbot',
    request: message,
    response: randomResponse,
    timestamp: new Date().toISOString(),
    mockServer: true
  });
}

// Gera dados de stream
export function generateStreamData(index: number): string {
  return JSON.stringify({
    type: 'stream',
    index,
    value: Math.random() * 100,
    timestamp: new Date().toISOString(),
    data: {
      temperature: (20 + Math.random() * 10).toFixed(1),
      humidity: (50 + Math.random() * 30).toFixed(1),
      pressure: (1000 + Math.random() * 30).toFixed(1)
    }
  });
}

// Gera notificação
export function generateNotification(): string {
  const types = ['info', 'warning', 'success', 'error'];
  const messages = [
    'Novo usuário conectado ao sistema',
    'Atualização de dados disponível',
    'Backup realizado com sucesso',
    'Alerta: Uso de memória acima de 80%',
    'Nova mensagem recebida',
    'Tarefa agendada concluída',
    'Sistema atualizado para versão 2.0',
    'Conexão com banco de dados reestabelecida'
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return JSON.stringify({
    type: 'notification',
    level: type,
    message,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  });
}

// Gera mensagens de stress test
export function generateStressMessage(index: number): string {
  return JSON.stringify({
    type: 'stress_test',
    messageIndex: index,
    timestamp: new Date().toISOString(),
    payload: 'A'.repeat(50) // Payload pequeno para testar volume
  });
}
