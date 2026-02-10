/**
 * Parser de arquivos JSON de cenários de teste
 */
import { TestScenario, TestCollection } from './types';

/**
 * Valida e parseia um arquivo JSON de cenário de teste
 */
export function parseTestScenario(json: string): TestScenario {
  try {
    const data = JSON.parse(json);

    // Valida campos obrigatórios
    if (!data.name) {
      throw new Error('Campo "name" é obrigatório');
    }

    if (!data.actions || !Array.isArray(data.actions)) {
      throw new Error('Campo "actions" é obrigatório e deve ser um array');
    }

    if (data.actions.length === 0) {
      throw new Error('Cenário deve ter pelo menos uma ação');
    }

    // Valida cada ação
    data.actions.forEach((action: any, index: number) => {
      if (!action.type) {
        throw new Error(`Ação ${index + 1}: campo "type" é obrigatório`);
      }

      const validTypes = [
        'connect',
        'disconnect',
        'subscribe',
        'unsubscribe',
        'send',
        'wait',
        'assert',
        'log'
      ];

      if (!validTypes.includes(action.type)) {
        throw new Error(
          `Ação ${index + 1}: tipo "${action.type}" inválido. Tipos válidos: ${validTypes.join(', ')}`
        );
      }

      // Validações específicas por tipo
      switch (action.type) {
        case 'connect':
          if (!action.url) {
            throw new Error(`Ação ${index + 1} (connect): campo "url" é obrigatório`);
          }
          break;

        case 'subscribe':
        case 'unsubscribe':
          if (!action.destination) {
            throw new Error(
              `Ação ${index + 1} (${action.type}): campo "destination" é obrigatório`
            );
          }
          break;

        case 'send':
          if (!action.message) {
            throw new Error(`Ação ${index + 1} (send): campo "message" é obrigatório`);
          }
          break;

        case 'wait':
          if (!action.duration || typeof action.duration !== 'number') {
            throw new Error(
              `Ação ${index + 1} (wait): campo "duration" é obrigatório e deve ser um número`
            );
          }
          break;

        case 'assert':
          if (!action.assertionType) {
            throw new Error(
              `Ação ${index + 1} (assert): campo "assertionType" é obrigatório`
            );
          }
          break;

        case 'log':
          if (!action.message) {
            throw new Error(`Ação ${index + 1} (log): campo "message" é obrigatório`);
          }
          break;
      }
    });

    return data as TestScenario;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON inválido: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parseia uma coleção de cenários
 */
export function parseTestCollection(json: string): TestCollection {
  try {
    const data = JSON.parse(json);

    if (!data.name) {
      throw new Error('Campo "name" é obrigatório na coleção');
    }

    if (!data.scenarios || !Array.isArray(data.scenarios)) {
      throw new Error('Campo "scenarios" é obrigatório e deve ser um array');
    }

    // Valida cada cenário
    data.scenarios.forEach((scenario: any, index: number) => {
      try {
        parseTestScenario(JSON.stringify(scenario));
      } catch (error) {
        throw new Error(`Cenário ${index + 1}: ${error}`);
      }
    });

    return data as TestCollection;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON inválido: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Substitui variáveis em uma string
 * Formato: ${VARIABLE_NAME}
 */
export function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Exporta um cenário para JSON formatado
 */
export function exportTestScenario(scenario: TestScenario): string {
  return JSON.stringify(scenario, null, 2);
}

/**
 * Exporta uma coleção para JSON formatado
 */
export function exportTestCollection(collection: TestCollection): string {
  return JSON.stringify(collection, null, 2);
}

/**
 * Valida se uma string é um JSON válido
 */
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
