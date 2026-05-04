import { useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlayCircle,
  History,
  ChevronDown,
  ChevronUp,
  Download,
  FileJson,
  FileSpreadsheet,
  Plug,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";
import { toast } from "sonner";

export type DiagSource = "odds" | "results" | "games_cache";

export type DiagEntry = {
  source: DiagSource;
  status: number | null;
  ok: boolean;
  message?: string;
  count?: number;
  bodySnippet?: string;
  at: number;
};

const HISTORY_KEY = "diag_history_v1";
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_THRESHOLD_MS = 120_000;

const loadHistory = (): DiagEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DiagEntry[];
    const cutoff = Date.now() - HISTORY_WINDOW_MS;
    return arr.filter((e) => e.at >= cutoff);
  } catch {
    return [];
  }
};

const listeners = new Set<(s: Record<DiagSource, DiagEntry | undefined>) => void>();
const historyListeners = new Set<(h: DiagEntry[]) => void>();

let state: Record<DiagSource, DiagEntry | undefined> = {
  odds: undefined,
  results: undefined,
  games_cache: undefined,
};
let history: DiagEntry[] = typeof window !== "undefined" ? loadHistory() : [];

const persistHistory = () => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-200)));
  } catch {
    /* ignore */
  }
};

export const diag = {
  log(e: DiagEntry) {
    state = { ...state, [e.source]: e };
    const cutoff = Date.now() - HISTORY_WINDOW_MS;
    history = [...history.filter((x) => x.at >= cutoff), e].slice(-200);
    persistHistory();
    listeners.forEach((l) => l(state));
    historyListeners.forEach((l) => l(history));
  },
  get() {
    return state;
  },
  getHistory() {
    return history;
  },
};

