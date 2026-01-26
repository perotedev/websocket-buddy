import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'websocket-buddy-theme';

/**
 * Hook para gerenciar o tema da aplicação
 * - Persiste o tema no localStorage
 * - Detecta a preferência do sistema operacional na primeira carga
 * - Aplica a classe 'dark' no elemento html
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Tenta carregar do localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

    if (savedTheme) {
      return savedTheme;
    }

    // Se não houver tema salvo, detecta a preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove ambas as classes primeiro
    root.classList.remove('light', 'dark');

    // Adiciona a classe correspondente ao tema atual
    root.classList.add(theme);

    // Salva no localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    toggleTheme,
    setTheme
  };
}
