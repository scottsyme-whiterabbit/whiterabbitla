import { useParams, Link, Navigate } from "react-router-dom";
import NotFound from "./NotFound";
import { getSeoPageBySlug } from "@/data/seoPages";
import { useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useServiceSchema } from "@/hooks/useSchemaOrg";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSeoPagesByCategory } from "@/data/seoPages";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import paramountLogo from "@/assets/logos/paramount.png";
import rivianLogo from "@/assets/logos/rivian.png";

import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-stage.jpg";
import corporateImg from "@/assets/event-penthouse-show.jpg";
import weddingImg from "@/assets/event-group-photo.jpg";
import privateImg from "@/assets/experience-private.jpg";

const trustLogos = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "Rivian", logo: rivianLogo },
];

interface ServiceData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSub: string;
  image: string;
  intro: string;
  sections: { heading: string; body: string }[];
  included: string[];
  faqs: { question: string; answer: string }[];
  testimonial: { quote: string; attribution: string };
}

const servicePages: Record<string, ServiceData> = {
  "corporate-magician": {
    slug: "corporate-magician",
    title: "Corporate Event Magician",
    metaTitle: "Corporate Event Magician | White Rabbit Magic Entertainment",
    metaDescription: "Hire a world-class corporate event magician for galas, product launches, and executive retreats. Trusted by Netflix, Disney & Morgan Stanley.",
    heroHeadline: "Corporate Event Magic",
    heroSub: "The entertainment your guests will actually remember, and your competitors will wish they'd booked first.",
    image: corporateImg,
    intro: "White Rabbit delivers world-class close-up magic and mentalism for Fortune 500 galas, product launches, holiday parties, and executive retreats. The kind of entertainment that makes your event feel like a first-class experience.",
    sections: [
      {
        heading: "Why Magic Works for Corporate Events",
        body: "Here's the problem with most corporate entertainment: it's forgettable. A DJ nobody dances to. A comedian who doesn't read the room. Background noise. White Rabbit is the opposite. Scott Syme walks into your event and within minutes, your CEO is laughing, your clients are leaning in, and strangers are bonding over something they can't explain. That's not a party trick. That's a business advantage.",
      },
      {
        heading: "Cocktail Hour & Roaming Magic",
        body: "Scott moves through your event performing intimate close-up magic for small groups: cards, mentalism, borrowed objects. Within seconds, people who've never met are gasping, laughing, and bonding over something extraordinary. It's the most effective icebreaker in the corporate entertainment world.",
      },
      {
        heading: "Full Show Experiences",
        body: "For events that call for a centerpiece moment, the Private Magic Show transforms your venue into an intimate theater. Professional lighting, a curated soundtrack, and 45 minutes of world-class magic that leaves your audience speechless. Available as a standalone show or paired with roaming magic for the complete White Rabbit experience.",
      },
      {
        heading: "What to Expect on the Night",
        body: "Scott arrives 30 to 45 minutes before your event starts. He'll walk the room with your planner or coordinator, note the layout, identify the best spots for roaming magic, and confirm timing with your AV team if there's a show component. Once guests arrive, he starts working the room — no announcement needed. Small groups of four to eight people get two to three minutes of close-up magic each. Cards, coins, borrowed rings, a phone or two. The reactions are loud enough that other groups start drifting over. By the end of cocktail hour, most of the room has seen something. If there's a seated show, Scott transitions from roaming into a 30- or 45-minute performance that pulls volunteers from the audience, reads minds, and builds to a finale that gets a standing ovation more often than not.",
      },
      {
        heading: "Types of Corporate Events We Work",
        body: "Annual galas and awards dinners. Product launches where you need the crowd buzzing before the reveal. Holiday parties that need to feel special, not just another open bar. Client appreciation events where the goal is making people feel valued. Executive retreats where the team needs to actually bond, not just sit through another trust fall. Trade show booths where you need foot traffic and a reason for people to stop. Conference after-parties where the real relationships get built. Incentive trips where the entertainment has to match the venue. Scott has worked all of these, most of them multiple times. He reads the room, adjusts his energy to the crowd, and knows when to dial it up or pull back.",
      },
    ],
    included: [
      "Pre-event consultation to tailor the performance to your audience and goals",
      "World-class close-up magic, mentalism, and audience interaction",
      "Professional appearance in signature style",
      "Custom integration with your event's theme and timeline",
      "Post-event follow-up to ensure your event exceeded expectations",
    ],
    faqs: [
      { question: "What type of corporate events is White Rabbit best suited for?", answer: "Cocktail receptions, holiday parties, product launches, executive retreats, client appreciation events, trade shows, and galas. Scott's close-up magic is designed to break the ice and create genuine connections between guests." },
      { question: "How long does a corporate performance last?", answer: "Roaming close-up magic is typically booked for 2 to 3 hours. The Private Magic Show is a curated 45-minute theatrical experience. Many clients book both for a full-evening White Rabbit experience." },
      { question: "Can the performance be customized for our brand?", answer: "Absolutely. Every performance is tailored to your event's goals, audience, and tone, from incorporating brand messaging to matching the energy of your event theme." },
      { question: "How much space does the magic require?", answer: "For roaming close-up magic, none — Scott works in whatever space your guests are already standing. For the full show, he needs about an 8-by-10-foot area with access to power for lighting and sound. No stage required, though one helps for groups over 100." },
      { question: "Can Scott customize the performance for our company or theme?", answer: "Yes. He's incorporated company products into tricks, used CEO names in mentalism routines, and tailored entire sets around event themes. The pre-event consultation is where all of this gets mapped out." },
      { question: "How far in advance should we book?", answer: "Prime dates in Los Angeles — especially October through January — book out 8 to 12 weeks. If you have a specific date, reach out sooner rather than later. Last-minute bookings sometimes work if the calendar lines up." },
      { question: "What happens if our event runs long or the timeline shifts?", answer: "Scott rolls with it. He has performed at enough corporate events to know that timelines are suggestions. He stays flexible and adjusts on the fly without any drama." },
    ],
    testimonial: {
      quote: "I've never seen a room full of executives laugh that hard. Every single person came up to me afterward asking where I found him.",
      attribution: "VP of Marketing, Tech Company",
    },
  },
  "wedding-magician": {
    slug: "wedding-magician",
    title: "Wedding Magician",
    metaTitle: "Wedding Magician | Cocktail Hour Entertainment | White Rabbit",
    metaDescription: "Hire a wedding magician who transforms your cocktail hour into the highlight of the evening. Elegant, sophisticated, unforgettable. Check availability.",
    heroHeadline: "Wedding Magic",
    heroSub: "The cocktail hour entertainment that makes your wedding unforgettable, for all the right reasons.",
    image: weddingImg,
    intro: "White Rabbit's cocktail hour magic is the secret weapon couples wish they'd known about sooner. While your guests mingle and the champagne flows, Scott creates moments of pure, joyful astonishment that turn strangers into friends before they even find their seats.",
    sections: [
      {
        heading: "Why Cocktail Hour Magic Works",
        body: "Here's what nobody tells you about weddings: cocktail hour is make-or-break. It's the moment when your college friends meet your partner's family, when coworkers meet cousins. Close-up magic solves this instantly. Within seconds, people who've never met are gasping, laughing, and bonding over something extraordinary.",
      },
      {
        heading: "Elegant & Sophisticated",
        body: "Every performance is perfectly calibrated for the tone of your celebration. No cheesy props. No interrupting toasts. No pulling rabbits out of hats. Just beautiful, intimate moments of wonder that feel right at home at a five-star venue, because that's where White Rabbit belongs.",
      },
      {
        heading: "Tailored to Your Vision",
        body: "Scott has performed at weddings across Southern California and beyond. From clifftop ceremonies to grand ballroom receptions. Each performance is tailored to your guest count, timeline, and vision. Cocktail hour roaming magic, a pre-dinner show, or both: whatever your celebration needs.",
      },
      {
        heading: "How It Works on Your Wedding Day",
        body: "Scott arrives during your venue's flip — while the ceremony space converts to reception. He checks in with your coordinator, confirms timing, and positions himself where guests will naturally gather for cocktail hour. As people arrive with drinks in hand, he starts. No microphone, no announcement. Just small groups of four to six getting two to three minutes of close-up magic. Someone feels a tap on their shoulder — but no one's there. A Rubik's cube scrambled by a guest solves itself to create an impossible coincidence. A meaningful word, chosen freely, turns out to have been hidden in plain sight the entire time. The magic is designed for cocktail crowds — adults with drinks in hand. Everything is family-friendly, but the material is crafted for a 21-and-up audience. Smart, sophisticated, and zero cringe. The reactions carry across the patio. People pull their friends over. By the time dinner is called, your guests have stories to tell that have nothing to do with the centerpieces.",
      },
      {
        heading: "Where Magic Fits in Your Timeline",
        body: "Most couples book Scott for cocktail hour, and that's the sweet spot. It's the one part of the wedding where guests are standing, mingling, and waiting — which means they're the perfect audience. But he's worked plenty of other windows too. Rehearsal dinners where the families haven't met yet and need a reason to talk — Scott can perform a full Private Magic Show for the immediate family and wedding party, offering a high-energy, discerning form of entertainment that sets the tone for the entire weekend. Morning-after brunches where the energy is relaxed and people want something fun. VIP welcome receptions for destination weddings. Even the gap between ceremony and cocktail hour, if your venue has one. And if your venue has a speakeasy area or lounge bar, Scott can come back after cocktail hour and keep performing there — offering an extra layer of entertainment as the night goes on, giving guests who want more magic a reason to linger. One thing that doesn't work: during dinner toasts or the first dance. Those moments belong to you. Scott knows when to be visible and when to disappear.",
      },
    ],
    included: [
      "Pre-wedding consultation to understand your vision and guest dynamics",
      "Elegant close-up magic designed for wedding atmospheres",
      "Seamless coordination with your wedding planner and venue",
      "Flexible timing to fit your cocktail hour or reception",
      "A follow-up to make sure your celebration exceeded expectations",
    ],
    faqs: [
      { question: "When during the wedding does the magician perform?", answer: "Cocktail hour is the most popular window. It's the perfect time to break the ice between guests. Scott can also perform during the reception or as a pre-dinner show. We work with your timeline to find the ideal moment." },
      { question: "Is the magic appropriate for all ages?", answer: "Yes. Every performance is elegant, sophisticated, and family-friendly. Just beautiful, intimate moments of wonder that feel right at home at a black-tie celebration." },
      { question: "How does booking work with our wedding planner?", answer: "Scott works directly with your planner or coordinator to ensure seamless integration. We handle timing, positioning, and flow so you don't have to think about it on your big day." },
      { question: "Will the magic be appropriate for all ages?", answer: "Yes. Scott's material is clean, smart, and works for everyone from your flower girl's grandparents to your college friends. No gimmicks, no cringe." },
      { question: "Do you need a table or stage for close-up magic?", answer: "No. Scott performs standing, using whatever's around — borrowed objects, napkins, someone's phone. He adapts to your space, indoors or out." },
      { question: "How many guests can you cover during cocktail hour?", answer: "In a standard 60- to 90-minute cocktail hour, Scott reaches 80 to 120 guests. For larger weddings, he prioritizes the VIP tables or areas your coordinator flags." },
      { question: "What if it rains and we move indoors?", answer: "Close-up magic works anywhere people are standing together. Scott has performed in wine caves, hotel lobbies, tented patios, and living rooms. The venue change won't affect the experience at all." },
      { question: "How far in advance should we book?", answer: "Peak wedding season (May through October) books months in advance. We recommend reaching out as soon as you have your date to secure availability." },
    ],
    testimonial: {
      quote: "Hiring Scott was the single best decision we made for our wedding. Our guests are STILL talking about him six months later.",
      attribution: "Private Client, Los Angeles",
    },
  },
  "private-party-magician": {
    slug: "private-party-magician",
    title: "Private Party Magician",
    metaTitle: "Private Party Magician | Luxury Event Entertainment | White Rabbit",
    metaDescription: "Hire a private party magician for birthdays, anniversaries, and exclusive celebrations. White Rabbit transforms gatherings into unforgettable experiences.",
    heroHeadline: "Private Party Magic",
    heroSub: "Give your guests a night they'll retell for years, not just another party they attended.",
    image: privateImg,
    intro: "The best parties aren't remembered for the venue or the menu. They're remembered for how they made people feel. White Rabbit transforms birthday celebrations, anniversary dinners, holiday gatherings, and house parties into evenings your guests will never stop talking about.",
    sections: [
      {
        heading: "The White Rabbit Effect",
        body: "Picture this: your guests are gathered close, drinks in hand, when impossible things start happening inches from their fingertips. A card they merely thought of appears in a sealed envelope. A borrowed ring vanishes and reappears inside a locked box. The room erupts. Not polite applause, but genuine, wide-eyed astonishment.",
      },
      {
        heading: "More Than a Magician",
        body: "Scott doesn't just perform tricks. He creates an atmosphere. The lighting shifts, a curated soundtrack sets the mood, and suddenly your living room feels like a private members' club. Every guest feels like the most important person in the room. That's the difference between hiring a magician and hiring White Rabbit.",
      },
      {
        heading: "Perfect for Every Occasion",
        body: "Milestone birthdays (30th, 40th, 50th), engagement parties, holiday gatherings, dinner parties, housewarming celebrations, and any occasion that deserves to be extraordinary. Available for intimate groups of 6 to celebrations of 200+.",
      },
      {
        heading: "What a Private Party Performance Looks Like",
        body: "Scott shows up early, meets whoever's hosting, and gets the lay of the land. Where are people gathering? Where's the bar? Is there a moment in the night where everyone comes together, or is it a cocktail-style flow? He figures out the rhythm of the party and works within it. For the first hour or so, he roams. Small clusters of guests get a few minutes of close-up magic — cards, coins, mentalism, borrowed objects that do impossible things in their hands. The reactions are genuine and they're contagious. Someone gasps, someone else comes over to see what happened, and suddenly there's energy in the room that wasn't there before. If the host wants a show component, Scott shifts into a 30- or 45-minute set that pulls volunteers up, reads minds, and builds toward a finish that people talk about in the Uber home.",
      },
      {
        heading: "Private Parties Scott Has Worked",
        body: "Birthday milestones — 40ths, 50ths, surprise parties where the guest of honor becomes part of the act. Dinner parties at private homes in the Hills, Malibu, Brentwood, Pacific Palisades. Engagement celebrations. Housewarming parties. Retirement dinners. Holiday gatherings where the host wanted something more memorable than a playlist. Intimate fundraisers at private residences. Watch parties and Super Bowl events. House concerts where Scott performed between musical acts. The common thread: these are hosts who care about the experience their guests have. They're not looking for a performer to stand in the corner. They want someone who makes the night feel different.",
      },
    ],
    included: [
      "Pre-event consultation to tailor the experience to your guests",
      "World-class close-up magic, mentalism, and audience interaction",
      "Professional appearance in signature style",
      "Curated atmosphere with optional sound and lighting",
      "A follow-up to make sure your event exceeded expectations",
    ],
    faqs: [
      { question: "What size party works best?", answer: "White Rabbit performs for intimate gatherings of 6 guests up to celebrations of 200+. For smaller groups, the magic becomes intensely personal. For larger parties, Scott moves through the room creating pockets of wonder everywhere." },
      { question: "What occasions work well with a magician?", answer: "Milestone birthdays, anniversary dinners, engagement parties, holiday gatherings, dinner parties, housewarming celebrations, and bachelorette events. Any occasion where you want guests talking about your party for years." },
      { question: "Can you perform at my home?", answer: "Absolutely. Many of our most memorable performances happen in private homes. Scott transforms any space (living rooms, backyards, dining rooms) into an intimate performance venue." },
      { question: "How many guests is ideal for a private party?", answer: "Sweet spot is 20 to 80. Under 20, the show format works best since there aren't enough clusters for roaming. Over 80, Scott can still cover the room during a 90-minute cocktail window. For 150-plus, consider adding the full show so everyone gets the experience." },
      { question: "Is your magic appropriate for mixed-age groups?", answer: "Completely. Scott reads the room. At a party with grandparents and teenagers in the same space, the magic lands differently for each group but works for everyone. Nothing crude, nothing that requires explanation." },
      { question: "What do you need from us as hosts?", answer: "Just the basics: date, time, rough guest count, and whether the party is indoors or outdoors. Scott handles everything else. No stage, no special equipment needed for roaming magic. If there's a show, he brings his own lighting and sound." },
      { question: "Can Scott start as a 'secret' guest and then reveal he's the entertainment?", answer: "This is actually one of the most popular requests. Scott mingles as a guest, casually starts performing for a few people, and the surprise builds organically. Hosts love this because it creates a genuine 'wait, what just happened?' moment." },
      { question: "How far in advance should I book?", answer: "We recommend booking 4 to 8 weeks in advance. Holiday season and summer weekends fill especially fast." },
    ],
    testimonial: {
      quote: "He read my mind. Actually read it. I still don't know how. My guests were screaming with joy, and these are people who don't scream.",
      attribution: "Private Event Host, Beverly Hills",
    },
  },
  "close-up-magician": {
    slug: "close-up-magician",
    title: "Close-Up Magician",
    metaTitle: "Close-Up Magician | Intimate Magic Entertainment | White Rabbit",
    metaDescription: "Hire a world-class close-up magician for your next event. Intimate, interactive magic that happens right in your guests' hands. Check availability.",
    heroHeadline: "Close-Up Magic",
    heroSub: "Magic that happens right in your hands. Intimate, impossible, and absolutely unforgettable.",
    image: closeupImg,
    intro: "Close-up magic is the most powerful form of entertainment because it's personal. It happens right there in your hands, inches from your face. White Rabbit brings world-class interactive magic directly to your guests, creating moments that feel like encountering real magic.",
    sections: [
      {
        heading: "Why Close-Up Magic",
        body: "There's a reason the world's most exclusive events feature close-up magic: it creates genuine human connection. When Scott approaches a group, within sixty seconds they're united. Executives and interns, introverts and extroverts, all sharing the same moment of pure, unfiltered amazement.",
      },
      {
        heading: "Interactive & Personal",
        body: "Scott's close-up work blends interactive magic, mentalism, and mind reading into seamless, conversational performances. Guests don't just watch. They participate. They make impossible choices, they hold objects that vanish and reappear, they experience moments that defy explanation. Every person feels like the star of the show.",
      },
      {
        heading: "Perfect for Any Setting",
        body: "Cocktail hours, dinner parties, VIP lounges, restaurant activations, hotel lobbies, brand activations, trade shows, and any event where you want guests mingling, laughing, and completely present in the moment.",
      },
      {
        heading: "Why Close-Up Magic Hits Different",
        body: "Stage magic works from a distance. You watch a person do something impossible 50 feet away and you clap. Close-up magic happens six inches from your face, with your ring, your card, your phone — and you can't process what just happened. That's the difference. Scott doesn't perform at you. He performs with you. You're holding the deck when the card changes. Someone feels a tap on their shoulder when nobody's behind them. A Rubik's cube scrambled by the audience solves itself to reveal an impossible coincidence. Your friend's phone shows a photo that shouldn't exist. The reactions aren't polite applause. They're real, involuntary, sometimes loud. People grab each other's arms. They replay it to their friends. They try to figure it out and they can't. That's what close-up magic does that no other form of entertainment can — it makes something impossible happen in your hands.",
      },
      {
        heading: "Where Close-Up Magic Works Best",
        body: "Cocktail hours and receptions where guests are standing and mingling. Seated dinners between courses, where Scott moves table to table. VIP lounges and greenrooms. Trade show booths where you need to stop foot traffic. Private dining rooms at restaurants. Gallery openings and launch events. Rooftop parties, garden parties, poolside events. Anywhere people are gathered in groups of three to ten with a drink in their hand and a few minutes to spare. The magic adapts to the space. Scott has performed in Michelin-starred restaurants, yacht decks, Soho House, backyard barbecues, and the Magic Castle itself. No stage, no setup, no tech requirements. Just Scott, a deck of cards, and whatever you happen to have in your pocket.",
      },
    ],
    included: [
      "Pre-event consultation to understand your audience and goals",
      "World-class mentalism, interactive magic, and impossible moments",
      "Seamless roaming performance through your event",
      "Professional appearance in signature style",
      "Post-event follow-up",
    ],
    faqs: [
      { question: "What is close-up magic?", answer: "Close-up magic happens right in your guests' hands: cards, coins, borrowed objects. Scott performs for small groups of 4 to 8 at a time, creating intimate, jaw-dropping moments. It's interactive, personal, and the most powerful form of live entertainment." },
      { question: "How long does a close-up performance last?", answer: "Most clients book 2–3 hours of roaming close-up magic. Each small group gets about 8–10 minutes of dedicated performance. Custom timing is always available." },
      { question: "Does close-up magic work for large events?", answer: "Absolutely. Scott moves through events of any size, creating intimate moments within larger gatherings. For 150+ guests, we recommend pairing close-up magic with a Private Magic Show." },
      { question: "What's the difference between close-up magic and stage magic?", answer: "Close-up magic happens within arm's reach, using everyday objects. Stage magic uses bigger props and plays to a seated audience from a distance. Scott does both, but close-up is his specialty — it's more personal, more interactive, and the reactions are stronger because the magic is literally happening in your hands." },
      { question: "How long does each group get with Scott?", answer: "Two to four minutes per group. That's enough for one or two effects that leave a real impression without overstaying. In a 60-minute cocktail hour, he'll reach 15 to 20 groups, covering 80 to 120 guests." },
      { question: "Can close-up magic work at a seated dinner?", answer: "Yes — Scott moves table to table between courses. Each table gets a dedicated 5-minute set. It works especially well at events where guests are locked into their seats and you want to bring the entertainment to them." },
      { question: "What objects does Scott use?", answer: "Playing cards, coins, borrowed rings, watches, phones, napkins, pens — whatever's available. Part of the appeal is that there's nothing hidden up a sleeve. Everything happens with ordinary objects, often ones the guests hand over themselves." },
      { question: "What do I need to provide?", answer: "Nothing. Scott brings everything. All you need is your guests and a great event. No stage, no setup, no special requirements." },
    ],
    testimonial: {
      quote: "Our guests didn't just enjoy the show. They came alive. Months later, they still talk about how Scott made them feel.",
      attribution: "Morgan Stanley, Private Client Event",
    },
  },
  "private-magic-show": {
    slug: "private-magic-show",
    title: "Private Magic Show",
    metaTitle: "Private Magic Show | Theatrical Magic Experience | White Rabbit",
    metaDescription: "Book a curated 45-minute theatrical magic show for 20–120 guests. Full production with lighting, sound, and staging. An unforgettable experience.",
    heroHeadline: "The Private Magic Show",
    heroSub: "A curated 45-minute theatrical experience your guests will be buzzing about for months.",
    image: parlorImg,
    intro: "The Private Magic Show is a curated 45-minute theatrical experience: part magic show, part one-man theater, part collective hallucination. Designed for groups of 20 to 120, it transforms any space into an intimate venue where the impossible feels inevitable.",
    sections: [
      {
        heading: "The Experience",
        body: "Imagine emerald curtains, warm lighting, and a curated soundtrack that pulls your guests into another world before the first trick even begins. Then Scott takes the stage, and for the next 45 minutes, reality gets beautifully unreliable. Cards defy physics. Minds are read. Objects appear in places they have no business being. And the audience? They're screaming, laughing, and grabbing each other's arms.",
      },
      {
        heading: "The Centerpiece of Your Evening",
        body: "The Private Magic Show isn't background entertainment. It's the centerpiece of your evening. It's the thing your guests will text each other about the next morning. It's the reason they'll RSVP 'yes' to your next event before you even send the invitation.",
      },
      {
        heading: "Full Production Support",
        body: "White Rabbit provides full production support in the greater Los Angeles area: professional lighting, sound design, and staging, turning your venue, living room, or conference room into a world-class performance space. Every show is tailored to your audience, your space, and the feeling you want to create.",
      },
      {
        heading: "Inside the Show",
        body: "The Private Magic Show is what defines the White Rabbit brand — an elegant, interactive experience designed to feel like a luxury event, not just a magic act. It runs 30 to 45 minutes depending on the event. Scott opens with close-up magic projected on screen so the entire room can see the details — cards changing in real time, borrowed objects doing things they shouldn't. Then it shifts to mentalism and audience interaction. Volunteers come up and participate in effects they couldn't have predicted. Someone's thought-of word appears inside a sealed envelope. A prediction written hours earlier matches a series of random choices made live. The finale builds on everything that came before it and lands in a way that gets people out of their chairs. The whole show is designed to feel cinematic — there's a curated soundtrack, professional lighting, and a pace that keeps the energy building from start to finish. It's not a variety act. It's a theatrical experience that happens to be in your living room, your boardroom, or your event space.",
      },
      {
        heading: "What Makes This Different from Hiring a Magician for a Stage Show",
        body: "Most magicians who do stage shows are doing the same 45 minutes they do everywhere — big box illusions, audience plants, scripted patter. The Private Magic Show is built from scratch for your event. The material changes based on the audience size, the room, and what the host is going for. A 30-person dinner party in Bel Air gets a different show than a 200-person corporate gala at the Beverly Hilton. Scott has performed at the Magic Castle, consulted for America's Got Talent, and worked private events for Netflix, Disney, and Morgan Stanley. The show reflects that level of craft. Every effect is rehearsed, every transition is clean, and the audience never sees the work behind it.",
      },
      {
        heading: "Available Nationwide",
        body: "The Private Magic Show is available nationwide. In Los Angeles, Scott handles all production — lighting, sound, setup. For events outside LA, production needs are coordinated with the host or their event team.",
      },
    ],
    included: [
      "Pre-event consultation to design the perfect show for your audience",
      "45-minute curated theatrical performance",
      "Full production (lighting, sound, staging) in greater LA area",
      "Curated soundtrack and atmosphere design",
      "Post-event follow-up",
    ],
    faqs: [
      { question: "How many guests can attend?", answer: "The Private Magic Show is designed for groups of 20 to 120 guests. This range ensures every person feels connected, close enough to see every detail, intimate enough to feel like they're part of something special." },
      { question: "What space do you need?", answer: "We can transform almost any space: living rooms, event venues, conference rooms, restaurants. In the LA area, we bring full production (curtains, lighting, sound). For events elsewhere, Scott works with your venue's existing setup." },
      { question: "Can the show be paired with close-up magic?", answer: "Yes, this is our most popular combination. Roaming close-up magic during cocktails, then the Private Magic Show as the evening's centerpiece. It's the complete White Rabbit experience." },
      { question: "What technical setup does the show require?", answer: "Scott brings his own professional lighting and sound system. He needs about an 8-by-10-foot performance area with access to a standard power outlet. No stage is required, though elevated staging helps for groups over 75. Setup takes about 30 minutes and breakdown is 15." },
      { question: "Can the show be paired with roaming magic?", answer: "Yes — this is the most popular booking. Scott does 60 to 90 minutes of roaming close-up magic during cocktail hour, then transitions into the seated show after dinner or during the main event. It gives your guests two completely different experiences in one night." },
      { question: "What's the ideal audience size?", answer: "The show works for 20 to 300 people. The sweet spot is 40 to 150 — large enough to generate real energy, intimate enough that everyone feels like they're part of it. For groups over 200, Scott uses projection screens so nobody misses a detail." },
      { question: "How far in advance should we book the show?", answer: "For peak season — October through January and May through June — book 8 to 12 weeks out. For the rest of the year, 4 to 6 weeks is usually fine. If you've got a date in mind, reach out early. Calendar holds are free and lock in your date." },
      { question: "Is the show appropriate for all audiences?", answer: "Absolutely. The show is sophisticated, elegant, and universally engaging. Perfect for corporate events, private celebrations, and mixed-age gatherings alike." },
    ],
    testimonial: {
      quote: "We've hired entertainers before. Scott is in a completely different category. He turned our cocktail hour into the highlight of the entire evening.",
      attribution: "Director of Events, Fortune 500 Company",
    },
  },
};

