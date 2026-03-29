import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Landing from "./pages/Landing.tsx";
import Catalog from "./pages/Catalog.tsx";
import CarCertificate from "./pages/CarCertificate.tsx";
import InspectorPage from "./pages/InspectorPage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import StaffPage from "./pages/StaffPage.tsx";
import ManagerUpload from "./pages/ManagerUpload.tsx";
import TrackOrder from "./pages/TrackOrder.tsx";
import Contact from "./pages/Contact.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import PurchaseGuide from "./pages/PurchaseGuide.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/car/:slug" element={<CarCertificate />} />
            <Route path="/inspector" element={<InspectorPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/manager-upload" element={<ManagerUpload />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/purchase-guide" element={<PurchaseGuide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
