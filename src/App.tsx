import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import Index from "./pages/Index";
import TestAutomation from "./pages/TestAutomation";
import Performance from "./pages/Performance";
import Tools from "./pages/Tools";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WebSocketProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/test-automation" element={<TestAutomation />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/export" element={<Export />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </WebSocketProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
