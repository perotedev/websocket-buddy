import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';

/**
 * Componente de alternância de tema (Light/Dark)
 * Exibe um switch com ícones de sol e lua
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Sun className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-opacity flex-shrink-0 ${isDark ? 'opacity-40' : 'opacity-100'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Alternar tema"
      />
      <Moon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-opacity flex-shrink-0 ${isDark ? 'opacity-100' : 'opacity-40'}`} />
    </div>
  );
}
