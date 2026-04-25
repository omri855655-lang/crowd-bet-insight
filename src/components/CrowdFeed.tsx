import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { recentUserBets } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ReportBetDialog } from "@/components/ReportBetDialog";
import { ArrowUpRight } from "lucide-react";

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

export const CrowdFeed = () => {
  const { t, lang } = useI18n();
  const [bets, setBets] = useState<FeedBet[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  const load = async () => {
    const { data: betsData } = await supabase
      .from("bets")
      .select("id, bet_on, amount, odds, currency, bookmaker, home_team, away_team, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(15);

    if (betsData && betsData.length > 0) {
      // Fetch profiles separately
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
        }))
      );
      setUsingMock(true);
    }
  };

  useEffect(() => {
    load();
    // realtime subscription
    const channel = supabase
      .channel("bets-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bets" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
              { v: `${bets.length}`, l: lang === "he" ? "הימורים בפיד" : "in feed" },
              { v: `$${bets.reduce((s, b) => s + b.amount, 0).toLocaleString()}`, l: lang === "he" ? "מחזור" : "Volume" },
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
          <AnimatePresence>
            {bets.map((bet, i) => (
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">@{bet.user}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{bet.bookmaker}</span>
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

          {bets.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
              {lang === "he" ? "אין הימורים עדיין. תהיה הראשון!" : "No bets yet. Be the first!"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
