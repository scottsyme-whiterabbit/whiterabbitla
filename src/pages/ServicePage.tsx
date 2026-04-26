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
  "holiday-party-magician": {
    slug: "holiday-party-magician",
    title: "Holiday Party Magician",
    metaTitle: "Holiday Party Magician in Los Angeles | White Rabbit LA",
    metaDescription: "The entertainment your team mentions in Monday's all-hands. Trusted by Netflix, Disney, and Morgan Stanley for company holiday parties across Los Angeles.",
    heroHeadline: "Holiday Party Magic",
    heroSub: "The entertainment your team will mention in Monday's all-hands — and remember next December.",
    image: corporateImg,
    intro: "White Rabbit delivers close-up magic and mentalism for company holiday parties, end-of-year galas, and seasonal celebrations across Los Angeles. The kind of entertainment that earns a place on the calendar year over year — never awkward, always remembered.",
    sections: [
      {
        heading: "Why Magic Works for Holiday Parties",
        body: "Holiday parties are high-stakes for HR and EAs: book the wrong entertainment and the cringe lasts until January. Close-up magic solves it. The performance creates shared moments of surprise across the entire room — sober colleagues, social colleagues, executives, interns, international team members all having the same reaction at the same time. No bad karaoke. No awkward icebreakers. Just real, involuntary laughter and the kind of stories that get repeated in Slack the next morning.",
      },
      {
        heading: "Cocktail Hour & Dinner Strolling",
        body: "For most corporate holiday parties under 200 guests, the highest-impact format is 60 to 90 minutes of close-up strolling during cocktails and dinner. Scott moves through the room engaging clusters of eight to fifteen people for six to ten minutes each. Photo ops happen. Conversations between teams that never talk start happening. By the end of dinner, most of the room has seen the magic and has something to talk about.",
      },
      {
        heading: "Featured Parlor Set for Larger Parties",
        body: "For company-wide holiday parties or holiday galas above 200 guests, a featured 25-minute parlor set after dinner gives the entire room a single shared centerpiece moment. Some companies book both — strolling early in the evening, parlor show as the featured close.",
      },
      {
        heading: "Built for Mixed Corporate Audiences",
        body: "Scott Syme has performed for Netflix, Disney, Morgan Stanley, and a long list of agencies, hedge funds, law firms, and Fortune 500 holiday events. Every routine is corporate-clean by default — no off-color material, no participant-embarrassment moments. The performance reads as sophisticated and intelligent rather than spectacle. It works for international audiences, sober crowds, conservative cultures, and younger social cultures equally well.",
      },
      {
        heading: "Booking Window — Why September Matters",
        body: "Top close-up magicians in Los Angeles are typically booked solid for the first three weekends of December by mid-October. Friday and Saturday nights in mid-December are the first to lock. White Rabbit accepts limited late bookings into November for non-peak nights — weekday parties, lunchtime events, second-half-of-December dates — but companies that want a specific date should book by mid-September. Procurement-ready: written contract, $1M general liability insurance, COI, W-9, and standard payment terms are all pre-loaded.",
      },
    ],
    included: [
      "Pre-event consultation to tailor the performance to your company culture",
      "Corporate-clean close-up magic, mentalism, and audience interaction",
      "Procurement-ready paperwork: COI, W-9, $1M general liability insurance",
      "Custom integration with your event's theme, agenda, and timeline",
      "Post-event follow-up to ensure your party exceeded expectations",
    ],
    faqs: [
      { question: "When should we book a holiday party magician for our company event?", answer: "Book by mid-September for a December holiday party. Top close-up magicians in Los Angeles are typically booked solid for the first three weekends of December by mid-October. White Rabbit LA still accepts limited late bookings into November for non-peak-night events (weekday parties, lunchtime events, and second-half-of-December dates), but Friday and Saturday nights in mid-December are the first to lock. Book early to secure the date, the format, and the time slot you want." },
      { question: "How much does a holiday party magician cost?", answer: "Holiday party magic at White Rabbit LA is custom-priced for each booking based on audience size, venue, format (cocktail strolling, dinner-table magic, or a featured parlor show), travel, and the level of brand or theme integration. Every quote is built on a short discovery call so the night you're planning is matched to the right format and investment. The booking process is built for corporate procurement teams, with written contract, $1M general liability insurance, COI, W-9, and standard payment terms. Scott Syme is a Magic Castle (Academy of Magical Arts) member, Disney Channel magic consultant, and magic consultant to America's Got Talent champion Dustin Tavella. Call (424) 394-1850 or request a callback through the contact page." },
      { question: "Will a magician work for our company holiday party if half the team doesn't drink?", answer: "Yes — close-up magic is one of the few entertainment formats that works equally well sober or social. The performance creates shared moments of surprise and laughter that don't depend on alcohol. For office cultures that lean younger and more social, the energy meets that. For office cultures that lean older, more conservative, or international, the performance lands as elevated and intelligent. The same act has played for Netflix and Morgan Stanley audiences in the same week." },
      { question: "What's the best format for a company holiday party magician?", answer: "For most corporate holiday parties under 200 guests, the highest-impact format is 60 to 90 minutes of close-up strolling during the cocktail and dinner portions of the event. Guests are mingling, photo ops are happening, and the magic creates the talking points that show up in the Monday-morning Slack. For larger company-wide parties or holiday galas, a featured 25-minute parlor set after dinner gives the entire room a single shared moment. Some companies book both — strolling early, parlor show as the featured close." },
      { question: "Can a magician travel to our office or venue for a private holiday event?", answer: "Yes. White Rabbit LA performs at private offices, restaurants, ballrooms, members' clubs, and home venues across Los Angeles, Beverly Hills, Malibu, Santa Monica, Pasadena, Calabasas, and the broader LA metro area. Travel is included for venues within a 30-mile radius of Beverly Hills. For events outside that radius — Orange County, Santa Barbara, Palm Springs, Ojai — travel and lodging are added at flat rate." },
      { question: "Is the holiday magic show appropriate for international and mixed-language audiences?", answer: "Yes. Scott's performance is heavily visual — the moments that land hardest are objects appearing, vanishing, and transforming in the guest's own hands, rather than verbal punchlines. The performance has played to audiences in cities including London, Tokyo, Dubai, and Mexico City. For international corporate holiday parties in Los Angeles, the magic translates without modification." },
    ],
    testimonial: {
      quote: "Our entire team was talking about Scott in the Monday standup. He read the room perfectly — sophisticated enough for the executives, fun enough for the new hires.",
      attribution: "Head of People, LA-based Tech Company",
    },
  },
  "charity-gala-magician": {
    slug: "charity-gala-magician",
    title: "Charity Gala Magician",
    metaTitle: "Charity Gala Magician for Nonprofit Fundraisers | White Rabbit LA",
    metaDescription: "Raises the room before the auction. Disney Channel consultant trusted by nonprofits across Los Angeles, Hollywood, Napa, and beyond. 5-star reviewed across 50+ events.",
    heroHeadline: "Charity Gala Magic",
    heroSub: "Raises the room before the auction — and gets remembered long after the last bid.",
    image: parlorImg,
    intro: "White Rabbit performs close-up magic and mentalism at charity galas and nonprofit fundraisers across Los Angeles, Hollywood, Napa Valley, and 80+ cities nationwide. The performance is engineered to elevate the room during cocktail hour, then step aside completely so the program, speakers, and live auction land at full force.",
    sections: [
      {
        heading: "Magic That Lifts the Auction",
        body: "A well-placed close-up magician at a gala increases donations because the entertainment is delivered before and during cocktail hour, then disappears once the program begins. By the time the live auction starts, the room is loose, conversational, and emotionally elevated — the exact state that drives bidding. Past gala clients have reported that post-event donor surveys named the close-up magic as the most memorable moment of the night.",
      },
      {
        heading: "How the Magic Sits in the Run-of-Show",
        body: "The standard format is 60 to 90 minutes of close-up strolling during cocktail hour and into the early dinner seating. Scott moves through the room engaging small clusters of donors for five to ten minutes each, creating shared moments and conversations between people who may not know each other. For larger galas with 300+ guests, a second magician is sometimes added to ensure full coverage. The magic is intentionally finished before the program begins so the room's full attention shifts to the speakers, honorees, and auction.",
      },
      {
        heading: "Built for High-Net-Worth Audiences",
        body: "The performance is designed for adult, sophisticated, often skeptical audiences. Past clients include events with C-suite executives, Hollywood industry leaders, and major philanthropists. Scott Syme is a Magic Castle (Academy of Magical Arts) member, magic consultant to America's Got Talent champion Dustin Tavella, a Disney Channel magic consultant on Bizaardvark, and a former Compass Beverly Hills luxury real estate professional — every interaction is delivered with white-glove hospitality, not magic-show showmanship.",
      },
      {
        heading: "Custom Mission-Tied Routines",
        body: "Custom routines tied to the nonprofit's mission, anniversary year, or honoree have been built for past clients. Examples include a routine where the year of the organization's founding appeared inside a sealed envelope passed through the audience, and a routine where the honoree's signature appeared on an object they had never touched. Custom mission-tied routines require a planning call four to six weeks in advance.",
      },
      {
        heading: "Available for Galas Nationwide",
        body: "White Rabbit performs at galas across Hollywood, Napa Valley, Aspen, the Hamptons, Palm Beach, Greenwich, Nashville, Austin, and 80+ additional cities. Travel is billed flat-rate. For nonprofit organizations with constrained entertainment budgets, White Rabbit also runs limited pro bono and discounted programs each year for mission-aligned causes — request the pro bono inquiry form on the contact page.",
      },
    ],
    included: [
      "Pre-event consultation aligned with your gala run-of-show",
      "60 to 90 minutes of close-up strolling during cocktail hour and early dinner",
      "Optional custom mission- or honoree-tied routine",
      "$1M general liability insurance and standard nonprofit-vendor paperwork",
      "Coordination with auctioneer and program team to ensure clean handoff",
    ],
    faqs: [
      { question: "Does hiring a magician at a charity gala increase or distract from donations?", answer: "A well-placed close-up magician increases donations because the entertainment is delivered before and during cocktail hour, then steps aside completely once the program begins. By the time the live auction starts, the room is loose, conversational, and emotionally elevated — the exact state that drives bidding. The magic works during natural mingling time when guests are arriving, drinking, and small-talking. It does not compete with the program, the speakers, or the auctioneer. White Rabbit LA has performed at galas where post-event donor surveys named the close-up magic as the most memorable moment of the night." },
      { question: "What's the right way to use a magician at a charity gala or fundraiser?", answer: "The standard format is 60 to 90 minutes of close-up strolling during cocktail hour and into the early dinner seating. The magician moves through the room engaging small clusters of guests for five to ten minutes each, creating shared moments and conversations between donors who may not know each other. For larger galas with 300+ guests, a second magician is sometimes added to ensure full coverage. The magic is intentionally finished before the program begins so the room's full attention shifts to the speakers, honorees, and auction." },
      { question: "Will the magic be sophisticated enough for a high-net-worth donor audience?", answer: "Yes. The performance is designed for adult, sophisticated, often skeptical audiences. Past clients include events with C-suite executives, Hollywood industry leaders, and major philanthropists. Scott Syme is a Magic Castle (Academy of Magical Arts) member, magic consultant to America's Got Talent champion Dustin Tavella, a Disney Channel magic consultant, and a former Compass Beverly Hills luxury real estate professional — every interaction is delivered with white-glove hospitality, not magic-show showmanship. The performance reads as a private clubhouse experience that just happens to involve magic." },
      { question: "Can a magician perform at a charity gala outside Los Angeles?", answer: "Yes. White Rabbit LA performs at galas nationwide — Hollywood, Napa Valley, Aspen, the Hamptons, Palm Beach, Greenwich, Nashville, Austin, and 80+ additional cities. Travel is billed flat-rate. For nonprofit organizations with constrained entertainment budgets, White Rabbit also runs limited pro bono and discounted programs each year for mission-aligned causes — request the pro bono inquiry form on the contact page." },
      { question: "How far in advance should we book a charity gala magician?", answer: "Book four to six months in advance for spring and fall gala season (March through May, September through November). Holiday season galas (December) often book by August. White Rabbit LA accepts shorter-window bookings when calendar permits, but premiere gala dates — Saturday nights during peak season — book first and book early." },
      { question: "Can the magic be branded or themed to the nonprofit's mission?", answer: "Yes. Custom routines tied to the nonprofit's mission, anniversary year, or honoree have been built for past clients. Examples include a routine where the year of the organization's founding appeared inside a sealed envelope passed through the audience, and a routine where the honoree's signature appeared on an object they had never touched. Custom mission-tied routines require a planning call four to six weeks in advance." },
    ],
    testimonial: {
      quote: "Scott set the tone for our gala in the best way. The room was electric by the time we opened the auction — and our paddle raises beat last year's by a meaningful margin.",
      attribution: "Gala Chair, Los Angeles Nonprofit",
    },
  },
  "trade-show-magician": {
    slug: "trade-show-magician",
    title: "Trade Show Magician",
    metaTitle: "Trade Show Magician for Booth Lead Generation | White Rabbit LA",
    metaDescription: "Lead-capture-ready routines, sales-team handoff built in. The booth strategy that turns walk-by traffic into qualified conversations. Magic consultant to AGT champion Dustin Tavella.",
    heroHeadline: "Trade Show Magic",
    heroSub: "The booth strategy that turns walk-by traffic into qualified conversations.",
    image: closeupImg,
    intro: "White Rabbit's trade show magic is engineered for one outcome: more qualified booth conversations per show day. Working magicians on the floor regularly report 200 to 300 leads per day and badge-scan rates two to three times what the booth team projected. The mechanism is simple — a small crowd watching genuinely impressive close-up magic stops the people walking past, and curiosity converts directly into conversations with your sales team.",
    sections: [
      {
        heading: "Why a Booth Magician Outperforms Bigger Booth Real Estate",
        body: "The cost-per-lead on a magic-driven booth is typically lower than the same budget spent on additional printed materials, larger displays, or more booth real estate. The magician stops traffic, builds the crowd, and warms the prospect. The sales team works the warmed prospect from there. The math works out across virtually every B2B vertical — SaaS, hardware, healthcare, financial services.",
      },
      {
        heading: "Sales Team Handoff Built Into the Routine",
        body: "Scott Syme works with each client's booth team in advance to build a custom hand-off line that ties the magic moment directly to the product or offer. 'Just like I just made that card change in your hand, what we do for [client type] is...' Lead capture — badge scan, business card, QR code — happens during the natural transition. The magician hands a warm, engaged prospect to the rep instead of a cold walk-up.",
      },
      {
        heading: "Custom Brand-Integrated Routines",
        body: "The strongest trade show routines integrate the client's brand, product, or core messaging into the moment of impact. Past examples include a SaaS client whose logo appeared inside a sealed envelope held by the prospect, a hardware client whose product specs appeared written on a card the prospect signed, and a healthcare client whose tagline appeared on a sealed prediction chosen at random. Custom branded routines require a planning call four to six weeks before the show.",
      },
      {
        heading: "Built for Multi-Day Conferences",
        body: "Scott has worked CES, Dreamforce, NRF, Adobe Summit, SXSW, HIMSS, and similar major conferences. The standard performance day is six hours of active booth-side performance, broken into eight- to twelve-minute routines with brief reset breaks. Stamina-managed correctly, this allows full coverage of peak floor hours without performance quality dropping in the afternoon. Multi-day bookings build in mandatory rest hours to maintain consistency across show days.",
      },
      {
        heading: "Minimal Footprint, Zero Tech",
        body: "A close-up trade show magician needs roughly a four-by-four-foot footprint and any standard booth surface — a podium, a high-top table, or even a back-counter. No microphone is needed because crowds form naturally within speaking distance. The magician is fully self-contained: all props, materials, and quick-reset routines travel with Scott. White Rabbit provides a one-page integration brief covering booth flow, hand-off scripts, and lead-capture timing.",
      },
    ],
    included: [
      "Pre-show planning call covering booth flow, sales handoff, and lead capture",
      "Six hours per day of active booth-side performance",
      "Optional custom brand-integrated routine tied to your product or messaging",
      "One-page sales-team integration brief and handoff scripts",
      "$1M general liability insurance and standard exhibitor paperwork",
    ],
    faqs: [
      { question: "Does a trade show magician actually generate leads, or is it just decoration?", answer: "A trade show magician is one of the highest-converting booth strategies in B2B marketing. Working magicians regularly report 200 to 300 booth-side leads per day and badge-scan rates two to three times what booth teams projected. The mechanism is straightforward: a small crowd watching genuinely impressive close-up magic stops people walking past, and curiosity converts directly into qualified conversations with the sales team. The cost-per-lead on a magic-driven booth is typically lower than the same budget spent on additional printed materials, larger displays, or more booth real estate." },
      { question: "How does a trade show magician integrate with our sales team and booth flow?", answer: "The magician's job is to stop traffic, build the crowd, and warm the prospect — then hand off to the sales team in the closing seconds of the routine. Scott Syme works with each client's booth team in advance to build a custom hand-off line that ties the magic moment directly to the product or offer ('Just like I just made that card change in your hand, what we do for [client type] is...'). Lead capture (badge scan, business card, QR code) happens during the natural transition. Sales reps work the warmed prospect from there." },
      { question: "How much does a trade show magician cost for a multi-day conference?", answer: "Trade show magic at White Rabbit LA is priced per booking, not from a public rate card. The variables are hours of active booth performance per day, total show days, custom branded routine development, travel, and lodging for multi-day events (CES, Dreamforce, NRF, Adobe Summit, SXSW, HIMSS). The investment is small relative to the rest of a trade show budget — adding a magician typically lifts total booth spend by a fraction of what it costs to add booth real estate, additional reps, or printed collateral, while measurably multiplying lead capture. Quotes are built on a short discovery call covering booth size, sales-team handoff plan, and brand-integration goals. Call (424) 394-1850 or request a callback." },
      { question: "Can the magic be customized to our product, brand, or messaging?", answer: "Yes — and it should be. The strongest trade show routines integrate the client's brand, product, or core messaging into the moment of impact. Past examples include a SaaS client whose logo appeared inside a sealed envelope held by the prospect, a hardware client whose product specs appeared written on a card the prospect signed, and a healthcare client whose tagline appeared on a sealed prediction chosen at random. Custom branded routines require a planning call four to six weeks before the show." },
      { question: "What are the technical and space requirements for a booth magician?", answer: "Minimal. A close-up trade show magician needs roughly a 4 ft × 4 ft footprint and any standard booth surface — a podium, a high-top table, or even a back-counter. No microphone is needed because crowds form naturally within speaking distance. The magician is fully self-contained: all props, materials, and quick-reset routines travel with Scott. White Rabbit LA provides a one-page integration brief covering booth flow, hand-off scripts, and lead-capture timing." },
      { question: "How many hours per day can a magician realistically perform on a trade show floor?", answer: "The standard performance day is six hours of active booth-side performance, broken into eight- to twelve-minute routines with brief reset breaks between sets. Stamina-managed correctly, this allows full coverage of peak floor hours without performance quality dropping in the afternoon. Multi-day bookings build in mandatory rest hours to maintain consistency across show days. White Rabbit LA delivers the same level of energy at hour six as hour one." },
    ],
    testimonial: {
      quote: "Booth scans were up nearly 3x over the previous year. Our reps spent the entire show talking to qualified prospects instead of trying to flag down attendees.",
      attribution: "Field Marketing Director, Enterprise SaaS",
    },
  },
  "golf-tournament-magician": {
    slug: "golf-tournament-magician",
    title: "Golf Tournament Magician",
    metaTitle: "Golf Tournament Magician for Hospitality & Clubhouse | White Rabbit LA",
    metaDescription: "Fills the gap between rounds and the auction. Hospitality-tent and clubhouse magician for charity golf and corporate tournaments across Southern California.",
    heroHeadline: "Golf Tournament Magic",
    heroSub: "Fills the gap between rounds and the auction — and lifts the awards dinner energy.",
    image: corporateImg,
    intro: "White Rabbit performs close-up magic at charity golf tournaments and corporate tournaments across Southern California — clubhouse cocktail receptions, awards dinners, and on-course hospitality tents. The performance fills the natural gaps in a tournament day where guests aren't actively playing or eating, and lifts the room before the auction or awards.",
    sections: [
      {
        heading: "Where the Magic Fits in a Tournament Day",
        body: "Three highest-value placements: (1) the morning registration and breakfast, where players are gathering and waiting for tee times, (2) the post-round cocktail reception and silent auction, where attendees are mingling before the awards dinner, and (3) the awards dinner itself, where dinner-table close-up magic between courses keeps energy high. Some tournaments add a magician to a sponsored hospitality tent on the course to entertain VIP groups during their round.",
      },
      {
        heading: "Why Magic Beats a DJ at a Tournament",
        body: "A close-up magician works the room one small group at a time, which is the format that matches how golf tournament guests actually socialize — small groups, mingling, conversational. A band or DJ requires a stationary audience and full attention; a magician moves through the room and creates intimate moments of impact within whatever conversation is already happening. For charity tournaments specifically, the magic creates the energy that lifts the auction without competing with the program.",
      },
      {
        heading: "On-Course Hospitality Tent Coverage",
        body: "On-course hospitality tent magic is a premium add-on for sponsor tents, charity hospitality, and VIP groups. The magician rotates between tents during play, performing six- to ten-minute sets for the small group of guests stationed in each tent. This is most effective at multi-tent tournaments where sponsors are competing for guest experience, and at charity tournaments where major donors are housed in dedicated VIP areas.",
      },
      {
        heading: "The Right Audience for the Magic",
        body: "The audience at a corporate or charity golf tournament is exactly the demographic White Rabbit performs for most often — adult, mixed-gender, professionally successful, often skeptical, and looking for intelligent entertainment rather than spectacle. Scott's client list (Netflix, Disney, Morgan Stanley) and Magic Castle membership pre-qualify the booking for this audience. The performance reads as a private clubhouse experience that earns conversation, not a kids'-show performance.",
      },
      {
        heading: "Booking Window for Tournament Season",
        body: "Book eight to twelve weeks in advance for charity tournaments and twelve to sixteen weeks for major corporate tournaments. Spring (April through June) and fall (September through October) are peak tournament season in California, and dates fill in the order they're requested. Late bookings are accepted when the calendar permits.",
      },
    ],
    included: [
      "Pre-tournament planning call covering hospitality, dinner, and on-course coverage",
      "Post-round cocktail reception and dinner-table strolling magic",
      "Optional on-course hospitality tent rotation as a sponsor add-on",
      "$1M general liability insurance and standard tournament-vendor paperwork",
      "Coordination with tournament committee and auctioneer for clean program flow",
    ],
    faqs: [
      { question: "What does a golf tournament magician actually do during the event?", answer: "A golf tournament magician fills the natural gaps in a tournament day where guests aren't actively playing or eating. The three highest-value placements are: (1) the morning registration and breakfast, where players are gathering and waiting for tee times, (2) the post-round cocktail reception and silent auction, where attendees are mingling before the awards dinner, and (3) the awards dinner itself, where dinner-table close-up magic between courses keeps energy high. Some tournaments add a magician to a sponsored hospitality tent on the course to entertain VIP groups during their round." },
      { question: "Why hire a magician for a charity golf tournament instead of a band or DJ?", answer: "A close-up magician works the room one small group at a time, which is the format that matches how golf tournament guests actually socialize — small groups, mingling, conversational. A band or DJ requires a stationary audience and full attention; a magician moves through the room and creates intimate moments of impact within whatever conversation is already happening. For charity tournaments specifically, the magic creates the energy that lifts the auction without competing with the program." },
      { question: "How much does it cost to book a magician for a golf tournament?", answer: "Golf tournament magic at White Rabbit LA is custom-priced per tournament. The variables are hours of coverage (registration, on-course hospitality, post-round cocktail reception, awards dinner), format (close-up strolling only, or close-up plus a featured parlor set after dinner), travel, and whether on-course hospitality tents are included. Most tournament committees book the post-round cocktail reception plus dinner-table strolling as the standard package and add on-course coverage as a sponsor-level upgrade. Every quote is built on a short discovery call. Call (424) 394-1850 or request a callback through the contact page." },
      { question: "Can a magician perform at the on-course hospitality tents during play?", answer: "Yes. On-course hospitality tent magic is a premium add-on for sponsor tents, charity hospitality, and VIP groups. The magician rotates between tents during play, performing six- to ten-minute sets for the small group of guests stationed in each tent. This is most effective at multi-tent tournaments where sponsors are competing for guest experience, and at charity tournaments where major donors are housed in dedicated VIP areas." },
      { question: "Will the magic translate to a golf-and-business demographic?", answer: "Yes. The audience at a corporate or charity golf tournament is exactly the demographic White Rabbit LA performs for most often — adult, mixed-gender, professionally successful, often skeptical, and looking for intelligent entertainment rather than spectacle. Scott Syme's client list (Netflix, Disney, Morgan Stanley) and Magic Castle membership pre-qualify the booking for this audience. The performance reads as a private clubhouse experience that earns conversation, not a 'wedding magician' performance." },
      { question: "How far in advance should we book a tournament magician?", answer: "Book eight to twelve weeks in advance for charity tournaments and twelve to sixteen weeks for major corporate tournaments. Spring (April through June) and fall (September through October) are peak tournament season in California, and dates fill in the order they're requested. Late bookings are accepted when the calendar permits." },
    ],
    testimonial: {
      quote: "The cocktail reception is usually the part of the day everyone forgets. This year, it was the part everyone remembered. Our auction numbers reflected it.",
      attribution: "Tournament Chair, Southern California Charity Golf Classic",
    },
  },
  "dmc-entertainment": {
    slug: "dmc-entertainment",
    title: "Magician for DMC Programs",
    metaTitle: "Magician for DMC Programs in Los Angeles | White Rabbit LA",
    metaDescription: "RFP-ready, insurance-loaded, performance consistent. The LA experience your incentive group remembers years later. Trusted by Netflix, Disney, and Morgan Stanley.",
    heroHeadline: "DMC Entertainment Partner",
    heroSub: "RFP-ready, insurance-loaded, performance consistent. The LA experience your incentive group remembers years later.",
    image: privateImg,
    intro: "White Rabbit partners with destination management companies sourcing close-up magic, parlor magic, and Magic Castle-themed evenings for incoming corporate incentive groups, executive offsites, and curated LA programs. RFP-ready, insurance-loaded, and built to perform consistently at the standard Fortune 500 incentive groups expect.",
    sections: [
      {
        heading: "How DMCs Use White Rabbit",
        body: "A DMC entertainment partner is a vetted, reservable, repeat-bookable performer that DMCs source for incoming groups visiting a destination city. White Rabbit partners with DMCs operating in Los Angeles — Hello! West, PRA, Allied PRA, Maritz, BCD M&E, and similar. The DMC owns the client relationship and the booking; Scott Syme delivers the performance to the agreed-upon spec. Insurance, contracts, COIs, and W-9 documentation are pre-loaded for fast turnaround on RFPs.",
      },
      {
        heading: "Three LA-Themed Program Formats",
        body: "Three formats are most commonly requested: (1) a private Magic Castle evening for incoming groups (subject to Academy of Magical Arts sponsorship rules and availability), (2) a private home or villa close-up performance staged in Beverly Hills, Hollywood Hills, or Malibu venues that DMCs already use, and (3) a featured close-up or parlor performance integrated into a curated LA-themed evening — rooftop dinner, classic-Hollywood venue, members' club, or private museum buyout. Each format can be customized to the client's brand or industry vertical.",
      },
      {
        heading: "Built for DMC Operating Tempo",
        body: "DMC bookings are prioritized in the calendar. White Rabbit holds blocks of weekend availability specifically for DMC partners, allowing inquiries to be answered within 24 hours and confirmed within 48 when calendar permits. For high-value incentive programs, advance booking 60 to 90 days out is preferred to lock the date and finalize custom programming. Day-of and 48-hour rush bookings are accepted at premium rates when calendar permits.",
      },
      {
        heading: "Commercial Terms and Documentation",
        body: "White Rabbit carries $1M general liability insurance, accepts net-30 payment terms with established DMC partners after first booking, and provides a standard one-page rider, COI naming the venue, W-9, and 1099-ready invoicing. New DMC partners are onboarded with a 50% deposit and net-30 balance. Multi-program annual agreements are available for DMCs running ongoing LA incentive programs.",
      },
      {
        heading: "Why DMCs Book Scott Syme Specifically",
        body: "Scott Syme is the founder and lead performer of White Rabbit LA. He is a member of the Academy of Magical Arts (Magic Castle, Hollywood), magic consultant to America's Got Talent champion Dustin Tavella, a Disney Channel magic consultant on Bizaardvark, and a former Compass Beverly Hills luxury real estate professional — a background that translates directly into the white-glove hospitality DMC clients expect. His client roster includes Netflix, Disney, Morgan Stanley, and a long list of Fortune 500 companies. The performance is consistent, the booking process is corporate-grade, and the LA-based authority signals align with the city-themed experiences DMC programs are built around.",
      },
    ],
    included: [
      "Priority calendar holds for established DMC partners",
      "RFP-ready documentation: insurance, COI, W-9, 1099-ready invoicing",
      "Custom program design for Magic Castle, private home, and curated LA evenings",
      "Net-30 terms after first booking; multi-program annual agreements available",
      "Post-program follow-up and reusable program documentation for repeat bookings",
    ],
    faqs: [
      { question: "What is a DMC entertainment partner and how does the booking process work?", answer: "A DMC (destination management company) entertainment partner is a vetted, reservable, repeat-bookable performer that DMCs source for incoming incentive groups, executive offsites, and corporate programs visiting a destination city. White Rabbit LA partners with DMCs operating in Los Angeles for programs sourcing close-up magic, parlor magic, and Magic Castle-themed evenings. The DMC handles the client relationship and booking; Scott Syme delivers the performance to the agreed-upon spec. Insurance, contracts, COIs, and W-9 documentation are pre-loaded for fast turnaround on RFPs." },
      { question: "What types of LA-themed magical experiences can be built into a DMC program?", answer: "Three formats are most commonly requested: (1) a private Magic Castle evening for incoming groups (subject to Academy of Magical Arts sponsorship rules and availability), (2) a private home or villa close-up performance staged in Beverly Hills, Hollywood Hills, or Malibu venues that DMCs already use, and (3) a featured close-up or parlor performance integrated into a curated LA-themed evening (rooftop dinner, classic-Hollywood venue, members' club, private museum buyout). Each format can be customized to the client's brand or industry vertical." },
      { question: "Are White Rabbit LA bookings available on short notice for DMC programs?", answer: "Yes — DMC bookings are prioritized in the calendar. White Rabbit LA holds blocks of weekend availability specifically for DMC partners, allowing inquiries to be answered within 24 hours and confirmed within 48 when calendar permits. For high-value incentive programs, advance booking 60 to 90 days out is preferred to lock the date and finalize custom programming. Day-of and 48-hour rush bookings are accepted at premium rates when calendar permits." },
      { question: "What are the standard DMC commercial terms and documentation?", answer: "White Rabbit LA carries $1M general liability insurance, accepts net-30 payment terms with established DMC partners after first booking, and provides a standard one-page rider, COI naming the venue, W-9, and 1099-ready invoicing. New DMC partners are onboarded with a 50% deposit and net-30 balance. Multi-program annual agreements are available for DMCs running ongoing LA incentive programs." },
      { question: "Can performances be delivered in languages other than English?", answer: "The performance is heavily visual — the impact moments are objects appearing, vanishing, and transforming in the guest's own hands, which translate without language. For groups where verbal patter would benefit from a host or translator, White Rabbit LA can structure the routine for minimal verbal patter. Past international groups have included audiences from Japan, Korea, Germany, Mexico, and the UAE. For groups where a Spanish-speaking emcee is preferred, referrals are available." },
      { question: "Who is Scott Syme and why do DMCs book him specifically?", answer: "Scott Syme is the founder and lead performer of White Rabbit LA. He is a member of the Academy of Magical Arts (Magic Castle, Hollywood), magic consultant to America's Got Talent champion Dustin Tavella, a Disney Channel magic consultant on the show Bizaardvark, and a former Compass Beverly Hills luxury real estate professional — a background that translates directly into the white-glove hospitality DMC clients expect. His client roster includes Netflix, Disney, Morgan Stanley, and a long list of Fortune 500 companies. DMCs book him because the performance is consistent, the booking process is corporate-grade, and the LA-based authority signals (Magic Castle membership, Hollywood credentials) align with the city-themed experiences DMC programs are built around." },
    ],
    testimonial: {
      quote: "Scott is one of the few entertainment partners we can hand to any client and not worry about the result. The performance lands every time, and the paperwork is always ready.",
      attribution: "Senior Program Manager, Los Angeles DMC",
    },
  },
  "resident-event-magician": {
    slug: "resident-event-magician",
    title: "Resident Event Magician",
    metaTitle: "Resident Magician for HOAs, Country Clubs & Residential Communities | White Rabbit LA",
    metaDescription: "The entertainment residents request again next year. Multi-event partnerships for HOAs, country clubs, and luxury residential communities across LA. 5-star reviewed across 50+ events.",
    heroHeadline: "Resident Event Magic",
    heroSub: "The entertainment residents request again next year.",
    image: weddingImg,
    intro: "White Rabbit performs close-up magic and parlor shows for HOA holiday parties, country club member nights, luxury residential building lobby events, gated-community summer socials, and seasonal celebrations across Los Angeles. One-off bookings and multi-event annual partnerships available.",
    sections: [
      {
        heading: "How Resident Booking Works",
        body: "A resident magician is a regularly-booked performer for residential community events. White Rabbit performs on a one-off basis for residential clients and offers a multi-event annual partnership for communities running four or more events per year. The annual partnership locks calendar priority, fixed pricing across the year, and custom themed programming for each event.",
      },
      {
        heading: "Built for Wide-Age Resident Audiences",
        body: "Close-up magic is one of the few entertainment formats that works for a wide adult age range without modification. The performance is sophisticated and intelligent, which lands with older audiences who appreciate skill over spectacle, and visually impactful, which lands with younger audiences who film and share the moments. There is no off-color material and no participant-embarrassment moments, so the performance reads as appropriate across the entire age range of a typical residential community event.",
      },
      {
        heading: "Long-Format Community Nights",
        body: "White Rabbit structures long-format community events as 60 to 90 minutes of close-up strolling during cocktail and dinner, with a featured 25-minute parlor set after dinner as the entertainment moment of the night. This pacing covers the natural arc of a four- to five-hour community event without performance fatigue. For all-night residential events, a second performer can be added to share floor time.",
      },
      {
        heading: "Past Residential and Club Clients",
        body: "Past residential and club events have included country club member nights in Beverly Hills and Pasadena, gated-community holiday galas in Calabasas and the Hollywood Hills, and luxury residential building events in Beverly Hills and Santa Monica. References from past residential clients are available on request, and the public review page on whiterabbitla.com includes specific mention of repeat residential and club bookings.",
      },
      {
        heading: "Custom Themed Routines for Community Traditions",
        body: "Custom routines built around the founding year of a community, seasonal themes (Halloween, Fourth of July, holiday season), or community anniversaries have been delivered for past clients. Examples include a routine where the founding year of a residential community appeared inside a sealed envelope passed through the audience, a Halloween residential event with a custom themed mentalism set, and an HOA anniversary gala where the names of long-tenured residents appeared on a card chosen at random. Custom themed routines require a four-week planning window.",
      },
    ],
    included: [
      "Pre-event planning call covering audience, format, and any custom themed routine",
      "60 to 90 minutes of close-up strolling, with optional featured parlor set",
      "Multi-event annual partnership available for communities running 4+ events per year",
      "$1M general liability insurance and standard residential-vendor paperwork",
      "Post-event follow-up and consistent performance across the annual calendar",
    ],
    faqs: [
      { question: "What is a resident magician and how does the booking work?", answer: "A resident magician is a regularly-booked performer for residential community events — HOA holiday parties, country club member nights, luxury residential building lobby events, gated-community summer socials, and seasonal celebrations. White Rabbit LA performs on a one-off booking basis for residential clients and offers a multi-event annual partnership for communities running four or more events per year. The annual partnership locks calendar priority, fixed pricing across the year, and custom themed programming for each event." },
      { question: "Will the magic work for an audience that spans ages 30 to 80?", answer: "Yes — close-up magic is one of the few entertainment formats that works for a wide adult age range without modification. The performance is sophisticated and intelligent, which lands with older audiences who appreciate skill over spectacle, and visually impactful, which lands with younger audiences who film and share the moments. There is no off-color material and no participant-embarrassment moments, so the performance reads as appropriate across the entire age range of a typical residential community event." },
      { question: "How much does a resident magician cost for a community event?", answer: "Resident magician bookings at White Rabbit LA are custom-priced per event based on audience size, length of coverage (cocktail hour only, full evening, or multi-segment night), venue, and format (close-up strolling only, or strolling plus a featured parlor set). Multi-event annual partnerships are available for residential communities and country clubs running four or more events per year, and offer locked calendar priority and consistent per-event terms. Every quote is built on a short discovery call so the right format is matched to the audience and the night. Call (424) 394-1850 or request a callback through the contact page." },
      { question: "Can a magician handle a long event night with multiple cocktail-and-dinner segments?", answer: "Yes. White Rabbit LA structures long-format community events as 60 to 90 minutes of close-up strolling during cocktail and dinner, with a featured 25-minute parlor set after dinner as the entertainment moment of the night. This pacing covers the natural arc of a four- to five-hour community event without performance fatigue. For all-night residential events, a second performer can be added to share floor time." },
      { question: "Has White Rabbit LA performed at country clubs and residential communities before?", answer: "Yes. Past residential and club events have included country club member nights in Beverly Hills and Pasadena, gated-community holiday galas in Calabasas and the Hollywood Hills, and luxury residential building events in Beverly Hills and Santa Monica. References from past residential clients are available on request, and the public review page on whiterabbitla.com includes specific mention of repeat residential and club bookings." },
      { question: "Can the magic be customized for community traditions or seasonal themes?", answer: "Yes. Past examples include a custom routine built around the founding year of a residential community (revealed inside an envelope passed through the audience), a Halloween residential event with a custom themed mentalism set, and an HOA anniversary gala where the names of long-tenured residents appeared on a card chosen at random. Custom themed routines require a 4-week planning window." },
    ],
    testimonial: {
      quote: "We've had Scott back three years running. The board votes to rebook him before we've even finished cleaning up. Our residents request him by name.",
      attribution: "Lifestyle Director, Los Angeles Country Club",
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

  // Review JSON-LD (per-page testimonial)
  // Skipped for the 6 new vertical pages — those pages stay at exactly 6 JSON-LD blocks
  // (3 global + 3 page: Service, BreadcrumbList, FAQPage) until real vertical-specific
  // testimonials are supplied. Re-enable per-page Review schema in a follow-up commit.
  const NEW_VERTICAL_SLUGS = new Set([
    "holiday-party-magician",
    "charity-gala-magician",
    "trade-show-magician",
    "golf-tournament-magician",
    "dmc-entertainment",
    "resident-event-magician",
  ]);
  useEffect(() => {
    if (!page?.testimonial) return;
    if (NEW_VERTICAL_SLUGS.has(page.slug)) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "service-review-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: {
        "@type": "Service",
        name: page.title,
        provider: {
          "@type": "LocalBusiness",
          "@id": "https://whiterabbitla.com/#business",
          name: "White Rabbit LA",
        },
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
      author: { "@type": "Person", name: page.testimonial.attribution },
      reviewBody: page.testimonial.quote,
    });
    document.getElementById("service-review-schema")?.remove();
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
      <SEOHead title={seoTitle} description={seoDescription} canonical={seoPath} ogImage={seoImage} />
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
                page.slug === "holiday-party-magician" ? "Holiday Parties" :
                page.slug === "charity-gala-magician" ? "Charity Galas" :
                page.slug === "trade-show-magician" ? "Trade Shows" :
                page.slug === "golf-tournament-magician" ? "Golf Tournaments" :
                page.slug === "dmc-entertainment" ? "DMC & Incentive Travel" :
                page.slug === "resident-event-magician" ? "Resident Events" :
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
