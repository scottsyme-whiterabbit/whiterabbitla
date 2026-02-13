import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-65KMF8KK5P", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};

export default usePageTracking;