export const useDiagnostics = () => {
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

const useHistory = () => {
  const [h, setH] = useState(history);
  useEffect(() => {
    const l = (n: DiagEntry[]) => setH([...n]);
    historyListeners.add(l);
    return () => {
      historyListeners.delete(l);
    };
  }, []);
  return h;
};

const fmtAgo = (ts: number, lang: string) => {
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return lang === "he" ? `לפני ${sec} שנ׳` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return lang === "he" ? `לפני ${min} דק׳` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  return lang === "he" ? `לפני ${hr} שע׳` : `${hr}h ago`;
};

const fmtTime = (ts: number, lang: string) =>
  new Date(ts).toLocaleTimeString(lang === "he" ? "he-IL" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const SOURCE_LABEL: Record<DiagSource, { he: string; en: string }> = {
  odds: { he: "שערים", en: "Odds" },
  results: { he: "תוצאות", en: "Results" },
  games_cache: { he: "מטמון", en: "Cache" },
};

export const DiagnosticsPanel = ({ onRefresh }: { onRefresh?: () => void }) => {
  const { lang } = useI18n();
  const { entries } = useDiagnostics();
  const hist = useHistory();
  const [, force] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [testing, setTesting] = useState(false);
  const lastAlertRef = useRef<number>(0);
  const lastOddsAtRef = useRef<number | null>(null);
  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  // re-render every 10s so "x seconds ago" updates
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 10000);
    return () => clearInterval(i);
  }, []);

  // Stale-odds notification monitor
  useEffect(() => {
    const check = () => {
      const e = entries.odds;
      if (!e) return;
      const stale = !e.ok || Date.now() - e.at > STALE_THRESHOLD_MS;
      if (stale && Date.now() - lastAlertRef.current > 5 * 60_000) {
        lastAlertRef.current = Date.now();
        toast.warning(
          txt("השערים החיים לא מתעדכנים", "Live odds stopped updating"),
          {
            description: txt(
              `אין רענון מעל 2 דקות. סטטוס אחרון: ${e.status ?? "—"}`,
              `No refresh for >2 minutes. Last status: ${e.status ?? "—"}`
            ),
            duration: 8000,
          }
        );
      }
      lastOddsAtRef.current = e.at;
    };
    const i = setInterval(check, 30_000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.odds, lang]);

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
    Date.now() - entries.odds.at < STALE_THRESHOLD_MS &&
    (entries.odds.count ?? 0) > 0;

  const runTests = async () => {
    setTesting(true);
    toast.info(txt("מריץ בדיקות…", "Running tests…"));
    const base = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    // Test odds
    try {
      const t0 = Date.now();
      const r = await fetch(
        `${base}/functions/v1/fetch-odds?sport=soccer_epl&markets=h2h`,
        { headers }
      );
      const text = await r.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
      diag.log({
        source: "odds",
        status: r.status,
        ok: r.ok && parsed?.success !== false,
        count: Array.isArray(parsed?.games) ? parsed.games.length : undefined,
        message: `manual test · ${Date.now() - t0}ms · ${parsed?.error || "ok"}`,
        bodySnippet: text.slice(0, 240),
        at: Date.now(),
      });
    } catch (e) {
      diag.log({
        source: "odds",
        status: null,
        ok: false,
        message: `manual test failed: ${e instanceof Error ? e.message : "error"}`,
        at: Date.now(),
      });
    }

    // Test results
    try {
      const t0 = Date.now();
      const r = await fetch(`${base}/functions/v1/fetch-daily-results`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ sport: "Soccer" }),
      });
      const text = await r.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
      diag.log({
        source: "results",
        status: r.status,
        ok: r.ok && !parsed?.error,
        count: Array.isArray(parsed?.games) ? parsed.games.length : undefined,
        message: `manual test · ${Date.now() - t0}ms · ${parsed?.error || parsed?.details?.access || "ok"}`,
        bodySnippet: text.slice(0, 240),
        at: Date.now(),
      });
    } catch (e) {
      diag.log({
        source: "results",
        status: null,
        ok: false,
        message: `manual test failed: ${e instanceof Error ? e.message : "error"}`,
        at: Date.now(),
      });
    }

    setTesting(false);
    toast.success(txt("בדיקות הסתיימו", "Tests completed"));
  };

  const triggerDownload = (content: string, mime: string, ext: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `diagnostics-${stamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      windowHours: 24,
      current: entries,
      history: hist,
    };
    triggerDownload(JSON.stringify(payload, null, 2), "application/json", "json");
    toast.success(txt("ייצוא JSON הושלם", "Exported as JSON"));
  };

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = v === undefined || v === null ? "" : String(v);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const header = ["timestamp_iso", "source", "status", "ok", "count", "message", "body_snippet"];
    const lines = [header.join(",")];
    hist.forEach((e) => {
      lines.push(
        [
          new Date(e.at).toISOString(),
          e.source,
          e.status ?? "",
          e.ok ? "true" : "false",
          e.count ?? "",
          e.message ?? "",
          e.bodySnippet ?? "",
        ]
          .map(esc)
          .join(",")
      );
    });
    (Object.keys(entries) as DiagSource[]).forEach((k) => {
      const e = entries[k];
      if (!e) return;
      lines.push(
        [
          new Date(e.at).toISOString() + " (current)",
          e.source,
          e.status ?? "",
          e.ok ? "true" : "false",
          e.count ?? "",
          e.message ?? "",
          e.bodySnippet ?? "",
        ]
          .map(esc)
          .join(",")
      );
    });
    triggerDownload("\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8", "csv");
    toast.success(txt("ייצוא CSV הושלם", "Exported as CSV"));
  };

  const reconnect = async () => {
    toast.info(txt("מתחבר מחדש…", "Reconnecting…"));
    try {
      await supabase.removeAllChannels();
      const ch = supabase.channel(`diag-reconnect-${Date.now()}`);
      await new Promise<void>((resolve) => {
        ch.subscribe((status) => {
          if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            resolve();
          }
        });
        setTimeout(resolve, 3000);
      });
      window.dispatchEvent(new CustomEvent("diag:reconnect"));
      onRefresh?.();
      diag.log({
        source: "games_cache",
        status: 200,
        ok: true,
        message: "realtime reconnected",
        at: Date.now(),
      });
      toast.success(txt("חיבור חודש", "Reconnected"));
    } catch (e) {
      diag.log({
        source: "games_cache",
        status: null,
        ok: false,
        message: `reconnect failed: ${e instanceof Error ? e.message : "error"}`,
        at: Date.now(),
      });
      toast.error(txt("החיבור נכשל", "Reconnect failed"));
    }
  };

  const reversedHistory = [...hist].reverse();

  return (
    <div className="glass-card rounded-xl p-4 mb-6 border border-border/60">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity
            className={`w-4 h-4 ${
              allOk ? "text-emerald-400" : anyError ? "text-red-400" : "text-amber-400"
            }`}
          />
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
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={runTests}
            disabled={testing}
          >
            <PlayCircle className={`w-3 h-3 ${testing ? "animate-pulse" : ""}`} />
            {txt("בדוק APIs", "Test APIs")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="w-3 h-3" />
            {txt("היסטוריה", "History")} ({hist.length})
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                disabled={hist.length === 0}
              >
                <Download className="w-3 h-3" />
                {txt("ייצוא", "Export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={exportJson} className="text-xs gap-2">
                <FileJson className="w-3.5 h-3.5" />
                {txt("הורד JSON", "Download JSON")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv} className="text-xs gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {txt("הורד CSV", "Download CSV")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={reconnect}
          >
            <Plug className="w-3 h-3" />
            {txt("התחבר מחדש", "Reconnect")}
          </Button>
          {onRefresh && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onRefresh}>
              <RefreshCw className="w-3 h-3" />
              {txt("רענן", "Refresh")}
            </Button>
          )}
        </div>
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
              {e?.bodySnippet && (
                <details className="mt-1">
                  <summary className="text-[10px] text-primary cursor-pointer hover:underline">
                    {txt("גוף תגובה", "Response body")}
                  </summary>
                  <pre className="text-[9px] mt-1 p-1.5 bg-background/60 rounded border border-border/40 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                    {e.bodySnippet}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {showHistory && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              {txt("ציר זמן (24 שעות אחרונות)", "Timeline (last 24h)")}
            </h4>
            <span className="text-[10px] text-muted-foreground">
              {hist.length} {txt("אירועים", "events")}
            </span>
          </div>
          {reversedHistory.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              {txt("אין אירועים עדיין", "No events yet")}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {reversedHistory.map((e, i) => (
                <div
                  key={`${e.at}-${i}`}
                  className="flex items-start gap-2 text-[10px] py-1 px-2 rounded bg-muted/20 hover:bg-muted/40 transition border border-transparent hover:border-border/40"
                >
                  <span className="font-mono text-muted-foreground shrink-0 w-16">
                    {fmtTime(e.at, lang)}
                  </span>
                  <span className="shrink-0 w-12 text-muted-foreground">
                    {SOURCE_LABEL[e.source][lang as "he" | "en"]}
                  </span>
                  <span
                    className={`shrink-0 font-mono font-semibold w-8 ${
                      e.ok ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {e.status ?? "—"}
                  </span>
                  {e.ok ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-muted-foreground/80 truncate flex-1" title={e.message}>
                    {typeof e.count === "number" ? `[${e.count}] ` : ""}
                    {e.message || (e.ok ? "ok" : "error")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
