import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    // Signal to Google this is a true 404, not a soft 404
    let noindex = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!noindex) {
      noindex = document.createElement("meta");
      noindex.name = "robots";
      document.head.appendChild(noindex);
    }
    noindex.content = "noindex";

    // Also set HTTP status hint via prerender-status-code for crawlers
    let statusMeta = document.querySelector('meta[name="prerender-status-code"]') as HTMLMetaElement | null;
    if (!statusMeta) {
      statusMeta = document.createElement("meta");
      statusMeta.name = "prerender-status-code";
      document.head.appendChild(statusMeta);
    }
    statusMeta.content = "404";

    return () => {
      // Clean up when navigating away so other pages remain indexable
      noindex?.remove();
      statusMeta?.remove();
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
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
