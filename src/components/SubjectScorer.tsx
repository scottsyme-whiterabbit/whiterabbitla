import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ScoreResult {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  spamRisk: string;
}

interface Props {
  subjectLine: string;
  storedPassword: string;
  onUseSuggestion: (subject: string) => void;
}

const SubjectScorer = ({ subjectLine, storedPassword, onUseSuggestion }: Props) => {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);

  const handleScore = async () => {
    if (!subjectLine.trim()) {
      toast.error("Enter a subject line first");
      return;
    }
    setScoring(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/score-subject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ subjectLine, adminPassword: storedPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scoring failed");
      }
      setResult(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  };

  const gradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-400";
    if (grade.startsWith("B")) return "text-yellow-400";
    if (grade.startsWith("C")) return "text-orange-400";
    return "text-red-400";
  };

  const spamIcon = (risk: string) => {
    if (risk === "low") return <CheckCircle size={14} className="text-green-400" />;
    if (risk === "medium") return <AlertTriangle size={14} className="text-yellow-400" />;
    return <AlertTriangle size={14} className="text-red-400" />;
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleScore}
        disabled={scoring || !subjectLine.trim()}
        className="flex items-center gap-2 text-xs font-sans tracking-wider uppercase text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
      >
        <Sparkles size={14} />
        {scoring ? "Scoring..." : "AI Score Subject Line"}
      </button>

      {result && (
        <div className="border border-border p-4 space-y-3 bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`font-serif text-3xl ${gradeColor(result.grade)}`}>{result.grade}</span>
              <span className="font-sans text-sm text-muted-foreground">{result.score}/100</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
              <Shield size={12} />
              Spam Risk: <span className="capitalize">{result.spamRisk}</span> {spamIcon(result.spamRisk)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-sans text-[10px] tracking-wider uppercase text-green-400 mb-1">Strengths</p>
              <ul className="space-y-0.5">
                {result.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-wider uppercase text-orange-400 mb-1">Improve</p>
              <ul className="space-y-0.5">
                {result.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] tracking-wider uppercase text-accent mb-1">Suggestions</p>
            <div className="space-y-1">
              {result.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onUseSuggestion(s)}
                  className="block w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 hover:bg-accent/10"
                >
                  "{s}" <span className="text-[10px] text-accent ml-1">→ use this</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectScorer;
