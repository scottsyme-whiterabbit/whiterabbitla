// Shared asset bank used by both the proposal renderer and the admin editor.
// Photos are referenced by stable string keys so the user's selections survive
// asset renames/hash changes without being lost.

import heroDesert from "@/assets/hero-desert.jpg";
import scottDesert from "@/assets/scott-desert-sitting.jpg";
import aboutHero from "@/assets/about-hero-desert.jpg";
import experienceHero from "@/assets/experience-hero-desert.jpg";
import scottCouch from "@/assets/scott-couch.jpg";
import eventParlorStage from "@/assets/event-parlor-stage.jpg";
import eventPenthouse from "@/assets/event-penthouse-show.jpg";
import eventScottBW from "@/assets/event-scott-bw-stage.jpg";
import eventScottCards from "@/assets/event-scott-cards.jpg";
import eventScottPerforming from "@/assets/event-scott-performing.jpg";
import eventCrowdReaction from "@/assets/event-crowd-reaction.jpg";
import eventGroupPhoto from "@/assets/event-group-photo.jpg";
import eventCloseupCocktail from "@/assets/event-closeup-cocktail.jpg";
import eventParlorAudience from "@/assets/event-parlor-audience.jpg";
import eventSilhouette from "@/assets/event-silhouette.jpg";
import eventCardsEmerald from "@/assets/event-cards-emerald.jpg";
import eventCuMagic from "@/assets/event-cu-magic-reaction.jpg";
import eventGuestReaction from "@/assets/event-guest-reaction.jpg";
import cardsMotion from "@/assets/cards-motion-curtain.jpg";
import cardsFan from "@/assets/cards-fan-closeup.jpg";
import scottSyme from "@/assets/scott-syme-photo.jpg";
import experienceCloseup from "@/assets/experience-closeup.jpg";
import experienceCorporate from "@/assets/experience-corporate.jpg";
import experiencePrivate from "@/assets/experience-private.jpg";
import experienceParlor from "@/assets/experience-parlor.jpg";
import proposalCardsBw from "@/assets/proposal-cards-bw.jpg";
import proposalCenterCards from "@/assets/proposal-center-cards.jpg";
import proposalDesert from "@/assets/proposal-desert.jpg";

import photoCardsDetail from "@/assets/events/proposal-cards-detail-new.jpg";
import galleryPhoto1 from "@/assets/events/proposal-gallery-1.jpg";
import galleryPhoto2 from "@/assets/events/proposal-gallery-2.jpg";
import galleryPhoto5 from "@/assets/events/proposal-gallery-5.avif";
import galleryPhoto6 from "@/assets/events/proposal-gallery-6.jpg";
import galleryPhoto7 from "@/assets/events/proposal-gallery-7.avif";
import gallerySetup from "@/assets/events/proposal-gallery-setup.jpg";
import galleryCrowdMirror from "@/assets/events/proposal-gallery-crowd-reaction-mirror.jpg";
import galleryCurtainGreeting from "@/assets/events/proposal-gallery-curtain-greeting.jpg";

import ladiesGreeting from "@/assets/events/ladies-luncheon-greeting.jpg";
import ladiesCardRibbon from "@/assets/events/ladies-luncheon-card-ribbon.jpg";
import ladiesCurtainHosts from "@/assets/events/ladies-luncheon-curtain-hosts.jpg";
import ladiesRoomWide from "@/assets/events/ladies-luncheon-room-wide.jpg";
import ladiesReaction from "@/assets/events/ladies-luncheon-reaction.jpg";
import ladiesLaughter from "@/assets/events/ladies-luncheon-laughter.jpg";
import ladiesDeckRibbon from "@/assets/events/ladies-luncheon-deck-ribbon.jpg";
import ladiesRibbonCurtain from "@/assets/events/ladies-luncheon-ribbon-curtain.jpg";
import ladiesRibbonReveal from "@/assets/events/ladies-luncheon-ribbon-reveal.jpg";
import ladiesScottPointing from "@/assets/events/ladies-luncheon-scott-pointing.jpg";
import ladies1566 from "@/assets/events/ladies-luncheon-1566.jpg";
import ladies1568 from "@/assets/events/ladies-luncheon-1568.jpg";
import ladies1570 from "@/assets/events/ladies-luncheon-1570.jpg";
import ladies1573 from "@/assets/events/ladies-luncheon-1573.jpg";
import ladies1576 from "@/assets/events/ladies-luncheon-1576.jpg";
import ladies1581 from "@/assets/events/ladies-luncheon-1581.jpg";
import ladies1607 from "@/assets/events/ladies-luncheon-1607.jpg";
import ladies1608 from "@/assets/events/ladies-luncheon-1608.jpg";
import ladies1628 from "@/assets/events/ladies-luncheon-1628.jpg";
import ladies1647 from "@/assets/events/ladies-luncheon-1647.jpg";

