import { useEffect } from 'react';

/**
 * Provider de tema que aplica o tema inicial antes da renderização
 * para evitar flash de conteúdo (FOUC)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const THEME_STORAGE_KEY = 'websocket-buddy-theme';
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const root = window.document.documentElement;

    if (savedTheme) {
      root.classList.add(savedTheme);
    } else {
      // Detecta a preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    }
  }, []);

  return <>{children}</>;
}
