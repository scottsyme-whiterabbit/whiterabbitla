import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import wrLogo from "@/assets/wr-second-primary-logo.png";

const Footer = () => {
  return (
    <footer className="bg-forest-dark text-cream/80 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src={wrLogo} alt="White Rabbit Los Angeles" className="h-24 w-auto brightness-0 invert opacity-80" />
            <p className="font-serif text-lg italic text-cream/60">
              Redefining the perception of magic.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center gap-3">
            <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Navigate</h4>
            {["Experience", "About", "Reviews", "Blog", "Contact"].map((link) => (
              <Link
                key={link}
                to={`/${link.toLowerCase()}`}
                className="font-sans text-sm tracking-wider hover:text-cream transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Get in Touch</h4>
            <a href="mailto:scott.syme@whiterabbitla.com" className="flex items-center gap-2 text-sm hover:text-cream transition-colors">
              <Mail size={16} /> scott.syme@whiterabbitla.com
            </a>
            <a href="tel:+14243941850" className="flex items-center gap-2 text-sm hover:text-cream transition-colors">
              <Phone size={16} /> (424) 394-1850
            </a>
            <a href="https://instagram.com/whiterabbit_la" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-cream transition-colors">
              <Instagram size={16} /> @whiterabbit_la
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 text-center">
          <p className="font-sans text-xs tracking-wider text-cream/40">
            © {new Date().getFullYear()} White Rabbit Los Angeles. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
