import { useMemo, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Tier, ProposalData } from "@/pages/ProposalTemplate";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Props {
  open: boolean;
  onClose: () => void;
  tier: Tier | null;
  proposal: ProposalData & { id?: string; slug?: string };
}

const buildAgreement = (opts: {
  clientName: string;
  clientEmail: string;
  tier: Tier;
  proposal: ProposalData;
  signedDate: string;
}) => {
  const { clientName, clientEmail, tier, proposal, signedDate } = opts;
  const eventDate = proposal.event_date || "TBD";
  const venue = proposal.venue || "TBD";
  const eventType = proposal.event_type || "Event";
  const items = tier.items.map((i) => `  • ${i}`).join("\n");

  return `PERFORMANCE AGREEMENT — WHITE RABBIT LA

Between: Scott Syme / White Rabbit LA ("Performer")
And: ${clientName}${clientEmail ? ` <${clientEmail}>` : ""} ("Client")
Signed: ${signedDate}

EVENT
  Type: ${eventType}
  Date: ${eventDate}
  Venue: ${venue}

PACKAGE SELECTED
  ${tier.name} — ${tier.price}
  ${tier.tagline}

INCLUDES
${items}

PAYMENT
  A 50% non-refundable retainer is due upon signing to reserve the date.
  The remaining 50% balance is due no later than the day before the event.
  Payment is made via Square invoice sent by the Performer.

CANCELLATION
  If the Client cancels more than 30 days before the event, the retainer is
  retained by the Performer. If cancellation occurs within 30 days of the
  event, the full contract price is due. If the Performer must cancel due
  to circumstances beyond their control, all payments made will be refunded
  in full or the event will be rescheduled at the Client's option.

TRAVEL
  Pricing above covers standard Los Angeles County. Travel outside LA
  County (airfare, ground transport, and lodging where applicable) will
  be added at cost with prior written approval by the Client.

RESCHEDULING
  One reschedule is permitted at no additional charge, subject to
  Performer availability, when requested at least 14 days in advance.

FORCE MAJEURE
  Neither party is liable for failure to perform due to events beyond
  reasonable control (illness, injury, natural disaster, government
  order, venue closure, or similar). In such case the parties will make
  reasonable efforts to reschedule; if not possible, any unearned
  payments will be refunded.

MEDIA
  Performer may capture non-identifying photo/video of the performance
  for portfolio and marketing use. Client may request in writing that no
  such media be used.

CONDUCT & ENVIRONMENT
  Client agrees to provide a safe performance environment. Performer
  reserves the right to end the engagement without refund if guests or
  conditions become unsafe.

ENTIRE AGREEMENT
  This document is the complete agreement between the parties for the
  event described above and supersedes any prior discussion or writing.

By typing their name below, the Client agrees to the terms above and
authorizes White Rabbit LA to send a Square invoice for the retainer.

CLIENT SIGNATURE: ${clientName}
DATE: ${signedDate}
`;
};

const SignAgreementModal = ({ open, onClose, tier, proposal }: Props) => {
  const [clientName, setClientName] = useState(
    `${proposal.first_name || ""} ${proposal.last_name || ""}`.trim()
  );
  const [clientEmail, setClientEmail] = useState(proposal.recipient_email || "");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const signedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [open]
  );

  if (!open || !tier) return null;

  const agreementText = buildAgreement({
    clientName: clientName || "____________________",
    clientEmail,
    tier,
    proposal,
    signedDate,
  });

  const submit = async () => {
    if (!clientName.trim()) return toast.error("Please type your full name.");
    if (!agreed) return toast.error("Please check the box to agree to the terms.");
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/proposals-api?action=sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposal.id || null,
          proposal_slug: proposal.slug || null,
          tier_name: tier.name,
          tier_price: tier.price,
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          event_type: proposal.event_type,
          event_date: proposal.event_date,
          venue: proposal.venue,
          agreement_text: agreementText,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Sign failed");
      setDone(true);
      toast.success("Agreement signed — check your email for a copy.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-forest-dark/80 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream text-forest-dark w-full max-w-2xl my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-forest-dark/60 hover:text-forest-dark"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-5" />
            <h2 className="font-serif text-3xl mb-3">Signed.</h2>
            <p className="text-sm text-forest-dark/70 mb-6 max-w-md mx-auto">
              A copy of the agreement has been emailed to you. Scott will send a Square invoice
              for the 50% retainer shortly to lock in your date.
            </p>
            <button
              onClick={onClose}
              className="bg-forest-dark text-cream px-6 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">Agreement</p>
            <h2 className="font-serif font-light text-2xl md:text-3xl mb-1">
              {tier.name}
            </h2>
            <p className="text-sm text-forest-dark/70 mb-5">
              {tier.price} · {proposal.event_type}
              {proposal.event_date ? ` on ${proposal.event_date}` : ""}
            </p>

            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                  Full legal name
                </span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 w-full border border-forest-dark/20 bg-white px-3 py-2.5 text-sm"
                  placeholder="Type your full name"
                  maxLength={200}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                  Email
                </span>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="mt-1 w-full border border-forest-dark/20 bg-white px-3 py-2.5 text-sm"
                  placeholder="you@example.com"
                  maxLength={200}
                />
              </label>
            </div>

            <div className="border border-forest-dark/15 bg-white/60 p-4 max-h-72 overflow-y-auto mb-4">
              <pre className="font-serif text-[12.5px] leading-relaxed whitespace-pre-wrap text-forest-dark/85">
                {agreementText}
              </pre>
            </div>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-forest-dark"
              />
              <span className="text-sm text-forest-dark/80">
                I have read and agree to the terms above. Typing my name serves as my
                electronic signature.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-forest-dark text-cream py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign & Reserve — {tier.price}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3.5 text-xs tracking-[0.2em] uppercase border border-forest-dark/25 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignAgreementModal;