const ServicePage = () => {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { openQuiz } = useBookingQuiz();
  const page = serviceSlug ? servicePages[serviceSlug] : undefined;

  const seoTitle = page?.metaTitle || "White Rabbit LA";
  const seoDescription = page?.metaDescription || "";
  const seoPath = serviceSlug ? `/services/${serviceSlug}` : "/experience";
  const seoImage = page?.image;

  useServiceSchema(page ? { title: page.title, metaDescription: page.metaDescription, slug: page.slug, intro: page.intro } : { title: "", metaDescription: "", slug: "", intro: "" });

  // FAQ JSON-LD
  useEffect(() => {
    if (!page?.faqs?.length) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "service-faq-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
    document.getElementById("service-faq-schema")?.remove();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [page]);

  if (!page) {
    // If this slug matches an SEO landing page, redirect to /blog/ canonical URL
    if (serviceSlug && getSeoPageBySlug(serviceSlug)) {
      return <Navigate to={`/blog/${serviceSlug}`} replace />;
    }
    return <NotFound />;
  }

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <img src={page.image} alt={page.heroHeadline} width={1200} height={630} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              White Rabbit Experience
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              {page.heroHeadline}
            </h1>
            <p className="font-sans text-lg text-cream/80 max-w-2xl mx-auto mb-10">
              {page.heroSub}
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-forest-dark py-8 border-t border-cream/10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-6">
            Trusted by World-Class Brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {trustLogos.map((client) => (
              <img key={client.name} src={client.logo} alt={client.name} width={80} height={32} loading="lazy" decoding="async" className="h-6 md:h-8 w-auto object-contain opacity-50 brightness-0 invert" />
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-lg text-foreground leading-relaxed mb-10 font-medium">
              {page.intro}
            </p>
          </AnimatedSection>

          {page.sections.map((section, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4 mt-12">
                {section.heading}
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {section.body}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Mid CTA */}
      <AnimatedSection>
        <section className="bg-secondary/30 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Ready to Elevate Your Event?
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Tell us about your event and we'll confirm availability within 24 hours.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Inquire Now, It's Free
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* What's Included */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <div className="p-8 border border-border">
              <h3 className="font-serif text-2xl text-foreground mb-6">What's Included</h3>
              <ul className="space-y-4">
                {page.included.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-accent mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {page.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="font-sans text-sm md:text-base text-foreground text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-6">
              "{page.testimonial.quote}"
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              {page.testimonial.attribution}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Related City Pages */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-6">Available Nationwide</h2>
            <p className="font-sans text-sm text-muted-foreground mb-6">
              White Rabbit performs across the country. Find {page.title.toLowerCase()} services near you:
            </p>
            <div className="flex flex-wrap gap-2">
              {getSeoPagesByCategory(
                page.slug === "corporate-magician" ? "Corporate Events" :
                page.slug === "wedding-magician" ? "Weddings" :
                page.slug === "private-party-magician" ? "Private Events" :
                page.slug === "close-up-magician" ? "Close-Up Magic" :
                "Private Magic Shows"
              )
                .slice(0, 10)
                .map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="font-sans text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    {p.location}
                  </Link>
                ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/experience" className="font-sans text-sm text-accent hover:text-accent/80 transition-colors underline underline-offset-4">
                See all experiences →
              </Link>
              <Link to="/reviews" className="font-sans text-sm text-accent hover:text-accent/80 transition-colors underline underline-offset-4">
                Read client reviews →
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Make Your Next Event Unforgettable
            </h2>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">
              Most clients book 2–4 weeks in advance · No obligation to inquire
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Book White Rabbit Now
            </button>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default ServicePage;
