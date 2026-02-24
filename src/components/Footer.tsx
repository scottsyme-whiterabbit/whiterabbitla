import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Phone } from "lucide-react";
import wrLogo from "@/assets/wr-logo-stars-white.png";
import threeStars from "@/assets/three-stars-gold.png";

const Footer = () => {
  return (
    <footer aria-label="Site footer" className="bg-forest-dark text-cream/80 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center md:items-start justify-center h-full">
            <img src={wrLogo} alt="White Rabbit Los Angeles luxury magic entertainment logo" loading="lazy" decoding="async" className="h-32 w-auto opacity-90" />
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-3 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Navigate</h4>
              {["Experience", "About", "Reviews", "Blog", "Contact"].map((link) =>
                <Link
                  key={link}
                  to={`/${link.toLowerCase()}`}
                  className="font-sans text-sm tracking-wider hover:text-cream transition-colors">
                  {link}
                </Link>
              )}
              <Link to="/refer" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">
                Refer a Friend
              </Link>
            </div>
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Services</h4>
              <Link to="/services/corporate-magician" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">Corporate Events</Link>
              <Link to="/services/wedding-magician" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">Weddings</Link>
              <Link to="/services/private-party-magician" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">Private Parties</Link>
              <Link to="/services/close-up-magician" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">Close-Up Magic</Link>
              <Link to="/services/private-magic-show" className="font-sans text-sm tracking-wider hover:text-cream transition-colors">Private Magic Show</Link>
              <Link to="/quiz" className="font-sans text-sm tracking-wider text-accent hover:text-cream transition-colors mt-3">Not sure? Take our quiz →</Link>
            </div>
          </nav>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Get in Touch</h4>
            <a href="mailto:events@whiterabbitla.com" className="flex items-center gap-2 text-sm hover:text-cream transition-colors">
              <Mail size={16} /> events@whiterabbitla.com
            </a>
            <a href="tel:+14243941850" className="flex items-center gap-2 text-sm hover:text-cream transition-colors">
              <Phone size={16} /> (424) 394-1850
            </a>
          </div>
        </div>

        {/* Social Follow Banner */}
        <div className="mt-12 pt-10 border-t border-cream/10">
          <div className="flex flex-col items-center gap-5">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">Follow the Magic</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <a href="https://www.instagram.com/scottsyme_/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-5 py-3 border border-cream/20 rounded-full hover:border-accent/60 hover:bg-accent/5 transition-all duration-300">
                <Instagram size={20} className="text-cream/60 group-hover:text-accent transition-colors" />
                <span className="font-sans text-sm tracking-wider text-cream/70 group-hover:text-cream transition-colors">@scottsyme_</span>
              </a>
              <a href="https://www.instagram.com/whiterabbit_la/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-5 py-3 border border-cream/20 rounded-full hover:border-accent/60 hover:bg-accent/5 transition-all duration-300">
                <Instagram size={20} className="text-cream/60 group-hover:text-accent transition-colors" />
                <span className="font-sans text-sm tracking-wider text-cream/70 group-hover:text-cream transition-colors">@whiterabbit_la</span>
              </a>
              <a href="https://www.linkedin.com/in/scottsymejr/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-5 py-3 border border-cream/20 rounded-full hover:border-accent/60 hover:bg-accent/5 transition-all duration-300">
                <Linkedin size={20} className="text-cream/60 group-hover:text-accent transition-colors" />
                <span className="font-sans text-sm tracking-wider text-cream/70 group-hover:text-cream transition-colors">Scott Syme</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-cream/10 text-center space-y-3">
          <img src={threeStars} alt="" aria-hidden="true" className="h-6 w-auto opacity-40 mx-auto mb-2" />
          <div className="flex items-center justify-center gap-4">
            <Link to="/privacy" className="font-sans text-[10px] tracking-wider text-cream/40 hover:text-cream/60 transition-colors">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-cream/20" />
            <Link to="/terms" className="font-sans text-[10px] tracking-wider text-cream/40 hover:text-cream/60 transition-colors">Terms of Service</Link>
          </div>
          <p className="font-sans text-xs tracking-wider text-cream/40">
            © {new Date().getFullYear()} White Rabbit Los Angeles. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);

};

export default Footer;