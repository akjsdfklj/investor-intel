import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DealDetail from "./pages/DealDetail";
import Settings from "./pages/Settings";
import BulkDueDiligence from "./pages/BulkDueDiligence";
import PipelineDashboard from "./pages/PipelineDashboard";
import Portfolio from "./pages/Portfolio";
import PortfolioCompanyDetail from "./pages/PortfolioCompanyDetail";
import DealSources from "./pages/DealSources";
import TermSheets from "./pages/TermSheets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/deal/:dealId" element={<DealDetail />} />
          <Route path="/bulk-dd" element={<BulkDueDiligence />} />
          <Route path="/pipeline" element={<PipelineDashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:companyId" element={<PortfolioCompanyDetail />} />
          <Route path="/deal-sources" element={<DealSources />} />
          <Route path="/term-sheets" element={<TermSheets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
