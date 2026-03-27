import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import usePageTracking from "@/hooks/usePageTracking";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
// DynamicCanonical removed — SEOHead now manages canonical tags per page
import { BookingQuizProvider } from "@/contexts/BookingQuizContext";
import BookingQuiz from "@/components/BookingQuiz";
import CookieConsent from "@/components/CookieConsent";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import SocialProofToast from "@/components/SocialProofToast";
import Index from "./pages/Index";
import Experience from "./pages/Experience";
import About from "./pages/About";
import Reviews from "./pages/Reviews";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import SeoLanding from "./pages/SeoLanding";
import ServicePage from "./pages/ServicePage";
import NotFound from "./pages/NotFound";
import DiscoveryQuiz from "./pages/DiscoveryQuiz";
import HostsPlaybook from "./pages/HostsPlaybook";
import AdminNewsletter from "./pages/AdminNewsletter";
import SocialGenerator from "./pages/SocialGenerator";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReviewGate from "./pages/ReviewGate";
import TermsOfService from "./pages/TermsOfService";
import PitchDeck from "./pages/PitchDeck";
import Refer from "./pages/Refer";
import Unsubscribe from "./pages/Unsubscribe";
import ServiceAreas from "./pages/ServiceAreas";
import ServiceAreaDetail from "./pages/ServiceAreaDetail";
import DigitalCard from "./pages/DigitalCard";
import Consultation from "./pages/Consultation";
import { getBlogArticleBySlug } from "./data/blogArticles";
import { useParams } from "react-router-dom";

const BlogArticleOrSeo = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  if (article) return <BlogArticle />;
  return <SeoLanding />;
};

const queryClient = new QueryClient();

const AppContent = () => {
  usePageTracking();
  return (
    <>
      {/* DynamicCanonical removed — SEOHead handles canonical per page */}
      <LocalBusinessSchema />
      <ScrollToTop />
      <Navbar />
      <BookingQuiz />
      <ExitIntentPopup />
      <StickyMobileCTA />
      <SocialProofToast />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/about" element={<About />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogArticleOrSeo />} />
        <Route path="/services/:serviceSlug" element={<ServicePage />} />
        <Route path="/quiz" element={<DiscoveryQuiz />} />
        <Route path="/guide" element={<HostsPlaybook />} />
        <Route path="/admin/newsletter" element={<AdminNewsletter />} />
        <Route path="/admin/social" element={<SocialGenerator />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/deck" element={<PitchDeck />} />
        <Route path="/review" element={<ReviewGate />} />
        <Route path="/refer" element={<Refer />} />
        <Route path="/areas" element={<ServiceAreas />} />
        <Route path="/areas/:citySlug" element={<ServiceAreaDetail />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/event-magician" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/blog/santa-barbara-halloween-party-magician" element={<Navigate to="/areas/santa-barbara" replace />} />
        <Route path="/post/*" element={<Navigate to="/blog" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CookieConsent />
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
          <Routes>
            <Route path="/card" element={<><DigitalCard /></>} />
            <Route path="/consultation" element={<><Consultation /></>} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </BookingQuizProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
