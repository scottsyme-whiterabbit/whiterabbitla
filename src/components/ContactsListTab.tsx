import { useState, useEffect, useCallback } from "react";
import { Search, Users, Flame, ThermometerSun, Snowflake, UserX, ChevronDown, ChevronUp, MousePointerClick, Eye, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface OpenEvent {
  id: string;
  drip_step: number;
  opened_at: string;
  user_agent: string | null;
}

type FilterStatus = "all" | "hot" | "warm" | "new" | "cold" | "unsubscribed" | "opened";
type CampaignFilter = "all" | "planner" | "resident" | "corporate" | "wedding" | "clubs" | "pr" | "nonprofit" | "talent";

interface ContactsListTabProps {
  storedPassword: string;
  initialFilter?: FilterStatus;
  initialCampaign?: CampaignFilter;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Flame; colorClass: string }> = {
  hot: { label: "Hot", icon: Flame, colorClass: "bg-red-900/30 text-red-400" },
  warm: { label: "Warm", icon: ThermometerSun, colorClass: "bg-orange-900/30 text-orange-400" },
  new: { label: "New", icon: Users, colorClass: "bg-blue-900/30 text-blue-400" },
  cold: { label: "Cold", icon: Snowflake, colorClass: "bg-slate-700/30 text-slate-400" },
  unsubscribed: { label: "Unsub", icon: UserX, colorClass: "bg-red-900/20 text-red-500" },
  opened: { label: "Opened", icon: Eye, colorClass: "bg-emerald-900/30 text-emerald-400" },
};

const TOTAL_STEPS = 5;

const DripTimeline = ({ currentStep, campaign, opens, clicks }: {
  currentStep: number;
  campaign: string;
  opens?: OpenEvent[];
  clicks?: ClickEvent[];
}) => {
  const openedSteps = new Set(opens?.map(o => o.drip_step) || []);
  const clickedSteps = new Set(clicks?.map(c => c.drip_step) || []);

  return (
    <div className="flex items-center gap-1" title={`${campaign} · Step ${currentStep}/${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isSent = step <= currentStep;
        const isOpened = openedSteps.has(step);
        const isClicked = clickedSteps.has(step);

        let dotClass = "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-sans font-bold transition-all ";
        if (isClicked) {
          dotClass += "bg-accent border-accent text-accent-foreground";
        } else if (isOpened) {
          dotClass += "bg-accent/30 border-accent text-accent";
        } else if (isSent) {
          dotClass += "bg-muted border-border text-muted-foreground";
        } else {
          dotClass += "border-border/40 text-border/40";
        }

        return (
          <div key={step} className="flex items-center">
            <div className={dotClass} title={
              isClicked ? `Step ${step}: Clicked` :
              isOpened ? `Step ${step}: Opened` :
              isSent ? `Step ${step}: Sent` :
              `Step ${step}: Pending`
            }>
              {step}
            </div>
            {step < TOTAL_STEPS && (
              <div className={`w-2 h-px ${isSent ? "bg-muted-foreground/30" : "bg-border/20"}`} />
            )}
          </div>
        );
      })}
      <span className="ml-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
        {campaign === "planner" ? "P" : "A"}
      </span>
    </div>
  );
};
const ContactsListTab = ({ storedPassword, initialFilter, initialCampaign }: ContactsListTabProps) => {

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>(initialFilter || "all");
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>(initialCampaign || "all");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clicksCache, setClicksCache] = useState<Record<string, ClickEvent[]>>({});
  const [opensCache, setOpensCache] = useState<Record<string, OpenEvent[]>>({});
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<"opens" | "clicks">("opens");
  const [openedContactIds, setOpenedContactIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const loadOpenedIds = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "get_opened_contact_ids", adminPassword: storedPassword }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setOpenedContactIds(new Set(data.contactIds || []));
    } catch (_e) { /* skip */ }
  }, [storedPassword]);

  useEffect(() => {
    loadContacts();
    loadOpenedIds();
  }, [loadContacts, loadOpenedIds]);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (initialCampaign) setCampaignFilter(initialCampaign);
  }, [initialCampaign]);

  const toggleExpand = async (contactId: string) => {
    if (expandedId === contactId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(contactId);

    if (clicksCache[contactId] && opensCache[contactId]) return;

    setLoadingActivity(contactId);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_contact_clicks", adminPassword: storedPassword, contactId }),
      });
      if (!res.ok) throw new Error("Failed to load activity");
      const data = await res.json();
      setClicksCache(prev => ({ ...prev, [contactId]: data.clicks || [] }));
      setOpensCache(prev => ({ ...prev, [contactId]: data.opens || [] }));
    } catch (e) {
      console.error("Failed to load activity:", e);
      setClicksCache(prev => ({ ...prev, [contactId]: [] }));
      setOpensCache(prev => ({ ...prev, [contactId]: [] }));
    } finally {
      setLoadingActivity(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "delete_contact", adminPassword: storedPassword, contactId: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error("Failed to delete contact:", e);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = contacts.filter(c => {
    // Campaign filter
    if (campaignFilter === "planner" && !c.drip_campaign.startsWith("planner")) return false;
    if (campaignFilter === "resident" && !c.drip_campaign.startsWith("resident")) return false;

    if (filter === "unsubscribed" && c.subscribed) return false;
    if (filter === "hot" && (c.engagement_status !== "hot" || !c.subscribed)) return false;
    if (filter === "warm" && (c.engagement_status !== "warm" || !c.subscribed)) return false;
    if (filter === "new" && (c.engagement_status !== "new" || !c.subscribed)) return false;
    if (filter === "cold" && (c.engagement_status !== "cold" || !c.subscribed)) return false;
    if (filter === "opened" && !openedContactIds.has(c.id)) return false;

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
    opened: contacts.filter(c => openedContactIds.has(c.id)).length,
  };

  // Dedupe opens by drip_step (show unique opens only)
  const getUniqueOpens = (opens: OpenEvent[]) => {
    const seen = new Set<string>();
    return opens.filter(o => {
      const key = `${o.drip_step}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return (
    <>
    <div className="space-y-6">
      {/* Campaign Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: "all" as CampaignFilter, label: "All Campaigns" },
          { key: "planner" as CampaignFilter, label: "Planner" },
          { key: "resident" as CampaignFilter, label: "Apartment" },
          { key: "corporate" as CampaignFilter, label: "Corporate" },
          { key: "wedding" as CampaignFilter, label: "Wedding" },
          { key: "clubs" as CampaignFilter, label: "Clubs" },
          { key: "pr" as CampaignFilter, label: "PR" },
          { key: "nonprofit" as CampaignFilter, label: "Nonprofit" },
          { key: "talent" as CampaignFilter, label: "Talent" },
        ]).map(cf => (
          <button
            key={cf.key}
            onClick={() => setCampaignFilter(cf.key)}
            className={`px-4 py-2 border font-sans text-xs tracking-[0.15em] uppercase transition-colors ${
              campaignFilter === cf.key
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {cf.label}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "hot", "warm", "new", "cold", "unsubscribed", "opened"] as FilterStatus[]).map(status => {
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
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Tag</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Status</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground min-w-[180px]">Drip Progress</th>
              <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Last Emailed</th>
              <th className="w-10 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const statusKey = !c.subscribed ? "unsubscribed" : c.engagement_status;
              const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG["new"];
              const isExpanded = expandedId === c.id;
              const clicks = clicksCache[c.id];
              const opens = opensCache[c.id];
              const isLoadingThis = loadingActivity === c.id;

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
                    <td className="p-3 text-muted-foreground text-xs">{c.city || "—"}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 font-sans tracking-[0.15em] uppercase ${
                        c.drip_campaign.startsWith("planner")
                          ? "bg-violet-900/30 text-violet-400 border border-violet-500/30"
                          : c.drip_campaign.startsWith("resident")
                          ? "bg-sky-900/30 text-sky-400 border border-sky-500/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {c.drip_campaign.startsWith("planner") ? "Planner" : c.drip_campaign.startsWith("resident") ? "Apartment" : c.drip_campaign}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 inline-flex items-center gap-1 ${config.colorClass}`}>
                        {c.reply_detected && "💬 "}
                        {config.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <DripTimeline
                        currentStep={c.drip_step}
                        campaign={c.drip_campaign}
                        opens={opensCache[c.id]}
                        clicks={clicksCache[c.id]}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {c.last_emailed_at ? new Date(c.last_emailed_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${c.id}-activity`} className="border-b border-border/50">
                      <td colSpan={10} className="p-0">
                        <div className="bg-accent/5 px-6 py-4">
                          {/* Activity tabs */}
                          <div className="flex gap-4 mb-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActivityTab("opens"); }}
                              className={`flex items-center gap-1.5 font-sans text-xs tracking-[0.15em] uppercase transition-colors ${
                                activityTab === "opens" ? "text-accent" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Eye size={14} />
                              Opens {opens ? `(${getUniqueOpens(opens).length})` : ""}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActivityTab("clicks"); }}
                              className={`flex items-center gap-1.5 font-sans text-xs tracking-[0.15em] uppercase transition-colors ${
                                activityTab === "clicks" ? "text-accent" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <MousePointerClick size={14} />
                              Clicks {clicks ? `(${clicks.length})` : ""}
                            </button>
                          </div>

                          {isLoadingThis ? (
                            <p className="text-xs text-muted-foreground">Loading activity...</p>
                          ) : activityTab === "opens" ? (
                            opens && getUniqueOpens(opens).length > 0 ? (
                              <div className="space-y-2">
                                {getUniqueOpens(opens).map(open => (
                                  <div key={open.id} className="flex items-center gap-4 text-xs">
                                    <span className="text-muted-foreground w-32">
                                      {new Date(open.opened_at).toLocaleDateString()} {new Date(open.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="text-foreground/70 bg-border/30 px-2 py-0.5">
                                      Email #{open.drip_step}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No opens recorded yet.</p>
                            )
                          ) : (
                            clicks && clicks.length > 0 ? (
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
                            )
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
                <td colSpan={10} className="p-8 text-center text-muted-foreground">
                  {search ? "No contacts match your search." : "No contacts found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Delete Confirmation */}
    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete <strong>{deleteTarget?.email}</strong>? This removes all their activity data (opens, clicks, send history) and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ContactsListTab;