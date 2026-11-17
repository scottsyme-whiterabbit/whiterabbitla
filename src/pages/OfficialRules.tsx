import SEOHead from "@/components/SEOHead";

/** Find the Queen drawing rules. Draft wording, pending legal review; bracketed items are placeholders to confirm. */
const SECTIONS: { id: string; title: string; body: string[] }[] = [
  {
    id: "no-purchase",
    title: "No purchase necessary",
    body: [
      "No purchase or payment of any kind is necessary to enter or win. A purchase will not improve your chances of winning. Void where prohibited.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: [
      "[To confirm] Open to legal residents of the United States who are at least 18 years old at the time of entry. Employees of White Rabbit LA and members of their immediate households are not eligible.",
    ],
  },
  {
    id: "entry-period",
    title: "Entry period",
    body: [
      "The drawing runs every calendar quarter: January through March, April through June, July through September, and October through December. Each quarter begins at 12:00 AM and ends at 11:59 PM Pacific Time on its first and last days. Entries count toward the quarter in which they are received.",
    ],
  },
  {
    id: "how-to-enter",
    title: "How to enter",
    body: [
      "Online: play Find the Queen on whiterabbitla.com and submit your first name and email address on the claim form. Every completed form is entered, whatever card you choose.",
      "Free entry by email, without playing: send an email to events@whiterabbitla.com with the subject line \"Find the Queen entry\" and your first name in the message. Email entries have the same chance of winning as online entries.",
      "[To confirm] Limit one entry per person, per household, per quarter, whichever way you enter.",
    ],
  },
  {
    id: "prize",
    title: "Prize and approximate value",
    body: [
      "One winner each quarter receives one complimentary White Rabbit show. Approximate retail value: $2,500.",
      "[To confirm] The show must be scheduled within 12 months of notification, subject to availability, and within the Los Angeles area unless otherwise agreed. The prize is not transferable and cannot be exchanged for cash. Travel, venue and any other costs not stated are the winner's responsibility.",
    ],
  },
  {
    id: "odds",
    title: "Odds",
    body: [
      "Odds of winning depend on the number of eligible entries received during the quarter.",
    ],
  },
  {
    id: "drawing",
    title: "Drawing date and winner notification",
    body: [
      "[To confirm] The winner is selected at random from all eligible entries within 15 days after each quarter ends. The winner will be notified by email at the address used to enter and must reply within 14 days to claim the prize, or an alternate winner may be drawn.",
    ],
  },
  {
    id: "credit-terms",
    title: "Credit terms",
    body: [
      "Everyone who completes the Find the Queen claim form receives a $500 credit toward a White Rabbit show. The credit is separate from the drawing.",
      "[To confirm] One credit per household. Valid 12 months from the day it is issued. Applies to new bookings of $2,500 or more. Non-transferable, no cash value, and not combinable with other offers.",
    ],
  },
  {
    id: "sponsor",
    title: "Sponsor",
    body: [
      "White Rabbit LA, 7393 W. Manchester Ave #209, Los Angeles, CA 90045. Questions: events@whiterabbitla.com.",
    ],
  },
];

const OfficialRules = () => (
  <main id="main-content" className="pt-20">
    <SEOHead
      title="Find the Queen Official Rules | White Rabbit LA"
      description="Official rules for the Find the Queen quarterly drawing and the $500 White Rabbit credit."
      canonical="/official-rules"
      noIndex
    />
    <section className="bg-forest-dark py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="inline-block font-sans text-[11px] tracking-[0.2em] uppercase text-accent border border-accent/40 px-3 py-1.5 mb-6">
          Draft, pending legal review
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Find the Queen Official Rules</h1>
        <p className="font-sans text-sm text-cream/60">Quarterly drawing for a complimentary White Rabbit show</p>
      </div>
    </section>
    <section className="py-14 md:py-20">
      <div className="max-w-2xl mx-auto px-6 space-y-10">
        {SECTIONS.map((s, i) => (
          <div key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="font-serif text-2xl text-foreground mb-3">{i + 1}. {s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  </main>
);

export default OfficialRules;
