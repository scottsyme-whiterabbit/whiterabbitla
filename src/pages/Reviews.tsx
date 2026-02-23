import { useEffect } from "react";
import { Star } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Link } from "react-router-dom";
import QuizCTA from "@/components/QuizCTA";
import audienceImg from "@/assets/event-audience.jpg";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useBreadcrumbSchema, useSpeakableSchema } from "@/hooks/useSchemaOrg";
import threeStars from "@/assets/three-stars-gold.png";

const reviews = [
{
  name: "Jamie I.",
  role: "Morgan Stanley, 200-Person Corporate Event",
  text: "Scott performed at a 200-person event for us this week and the guests absolutely LOVED him and were amazed by his talents. I could not recommend him more! We can't wait to have him back.",
  rating: 5
},
{
  name: "Josh T.",
  role: "Men's Group Host",
  text: "He was fantastic to work with from the moment I reached out to him through to the night of the show when he stuck around and spoke with several members of our group well after his performance was over. Scott is warm, personable, funny, energetic and an EXCELLENT magician. I can't recommend him highly enough.",
  rating: 5
},
{
  name: "Shaahin J.",
  role: "35th Birthday Celebration",
  text: "Scott & White Rabbit made my birthday one I will never forget. The show left my friends in awe — I was getting messages for two days after from friends telling me how great it was. I highly recommend!",
  rating: 5
},
{
  name: "Grace G.",
  role: "Corporate Holiday Dinner",
  text: "My company hosted a holiday dinner last Friday, and we had the pleasure of experiencing Scott's magic show. He is incredible and had the whole room captivated.",
  rating: 5
},
{
  name: "Mohammad R.",
  role: "Private Event Guest",
  text: "Saw him at a private event and absolutely crushed it!! Jaws were hitting the floor so hard the downstairs neighbors started wondering what was going down. I would recommend him!",
  rating: 5
},
{
  name: "Mostafa A.",
  role: "Birthday Celebration",
  text: "I had the absolute pleasure of having Scott perform at my birthday celebration, and he completely stole the show!",
  rating: 5
},
{
  name: "Zara M.",
  role: "Private Party",
  text: "Scott was so amazing. He elevated our party in ways I didn't expect, and he was everyone's favorite part. Absolutely worth it.",
  rating: 5
},
{
  name: "Andres O.",
  role: "Black Tie Event",
  text: "We had Scott perform magic for a black tie event recently. Scott absolutely did an amazing job engaging with everyone.",
  rating: 5
},
{
  name: "Taylor R.",
  role: "Corporate Holiday Party",
  text: "Scott put on an amazing show at our Holiday Christmas Party, all the guests loved him and were blown away from his tricks and magic! 2nd year in a row hiring him and he knocks it out of the park both times!",
  rating: 5
},
{
  name: "Tim C.",
  role: "Company Holiday Luncheon",
  text: "Scott is an amazing magician. We had him showcase his skills at a company holiday luncheon. He is a true professional.",
  rating: 5
},
{
  name: "Jose F.",
  role: "White Rabbit Show Guest",
  text: "White Rabbit is an absolute gem! The atmosphere is magical, with an ambiance that instantly transports you.",
  rating: 5
},
{
  name: "Chris R.",
  role: "Private Event",
  text: "Scott is a great entertainer that does an excellent job customizing the performance to the specific space and event.",
  rating: 5
},
{
  name: "Kenneth R.",
  role: "Private Show Guest",
  text: "Scott takes a unique and personalized approach to his craft! I don't want to give anything away so all I can say is BOOK WHITE RABBIT! You won't regret it.",
  rating: 5
},
{
  name: "Erik F.",
  role: "Private Event Guest",
  text: "Had an incredible experience at one of their events with some friends. Syme time is amazing and brings the whole crowd into his magical orbit. Highly recommend!",
  rating: 5
},
{
  name: "Kyle L.",
  role: "Private Event Host",
  text: "One of the most entertaining magicians I have seen! Had the pleasure of hiring him for a private event and was amazing.",
  rating: 5
},
{
  name: "Will C.",
  role: "Private Event",
  text: "Excellent Experience! Don't even hesitate! Scott is amazing and our guests were very impressed. Thanks again!",
  rating: 5
},
{
  name: "Jennie",
  role: "Private Show Guest",
  text: "Scott is a tremendously talented magician whose sleight of hand mastery is unmatched. He has a funny and charming personality that makes every moment enjoyable.",
  rating: 5
},
{
  name: "Ana A.",
  role: "Birthday Slumber Party",
  text: "Amazing! Scott came over to make some magic during my birthday slumber party with my 6 best friends. We had the best time.",
  rating: 5
},
{
  name: "Heather C.",
  role: "Show Attendee",
  text: "Absolutely amazing show! Would highly recommend! Everyone was blown away by every trick!",
  rating: 5
}];


