import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/legal";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";

// Import direct des pages critiques (non protégées) pour affichage immédiat
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Legal from "./pages/Legal";
import Cookies from "./pages/Cookies";

// Lazy load uniquement des pages protégées
const Index = lazy(() => import("./pages/Index"));
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
const LegalImport = lazy(() => import("./pages/LegalImport"));
const GPTClone = lazy(() => import("./pages/GPTClone"));
const GPTSettings = lazy(() => import("./pages/GPTSettings"));

const App = () => (
  <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <BrowserRouter>
        {/* Suspense avec fallback optimisé pour réduire le FID */}
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        }>
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
            <Route path="/import-legal" element={
              <ProtectedRoute>
                <LegalImport />
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
            <Route path="/gpt-clone" element={
              <ProtectedRoute>
                <GPTClone />
              </ProtectedRoute>
            } />
            <Route path="/gpt-clone/settings" element={
              <ProtectedRoute>
                <GPTSettings />
              </ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
);

export default App;
