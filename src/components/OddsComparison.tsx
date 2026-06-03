import { motion } from "framer-motion";
import { games, bookmakers } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";

export const OddsComparison = () => {
  const { t } = useI18n();
  const game = games[0];

  const bestHome = Math.max(...Object.values(game.odds).map((o) => o.home));
  const bestDraw = Math.max(...Object.values(game.odds).map((o) => o.draw ?? 0));
  const bestAway = Math.max(...Object.values(game.odds).map((o) => o.away));

  return (
    <section className="container py-16 md:py-24">
      <div className="text-center mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("odds.eyebrow")}</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
          {t("odds.title1")} <span className="italic text-gradient-gold">{t("odds.title2")}</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">{t("odds.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card rounded-2xl overflow-hidden shadow-elevated"
      >
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{game.homeFlag}</div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-0.5">{game.league}</div>
                <div className="font-display text-2xl font-bold">
                  {game.homeTeam} <span className="text-muted-foreground text-base">{t("card.vs").toLowerCase()}</span> {game.awayTeam}
                </div>
                <div className="text-xs text-muted-foreground mt-1 tabular">{game.startTime}</div>
              </div>
              <div className="text-3xl">{game.awayFlag}</div>
            </div>
            <div className="text-end">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("odds.total_vol")}</div>
              <div className="font-display text-2xl font-bold text-gradient-gold tabular">${game.totalVolume}M</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-start text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold py-4 px-6">
                  {t("odds.bookmaker")}
                </th>
                <th className="text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold py-4 px-4">
                  {game.homeTeam}
                </th>
                <th className="text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold py-4 px-4">
                  {t("odds.draw")}
                </th>
                <th className="text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold py-4 px-4">
                  {game.awayTeam}
                </th>
                <th className="text-end text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold py-4 px-6">
                  {t("odds.region")}
                </th>
              </tr>
            </thead>
            <tbody>
              {bookmakers.map((bm, i) => {
                const o = game.odds[bm.id];
                if (!o) return null;
                const isWinner = bm.id === "winner";
                return (
                  <motion.tr
                    key={bm.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={`border-b border-border/30 hover:bg-secondary/30 transition-colors ${isWinner ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{bm.logo}</span>
                        <div>
                          <div className="font-semibold text-sm">{bm.name}</div>
                          {isWinner && <div className="text-[10px] text-primary font-semibold">{t("odds.local_fav")}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <OddCell value={o.home} isBest={o.home === bestHome} />
                    </td>
                    <td className="text-center py-4 px-4">
                      <OddCell value={o.draw} isBest={o.draw === bestDraw && bestDraw > 0} />
                    </td>
                    <td className="text-center py-4 px-4">
                      <OddCell value={o.away} isBest={o.away === bestAway} />
                    </td>
                    <td className="text-end py-4 px-6">
                      <span className="text-xs text-muted-foreground">{bm.region}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-secondary/20 border-t border-border/50 text-center text-xs text-muted-foreground">
          {t("odds.diff_note")}
        </div>
      </motion.div>
    </section>
  );
};

const OddCell = ({ value, isBest }: { value?: number; isBest: boolean }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-block min-w-[60px] py-1.5 px-3 rounded-lg font-display text-base font-bold tabular ${
        isBest ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-foreground"
      }`}
    >
      {value.toFixed(2)}
    </span>
  );
};
