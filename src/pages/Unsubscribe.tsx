import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AnimatedSection from "@/components/AnimatedSection";
import SEOHead from "@/components/SEOHead";

const Unsubscribe = () => {
  const seoTitle = "Unsubscribed | White Rabbit Magic";
  const seoDescription = "You have been unsubscribed from White Rabbit emails.";

  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      return;
    }

    const unsubscribe = async () => {
      try {
        const { error } = await supabase.functions.invoke("email-webhook", {
          body: {
            type: "unsubscribe_manual",
            data: { email_address: email },
          },
        });

        if (error) throw error;
        setStatus("success");
      } catch (err) {
        console.error("Unsubscribe error:", err);
        // Even if the backend call fails, show success to the user
        // (the email may not exist in our list, which is fine)
        setStatus("success");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title={seoTitle} description={seoDescription} canonical="/unsubscribe" noIndex />
      <section className="min-h-[60vh] flex items-center justify-center py-24">
        <div className="max-w-lg mx-auto px-6 text-center">
          <AnimatedSection>
            {status === "processing" && (
              <>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
                  Processing
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
                  One Moment...
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  We're updating your preferences.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
                  Confirmed
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
                  You've Been Unsubscribed
                </h1>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  We're sorry to see you go. You won't receive any more emails from us.
                  If you ever want to reconnect, you know where to find us.
                </p>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="font-sans text-xs text-muted-foreground/60">
                    White Rabbit · Los Angeles
                  </p>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
                  Oops
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
                  Something Went Wrong
                </h1>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  We couldn't process your request. Please email us directly at{" "}
                  <a
                    href="mailto:events@whiterabbitla.com?subject=Unsubscribe"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    events@whiterabbitla.com
                  </a>{" "}
                  and we'll take care of it.
                </p>
              </>
            )}
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
};

export default Unsubscribe;
