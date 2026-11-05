import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * On desktop renders a normal input/textarea. On phones, tapping the field
 * opens a full-screen editor sized to the visible viewport so Save and Cancel
 * sit just above the keyboard. The value only changes when Save is tapped.
 */
type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  placeholder?: string;
  rows?: number;
  multiline?: boolean;
};

export const ExpandableField = ({ value, onChange, label, className, placeholder, rows, multiline = true }: Props) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const openEditor = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    e.currentTarget.blur();
    setOpen(true);
  };
  return (
    <>
      {multiline ? (
        <textarea className={className} placeholder={placeholder} rows={rows} value={value} onFocus={openEditor} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      ) : (
        <input className={className} placeholder={placeholder} value={value} onFocus={openEditor} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      )}
      {open && <FullScreenTextEditor label={label} initial={value} placeholder={placeholder} multiline={multiline} onCancel={() => setOpen(false)} onSave={(v) => { onChange(v); setOpen(false); }} />}
    </>
  );
};

const FullScreenTextEditor = ({ label, initial, placeholder, multiline, onCancel, onSave }: { label: string; initial: string; placeholder?: string; multiline: boolean; onCancel: () => void; onSave: (v: string) => void }) => {
  const [draft, setDraft] = useState(initial);
  const [box, setBox] = useState<{ top: number; height: number }>(() => ({ top: 0, height: typeof window !== "undefined" ? window.innerHeight : 0 }));
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => setBox({ top: vv ? vv.offsetTop : 0, height: vv ? vv.height : window.innerHeight });
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const el = ref.current;
      if (el) { el.focus({ preventScroll: true }); el.setSelectionRange(el.value.length, el.value.length); }
    }, 50);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${label}`}
      className="fixed inset-x-0 z-[100] flex flex-col bg-cream"
      style={{ top: box.top, height: box.height }}
    >
      <div className="flex items-center justify-between border-b border-forest-dark/10 bg-white px-4 py-2" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
        <span className="text-xs uppercase tracking-wider text-forest-dark/60">{label}</span>
        <span className="text-xs text-forest-dark/50">{draft.length} characters</span>
      </div>
      <textarea
        ref={ref}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(multiline ? e.target.value : e.target.value.replace(/\n/g, " "))}
        className="min-h-0 flex-1 w-full resize-none overflow-y-auto overscroll-contain bg-white px-4 py-3 text-base leading-relaxed text-forest-dark outline-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      />
      <div className="flex gap-3 border-t border-forest-dark/10 bg-white px-4 py-2">
        <button type="button" onClick={onCancel} className="min-h-[44px] flex-1 border border-forest-dark/20 text-base text-forest-dark">Cancel</button>
        <button type="button" onClick={() => onSave(draft)} className="min-h-[44px] flex-1 bg-forest-dark text-base text-cream">Save</button>
      </div>
    </div>,
    document.body,
  );
};
