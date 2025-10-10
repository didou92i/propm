import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/legal";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Legal = lazy(() => import("./pages/Legal"));
const Cookies = lazy(() => import("./pages/Cookies"));
const UserDataManagement = lazy(() => import("./pages/UserDataManagement"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const SimulateurSalaire = lazy(() => import("./pages/SimulateurSalaire"));
const ProNatinf = lazy(() => import("./pages/ProNatinf"));
const JobsPage = lazy(() => import("./pages/Jobs"));
const JobCreatePage = lazy(() => import("./pages/JobCreate"));
const JobManagePage = lazy(() => import("./pages/JobManage"));
const Training = lazy(() => import("./pages/Training"));
const TrainingWelcome = lazy(() => import("./pages/TrainingWelcome"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center py-10 text-muted-foreground">Chargement…</div>}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/my-data" element={
              <ProtectedRoute>
                <UserDataManagement />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/simulateur" element={
              <ProtectedRoute>
                <SimulateurSalaire />
              </ProtectedRoute>
            } />
            <Route path="/natinf" element={
              <ProtectedRoute>
                <ProNatinf />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            } />
            <Route path="/jobs/new" element={
              <ProtectedRoute>
                <JobCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/jobs/manage" element={
              <ProtectedRoute>
                <JobManagePage />
              </ProtectedRoute>
            } />
            <Route path="/diagnostics" element={
              <ProtectedRoute>
                <Diagnostics />
              </ProtectedRoute>
            } />
            <Route path="/training" element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            } />
            <Route path="/training/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
