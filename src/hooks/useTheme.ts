import { useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';

/**
 * Hook para acessar o tema da aplicação
 * - Consome o ThemeContext fornecido pelo ThemeProvider
 * - Permite alternar entre light/dark mode
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
