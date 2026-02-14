import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("wr-cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("wr-cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-3xl mx-auto bg-forest-dark border border-accent/20 p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-serif text-lg text-cream mb-2">Your Privacy</p>
                <p className="font-sans text-sm text-cream/60 leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and serve personalized content. By clicking "Accept," you consent to our use of cookies.
                </p>
              </div>
              <button
                onClick={decline}
                className="text-cream/40 hover:text-cream transition-colors shrink-0"
                aria-label="Close cookie banner"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={accept}
                className="font-sans text-xs tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3 hover:bg-accent/80 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="font-sans text-xs tracking-[0.2em] uppercase border border-cream/20 text-cream/60 px-8 py-3 hover:border-cream/40 hover:text-cream transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
