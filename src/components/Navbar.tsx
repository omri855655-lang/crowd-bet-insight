import { motion } from "framer-motion";
import { TrendingUp, Activity, Users, Zap, LogOut, User as UserIcon, Crown } from "lucide-react";
import { useI18n, type Lang } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const Navbar = () => {
  const { t, lang, setLang } = useI18n();
  const { user, subscription, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { key: "nav.dashboard", icon: Activity, href: "#" },
    { key: "nav.live", icon: Zap, href: "#results" },
    { key: "nav.crowd", icon: Users, href: "#feed" },
    { key: "nav.trends", icon: TrendingUp, href: "#ai" },
  ];

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 glass-card border-b border-border/50"
    >
      <div className="container flex items-center justify-between h-20 gap-4">
        <a href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <span className="font-display font-black text-primary-foreground text-xl">O</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-gradient-gold">OddsOracle</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{t("nav.tagline")}</span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-1 bg-secondary/40 rounded-full p-1.5 border border-border/40">
          {links.map((link, i) => (
            <a
              key={link.key}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === 0
                  ? "bg-gradient-gold text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <link.icon className="w-3.5 h-3.5" />
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/40 border border-border/40">
            {(["en", "he"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-label={`Switch to ${l}`}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  lang === l ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "en" ? "EN" : "עב"}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {subscription?.isPro && (
                <Badge className="hidden sm:flex bg-gradient-gold text-primary-foreground gap-1">
                  <Crown className="w-3 h-3" />
                  {subscription.tier === "pro"
                    ? "Pro"
                    : txt(`ניסיון: ${subscription.trialDaysLeft}י׳`, `Trial: ${subscription.trialDaysLeft}d`)}
                </Badge>
              )}
              <button
                onClick={signOut}
                aria-label={txt("התנתק", "Sign out")}
                className="p-2 rounded-full bg-secondary/40 border border-border/40 hover:text-primary"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              {t("nav.signin")}
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

