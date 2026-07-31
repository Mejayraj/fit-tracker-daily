import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedShell } from "@/components/AppLayout";
import Auth from "./pages/Auth.tsx";
import Food from "./pages/Food.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Workouts from "./pages/Workouts.tsx";
import Exercises from "./pages/Exercises.tsx";
import ProgressPage from "./pages/Progress.tsx";
import ProfilePage from "./pages/Profile.tsx";
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
            <Route path="/" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
            <Route path="/workouts" element={<ProtectedShell><Workouts /></ProtectedShell>} />
            <Route path="/exercises" element={<ProtectedShell><Exercises /></ProtectedShell>} />
            <Route path="/food" element={<ProtectedShell><Food /></ProtectedShell>} />
            <Route path="/progress" element={<ProtectedShell><ProgressPage /></ProtectedShell>} />
            <Route path="/profile" element={<ProtectedShell><ProfilePage /></ProtectedShell>} />
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
