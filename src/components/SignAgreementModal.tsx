import { useCallback, useMemo, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

import type { Tier, ProposalData } from "@/pages/ProposalTemplate";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type PayInfo = {
  pay_token: string | null;
  total_cents: number | null;
  deposit_cents: number | null;
  pay_url: string | null;
};

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

interface Props {
  open: boolean;
  onClose: () => void;
  tier: Tier | null;
  proposal: ProposalData & { id?: string; slug?: string };
}

const detectDefaultArrival = (tier: Tier): string => {
  const hay = `${tier.name} ${tier.items.join(" ")}`.toLowerCase();
  const isShow = /(parlor|parlour|stage|show|theater|theatre|seated|illusion)/.test(hay);
  const isWalkAround = /(walk-?around|strolling|close-?up|cocktail|roving|mingle)/.test(hay);
  if (isShow && !isWalkAround) return "45 minutes before show time";
  return "30 minutes before show time";
};

const buildAgreement = (opts: {
  clientName: string;
  clientEmail: string;
  tier: Tier;
  proposal: ProposalData;
  signedDate: string;
  arrivalTime: string;
  performanceTime: string;
  eventLocation: string;
}) => {
  const { clientName, clientEmail, tier, proposal, signedDate, arrivalTime, performanceTime, eventLocation } = opts;
  const eventDate = proposal.event_date || "TBA";
  const eventType = proposal.event_type || "Event";
  const services = tier.items.map((i) => `- ${i}`).join("\n");

  return `WHITE RABBIT ENTERTAINMENT PERFORMANCE AGREEMENT

Client Name: ${clientName}${clientEmail ? ` <${clientEmail}>` : ""}
Event Name: ${eventType}
Event Date: ${eventDate}
Event Location: ${eventLocation || "TBA"}
Performance Time: ${performanceTime || "TBA"}
Arrival Time: ${arrivalTime}

Package Selected: ${tier.name} — ${tier.price}

Services Provided:
White Rabbit Entertainment agrees to provide professional entertainment for the above-referenced event. The services include:
${services}
- Pre-event consultation with the client and/or planner to confirm flow of the evening and any special moments.

Performance Requirements:
- Client agrees to provide parking or give parking instructions close to the venue entrance for ease of access.
- A secure area or small designated space will be made available for the performer and equipment setup.
- Magician Scott Syme will be dressed in professional attire suitable for the event's ambiance.
- Performance start time is fixed. Delays caused by the client or venue do not extend the agreed end time.
- Additional performance time beyond the contracted end time is subject to availability and an agreed-upon rate determined the night of the event.

Payment & Booking Confirmation:
- A paid invoice or deposit is required to secure the performance date. Until payment is received, the booking is not confirmed, and availability cannot be guaranteed.
- A 50% deposit is due upon receipt to lock the date. The remaining 50% is due the day before the event, unless otherwise agreed upon in writing.
- If the final balance is not paid within 7 days of the agreed balance-due date, a late fee of $200 will be added to the total amount owed.

Cancellation & Rescheduling:
- If the client needs to cancel or reschedule, a written notice must be provided at least 7 days before the event. Deposits are non-refundable but may be applied toward a rescheduled event at White Rabbit Entertainment's discretion.
- In the unlikely event that White Rabbit Entertainment is unable to perform due to unforeseen circumstances (e.g., illness, emergency), reasonable efforts will be made to provide a suitable replacement or issue a full refund.

Liability & Conduct:
- White Rabbit Entertainment will not be held liable for any property damage, injuries, or unforeseen circumstances resulting from the performance. (White Rabbit does carry performer insurance.)
- Performers will conduct themselves professionally and in accordance with the event's guidelines. In the event of inappropriate behavior from guests that compromises safety or disrupts the performance, White Rabbit Entertainment reserves the right to conclude the performance early without refund.

Contact Information:
For any questions, modifications, or special requests, please contact White Rabbit Entertainment at:
Email: scott.syme@whiterabbitla.com
Phone: (424) 394-1850 / (650) 678-9428

By paying the deposit invoice, the client acknowledges and agrees to the terms outlined in this agreement.

Thank you for choosing White Rabbit Entertainment!

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
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);
  const [payOption, setPayOption] = useState<"deposit" | "full" | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const [arrivalTime, setArrivalTime] = useState(() =>
    tier ? detectDefaultArrival(tier) : "30 minutes before show time"
  );
  const [performanceTime, setPerformanceTime] = useState("");
  const [eventLocation, setEventLocation] = useState(proposal.venue || "");

  const signedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [open]
  );

  const startCheckout = useCallback(async (option: "deposit" | "full") => {
    setPayOption(option);
    setRedirecting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/invoice-api?action=checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: payInfo?.pay_token,
          option,
          environment: getStripeEnvironment(),
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url as string;
    } catch (e) {
      toast.error((e as Error).message);
      setRedirecting(false);
      setPayOption(null);
    }
  }, [payInfo]);


  if (!open || !tier) return null;

  const agreementText = buildAgreement({
    clientName: clientName || "____________________",
    clientEmail,
    tier,
    proposal,
    signedDate,
    arrivalTime: arrivalTime.trim() || detectDefaultArrival(tier),
    performanceTime: performanceTime.trim(),
    eventLocation: eventLocation.trim(),
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
      setPayInfo({
        pay_token: j.pay_token ?? null,
        total_cents: j.total_cents ?? null,
        deposit_cents: j.deposit_cents ?? null,
        pay_url: j.pay_url ?? null,
      });
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

        {done && payInfo?.pay_token && !payOption ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-5" />
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">Agreement Signed</p>
            <h2 className="font-serif font-light text-3xl mb-3">Now, let's hold your date.</h2>
            <p className="text-sm text-forest-dark/70 mb-7 max-w-md mx-auto">
              A copy of your agreement is on its way to your inbox. Securing your date takes about
              a minute — by bank transfer or card, whichever you prefer. The moment it lands, the
              evening is yours.
            </p>
            <div className="space-y-3 max-w-sm mx-auto">
              <button
                onClick={() => startCheckout("deposit")}
                className="w-full bg-gold text-forest-dark py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90"
              >
                Reserve with 50% deposit — {money(payInfo.deposit_cents ?? 0)}
              </button>
              <button
                onClick={() => startCheckout("full")}
                className="w-full border border-forest-dark/30 py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-white"
              >
                Pay in full — {money(payInfo.total_cents ?? 0)}
              </button>
            </div>
            <p className="mt-5 text-[11px] text-forest-dark/50">
              Prefer to pay later? The same link is waiting in your email.
            </p>
          </div>
        ) : done && payInfo?.pay_token && payOption ? (
          <div className="p-10 text-center">
            <Loader2 className="w-8 h-8 text-gold mx-auto mb-4 animate-spin" />
            <p className="text-sm text-forest-dark/70">Redirecting to secure checkout…</p>
          </div>

        ) : done ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-5" />
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">Agreement Signed</p>
            <h2 className="font-serif font-light text-3xl mb-3">Signed.</h2>
            <p className="text-sm text-forest-dark/70 mb-6 max-w-md mx-auto">
              A copy of your agreement is in your inbox. I'll follow up shortly with your invoice
              to lock the date. — Scott
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

            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                  Event Location
                </span>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="mt-1 w-full border border-forest-dark/20 bg-white px-3 py-2.5 text-sm"
                  placeholder="Venue name / address or TBA"
                  maxLength={200}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                  Performance Time
                </span>
                <input
                  type="text"
                  value={performanceTime}
                  onChange={(e) => setPerformanceTime(e.target.value)}
                  className="mt-1 w-full border border-forest-dark/20 bg-white px-3 py-2.5 text-sm"
                  placeholder="e.g. 7:30 – 9:00 PM or TBA"
                  maxLength={120}
                />
              </label>
            </div>

            <label className="block mb-4">
              <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                Arrival Time
              </span>
              <input
                type="text"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="mt-1 w-full border border-forest-dark/20 bg-white px-3 py-2.5 text-sm"
                placeholder="30 minutes before show time"
                maxLength={120}
              />
              <span className="mt-1 block text-[11px] text-forest-dark/50">
                Default: 30 min for walk-around close-up · 45 min for a seated show. Edit if agreed otherwise.
              </span>
            </label>


            <div className="border border-forest-dark/15 bg-white/60 p-4 max-h-72 overflow-y-auto mb-4">
              <pre className="font-sans text-[13px] leading-[1.7] whitespace-pre-wrap text-forest-dark/90">
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