export interface BrandPhoto {
  key: string;
  src: string;
  label: string;
}

// All photos available for proposals to pick from
export const BRAND_PHOTOS: BrandPhoto[] = [
  { key: "proposal-cards-detail", src: photoCardsDetail, label: "Cards Detail (proposal)" },
  { key: "gallery-1", src: galleryPhoto1, label: "Gallery 1" },
  { key: "parlor-audience", src: eventParlorAudience, label: "Parlor Audience" },
  { key: "gallery-2", src: galleryPhoto2, label: "Gallery 2" },
  { key: "gallery-7", src: galleryPhoto7, label: "Gallery 7" },
  { key: "crowd-mirror", src: galleryCrowdMirror, label: "Crowd Reaction (mirror)" },
  { key: "gallery-setup", src: gallerySetup, label: "Setup" },
  { key: "curtain-greeting", src: galleryCurtainGreeting, label: "Curtain Greeting" },
  { key: "gallery-6", src: galleryPhoto6, label: "Gallery 6" },
  { key: "gallery-5", src: galleryPhoto5, label: "Gallery 5" },
  { key: "proposal-cards-bw", src: proposalCardsBw, label: "Cards B&W" },
  { key: "proposal-center-cards", src: proposalCenterCards, label: "Center Cards" },
  { key: "proposal-desert", src: proposalDesert, label: "Desert" },
  { key: "hero-desert", src: heroDesert, label: "Desert Hero" },
  { key: "scott-desert", src: scottDesert, label: "Scott Desert" },
  { key: "scott-couch", src: scottCouch, label: "Scott Couch" },
  { key: "scott-portrait", src: scottSyme, label: "Scott Portrait" },
  { key: "scott-bw-stage", src: eventScottBW, label: "Scott B&W Stage" },
  { key: "scott-cards", src: eventScottCards, label: "Scott Cards" },
  { key: "scott-performing", src: eventScottPerforming, label: "Scott Performing" },
  { key: "parlor-stage", src: eventParlorStage, label: "Parlor Stage" },
  { key: "penthouse", src: eventPenthouse, label: "Penthouse Show" },
  { key: "crowd-reaction", src: eventCrowdReaction, label: "Crowd Reaction" },
  { key: "group-photo", src: eventGroupPhoto, label: "Group Photo" },
  { key: "closeup-cocktail", src: eventCloseupCocktail, label: "Closeup Cocktail" },
  { key: "silhouette", src: eventSilhouette, label: "Silhouette" },
  { key: "cards-emerald", src: eventCardsEmerald, label: "Cards Emerald" },
  { key: "cu-magic", src: eventCuMagic, label: "Magic Reaction" },
  { key: "guest-reaction", src: eventGuestReaction, label: "Guest Reaction" },
  { key: "cards-motion", src: cardsMotion, label: "Cards Motion" },
  { key: "cards-fan", src: cardsFan, label: "Cards Fan" },
  { key: "experience-closeup", src: experienceCloseup, label: "Experience Close-Up" },
  { key: "experience-corporate", src: experienceCorporate, label: "Experience Corporate" },
  { key: "experience-private", src: experiencePrivate, label: "Experience Private" },
  { key: "experience-parlor", src: experienceParlor, label: "Experience Parlor" },
  { key: "about-hero", src: aboutHero, label: "About Hero" },
  { key: "experience-hero", src: experienceHero, label: "Experience Hero" },
  { key: "ladies-room-wide", src: ladiesRoomWide, label: "Luncheon Room Wide" },
  { key: "ladies-greeting", src: ladiesGreeting, label: "Luncheon Greeting" },
  { key: "ladies-curtain-hosts", src: ladiesCurtainHosts, label: "Luncheon Curtain Hosts" },
  { key: "ladies-reaction", src: ladiesReaction, label: "Luncheon Reaction" },
  { key: "ladies-laughter", src: ladiesLaughter, label: "Luncheon Laughter" },
  { key: "ladies-ribbon-reveal", src: ladiesRibbonReveal, label: "Luncheon Ribbon Reveal" },
  { key: "ladies-ribbon-curtain", src: ladiesRibbonCurtain, label: "Luncheon Ribbon Curtain" },
  { key: "ladies-deck-ribbon", src: ladiesDeckRibbon, label: "Luncheon Deck on Ribbon" },
  { key: "ladies-card-ribbon", src: ladiesCardRibbon, label: "Luncheon Card & Ribbon" },
  { key: "ladies-scott-pointing", src: ladiesScottPointing, label: "Luncheon Scott Performing" },
  { key: "ladies-1566", src: ladies1566, label: "Luncheon Table Address" },
  { key: "ladies-1568", src: ladies1568, label: "Luncheon Hosts Group" },
  { key: "ladies-1570", src: ladies1570, label: "Luncheon Hosts Welcome" },
  { key: "ladies-1573", src: ladies1573, label: "Luncheon Hosts Smiling" },
  { key: "ladies-1576", src: ladies1576, label: "Luncheon Hosts Lineup" },
  { key: "ladies-1581", src: ladies1581, label: "Luncheon Hosts Closeup" },
  { key: "ladies-1607", src: ladies1607, label: "Luncheon Room Tables" },
  { key: "ladies-1608", src: ladies1608, label: "Luncheon Scott Stage" },
  { key: "ladies-1628", src: ladies1628, label: "Luncheon Scott Notepad" },
  { key: "ladies-1647", src: ladies1647, label: "Luncheon Sharpie Reveal" },
];

