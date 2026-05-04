import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";

export type DiagSource = "odds" | "results" | "games_cache";

export type DiagEntry = {
  source: DiagSource;
  status: number | null;
  ok: boolean;
  message?: string;
  count?: number;
  at: number;
};

type Diagnostics = {
  entries: Record<DiagSource, DiagEntry | undefined>;
  log: (e: DiagEntry) => void;
};

const listeners = new Set<(s: Record<DiagSource, DiagEntry | undefined>) => void>();
let state: Record<DiagSource, DiagEntry | undefined> = {
  odds: undefined,
  results: undefined,
  games_cache: undefined,
};

export const diag = {
  log(e: DiagEntry) {
    state = { ...state, [e.source]: e };
    listeners.forEach((l) => l(state));
  },
  get() {
    return state;
  },
};

export const useDiagnostics = (): Diagnostics => {
  const [s, setS] = useState(state);
  useEffect(() => {
    const l = (n: typeof state) => setS(n);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { entries: s, log: diag.log };
};

const fmtAgo = (ts: number, lang: string) => {
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return lang === "he" ? `לפני ${sec} שנ׳` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return lang === "he" ? `לפני ${min} דק׳` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  return lang === "he" ? `לפני ${hr} שע׳` : `${hr}h ago`;
};

export const DiagnosticsPanel = ({ onRefresh }: { onRefresh?: () => void }) => {
  const { lang } = useI18n();
  const { entries } = useDiagnostics();
  const [, force] = useState(0);
  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  // re-render every 10s so "x seconds ago" updates
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 10000);
    return () => clearInterval(i);
  }, []);

  const rows: { key: DiagSource; label: string }[] = [
    { key: "odds", label: txt("שערים חיים (Odds API)", "Live odds (Odds API)") },
    { key: "results", label: txt("תוצאות (API-Football)", "Results (API-Football)") },
    { key: "games_cache", label: txt("מטמון משחקים (DB)", "Games cache (DB)") },
  ];

  const allOk = rows.every((r) => entries[r.key]?.ok);
  const anyError = rows.some((r) => entries[r.key] && !entries[r.key]!.ok);

  const oddsLive =
    entries.odds?.ok &&
    entries.odds.at &&
    Date.now() - entries.odds.at < 120_000 &&
    (entries.odds.count ?? 0) > 0;

  return (
    <div className="glass-card rounded-xl p-4 mb-6 border border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${allOk ? "text-emerald-400" : anyError ? "text-red-400" : "text-amber-400"}`} />
          <h3 className="text-sm font-semibold">
            {txt("סטטוס מערכת — דיאגנוסטיקה חיה", "System status — live diagnostics")}
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              oddsLive
                ? "bg-emerald-500/15 text-emerald-400 animate-pulse"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {oddsLive ? txt("שערים מתעדכנים", "ODDS LIVE") : txt("לא חי", "STALE")}
          </span>
        </div>
        {onRefresh && (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3" />
            {txt("רענן", "Refresh")}
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {rows.map((r) => {
          const e = entries[r.key];
          return (
            <div
              key={r.key}
              className="bg-muted/30 rounded-lg p-3 border border-border/40 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate">{r.label}</span>
                {e ? (
                  e.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-xs font-mono font-semibold ${
                    !e ? "text-muted-foreground" : e.ok ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {e?.status ?? "—"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {e ? fmtAgo(e.at, lang) : txt("ממתין…", "waiting…")}
                </span>
              </div>
              {e?.message && (
                <p className="text-[10px] text-muted-foreground/80 truncate" title={e.message}>
                  {typeof e.count === "number" ? `${e.count} ${txt("פריטים", "items")} · ` : ""}
                  {e.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
