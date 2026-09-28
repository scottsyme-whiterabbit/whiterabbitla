import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RemovedRouteRedirect from "@/components/RemovedRouteRedirect";
import Navbar from "@/components/Navbar";

import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import usePageTracking from "@/hooks/usePageTracking";

import DynamicCanonical from "@/components/DynamicCanonical";
import { BookingQuizProvider } from "@/contexts/BookingQuizContext";
import BookingQuiz from "@/components/BookingQuiz";
import CookieConsent from "@/components/CookieConsent";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import StickyMobileCTA from "@/components/StickyMobileCTA";

import Index from "./pages/Index";
const Experience = lazy(() => import("./pages/Experience"));
const ExperienceGallery = lazy(() => import("./pages/ExperienceGallery"));
const About = lazy(() => import("./pages/About"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const SeoLanding = lazy(() => import("./pages/SeoLanding"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const ServicesHub = lazy(() => import("./pages/Services"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DiscoveryQuiz = lazy(() => import("./pages/DiscoveryQuiz"));
const HostsPlaybook = lazy(() => import("./pages/HostsPlaybook"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const SocialGenerator = lazy(() => import("./pages/SocialGenerator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ReviewGate = lazy(() => import("./pages/ReviewGate"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const Refer = lazy(() => import("./pages/Refer"));
const PayInvoice = lazy(() => import("./pages/PayInvoice"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ServiceAreas = lazy(() => import("./pages/ServiceAreas"));
const ServiceAreaDetail = lazy(() => import("./pages/ServiceAreaDetail"));
const DigitalCard = lazy(() => import("./pages/DigitalCard"));
const Consultation = lazy(() => import("./pages/Consultation"));
const Planners = lazy(() => import("./pages/Planners"));
const ProposalTemplate = lazy(() => import("./pages/ProposalTemplate"));
const ResidencyTemplate = lazy(() => import("./pages/ResidencyTemplate"));
const AdminProposals = lazy(() => import("./pages/AdminProposals"));
const BlogArticleOrSeo = lazy(() => import("./pages/BlogArticleOrSeo"));

const PageFallback = () => <div className="bg-background min-h-screen" />;

const queryClient = new QueryClient();

const AppContent = () => {
  usePageTracking();
  return (
    <>
      <DynamicCanonical />
      
      <ScrollToTop />
      <Navbar />
      <BookingQuiz />
      <ExitIntentPopup />
      <StickyMobileCTA />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/experience/gallery" element={<ExperienceGallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogArticleOrSeo />} />
        <Route path="/services" element={<ServicesHub />} />
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
        <Route path="/planners" element={<Planners />} />
        <Route path="/areas" element={<ServiceAreas />} />
        <Route path="/areas/:citySlug" element={<ServiceAreaDetail />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/event-magician" element={<RemovedRouteRedirect to="/" />} />
        <Route path="/book" element={<RemovedRouteRedirect to="/contact" />} />
        <Route path="/booking" element={<RemovedRouteRedirect to="/contact" />} />
        <Route path="/inquire" element={<RemovedRouteRedirect to="/contact" />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/blog/santa-barbara-halloween-party-magician" element={<RemovedRouteRedirect to="/areas/santa-barbara" />} />
        <Route path="/blog/dallas-resident-event-magician" element={<RemovedRouteRedirect to="/blog" />} />
        <Route path="/blog/napa-valley-resident-event-magician" element={<RemovedRouteRedirect to="/blog/napa-valley-corporate-event-magician" />} />
        <Route path="/post/*" element={<RemovedRouteRedirect to="/blog" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
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
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/card" element={<><DigitalCard /></>} />
            <Route path="/consultation" element={<><Consultation /></>} />
            <Route path="/proposals/template" element={<ProposalTemplate preview />} />
            <Route path="/proposal/:slug" element={<ProposalTemplate />} />
            <Route path="/residency/template" element={<ResidencyTemplate preview />} />
            <Route path="/residency/:slug" element={<ResidencyTemplate />} />
            <Route path="/admin/proposals" element={<AdminProposals />} />
            <Route path="/pay/:token" element={<PayInvoice />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </BookingQuizProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
