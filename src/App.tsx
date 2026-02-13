import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import usePageTracking from "@/hooks/usePageTracking";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import { BookingQuizProvider } from "@/contexts/BookingQuizContext";
import BookingQuiz from "@/components/BookingQuiz";
import Index from "./pages/Index";
import Experience from "./pages/Experience";
import About from "./pages/About";
import Reviews from "./pages/Reviews";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import SeoLanding from "./pages/SeoLanding";
import ServicePage from "./pages/ServicePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  usePageTracking();
  return (
    <>
      <LocalBusinessSchema />
      <ScrollToTop />
      <Navbar />
      <BookingQuiz />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/about" element={<About />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<SeoLanding />} />
        <Route path="/services/:serviceSlug" element={<ServicePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BookingQuizProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </BookingQuizProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
