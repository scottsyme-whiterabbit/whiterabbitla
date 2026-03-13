import { useState, useEffect, useCallback } from "react";
import ShowCalendar from "@/components/ShowCalendar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface BookingsTabProps {
  adminPassword: string;
  onOpenDeal?: (dealId: string) => void;
}

const BookingsTab = ({ adminPassword, onOpenDeal }: BookingsTabProps) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ password: adminPassword, action: "list_deals" }),
      });
      const data = await res.json();
      if (data.deals) setDeals(data.deals);
    } catch (err) {
      console.error("Failed to fetch deals for calendar:", err);
    } finally {
      setLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-sans text-sm text-muted-foreground tracking-wider uppercase animate-pulse">Loading calendar…</p>
      </div>
    );
  }

  return <ShowCalendar deals={deals} onOpenDeal={onOpenDeal} />;
};

export default BookingsTab;
