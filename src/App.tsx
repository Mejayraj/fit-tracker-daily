import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedShell } from "@/components/AppLayout";
import PageTransition from "@/components/PageTransition";
import Auth from "./pages/Auth.tsx";
import Food from "./pages/Food.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Train from "./pages/Train.tsx";
import Me from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedShell><PageTransition><Dashboard /></PageTransition></ProtectedShell>} />
            <Route path="/train" element={<ProtectedShell><PageTransition><Train /></PageTransition></ProtectedShell>} />
            <Route path="/food" element={<ProtectedShell><PageTransition><Food /></PageTransition></ProtectedShell>} />
            <Route path="/me" element={<ProtectedShell><PageTransition><Me /></PageTransition></ProtectedShell>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
