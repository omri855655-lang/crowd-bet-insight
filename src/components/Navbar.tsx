import { motion } from "framer-motion";
import { TrendingUp, Activity, Users, Zap, Globe } from "lucide-react";
import { useI18n, type Lang } from "@/i18n/i18n";

export const Navbar = () => {
  const { t, lang, setLang } = useI18n();

  const links = [
    { key: "nav.dashboard", icon: Activity },
    { key: "nav.live", icon: Zap },
    { key: "nav.crowd", icon: Users },
    { key: "nav.trends", icon: TrendingUp },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 glass-card border-b border-border/50"
    >
      <div className="container flex items-center justify-between h-20">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <span className="font-display font-black text-primary-foreground text-xl">O</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-gradient-gold">OddsOracle</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{t("nav.tagline")}</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-secondary/40 rounded-full p-1.5 border border-border/40">
          {links.map((link, i) => (
            <button
              key={link.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === 0
                  ? "bg-gradient-gold text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <link.icon className="w-3.5 h-3.5" />
              {t(link.key)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/40 border border-border/40">
            {(["en", "he"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  lang === l ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "en" ? "EN" : "עב"}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-positive/10 border border-positive/20">
            <span className="w-2 h-2 rounded-full bg-positive pulse-dot" />
            <span className="text-xs font-medium text-positive tabular">{t("nav.live_count", { n: 12 })}</span>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold hover:scale-105 transition-transform">
            {t("nav.signin")}
          </button>
        </div>
      </div>
    </motion.header>
  );
};