// Photos uploaded to the official gallery (stored in the `gallery-uploads`
// bucket). They are streamed through the public `upload` endpoint of the
// drive-photos function, so <img src> resolves without an admin token.
const UPLOAD_IMAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos?action=upload&path=`;

const uploadPhoto = (path: string, label: string): BrandPhoto => ({
  key: `upload:${path}`,
  src: UPLOAD_IMAGE_BASE + encodeURIComponent(path),
  label,
});

// New gallery-page photos, now selectable inside proposals.
export const GALLERY_UPLOAD_PHOTOS: BrandPhoto[] = [
  uploadPhoto("a71549f0-8a6c-44ee-bd48-4d3469a7f67d-IMG_0557.JPG", "Green Tux — Table Moment"),
  uploadPhoto("2946cda0-2837-46e5-bc66-b2415fc66488-IMG_0548.JPG", "Green Tux — Performing 1"),
  uploadPhoto("c1fe490d-8a38-4e14-89fa-1171552d90ec-IMG_0549.JPG", "Green Tux — Performing 2"),
  uploadPhoto("cbad12dc-3531-4ffd-a979-77522df5e9a5-IMG_0550.JPG", "Green Tux — Performing 3"),
  uploadPhoto("ada73250-5d52-4175-bc7d-eba963e26b7c-IMG_0553.JPG", "Green Tux — Reaction 1"),
  uploadPhoto("42d64743-184c-41f5-a51e-7f7f2d6f0608-IMG_0554.JPG", "Green Tux — Reaction 2"),
  uploadPhoto("9afc1ab6-45dc-4ebd-b3e8-f6a6b4ed9cec-IMG_0555.JPG", "Green Tux — Reaction 3"),
  uploadPhoto("9d494b5a-29b4-4610-81fc-06c94db1bb0f-IMG_0556.JPG", "Green Tux — Reaction 4"),
  uploadPhoto("c8e6e9c1-4d5e-4b6a-9ba2-8449c58ef3a4-IMG_9169_2.JPG", "Event Photo 1"),
  uploadPhoto("47c0c269-7c8b-47fe-97b1-03817f8fa082-IMG_9170_2.JPG", "Event Photo 2"),
  uploadPhoto("d60cda7e-be69-4be4-b2a4-355f708e1c72-IMG_9171_2.JPG", "Event Photo 3"),
  uploadPhoto("6e714c63-8dbd-4545-877f-475ac637685d-IMG_9172_2.JPG", "Event Photo 4"),
  uploadPhoto("bf0dd628-1023-4b78-82d0-faee014b3f95-IMG_9173_2.JPG", "Event Photo 5"),
  uploadPhoto("4cc495d3-af40-4834-8482-9259312522e8-IMG_9178_2.JPG", "Event Photo 6"),
  uploadPhoto("scott-green-cards-doorway.jpg", "Green Cards — Doorway"),
  uploadPhoto("scott-green-cards-outdoor.jpg", "Green Cards — Outdoor"),
  uploadPhoto("scott-with-alec.jpg", "With a Guest"),
  uploadPhoto("scott-bw-walking.jpg", "B&W Walking"),
  uploadPhoto("scott-desert-cards-toss.jpg", "Desert — Cards Toss"),
  uploadPhoto("scott-desert-walking.jpg", "Desert — Walking"),
  uploadPhoto("scott-desert-wave.jpg", "Desert — Wave"),
  uploadPhoto("scott-desert-laughing.jpg", "Desert — Laughing"),
  uploadPhoto("scott-desert-standing.jpg", "Desert — Standing"),
  uploadPhoto("desert-phh-184.jpg", "Desert Shoot 184"),
  uploadPhoto("desert-phh-186.jpg", "Desert Shoot 186"),
  uploadPhoto("desert-phh-385.jpg", "Desert Shoot 385"),
  uploadPhoto("desert-phh-423.jpg", "Desert Shoot 423"),
  uploadPhoto("desert-phh-425.jpg", "Desert Shoot 425"),
  uploadPhoto("desert-phh-432.jpg", "Desert Shoot 432"),
  uploadPhoto("desert-tezza-4035.jpg", "Desert Shoot — Tezza"),
];

BRAND_PHOTOS.push(...GALLERY_UPLOAD_PHOTOS);

// Drive-backed photo keys use the format `drive:<fileId>` and are streamed
// through the drive-photos edge function. The /image endpoint is public so
// <img src> tags can resolve them without an admin token.
const DRIVE_IMAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos?action=image&fileId=`;

