/**
 * Layout principal com navegação
 */
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Terminal, FlaskConical, BarChart3, Wrench, Download, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { status } = useWebSocketContext();

  const routes = [
    {
      path: '/',
      name: 'WebSocket',
      icon: Terminal,
      description: 'Testar conexões'
    },
    {
      path: '/test-automation',
      name: 'Testes',
      icon: FlaskConical,
      description: 'Automação de testes'
    },
    {
      path: '/performance',
      name: 'Performance',
      icon: BarChart3,
      description: 'Estatísticas'
    },
    {
      path: '/tools',
      name: 'Ferramentas',
      icon: Wrench,
      description: 'Utilitários'
    },
    {
      path: '/export',
      name: 'Exportar',
      icon: Download,
      description: 'Exportação'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header com Navegação */}
      <header className="border-b border-border flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight hidden sm:block">
                WebSocket Buddy
              </h1>
              <h1 className="text-base font-bold uppercase tracking-tight sm:hidden">
                WS Buddy
              </h1>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-2xl">
              {routes.map((route) => {
                const Icon = route.icon;
                const active = isActive(route.path);

                return (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{route.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Navegação Mobile - Dropdown simples */}
            <div className="md:hidden flex items-center gap-2">
              <select
                value={location.pathname}
                onChange={(e) => window.location.href = e.target.value}
                className="text-xs border border-border rounded px-2 py-1 bg-background"
              >
                {routes.map((route) => (
                  <option key={route.path} value={route.path}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status da Conexão */}
            <div className="flex items-center gap-1.5">
              {status === 'connected' && (
                <>
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                  <span className="hidden sm:inline text-[11px] font-medium text-green-500">Conectado</span>
                </>
              )}
              {status === 'connecting' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                  <span className="hidden sm:inline text-[11px] font-medium text-yellow-500">Conectando</span>
                </>
              )}
              {status === 'disconnected' && (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-[11px] font-medium text-slate-400">Desconectado</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="hidden sm:inline text-[11px] font-medium text-red-500">Erro</span>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Footer - apenas no desktop */}
      <footer className="border-t border-border flex-shrink-0 hidden sm:block">
        <div className="container mx-auto px-2 sm:px-3 py-1.5 sm:py-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            WebSocket Buddy • <a target="_blank" href="https://perotedev.com" rel="noreferrer">@perotedev</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
