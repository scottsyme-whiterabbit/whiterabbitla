import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import wrLogo from "@/assets/wr-symbol.png";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";

const navLinks = [
  { to: "/experience", label: "Experience" },
  { to: "/areas", label: "Areas" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { openQuiz } = useBookingQuiz();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isHome
        ? "bg-forest-dark/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-center h-20">
          <Link to="/" className="absolute left-6 lg:left-12 flex-shrink-0">
            <img src={wrLogo} alt="White Rabbit Los Angeles, luxury magician" width={48} height={48} className="h-12 w-auto invert brightness-200" fetchPriority="high" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-sans text-sm tracking-[0.2em] uppercase transition-colors duration-300 text-cream/80 hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
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
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="font-sans text-sm tracking-[0.2em] uppercase transition-colors text-cream/80 hover:text-cream"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setIsOpen(false); openQuiz(); }}
                className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-3 text-center"
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
