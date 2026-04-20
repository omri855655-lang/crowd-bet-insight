import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { stats } from "@/data/mockData";
import { useI18n } from "@/i18n/i18n";

export const Hero = () => {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="container relative pt-20 pb-16 md:pt-32 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide text-foreground/80">{t("hero.badge")}</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            {t("hero.title1")} <span className="text-gradient-gold italic">{t("hero.title2")}</span><br />
            {t("hero.title3")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:scale-105 transition-transform">
              {t("hero.cta1")}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button className="px-7 py-3.5 rounded-full glass-card text-foreground font-semibold hover:bg-secondary/60 transition-colors">
              {t("hero.cta2")}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden glass-card max-w-5xl mx-auto"
        >
          {[
            { label: t("stats.volume"), value: `$${stats.totalVolume24h}M`, change: `+${stats.volumeChange}%` },
            { label: t("stats.bets"), value: stats.activeBets.toLocaleString(), change: `+${stats.betsChange}%` },
            { label: t("stats.live"), value: stats.liveGames, change: t("stats.now") },
            { label: t("stats.bettors"), value: `${(stats.totalUsers / 1000).toFixed(1)}K`, change: "+2.1%" },
          ].map((s, i) => (
            <div key={i} className="p-6 md:p-8 bg-card/60">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{s.label}</div>
              <div className="font-display text-3xl md:text-4xl font-bold text-foreground tabular">{s.value}</div>
              <div className="text-xs text-positive font-medium mt-2 tabular">{s.change}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
