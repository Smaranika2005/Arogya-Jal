import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import ASHALogin from "./pages/ASHALogin";
import ASHASignup from "./pages/ASHASignup";
import ASHADashboard from "./pages/ASHADashboard";
import ASHASurvey from "./pages/ASHASurvey";
import ASHAWaterQuality from "./pages/ASHAWaterQuality";
import ASHAProfile from "./pages/ASHAProfile";
import GovLogin from "./pages/GovLogin";
import GovDashboard from "./pages/GovDashboard";
import PublicLogin from "./pages/PublicLogin";
import PublicDashboard from "./pages/PublicDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/asha/login" element={<ASHALogin />} />
          <Route path="/asha/signup" element={<ASHASignup />} />
          <Route path="/asha/dashboard" element={<ASHADashboard />} />
          <Route path="/asha/survey" element={<ASHASurvey />} />
          <Route path="/asha/survey/:id" element={<ASHASurvey />} />
          <Route path="/asha/water-quality" element={<ASHAWaterQuality />} />
          <Route path="/asha/profile" element={<ASHAProfile />} />
          <Route path="/gov/login" element={<GovLogin />} />
          <Route path="/gov/dashboard" element={<GovDashboard />} />
          <Route path="/public/login" element={<PublicLogin />} />
          <Route path="/public/dashboard" element={<PublicDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;