export const photoKeyToSrc = (key: string): string | null => {
  if (key.startsWith("drive:")) return DRIVE_IMAGE_BASE + encodeURIComponent(key.slice(6));
  if (key.startsWith("upload:")) return UPLOAD_IMAGE_BASE + encodeURIComponent(key.slice(7));
  const p = BRAND_PHOTOS.find((b) => b.key === key);
  return p ? p.src : null;
};


// Default photo grid (10 keys) — used when proposal.gallery_photos is empty
export const DEFAULT_GALLERY_KEYS = [
  "proposal-cards-detail",
  "gallery-1",
  "parlor-audience",
  "gallery-2",
  "gallery-7",
  "crowd-mirror",
  "gallery-setup",
  "curtain-greeting",
  "gallery-6",
  "gallery-5",
];

// ── EVENT-TYPE TEMPLATES ──
// Pre-fill tiers, FAQs, timeline, intro and hero photo when starting a new
// proposal of a given type. Recipient name/date/venue stay blank.
export interface ProposalTemplate {
  intro_paragraph: string;
  letter_intro: string;
  hero_image: string;
  timeline: { time: string; desc: string }[];
  tiers: {
    name: string;
    tagline: string;
    items: string[];
    price: string;
    href: string;
    cta: string;
    recommended?: boolean;
  }[];
  faqs: { q: string; a: string }[];
  closing_quote?: string;
  closing_attribution?: string;
}

const COMMON_FAQS: { q: string; a: string }[] = [
  { q: "How much space do you need?", a: "For close-up walk-around, none — I move through the room. For the parlor experience, anywhere a host can comfortably gather their guests works. I'll walk you through setup a week ahead." },
  { q: "What if a guest doesn't want to participate?", a: "No one is ever pulled in who doesn't want to be. The night is built around making your guests feel hosted, not put on the spot." },
  { q: "Do you need a stage, microphone, or special lighting?", a: "For most rooms, no. I bring everything I need — including soft lighting and a discreet sound system if the space calls for it." },
  { q: "How early do you arrive?", a: "For close-up walk-around, a half hour before guests is all I need. For the parlor magic stage show (a 45-minute set), I arrive earlier to quietly set the room — typically 60–90 minutes before." },
  { q: "Do you travel?", a: "Yes. Standard pricing covers Los Angeles County. For destination events, travel and lodging are added." },
  { q: "What happens after I reserve the date?", a: "A 50% deposit holds your date. The remaining 50% is due the day before. Two weeks before, we hop on a final call to walk through the night together." },
];

