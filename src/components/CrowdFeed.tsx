import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { recentUserBets } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";

export const CrowdFeed = () => {
  const { t } = useI18n();
  return (
    <section className="container py-16 md:py-24">
      <div className="grid lg:grid-cols-5 gap-10 items-start">
        <div className="lg:col-span-2 lg:sticky lg:top-28">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("feed.eyebrow")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
            {t("feed.title1")} <br />
            <span className="italic text-gradient-gold">{t("feed.title2")}</span><br />
            {t("feed.title3")}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{t("feed.desc")}</p>
          <button className="group flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold hover:scale-105 transition-transform">
            {t("feed.cta")}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { v: "5.8K", l: t("feed.bets_hr") },
              { v: "$2.4M", l: t("feed.vol_hr") },
              { v: "94%", l: t("feed.verified") },
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
            {recentUserBets.map((bet, i) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
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
                  <div className="font-display text-xl font-bold text-foreground tabular">${bet.amount.toLocaleString()}</div>
                  <div className="text-[11px] text-primary tabular font-semibold">@ {bet.odds.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button className="w-full py-4 glass-card rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors">
            {t("feed.load_more")}
          </button>
        </div>
      </div>
    </section>
  );
};
