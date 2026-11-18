import SEOHead from "@/components/SEOHead";

/** Find the Queen game, quarterly drawing and LIGHTS-UP credit rules. */
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
      "Open to legal residents of the 50 United States and the District of Columbia who are at least 18 years old at the time of entry. Employees of White Rabbit LA and members of their immediate households are not eligible.",
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
      "By playing: play Find the Queen on whiterabbitla.com. If the card you pick is the Queen of Hearts and you then submit your first name and email address on the claim form, you are entered in the drawing for that quarter.",
      "Free alternate entry, without playing: send an email to events@whiterabbitla.com with the subject line \"Find the Queen entry\" and your first name in the message. Each eligible email received during a quarter is entered in that quarter's drawing and has the same chance of winning as an entry from the game.",
      "Limit one entry per person and per email address each quarter, whichever way you enter.",
    ],
  },
  {
    id: "the-game",
    title: "The game and its odds",
    body: [
      "Find the Queen uses five cards: the Queen of Hearts and four black cards. The Queen is placed at random and shown to you, then the cards are shuffled in plain view. The card you pick turns over to show its true face, and nothing in the game stops you from finding her.",
      "A guest who picks at random has a 1 in 5 chance of finding the Queen. Following the shuffle closely may improve your chances.",
    ],
  },
  {
    id: "drawing",
    title: "Drawing and winner notification",
    body: [
      "Within 15 days after each quarter ends, White Rabbit LA selects one winner at random, by computer, from all eligible entries for that quarter. Odds of winning the drawing depend on the number of eligible entries received that quarter.",
      "The winner is notified by email at the address used to enter, within 7 days of the drawing, and must reply within 14 days to claim the prize. If the winner does not reply in time, is found ineligible, or declines the prize, an alternate winner may be selected at random from the remaining entries for that quarter.",
    ],
  },
  {
    id: "prize",
    title: "Prize and approximate value",
    body: [
      "One winner each quarter receives one complimentary White Rabbit show. Approximate retail value: $2,500.",
      "The show must be scheduled within 12 months of notification, subject to availability, and takes place in the Los Angeles area unless otherwise agreed. Travel, venue and any other costs not stated here are the winner's responsibility, as are any taxes on the prize. The prize is not transferable and cannot be exchanged for cash.",
    ],
  },
  {
    id: "credit-terms",
    title: "Credit terms",
    body: [
      "Every guest who completes the Find the Queen claim form receives a code in the form LIGHTS-UP-XXXX for a $250 credit toward a White Rabbit show, whether or not they found the Queen. The credit is separate from the drawing.",
      "The credit is valid only on packages of $2,500 or more, one per event, on new bookings only, for 12 months from the day it is issued. It is non-transferable, has no cash value and cannot be combined with other offers.",
      "An email address is required to receive the code. The optional box to receive the occasional note from White Rabbit does not affect the credit or the drawing.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    body: [
      "Information you share is used to send your code, run the drawing and contact the winner, and is held under our Privacy Policy at whiterabbitla.com/privacy.",
    ],
  },
  {
    id: "general",
    title: "General conditions",
    body: [
      "White Rabbit LA may disqualify entries made by automated means or in breach of these rules, and may suspend or modify the game or the drawing if fraud or a technical problem affects its fairness. By entering, you agree to these rules and to the decisions of White Rabbit LA, which are final.",
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
      description="Official rules for the Find the Queen game, the quarterly drawing for a complimentary White Rabbit show, and the LIGHTS-UP credit."
      canonical="/official-rules"
      noIndex
    />
    <section className="bg-forest-dark py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Find the Queen Official Rules</h1>
        <p className="font-sans text-sm text-cream/60">The five card game, the quarterly drawing for a complimentary White Rabbit show, and the credit terms</p>
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
