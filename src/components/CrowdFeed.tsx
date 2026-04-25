import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { recentUserBets } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ReportBetDialog } from "@/components/ReportBetDialog";
import { ArrowUpRight, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FeedBet = {
  id: string;
  user: string;
  avatar: string;
  bookmaker: string;
  pick: string;
  game: string;
  amount: number;
  odds: number;
  timeAgo: string;
  currency: string;
  sport: string;
  league: string;
  createdAt: string;
};

const timeAgo = (date: string, lang: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "he" ? "עכשיו" : "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const avatarFor = (name: string) => {
  const emojis = ["⚽", "🏀", "🎯", "🔥", "💎", "🚀", "⭐", "🎲", "🏆", "💰"];
  const i = name.charCodeAt(0) % emojis.length;
  return emojis[i];
};

type TimeRange = "all" | "1h" | "24h" | "7d" | "30d";

export const CrowdFeed = () => {
  const { t, lang } = useI18n();
  const [bets, setBets] = useState<FeedBet[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  // Filters
  const [sport, setSport] = useState<string>("all");
  const [league, setLeague] = useState<string>("all");
  const [matchQuery, setMatchQuery] = useState<string>("");
  const [range, setRange] = useState<TimeRange>("all");

  const load = async () => {
    const { data: betsData } = await supabase
      .from("bets")
      .select("id, bet_on, amount, odds, currency, bookmaker, home_team, away_team, created_at, user_id, sport, league")
      .order("created_at", { ascending: false })
      .limit(50);

    if (betsData && betsData.length > 0) {
      const userIds = [...new Set(betsData.map((b: any) => b.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.display_name]));

      const mapped: FeedBet[] = betsData.map((b: any) => {
        const name = nameMap.get(b.user_id) || "anon";
        return {
          id: b.id,
          user: name,
          avatar: avatarFor(name),
          bookmaker: b.bookmaker,
          pick: b.bet_on,
          game: `${b.home_team} vs ${b.away_team}`,
          amount: Number(b.amount),
          odds: Number(b.odds || 0),
          timeAgo: timeAgo(b.created_at, lang),
          currency: b.currency,
          sport: b.sport || "Other",
          league: b.league || "—",
          createdAt: b.created_at,
        };
      });
      setBets(mapped);
      setUsingMock(false);
    } else {
      setBets(
        recentUserBets.map((b) => ({
          id: String(b.id),
          user: b.user,
          avatar: b.avatar,
          bookmaker: b.bookmaker,
          pick: b.pick,
          game: b.game,
          amount: b.amount,
          odds: b.odds,
          timeAgo: b.timeAgo,
          currency: "USD",
          sport: (b as any).sport || "Soccer",
          league: (b as any).league || "—",
          createdAt: new Date(Date.now() - b.id * 60000).toISOString(),
        }))
      );
      setUsingMock(true);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("bets-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bets" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const sports = useMemo(
    () => Array.from(new Set(bets.map((b) => b.sport).filter(Boolean))).sort(),
    [bets]
  );
  const leagues = useMemo(
    () =>
      Array.from(
        new Set(
          bets
            .filter((b) => sport === "all" || b.sport === sport)
            .map((b) => b.league)
            .filter((l) => l && l !== "—")
        )
      ).sort(),
    [bets, sport]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs: Record<TimeRange, number> = {
      all: Infinity,
      "1h": 3600_000,
      "24h": 86_400_000,
      "7d": 7 * 86_400_000,
      "30d": 30 * 86_400_000,
    };
    const q = matchQuery.trim().toLowerCase();
    return bets.filter((b) => {
      if (sport !== "all" && b.sport !== sport) return false;
      if (league !== "all" && b.league !== league) return false;
      if (q && !b.game.toLowerCase().includes(q)) return false;
      if (range !== "all" && now - new Date(b.createdAt).getTime() > rangeMs[range]) return false;
      return true;
    });
  }, [bets, sport, league, matchQuery, range]);

  const activeCount =
    (sport !== "all" ? 1 : 0) +
    (league !== "all" ? 1 : 0) +
    (matchQuery.trim() ? 1 : 0) +
    (range !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSport("all");
    setLeague("all");
    setMatchQuery("");
    setRange("all");
  };

  const currencySymbol = (c: string) =>
    c === "ILS" ? "₪" : c === "EUR" ? "€" : c === "GBP" ? "£" : "$";

  return (
    <section className="container py-16 md:py-24" id="feed">
      <div className="grid lg:grid-cols-5 gap-10 items-start">
        <div className="lg:col-span-2 lg:sticky lg:top-28">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
            {t("feed.eyebrow")}
            {!usingMock && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-positive/20 text-positive font-bold">
                LIVE
              </span>
            )}
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
            {t("feed.title1")} <br />
            <span className="italic text-gradient-gold">{t("feed.title2")}</span><br />
            {t("feed.title3")}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{t("feed.desc")}</p>

          <ReportBetDialog
            trigger={
              <button className="group flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold hover:scale-105 transition-transform">
                {t("feed.cta")}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            }
          />

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { v: `${filtered.length}`, l: lang === "he" ? "תוצאות" : "Results" },
              { v: `$${filtered.reduce((s, b) => s + b.amount, 0).toLocaleString()}`, l: lang === "he" ? "מחזור" : "Volume" },
              { v: usingMock ? "DEMO" : "LIVE", l: lang === "he" ? "סטטוס" : "Status" },
            ].map((s) => (
              <div key={s.l} className="glass-card rounded-xl p-4 text-center">
                <div className="font-display text-xl font-bold text-gradient-gold tabular">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          {/* Filters bar */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="w-4 h-4 text-primary" />
                {lang === "he" ? "סינון" : "Filters"}
                {activeCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                    {activeCount}
                  </span>
                )}
              </div>
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {lang === "he" ? "נקה" : "Clear"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={sport} onValueChange={(v) => { setSport(v); setLeague("all"); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={lang === "he" ? "ספורט" : "Sport"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">{lang === "he" ? "כל הספורט" : "All sports"}</SelectItem>
                  {sports.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={league} onValueChange={setLeague}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={lang === "he" ? "ליגה" : "League"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">{lang === "he" ? "כל הליגות" : "All leagues"}</SelectItem>
                  {leagues.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={lang === "he" ? "טווח זמן" : "Time"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">{lang === "he" ? "כל הזמן" : "All time"}</SelectItem>
                  <SelectItem value="1h">{lang === "he" ? "שעה אחרונה" : "Last hour"}</SelectItem>
                  <SelectItem value="24h">{lang === "he" ? "24 שעות" : "Last 24h"}</SelectItem>
                  <SelectItem value="7d">{lang === "he" ? "7 ימים" : "Last 7 days"}</SelectItem>
                  <SelectItem value="30d">{lang === "he" ? "30 ימים" : "Last 30 days"}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={matchQuery}
                onChange={(e) => setMatchQuery(e.target.value)}
                placeholder={lang === "he" ? "חפש משחק..." : "Search match..."}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <AnimatePresence>
            {filtered.map((bet, i) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.5) }}
                whileHover={{ x: 4 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:border-primary/30 transition-colors shadow-card-premium"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-xl shrink-0 shadow-gold">
                  {bet.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">@{bet.user}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{bet.bookmaker}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{bet.sport}</span>
                    {bet.league !== "—" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{bet.league}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground tabular ms-auto">{bet.timeAgo} {t("feed.ago")}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {t("feed.bet_on")} <span className="text-foreground font-semibold">{bet.pick}</span> · {bet.game}
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <div className="font-display text-xl font-bold text-foreground tabular">
                    {currencySymbol(bet.currency)}{bet.amount.toLocaleString()}
                  </div>
                  {bet.odds > 0 && (
                    <div className="text-[11px] text-primary tabular font-semibold">@ {bet.odds.toFixed(2)}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
              {bets.length === 0
                ? (lang === "he" ? "אין הימורים עדיין. תהיה הראשון!" : "No bets yet. Be the first!")
                : (lang === "he" ? "אין תוצאות לסינון הנוכחי" : "No results for current filters")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