export const PROPOSAL_TEMPLATES: Record<string, ProposalTemplate> = {
  Wedding: {
    letter_intro: "Thank you for the time on the phone — I enjoyed it more than you know.",
    intro_paragraph:
      "What you described isn't a magic act dropped into your evening — it's an entire texture woven through the night. Quiet conversation that turns into wide-eyed silence, then laughter, then the kind of story your guests will still be telling on Monday.",
    hero_image: "wedding",
    timeline: [
      { time: "5:30 PM", desc: "I arrive, set quietly, full environment built before guests arrive." },
      { time: "6:00 PM", desc: "Greeting every guest as they walk in to cocktail hour." },
      { time: "7:00 PM", desc: "Guests move to dinner — I step away." },
      { time: "9:30 PM", desc: "Optional Speakeasy lounge moment after the reception." },
    ],
    tiers: [
      {
        name: "Cocktail Hour",
        tagline: "Intimate close-up during cocktail hour",
        items: [
          "90 minutes of close-up magic during cocktail hour",
          "Up to 100 guests",
          "Pre-event call with couple and/or planner",
          "Standard LA County",
        ],
        price: "$1,800",
        href: "",
        cta: "Reserve Cocktail Hour",
      },
      {
        name: "The White Rabbit Wedding Experience",
        tagline: "Parlor at rehearsal dinner + cocktail hour the next day",
        items: [
          "40–45 minute parlor experience at rehearsal dinner the night before",
          "90 minutes of close-up at cocktail hour the next day",
          "Up to 150 guests across both events",
          "Full pre-event consultation with couple and planner",
          "White Rabbit branded materials, custom moment for the couple",
        ],
        price: "$3,500",
        href: "",
        cta: "Reserve Wedding Experience",
        recommended: true,
      },
      {
        name: "The Estate Wedding Experience",
        tagline: "Parlor + cocktail hour + post-reception speakeasy",
        items: [
          "40–45 minute parlor at rehearsal dinner",
          "2 hours of close-up at cocktail hour",
          "30-minute Speakeasy lounge moment after reception",
          "Up to 250 guests across all three events",
          "Full environment build for parlor moment",
          "Custom narrative woven through the night",
        ],
        price: "$5,500",
        href: "",
        cta: "Reserve Estate Experience",
      },
    ],
    faqs: [
      { q: "What's your weather contingency for outdoor events?", a: "We move indoors. I'll work with your planner on the indoor backup so it's ready before it's needed." },
      ...COMMON_FAQS,
    ],
    closing_quote: "In those moments, nothing feels impossible. And maybe, for the guests who were there, nothing quite does afterward either.",
    closing_attribution: "",
  },

  "Corporate Event": {
    letter_intro: "Thank you for the time today — I enjoyed hearing about what you're building.",
    intro_paragraph:
      "Your guests have been to a hundred corporate dinners. What they haven't been to is the one they're still telling stories about on Monday. That's the night we build together — quiet wonder during cocktails, then a parlor moment after dinner that resets the whole room.",
    hero_image: "corporate",
    timeline: [
      { time: "5:30 PM", desc: "Arrive, set up discreetly before guests." },
      { time: "6:30 PM", desc: "Close-up magic during cocktail reception." },
      { time: "8:30 PM", desc: "40-minute parlor experience after dinner." },
      { time: "9:15 PM", desc: "Stay through dessert, conversation, last impressions." },
    ],
    tiers: [
      {
        name: "Cocktail Reception",
        tagline: "Close-up magic for the reception hour",
        items: [
          "90 minutes of close-up magic during cocktail reception",
          "Up to 100 guests",
          "Pre-event call with planner",
          "Standard LA County",
        ],
        price: "$2,000",
        href: "",
        cta: "Reserve Cocktail Reception",
      },
      {
        name: "The Corporate Evening",
        tagline: "Cocktail hour + after-dinner parlor experience",
        items: [
          "90 minutes of close-up at cocktail reception",
          "40–45 minute parlor experience after dinner",
          "Up to 150 guests",
          "Full pre-event consultation with planner & exec sponsor",
          "Custom branded moment for the company",
        ],
        price: "$4,500",
        href: "",
        cta: "Reserve Corporate Evening",
        recommended: true,
      },
      {
        name: "The Full Production",
        tagline: "Branded activation + cocktail magic + parlor",
        items: [
          "Custom-built brand moment integrated into the show",
          "2 hours of close-up across the reception",
          "45-minute parlor experience",
          "Up to 250 guests",
          "Full environment build",
          "Pre-event creative session with marketing team",
        ],
        price: "$7,500",
        href: "",
        cta: "Reserve Full Production",
      },
    ],
    faqs: [
      { q: "Can the show be tied to our brand or messaging?", a: "Yes — the parlor moment can be lightly woven around a product launch, milestone, or message. We'll talk through what feels natural and what would feel forced." },
      { q: "Will this work in a hotel ballroom?", a: "Yes. I've performed in everything from intimate suites to 300-person ballrooms. The room shape changes the staging, never the experience." },
      ...COMMON_FAQS,
    ],
    closing_quote: "The entertainment your guests are still talking about on Monday.",
    closing_attribution: "",
  },

  "Private Event": {
    letter_intro: "Thank you for reaching out — I enjoyed our conversation.",
    intro_paragraph:
      "A private evening should feel like a secret kept beautifully. What we're building together isn't an act inserted into your night — it's a thread that runs through it, drawing your guests closer to one another and to the room.",
    hero_image: "private",
    timeline: [
      { time: "6:30 PM", desc: "Arrive and set up before guests." },
      { time: "7:00 PM", desc: "Greeting every guest with close-up moments." },
      { time: "8:45 PM", desc: "40-minute parlor experience after dinner." },
      { time: "9:30 PM", desc: "Stay through dessert and conversation." },
    ],
    tiers: [
      {
        name: "Cocktail Hour",
        tagline: "Intimate close-up during cocktails",
        items: [
          "90 minutes of close-up magic",
          "Up to 50 guests",
          "Pre-event call with host",
          "Standard LA County",
        ],
        price: "$1,800",
        href: "",
        cta: "Reserve Cocktail Hour",
      },
      {
        name: "The Private Evening",
        tagline: "Cocktail hour + parlor experience after dinner",
        items: [
          "90 minutes of close-up at cocktail hour",
          "40–45 minute parlor experience after dinner",
          "Up to 80 guests",
          "Pre-event consultation with host",
          "Custom moment built for the guest of honor",
        ],
        price: "$3,500",
        href: "",
        cta: "Reserve Private Evening",
        recommended: true,
      },
      {
        name: "The Estate Evening",
        tagline: "Full environment build + parlor + post-dinner speakeasy",
        items: [
          "Full environment build for the parlor moment",
          "2 hours of close-up across the evening",
          "45-minute parlor experience",
          "Late-night Speakeasy lounge moment",
          "Up to 120 guests",
          "Custom narrative for the host",
        ],
        price: "$5,500",
        href: "",
        cta: "Reserve Estate Evening",
      },
    ],
    faqs: COMMON_FAQS,
    closing_quote: "In those moments, nothing feels impossible. And maybe, for the guests who were there, nothing quite does afterward either.",
    closing_attribution: "",
  },

  Fundraiser: {
    letter_intro: "Thank you for the time — and for the work you're doing.",
    intro_paragraph:
      "Galas live and die by energy. Magic resets the room, breaks the ice between strangers, and gives your donors a moment they'll attach to your cause for years. The goal isn't a show — it's atmosphere that opens wallets.",
    hero_image: "corporate",
    timeline: [
      { time: "5:30 PM", desc: "Arrive, set up discreetly before doors." },
      { time: "6:00 PM", desc: "Close-up magic during cocktail reception." },
      { time: "8:00 PM", desc: "Optional parlor moment between program segments." },
      { time: "9:30 PM", desc: "Stay through dessert and donor conversation." },
    ],
    tiers: [
      {
        name: "Reception Magic",
        tagline: "Close-up magic during the cocktail reception",
        items: [
          "90 minutes of close-up magic during reception",
          "Up to 150 guests",
          "Pre-event call with development team",
          "Standard LA County",
        ],
        price: "$2,500",
        href: "",
        cta: "Reserve Reception Magic",
      },
      {
        name: "The Gala Experience",
        tagline: "Reception magic + parlor moment between program segments",
        items: [
          "90 minutes of close-up at reception",
          "20-minute parlor moment woven between program segments",
          "Up to 250 guests",
          "Custom moment tied to mission or honoree",
          "Full pre-event consultation",
        ],
        price: "$5,000",
        href: "",
        cta: "Reserve Gala Experience",
        recommended: true,
      },
    ],
    faqs: [
      { q: "Can the show tie back to our mission?", a: "Yes — done with care. The strongest moments are ones where the magic illustrates something true about your cause without overplaying it." },
      ...COMMON_FAQS,
    ],
    closing_quote: "Atmosphere that opens hearts — and wallets.",
    closing_attribution: "",
  },

  Birthday: {
    letter_intro: "Thank you for thinking of us for this — sounds like a special one.",
    intro_paragraph:
      "Birthdays are the easiest night to phone in and the hardest to get right. The version your guest of honor will remember isn't bigger — it's more personal. Quiet wonder, woven into the room, with a moment built just for them.",
    hero_image: "private",
    timeline: [
      { time: "6:30 PM", desc: "Arrive, set up before guests." },
      { time: "7:00 PM", desc: "Close-up magic during cocktails and arrivals." },
      { time: "9:00 PM", desc: "Custom moment for the guest of honor." },
    ],
    tiers: [
      {
        name: "The Birthday Cocktail Hour",
        tagline: "Close-up magic during the celebration",
        items: [
          "90 minutes of close-up magic",
          "Up to 60 guests",
          "Custom moment built for the birthday guest",
          "Pre-event call with host",
        ],
        price: "$2,000",
        href: "",
        cta: "Reserve Birthday Cocktail Hour",
        recommended: true,
      },
      {
        name: "The Birthday Evening",
        tagline: "Cocktail magic + after-dinner parlor",
        items: [
          "90 minutes of close-up at cocktails",
          "40-minute parlor experience after dinner",
          "Up to 100 guests",
          "Custom narrative built around the guest of honor",
        ],
        price: "$3,800",
        href: "",
        cta: "Reserve Birthday Evening",
      },
    ],
    faqs: COMMON_FAQS,
    closing_quote: "A night they'll be talked about for.",
    closing_attribution: "",
  },

  "Holiday Party": {
    letter_intro: "Thanks for thinking of us for the holidays.",
    intro_paragraph:
      "Holiday parties are crowded, generous, and easy to forget. The ones people remember are the ones where something quiet and unexpected happened. Magic during cocktails resets the room — strangers turn into friends, phones go down, and the night actually starts.",
    hero_image: "corporate",
    timeline: [
      { time: "5:30 PM", desc: "Arrive, set up before guests." },
      { time: "6:00 PM", desc: "Close-up magic during cocktails and arrivals." },
      { time: "8:00 PM", desc: "Optional parlor moment after dinner." },
    ],
    tiers: [
      {
        name: "Holiday Cocktail Hour",
        tagline: "Close-up magic during the holiday reception",
        items: [
          "90 minutes of close-up magic",
          "Up to 100 guests",
          "Pre-event call with planner",
          "Standard LA County",
        ],
        price: "$1,800",
        href: "",
        cta: "Reserve Holiday Cocktail Hour",
      },
      {
        name: "The Holiday Evening",
        tagline: "Cocktail magic + after-dinner parlor",
        items: [
          "90 minutes of close-up at cocktails",
          "40-minute parlor experience after dinner",
          "Up to 150 guests",
          "Festive moment woven into the show",
        ],
        price: "$3,500",
        href: "",
        cta: "Reserve Holiday Evening",
        recommended: true,
      },
    ],
    faqs: COMMON_FAQS,
    closing_quote: "The detail that makes the holiday party the one they remember.",
    closing_attribution: "",
  },
};
