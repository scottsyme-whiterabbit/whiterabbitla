import { useEffect } from "react";
import { Instagram, Linkedin, Globe, Phone, Mail, MapPin, Download, ExternalLink, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

import wrLogo from "@/assets/wr-email-logo.png";
import scottPhoto from "@/assets/scott-couch.jpg";

const VCARD = `BEGIN:VCARD
VERSION:3.0
FN:Scott Syme
N:Syme;Scott;;;
ORG:White Rabbit Entertainment
TITLE:Founder & Magician
TEL;TYPE=CELL:+14243941850
EMAIL:events@whiterabbitla.com
URL:https://whiterabbitla.com
ADR;TYPE=WORK:;;Los Angeles;CA;;US
NOTE:Luxury event magician — corporate, private, weddings.
END:VCARD`;

const handleSaveContact = () => {
  const blob = new Blob([VCARD], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Scott-Syme-WhiteRabbit.vcf";
  a.click();
  URL.revokeObjectURL(url);
};

const socialLinks = [
  {
    label: "Venmo",
    href: "https://venmo.com/Scott-SymeJr",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.5 1.5c.9 1.5 1.3 3.1 1.3 5.1 0 6.3-5.4 14.5-9.8 20.3H3.3L.5 2.1l7.1-.7 1.7 13.8c1.6-2.6 3.5-6.7 3.5-9.5 0-1.9-.3-3.2-.8-4.2l7.5-0z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/scottsymejr",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/scottsyme_/",
    icon: Instagram,
  },
];

const DigitalCard = () => {
  usePageMeta({
    title: "Scott Syme | White Rabbit Magic",
    description: "Connect with Scott Syme — Founder & Magician at White Rabbit Entertainment, Los Angeles.",
    path: "/card",
  });

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <main className="min-h-screen bg-forest-dark flex items-center justify-center p-4 pt-24 pb-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-background rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Band */}
          <div className="bg-forest-dark py-8 flex justify-center">
            <img
              src={wrLogo}
              alt="White Rabbit Los Angeles logo"
              className="h-24 object-contain"
            />
          </div>

          {/* Profile Section */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-accent mb-4 shadow-lg">
              <img
                src={scottPhoto}
                alt="Scott Syme"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="font-serif text-2xl text-foreground">Scott Syme</h1>
            <p className="font-sans text-sm text-accent mt-1">
              Founder & Magician at White Rabbit Entertainment
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin size={12} /> Los Angeles, CA
            </p>
          </div>

          {/* Save Contact Button */}
          <div className="px-6 pb-4">
            <button
              onClick={handleSaveContact}
              className="w-full flex items-center justify-center gap-2 bg-accent text-forest-dark font-sans text-sm font-semibold tracking-wide uppercase py-3.5 rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Download size={18} />
              Save Contact
            </button>
          </div>

          {/* Social Icons */}
          <div className="px-6 pb-5">
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Connect
            </p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-accent hover:text-forest-dark transition-colors"
                  aria-label={link.label}
                >
                  <link.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="px-6 pb-6 space-y-2">
            <a
              href="https://whiterabbitla.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
            >
              <Globe size={18} className="text-accent" />
              <span className="font-sans text-sm text-foreground flex-1">Website</span>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
            <a
              href="tel:+14243941850"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
            >
              <Phone size={18} className="text-accent" />
              <span className="font-sans text-sm text-foreground flex-1">(424) 394-1850</span>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
            <a
              href="mailto:events@whiterabbitla.com"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
            >
              <Mail size={18} className="text-accent" />
              <span className="font-sans text-sm text-foreground flex-1">events@whiterabbitla.com</span>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
            <a
              href="https://whiterabbitla.com/quiz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
            >
              <Sparkles size={18} className="text-accent" />
              <span className="font-sans text-sm text-foreground flex-1">What magic fits your event?</span>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-sans text-xs text-cream/40 mt-6">
          whiterabbitla.com
        </p>
      </div>
    </main>
  );
};

export default DigitalCard;
