import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import ClientContextPanel, { type ClientTarget } from "@/components/admin/ClientContextPanel";

type OpenFn = (t: ClientTarget) => void;
const Ctx = createContext<OpenFn | null>(null);

/** Mount once per admin page. Any ClientName inside opens the same client file. */
export const ClientFileProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<ClientTarget | null>(null);
  const [open, setOpen] = useState(false);
  const openClient = useCallback<OpenFn>((t) => {
    if (!t.email && !t.dealId) return;
    setTarget({ ...t });
    setOpen(true);
  }, []);
  // Phone back gesture closes the client file instead of leaving the page.
  const pushed = useRef(false);
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ clientFile: true }, "");
    pushed.current = true;
    const onPop = () => { pushed.current = false; setOpen(false); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (pushed.current) { pushed.current = false; window.history.back(); }
    };
  }, [open]);
  return (
    <Ctx.Provider value={openClient}>
      {children}
      <ClientContextPanel target={target} open={open} onOpenChange={setOpen} />
    </Ctx.Provider>
  );
};

export const useClientFile = () => useContext(Ctx);

interface NameProps {
  email?: string | null;
  name?: string | null;
  dealId?: string | null;
  className?: string;
  children?: ReactNode;
}

/** A client's name that opens their client file. Falls back to plain text outside a provider or without an email. */
export const ClientName = ({ email, name, dealId, className = "", children }: NameProps) => {
  const openClient = useClientFile();
  const label = children ?? (name || email || "Client");
  if (!openClient || (!email && !dealId)) return <span className={className}>{label}</span>;
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openClient({ email: email || "", name: name || null, dealId: dealId || null });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title="Open client file"
      className={`text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 hover:text-accent hover:decoration-accent transition-colors ${className}`}
    >
      {label}
    </button>
  );
};
