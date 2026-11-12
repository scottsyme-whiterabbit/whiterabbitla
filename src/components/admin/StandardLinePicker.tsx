import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StandardLine } from "@/data/proposalAssets";

/**
 * Multi-select standard line menu. Tapping a line only toggles it; nothing is
 * added until "Add selected" is pressed. Closing or canceling adds nothing.
 * Selected lines are returned in the menu's own order.
 */
type Props = { lines: StandardLine[]; onAdd: (lines: string[]) => void };

export const StandardLinePicker = ({ lines, onAdd }: Props) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = () => { setOpen(false); setSelected(new Set()); };
  const toggle = (text: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(text)) next.delete(text); else next.add(text);
    return next;
  });
  const confirm = () => {
    const picked = lines.map(l => l.text).filter(text => selected.has(text));
    close();
    if (picked.length) onAdd(picked);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (isMobile) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open, isMobile]);

  // Desktop: keep the whole menu, including its Add selected button, on screen.
  useEffect(() => {
    if (open && !isMobile) panelRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [open, isMobile]);

  const groups = Array.from(new Set(lines.map(l => l.group)));
  const count = selected.size;

  const list = (
    <div className="flex-1 overflow-y-auto overscroll-contain" role="group" aria-label="Standard lines">
      {groups.map(group => (
        <div key={group}>
          <div className="sticky top-0 z-10 bg-cream px-3 py-1.5 text-xs uppercase tracking-wider text-forest-dark/60">{group}</div>
          {lines.filter(l => l.group === group).map(l => {
            const on = selected.has(l.text);
            return (
              <button
                key={l.text}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(l.text)}
                className={`flex w-full min-h-[44px] items-start gap-3 px-3 py-2.5 text-left text-base sm:text-sm text-forest-dark border-b border-forest-dark/5 ${on ? "bg-gold/10" : "bg-white hover:bg-cream/60"}`}
              >
                <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${on ? "border-forest-dark bg-forest-dark text-cream" : "border-forest-dark/30 bg-white"}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">{l.text}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const footer = (
    <div className="flex shrink-0 gap-2 border-t border-forest-dark/10 bg-white p-2" style={isMobile ? { paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" } : undefined}>
      <button type="button" onClick={close} className="min-h-[44px] flex-1 border border-forest-dark/20 px-3 text-sm text-forest-dark hover:bg-cream">Cancel</button>
      <button type="button" onClick={confirm} disabled={count === 0} className="min-h-[44px] flex-[2] bg-forest-dark px-3 text-sm font-medium text-cream disabled:opacity-40 disabled:cursor-not-allowed">
        Add selected ({count})
      </button>
    </div>
  );

  return (
    <div ref={wrapRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full sm:w-auto sm:max-w-[260px] min-h-[44px] items-center justify-between gap-2 border border-forest-dark/20 bg-white px-2 py-1 text-base sm:text-xs text-forest-dark"
      >
        <span>+ Standard line...</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </button>
      {open && !isMobile && (
        <div ref={panelRef} role="dialog" aria-label="Choose standard lines" className="absolute right-0 z-50 mt-1 flex max-h-[60vh] scroll-mb-24 w-[min(420px,90vw)] flex-col border border-forest-dark/20 bg-white shadow-lg">
          {list}
          {footer}
        </div>
      )}
      {open && isMobile && <MobileSheet onClose={close}>{list}{footer}</MobileSheet>}
    </div>
  );
};

const MobileSheet = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  const [box, setBox] = useState<{ top: number; height: number }>(() => ({ top: 0, height: typeof window !== "undefined" ? window.innerHeight : 0 }));
  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => setBox({ top: vv ? vv.offsetTop : 0, height: vv ? vv.height : window.innerHeight });
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Choose standard lines" className="fixed inset-x-0 z-[100] flex flex-col bg-cream" style={{ top: box.top, height: box.height }}>
      <div className="flex shrink-0 items-center justify-between border-b border-forest-dark/10 bg-white px-4 py-2" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
        <span className="text-xs uppercase tracking-wider text-forest-dark/60">Standard lines</span>
        <button type="button" onClick={onClose} className="min-h-[44px] px-2 text-sm text-forest-dark/70">Close</button>
      </div>
      {children}
    </div>,
    document.body,
  );
};
