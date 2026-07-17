import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import wrLogo from "@/assets/wr-symbol.png";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";

const servicesLinks = [
  { to: "/services/corporate-magician", label: "Corporate Events" },
  { to: "/services/wedding-magician", label: "Weddings" },
  { to: "/services/private-party-magician", label: "Private Parties" },
  { to: "/services/holiday-party-magician", label: "Holiday Parties" },
  { to: "/services", label: "All Services" },
];

const navLinks = [
  { to: "/experience", label: "Experience" },
  { to: "/services", label: "Services", dropdown: servicesLinks },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesTimer = useRef<number | null>(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { openQuiz } = useBookingQuiz();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openServices = () => {
    if (servicesTimer.current) window.clearTimeout(servicesTimer.current);
    setServicesOpen(true);
  };
  const closeServicesSoon = () => {
    if (servicesTimer.current) window.clearTimeout(servicesTimer.current);
    servicesTimer.current = window.setTimeout(() => setServicesOpen(false), 150);
  };

  return (
    <nav aria-label="Main navigation" className="fixed top-14 md:top-10 left-0 right-0 z-50 transition-all duration-300 bg-forest-dark/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-center h-20">
          <Link to="/" className="absolute left-6 lg:left-12 flex-shrink-0">
            <img src={wrLogo} alt="White Rabbit Los Angeles, luxury magician" width={48} height={48} className="h-12 w-auto invert brightness-200" fetchPriority="high" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div
                  key={link.to}
                  className="relative"
                  onMouseEnter={openServices}
                  onMouseLeave={closeServicesSoon}
                >
                  <Link
                    to={link.to}
                    className="font-sans text-sm tracking-[0.2em] uppercase transition-colors duration-300 text-cream/80 hover:text-cream inline-flex items-center gap-1.5"
                    aria-haspopup="true"
                    aria-expanded={servicesOpen}
                  >
                    {link.label}
                    <ChevronDown size={12} className={`transition-transform duration-300 ${servicesOpen ? "rotate-180" : ""}`} />
                  </Link>
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-4 min-w-[240px]"
                        role="menu"
                      >
                        <div className="bg-forest-dark/95 backdrop-blur-md border-t border-gold/40 py-3">
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setServicesOpen(false)}
                              className="block px-6 py-2.5 font-sans text-xs tracking-[0.2em] uppercase text-cream/75 hover:text-cream hover:bg-cream/5 transition-colors"
                              role="menuitem"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="font-sans text-sm tracking-[0.2em] uppercase transition-colors duration-300 text-cream/80 hover:text-cream"
                >
                  {link.label}
                </Link>
              )
            )}
            <button
              onClick={openQuiz}
              className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-2 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-6 md:hidden text-cream p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-forest-dark/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) =>
                link.dropdown ? (
                  <div key={link.to} className="flex flex-col">
                    <button
                      onClick={() => setMobileServicesOpen((v) => !v)}
                      className="font-sans text-sm tracking-[0.2em] uppercase text-cream/80 hover:text-cream inline-flex items-center justify-between"
                      aria-expanded={mobileServicesOpen}
                    >
                      <span>{link.label}</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${mobileServicesOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {mobileServicesOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pt-4 flex flex-col gap-4 border-l border-gold/30 mt-3">
                            {link.dropdown.map((item) => (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => { setIsOpen(false); setMobileServicesOpen(false); }}
                                className="font-sans text-xs tracking-[0.2em] uppercase text-cream/70 hover:text-cream transition-colors"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="font-sans text-sm tracking-[0.2em] uppercase transition-colors text-cream/80 hover:text-cream"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <button
                onClick={() => { setIsOpen(false); openQuiz(); }}
                className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-2 text-center"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
