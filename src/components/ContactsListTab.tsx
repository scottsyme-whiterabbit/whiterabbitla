import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, Flame, ThermometerSun, Snowflake, UserX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  city: string | null;
  source: string | null;
  subscribed: boolean;
  drip_campaign: string;
  drip_step: number;
  engagement_status: string;
  reply_detected: boolean;
  last_emailed_at: string | null;
  created_at: string;
}

type FilterStatus = "all" | "hot" | "warm" | "new" | "cold" | "unsubscribed";

interface ContactsListTabProps {
  storedPassword: string;
  initialFilter?: FilterStatus;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Flame; colorClass: string }> = {
  hot: { label: "Hot", icon: Flame, colorClass: "bg-red-900/30 text-red-400" },
  warm: { label: "Warm", icon: ThermometerSun, colorClass: "bg-orange-900/30 text-orange-400" },
  new: { label: "New", icon: Users, colorClass: "bg-blue-900/30 text-blue-400" },
  cold: { label: "Cold", icon: Snowflake, colorClass: "bg-slate-700/30 text-slate-400" },
  unsubscribed: { label: "Unsub", icon: UserX, colorClass: "bg-red-900/20 text-red-500" },
};

const ContactsListTab = ({ storedPassword, initialFilter }: ContactsListTabProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>(initialFilter || "all");
  const [loading, setLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_contacts_full", adminPassword: storedPassword }),
      });
      if (!res.ok) throw new Error("Failed to load contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      console.error("Failed to load contacts:", e);
    } finally {
      setLoading(false);
    }
  }, [storedPassword]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const filtered = contacts.filter(c => {
    // Filter by status
    if (filter === "unsubscribed" && c.subscribed) return false;
    if (filter === "hot" && (c.engagement_status !== "hot" || !c.subscribed)) return false;
    if (filter === "warm" && (c.engagement_status !== "warm" || !c.subscribed)) return false;
    if (filter === "new" && (c.engagement_status !== "new" || !c.subscribed)) return false;
    if (filter === "cold" && (c.engagement_status !== "cold" || !c.subscribed)) return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.email.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q)) ||
        (c.company?.toLowerCase().includes(q)) ||
        (c.city?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: contacts.filter(c => c.subscribed).length,
    hot: contacts.filter(c => c.engagement_status === "hot" && c.subscribed).length,
    warm: contacts.filter(c => c.engagement_status === "warm" && c.subscribed).length,
    new: contacts.filter(c => c.engagement_status === "new" && c.subscribed).length,
    cold: contacts.filter(c => c.engagement_status === "cold" && c.subscribed).length,
    unsubscribed: contacts.filter(c => !c.subscribed).length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "hot", "warm", "new", "cold", "unsubscribed"] as FilterStatus[]).map(status => {
          const config = STATUS_CONFIG[status];
          const Icon = config?.icon || Users;
          const isActive = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex items-center gap-2 px-4 py-2 border font-sans text-xs tracking-[0.15em] uppercase transition-colors ${
                isActive
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Icon size={14} />
              {status === "all" ? "All Active" : config?.label || status}
              <span className="ml-1 opacity-60">({counts[status]})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, name, company, or city..."
          className="w-full bg-forest-dark/50 border border-border text-foreground pl-10 pr-4 py-3 font-sans text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Results Count */}
      <p className="text-xs text-muted-foreground font-sans tracking-wider">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""} found
        {loading && " · Loading..."}
      </p>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Email</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Name</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Company</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">City</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Status</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Campaign</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Step</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Last Emailed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const statusKey = !c.subscribed ? "unsubscribed" : c.engagement_status;
              const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG["new"];
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                  <td className="p-3 text-foreground font-mono text-xs">{c.email}</td>
                  <td className="p-3 text-muted-foreground">{c.name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.company || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.city || "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 inline-flex items-center gap-1 ${config.colorClass}`}>
                      {c.reply_detected && "💬 "}
                      {config.label}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{c.drip_campaign}</td>
                  <td className="p-3 text-muted-foreground text-xs">{c.drip_step}/5</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {c.last_emailed_at ? new Date(c.last_emailed_at).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {search ? "No contacts match your search." : "No contacts found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactsListTab;
