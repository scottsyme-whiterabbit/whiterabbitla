import { useEffect, useMemo } from "react";
import { Loader2, Send, X } from "lucide-react";
import { renderProposalSendEmailHtml } from "@/lib/proposalSendEmail";

export interface ProposalSendDraft {
  to: string;
  subject: string;
  message: string;
}

interface Props {
  draft: ProposalSendDraft;
  firstName: string;
  link: string;
  sending: boolean;
  onChange: (draft: ProposalSendDraft) => void;
  onSend: () => void;
  onCancel: () => void;
}

export default function ProposalSendPreviewModal({ draft, firstName, link, sending, onChange, onSend, onCancel }: Props) {
  const html = useMemo(
    () => renderProposalSendEmailHtml({ firstName, message: draft.message, link }),
    [firstName, draft.message, link],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, sending]);

  const close = () => {
    if (!sending) onCancel();
  };

  const fieldCls = "w-full border border-forest-dark/20 px-3 py-2 bg-white text-forest-dark text-sm focus:outline-none focus:border-gold";
  const labelCls = "block text-xs uppercase tracking-wider text-forest-dark/60 mb-1";

  return (
    <div
      className="fixed inset-0 z-[60] bg-forest-dark/60 flex items-start md:items-center justify-center overflow-y-auto p-0 md:p-6"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Send proposal"
    >
      <div
        className="bg-cream w-full max-w-5xl min-h-full md:min-h-0 md:max-h-[92vh] flex flex-col border border-gold/40 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-forest-dark/15">
          <h2 className="font-serif text-2xl text-forest-dark">Send Proposal</h2>
          <button onClick={close} disabled={sending} title="Close" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white rounded disabled:opacity-40">
            <X className="w-5 h-5 text-forest-dark" />
          </button>
        </div>

        <div className="flex-1 md:overflow-y-auto grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 p-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="send-to" className={labelCls}>To</label>
              <input
                id="send-to"
                type="email"
                value={draft.to}
                onChange={(e) => onChange({ ...draft, to: e.target.value })}
                className={fieldCls}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label htmlFor="send-subject" className={labelCls}>Subject</label>
              <input
                id="send-subject"
                type="text"
                value={draft.subject}
                onChange={(e) => onChange({ ...draft, subject: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="send-message" className={labelCls}>Personal message</label>
              <textarea
                id="send-message"
                rows={8}
                value={draft.message}
                onChange={(e) => onChange({ ...draft, message: e.target.value })}
                className={fieldCls + " resize-y"}
              />
              <p className="text-xs text-forest-dark/50 mt-1">Greeting and signature are added automatically. If left blank, the default message is sent.</p>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="border border-forest-dark/15 bg-white px-4 py-3 text-sm text-forest-dark space-y-1">
              <p className="break-all"><span className="text-forest-dark/50">To: </span>{draft.to || <span className="text-forest-dark/40">No recipient yet</span>}</p>
              <p className="break-words"><span className="text-forest-dark/50">Subject: </span><span className="font-medium">{draft.subject || <span className="text-forest-dark/40 font-normal">No subject yet</span>}</span></p>
            </div>
            <iframe
              title="Email preview"
              srcDoc={html}
              sandbox=""
              className="w-full h-[560px] md:h-[600px] border border-t-0 border-forest-dark/15 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-forest-dark/15">
          <button
            onClick={close}
            disabled={sending}
            className="px-5 py-3 min-h-[44px] border border-forest-dark/20 text-forest-dark hover:bg-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="px-5 py-3 min-h-[44px] bg-forest-dark text-cream hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
