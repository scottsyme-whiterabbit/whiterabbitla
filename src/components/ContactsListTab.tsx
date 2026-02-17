import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, Flame, ThermometerSun, Snowflake, UserX, ChevronDown, ChevronUp, MousePointerClick } from "lucide-react";

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

interface ClickEvent {
  id: string;
  link_slug: string;
  drip_step: number;
  clicked_at: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clicksCache, setClicksCache] = useState<Record<string, ClickEvent[]>>({});
  const [loadingClicks, setLoadingClicks] = useState<string | null>(null);

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

  const toggleExpand = async (contactId: string) => {
    if (expandedId === contactId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(contactId);

    if (clicksCache[contactId]) return;

    setLoadingClicks(contactId);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_contact_clicks", adminPassword: storedPassword, contactId }),
      });
      if (!res.ok) throw new Error("Failed to load clicks");
      const data = await res.json();
      setClicksCache(prev => ({ ...prev, [contactId]: data.clicks || [] }));
    } catch (e) {
      console.error("Failed to load clicks:", e);
      setClicksCache(prev => ({ ...prev, [contactId]: [] }));
    } finally {
      setLoadingClicks(null);
    }
  };

  const filtered = contacts.filter(c => {
    if (filter === "unsubscribed" && c.subscribed) return false;
    if (filter === "hot" && (c.engagement_status !== "hot" || !c.subscribed)) return false;
    if (filter === "warm" && (c.engagement_status !== "warm" || !c.subscribed)) return false;
    if (filter === "new" && (c.engagement_status !== "new" || !c.subscribed)) return false;
    if (filter === "cold" && (c.engagement_status !== "cold" || !c.subscribed)) return false;

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
              <th className="w-8 p-3"></th>
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
              const isExpanded = expandedId === c.id;
              const clicks = clicksCache[c.id];
              const isLoadingThis = loadingClicks === c.id;

              return (
                <>
                  <tr
                    key={c.id}
                    onClick={() => toggleExpand(c.id)}
                    className="border-b border-border/50 hover:bg-accent/5 transition-colors cursor-pointer"
                  >
                    <td className="p-3 text-muted-foreground">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
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
                  {isExpanded && (
                    <tr key={`${c.id}-clicks`} className="border-b border-border/50">
                      <td colSpan={9} className="p-0">
                        <div className="bg-accent/5 px-6 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MousePointerClick size={14} className="text-accent" />
                            <span className="font-sans text-xs tracking-[0.15em] uppercase text-accent">Click Activity</span>
                          </div>
                          {isLoadingThis ? (
                            <p className="text-xs text-muted-foreground">Loading clicks...</p>
                          ) : clicks && clicks.length > 0 ? (
                            <div className="space-y-2">
                              {clicks.map(click => (
                                <div key={click.id} className="flex items-center gap-4 text-xs">
                                  <span className="text-muted-foreground w-32">
                                    {new Date(click.clicked_at).toLocaleDateString()} {new Date(click.clicked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  <span className="text-foreground/70 bg-border/30 px-2 py-0.5">
                                    Email #{click.drip_step}
                                  </span>
                                  <span className="text-foreground font-mono">{click.link_slug}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No clicks recorded yet.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
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