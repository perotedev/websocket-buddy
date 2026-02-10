/**
 * Página de Exportação
 * (Em construção)
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

const Export = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Exportação e Relatórios</h1>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <CardTitle>Em Construção</CardTitle>
              </div>
              <CardDescription>
                Esta página estará disponível em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Funcionalidades planejadas:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Exportar logs (JSON, CSV, TXT)</li>
                <li>Exportar/Importar conexões</li>
                <li>Exportar relatório de sessão (HTML)</li>
                <li>Histórico de exportações</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Export;