const Reviews = () => {
  usePageMeta({
    title: "Client Reviews | White Rabbit Magic — 5-Star Rated Los Angeles Magician",
    description: "Read 50+ five-star reviews from corporate planners, brides, and private event hosts. See why White Rabbit is LA's most trusted luxury magic entertainment.",
    path: "/reviews",
    image: audienceImg,
  });
  useBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Reviews", path: "/reviews" }]);
  useSpeakableSchema({ name: "Client Reviews", path: "/reviews" });

  // Inject AggregateRating + individual Review schema for Google rich results
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "reviews-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://whiterabbitla.com/#business",
      name: "White Rabbit LA",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        bestRating: "5",
        ratingCount: String(reviews.length),
        reviewCount: String(reviews.length),
      },
      review: reviews.map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
        },
        author: { "@type": "Person", name: r.name },
        reviewBody: r.text,
      })),
    });
    document.getElementById("reviews-schema")?.remove();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={audienceImg} alt="Audience reacting to Scott Syme White Rabbit magic show at a luxury event in Los Angeles" className="w-full h-full object-cover" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-forest-dark/70" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pb-16 pt-32">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Testimonials</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              What They Say
            </h1>
             <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
               They came for the magic. They stayed for the feeling. Hear from guests who left feeling truly alive.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Branded divider */}
      <div className="flex justify-center py-8">
        <img src={threeStars} alt="" aria-hidden="true" className="h-12 w-auto opacity-50" />
      </div>

      {/* Reviews Grid */}
      <section className="py-24 pt-0">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) =>
            <AnimatedSection key={index} delay={index * 0.1}>
                <div className="bg-card border border-border p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) =>
                  <Star key={i} size={16} className="fill-accent text-accent" />
                  )}
                  </div>
                  <blockquote className="font-serif text-lg text-card-foreground leading-relaxed flex-grow mb-6">
                    "{review.text}"
                  </blockquote>
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="font-sans text-xs text-muted-foreground tracking-wider uppercase">{review.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Leave a Review CTA */}
          <div className="text-center mt-16 mb-4">
            <img src={threeStars} alt="" aria-hidden="true" className="h-11 w-auto opacity-50 mx-auto mb-6" />
            <p className="font-serif text-2xl text-foreground mb-3">Experienced the Magic?</p>
            <p className="font-sans text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Your words help others discover the wonder. We'd love to hear about your experience.
            </p>
            <a
              href="/review"
              className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              <Star size={16} className="fill-current" />
              Leave a Google Review
            </a>
          </div>

          {/* Testimonials Disclaimer */}
          <p className="font-sans text-[10px] text-muted-foreground/40 text-center mt-12 max-w-xl mx-auto leading-relaxed">
            Individual experiences may vary. Testimonials reflect the personal opinions of verified clients and do not constitute a guarantee of similar results. All reviews are authentic and unedited.
          </p>
        </div>
      </section>

      {/* Quiz CTA */}
      <QuizCTA title="Still Wondering If Magic Is Right for You?" />

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark pt-24 pb-24 text-center mb-12">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-6">Let's Make Some Magic</h2>
            <p className="font-sans text-base text-cream/70 mb-10">
              Ready to create your own unforgettable moment?
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors">
              Book Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>);

};

export default Reviews;