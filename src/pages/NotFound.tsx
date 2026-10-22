import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  // Tell prerendering crawlers this route really is a 404, so soft-404
  // detection drops the URL instead of indexing it. Scoped with
  // data-not-found so SPA navigation to a real page always removes it.
  useEffect(() => {
    const existing = document.querySelector(
      'meta[name="prerender-status-code"][data-not-found="true"]'
    );
    if (!existing) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "prerender-status-code");
      meta.setAttribute("content", "404");
      meta.setAttribute("data-not-found", "true");
      document.head.appendChild(meta);
    }

    return () => {
      document
        .querySelectorAll('meta[name="prerender-status-code"][data-not-found="true"]')
        .forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEOHead title="Page Not Found | White Rabbit LA" description="The page you are looking for does not exist." noIndex />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
