import { motion } from "framer-motion";
import { Flame, TrendingUp, Users } from "lucide-react";
import { games, type Game } from "@/data/mockData";

const formatMoney = (k: number) => k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}K`;

const CrowdBar = ({ game }: { game: Game }) => {
  const total = game.crowdMoney.home + (game.crowdMoney.draw ?? 0) + game.crowdMoney.away;
  const homePct = (game.crowdMoney.home / total) * 100;
  const drawPct = ((game.crowdMoney.draw ?? 0) / total) * 100;
  const awayPct = (game.crowdMoney.away / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Crowd money split</span>
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

const GameCard = ({ game, index }: { game: Game; index: number }) => {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
            {game.league}
          </span>
          {game.trending && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary">
              <Flame className="w-2.5 h-2.5" /> HOT
            </span>
          )}
        </div>
        {game.status === "live" ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-negative/10">
            <span className="w-1.5 h-1.5 rounded-full bg-negative pulse-dot" />
            <span className="text-[10px] font-bold text-negative tabular">{game.liveScore?.minute}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground tabular">{game.startTime}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{game.homeFlag}</div>
          <div className="font-display font-semibold text-sm">{game.homeTeam}</div>
          {game.liveScore && (
            <div className="font-display text-2xl font-bold text-foreground tabular mt-1">{game.liveScore.home}</div>
          )}
        </div>
        <div className="px-3 text-muted-foreground font-display text-xs">VS</div>
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{game.awayFlag}</div>
          <div className="font-display font-semibold text-sm">{game.awayTeam}</div>
          {game.liveScore && (
            <div className="font-display text-2xl font-bold text-foreground tabular mt-1">{game.liveScore.away}</div>
          )}
        </div>
      </div>

      {/* Best odds */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-transparent hover:border-primary/30 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Best Home</span>
          <span className="font-display text-xl font-bold text-foreground tabular mt-0.5">{bestHome.toFixed(2)}</span>
        </button>
        <button className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-transparent hover:border-primary/30 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Best Away</span>
          <span className="font-display text-xl font-bold text-foreground tabular mt-0.5">{bestAway.toFixed(2)}</span>
        </button>
      </div>

      {/* Crowd bar */}
      <CrowdBar game={game} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span className="tabular">{game.userReports.toLocaleString()} bets</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <TrendingUp className="w-3 h-3" />
          <span className="tabular font-semibold">${game.totalVolume}M vol</span>
        </div>
      </div>
    </motion.div>
  );
};

export const LiveGamesBoard = () => {
  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Live Board</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            What the world is <span className="italic text-gradient-gold">betting on</span>
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {["All", "Football", "NBA", "Tennis", "NFL"].map((s, i) => (
            <button
              key={s}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === 0
                  ? "bg-foreground text-background"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
    </section>
  );
};
