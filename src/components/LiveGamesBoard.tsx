import { motion } from "framer-motion";
import { Flame, TrendingUp, Users, Loader2, AlertCircle } from "lucide-react";
import { games as mockGames, type Game } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";
import { useRealOdds } from "@/hooks/useRealOdds";
import { buildGameKey } from "@/hooks/useCrowdGameSummaries";
import { type MarketIntelligenceSummary, useMarketIntelligenceSummaries } from "@/hooks/useMarketIntelligenceSummaries";
import { useMemo, useState } from "react";

const formatMoney = (k: number) => k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k.toFixed(0)}K`;

const toThousands = (amount: number) => Math.round(amount / 1000);

const toMillions = (amount: number) => +(amount / 1_000_000).toFixed(2);

const CrowdBar = ({ game }: { game: Game }) => {
  const { t } = useI18n();
  const total = game.crowdMoney.home + (game.crowdMoney.draw ?? 0) + game.crowdMoney.away;
  const homePct = (game.crowdMoney.home / total) * 100;
  const drawPct = ((game.crowdMoney.draw ?? 0) / total) * 100;
  const awayPct = (game.crowdMoney.away / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{t("card.crowd_split")}</span>
        <span className="text-primary tabular">{formatMoney(total)}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
        <div className="bg-gradient-to-r from-positive to-positive/70 transition-all" style={{ width: `${homePct}%` }} />
        {drawPct > 0 && <div className="bg-neutral/60" style={{ width: `${drawPct}%` }} />}
        <div className="bg-gradient-to-r from-primary/80 to-primary transition-all" style={{ width: `${awayPct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] tabular">
        <span className="text-positive font-semibold">{homePct.toFixed(0)}%</span>
        {drawPct > 0 && <span className="text-muted-foreground">{drawPct.toFixed(0)}%</span>}
        <span className="text-primary font-semibold">{awayPct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

const MarketVsCrowd = ({ game }: { game: Game }) => {
  if (!game.marketConsensus) return null;

  return (
    <div className="mt-3 rounded-xl bg-secondary/50 px-3 py-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Crowd vs Market</span>
        <span className="font-semibold text-primary">{game.marketConsensus.provider}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 tabular">
        <span className="text-positive">
          Crowd {Math.round(game.crowdMoney.home / Math.max(game.crowdMoney.home + (game.crowdMoney.draw ?? 0) + game.crowdMoney.away, 1) * 100)}%
        </span>
        <span className="text-muted-foreground">Market {game.marketConsensus.homePct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

const GameCard = ({ game, index }: { game: Game; index: number }) => {
  const { t } = useI18n();
  const bestHome = Math.max(...Object.values(game.odds).map((o) => o.home));
  const bestAway = Math.max(...Object.values(game.odds).map((o) => o.away));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors shadow-card-premium"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium truncate max-w-[140px]">
            {game.league}
          </span>
          {game.trending && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary">
              <Flame className="w-2.5 h-2.5" /> {t("card.hot")}
            </span>
          )}
        </div>
        {game.status === "live" ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-negative/10">
            <span className="w-1.5 h-1.5 rounded-full bg-negative pulse-dot" />
            <span className="text-[10px] font-bold text-negative tabular">{game.liveScore?.minute}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground tabular truncate max-w-[120px]">{game.startTime}</span>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 text-center min-w-0">
          <div className="text-3xl mb-1">{game.homeFlag}</div>
          <div className="font-display font-semibold text-sm truncate px-1">{game.homeTeam}</div>
          {game.liveScore && (
            <div className="font-display text-2xl font-bold text-foreground tabular mt-1">{game.liveScore.home}</div>
          )}
        </div>
        <div className="px-3 text-muted-foreground font-display text-xs">{t("card.vs")}</div>
        <div className="flex-1 text-center min-w-0">
          <div className="text-3xl mb-1">{game.awayFlag}</div>
          <div className="font-display font-semibold text-sm truncate px-1">{game.awayTeam}</div>
          {game.liveScore && (
            <div className="font-display text-2xl font-bold text-foreground tabular mt-1">{game.liveScore.away}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <button className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-transparent hover:border-primary/30 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("card.best_home")}</span>
          <span className="font-display text-xl font-bold text-foreground tabular mt-0.5">{bestHome.toFixed(2)}</span>
        </button>
        <button className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-transparent hover:border-primary/30 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("card.best_away")}</span>
          <span className="font-display text-xl font-bold text-foreground tabular mt-0.5">{bestAway.toFixed(2)}</span>
        </button>
      </div>

      <CrowdBar game={game} />
      <MarketVsCrowd game={game} />

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span className="tabular">{t("card.bets", { n: game.userReports.toLocaleString() })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <TrendingUp className="w-3 h-3" />
          <span className="tabular font-semibold">{t("card.vol", { n: game.totalVolume })}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Convert real odds API game to our Game shape (with fake crowd data)
const enrichRealGame = (
  real: import("@/hooks/useRealOdds").RealGame,
  idx: number,
  summary?: MarketIntelligenceSummary
): Game => {
  const oddsValues = Object.values(real.bookmakers);
  const pricedBooks = oddsValues.filter((book) => typeof book.home === "number" && typeof book.away === "number");
  const avgHome =
    pricedBooks.reduce((sum, book) => sum + (book.home ?? 0), 0) / Math.max(pricedBooks.length, 1);
  const avgAway =
    pricedBooks.reduce((sum, book) => sum + (book.away ?? 0), 0) / Math.max(pricedBooks.length, 1);

  const homeWeight = avgHome > 0 ? 1 / avgHome : 1;
  const awayWeight = avgAway > 0 ? 1 / avgAway : 1;
  const totalWeight = homeWeight + awayWeight;
  const fallbackTotalMoney = 800 + idx * 170;
  const fallbackHome = Math.round((homeWeight / totalWeight) * fallbackTotalMoney);
  const fallbackAway = Math.round((awayWeight / totalWeight) * fallbackTotalMoney);
  const homeAmount = summary ? toThousands(summary.home_amount) : fallbackHome;
  const awayAmount = summary ? toThousands(summary.away_amount) : fallbackAway;
  const drawAmount = summary && summary.draw_amount > 0 ? toThousands(summary.draw_amount) : undefined;
  const reportCount = summary?.report_count ?? Math.floor(500 + idx * 250);
  const totalVolume = summary ? toMillions(summary.total_amount) : +(5 + idx * 1.8).toFixed(1);

  const startDate = new Date(real.startTime);
  const formatted = startDate.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: real.id,
    sport: "Football" as any,
    league: real.league,
    homeTeam: real.homeTeam,
    awayTeam: real.awayTeam,
    homeFlag: ["⚪", "🔵", "🔴", "🟡", "🟢"][idx % 5],
    awayFlag: ["🔴", "⚫", "🟠", "🟣", "🟤"][idx % 5],
    startTime: formatted,
    status: "upcoming" as const,
    odds: real.bookmakers,
    crowdMoney: {
      home: homeAmount,
      draw: drawAmount,
      away: awayAmount,
    },
    userReports: reportCount,
    totalVolume,
    trending: idx < 2,
    marketConsensus:
      summary?.market_provider && summary.home_money_pct != null && summary.away_money_pct != null
        ? {
            provider: summary.market_provider,
            homePct: summary.home_money_pct,
            awayPct: summary.away_money_pct,
            drawPct: summary.draw_money_pct ?? undefined,
          }
        : undefined,
  };
};

export const LiveGamesBoard = () => {
  const { t } = useI18n();
  const [useReal, setUseReal] = useState(true);
  const { games: realGames, loading, error } = useRealOdds("upcoming");
  const { summaries } = useMarketIntelligenceSummaries();

  const displayGames = useMemo<Game[]>(() => {
    if (useReal && realGames.length > 0) {
      const summaryMap = new Map(
        summaries.map((summary) => [
          buildGameKey(
            summary.sport ?? "",
            summary.league ?? "",
            summary.home_team ?? "",
            summary.away_team ?? ""
          ),
          summary,
        ])
      );

      return realGames.map((g, i) => {
        const summary = summaryMap.get(buildGameKey(g.sport, g.league, g.homeTeam, g.awayTeam));
        return enrichRealGame(g, i, summary);
      }).slice(0, 6);
    }
    return mockGames;
  }, [useReal, realGames, summaries]);

  const isLive = useReal && realGames.length > 0 && !error;

  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">{t("board.eyebrow")}</span>
            {isLive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive/15 text-positive text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-positive pulse-dot" />
                {t("board.real")}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                {t("board.demo")}
              </span>
            )}
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            {t("board.title1")} <span className="italic text-gradient-gold">{t("board.title2")}</span>
          </h2>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {t("board.loading")}
        </div>
      )}

      {error && !loading && (
        <div className="glass-card rounded-2xl p-5 mb-6 flex items-start gap-3 border-negative/30">
          <AlertCircle className="w-5 h-5 text-negative shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold mb-1">Falling back to demo data</div>
            <div className="text-muted-foreground text-xs">{error}</div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayGames.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};
