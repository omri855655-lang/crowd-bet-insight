// Internationalization: Hebrew + English
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "he";

type Dict = Record<string, { en: string; he: string }>;

export const translations: Dict = {
  // Navbar
  "nav.dashboard": { en: "Dashboard", he: "דשבורד" },
  "nav.live": { en: "Live", he: "חי" },
  "nav.crowd": { en: "Crowd", he: "ההמון" },
  "nav.trends": { en: "Trends", he: "מגמות" },
  "nav.signin": { en: "Sign In", he: "התחבר" },
  "nav.tagline": { en: "Crowd Wisdom · Premium", he: "חכמת ההמונים · פרימיום" },
  "nav.live_count": { en: "LIVE · {n}", he: "חי · {n}" },

  // Hero
  "hero.badge": { en: "Powered by 124,800+ bettors worldwide", he: "מופעל על ידי 124,800+ מהמרים מכל העולם" },
  "hero.title1": { en: "Where the", he: "כאן הכסף" },
  "hero.title2": { en: "smart money", he: "החכם" },
  "hero.title3": { en: "actually moves.", he: "באמת זז." },
  "hero.subtitle": {
    en: "Real-time odds from Winner, Bet365, Pinnacle and more — overlaid with what the crowd is actually betting. See where every dollar goes.",
    he: "יחסים בזמן אמת מ-Winner, Bet365, Pinnacle ועוד — בשילוב עם מה שההמון באמת מהמר עליו. תראה לאן כל דולר הולך."
  },
  "hero.cta1": { en: "Explore live games", he: "גלה משחקים חיים" },
  "hero.cta2": { en: "Report your bet", he: "דווח על ההימור שלך" },
  "stats.volume": { en: "24h Volume", he: "מחזור 24 שעות" },
  "stats.bets": { en: "Active Bets", he: "הימורים פעילים" },
  "stats.live": { en: "Live Games", he: "משחקים חיים" },
  "stats.bettors": { en: "Bettors", he: "מהמרים" },
  "stats.now": { en: "now", he: "עכשיו" },

  // Live Board
  "board.eyebrow": { en: "Live Board", he: "לוח חי" },
  "board.title1": { en: "What the world is", he: "על מה העולם" },
  "board.title2": { en: "betting on", he: "מהמר" },
  "board.real": { en: "REAL", he: "אמיתי" },
  "board.demo": { en: "DEMO", he: "דמו" },
  "board.loading": { en: "Loading live odds...", he: "טוען יחסים חיים..." },
  "card.hot": { en: "HOT", he: "חם" },
  "card.crowd_split": { en: "Crowd money split", he: "חלוקת כסף ההמון" },
  "card.best_home": { en: "Best Home", he: "הטוב ביותר - בית" },
  "card.best_away": { en: "Best Away", he: "הטוב ביותר - חוץ" },
  "card.bets": { en: "{n} bets", he: "{n} הימורים" },
  "card.vol": { en: "${n}M vol", he: "${n}M מחזור" },
  "card.vs": { en: "VS", he: "נגד" },
  "card.live": { en: "LIVE", he: "חי" },

  // Odds Comparison
  "odds.eyebrow": { en: "Odds comparison", he: "השוואת יחסים" },
  "odds.title1": { en: "Six bookmakers.", he: "שישה בוקמייקרים." },
  "odds.title2": { en: "One winner.", he: "מנצח אחד." },
  "odds.subtitle": {
    en: "Always shop for the best line. Highlighted in gold = best available odds for that outcome.",
    he: "תמיד חפש את היחס הטוב ביותר. בזהב = היחס הזמין הטוב ביותר לתוצאה."
  },
  "odds.bookmaker": { en: "Bookmaker", he: "בוקמייקר" },
  "odds.draw": { en: "Draw", he: "תיקו" },
  "odds.region": { en: "Region", he: "אזור" },
  "odds.local_fav": { en: "★ Local favourite", he: "★ מועדף ישראלי" },
  "odds.total_vol": { en: "Total volume", he: "מחזור כולל" },
  "odds.diff_note": {
    en: "💡 Best price difference: +9.5% on this outcome between bookmakers",
    he: "💡 הפרש המחיר הטוב ביותר: +9.5% בין בוקמייקרים"
  },

  // Crowd Wisdom
  "wisdom.eyebrow": { en: "Crowd Wisdom", he: "חכמת ההמונים" },
  "wisdom.title1": { en: "The collective is", he: "הקולקטיב" },
  "wisdom.title2": { en: "smarter", he: "חכם יותר" },
  "wisdom.title3": { en: "than any single bookie.", he: "מכל בוקי בודד." },
  "wisdom.volume_title": { en: "24h global volume", he: "מחזור גלובלי 24 שעות" },
  "wisdom.volume_sub": { en: "Aggregated across all bookmakers + user reports", he: "מצטבר מכל הבוקמייקרים + דיווחי משתמשים" },
  "wisdom.vs_yesterday": { en: "vs yesterday", he: "מול אתמול" },
  "wisdom.sport_split": { en: "Sport split", he: "חלוקה לפי ספורט" },
  "wisdom.by_volume": { en: "By 24h volume", he: "לפי מחזור 24 שעות" },
  "wisdom.flow_title": { en: "Money flow per matchup", he: "זרימת כסף לכל משחק" },
  "wisdom.flow_sub": { en: "Where the crowd is actually putting their money (in $K)", he: "לאן ההמון באמת שם את הכסף (ב-$K)" },
  "wisdom.home": { en: "Home", he: "בית" },
  "wisdom.away": { en: "Away", he: "חוץ" },

  // Crowd Feed
  "feed.eyebrow": { en: "Live crowd feed", he: "פיד חי של ההמון" },
  "feed.title1": { en: "Real bettors.", he: "מהמרים אמיתיים." },
  "feed.title2": { en: "Real money.", he: "כסף אמיתי." },
  "feed.title3": { en: "Real time.", he: "זמן אמת." },
  "feed.desc": {
    en: "Every reported bet feeds the crowd intelligence. See where the smart money is flowing from Winner, Bet365, and others — within seconds of the click.",
    he: "כל הימור שמדווח מזין את חכמת ההמונים. תראה לאן הכסף החכם זורם מ-Winner, Bet365 ואחרים — תוך שניות."
  },
  "feed.cta": { en: "Report your bet", he: "דווח על ההימור שלך" },
  "feed.bets_hr": { en: "Bets / hr", he: "הימורים/שעה" },
  "feed.vol_hr": { en: "Volume / hr", he: "מחזור/שעה" },
  "feed.verified": { en: "Verified", he: "מאומת" },
  "feed.bet_on": { en: "Bet on", he: "הימור על" },
  "feed.ago": { en: "ago", he: "לפני" },
  "feed.load_more": { en: "Load more bets ↓", he: "טען עוד הימורים ↓" },

  // Footer
  "footer.copy": { en: "© 2025 · Crowd-powered insights", he: "© 2025 · תובנות מבוססות המון" },
  "footer.about": { en: "About", he: "אודות" },
  "footer.responsible": { en: "Responsible gambling", he: "הימור אחראי" },
  "footer.terms": { en: "Terms", he: "תנאים" },
  "footer.disclaimer": {
    en: "OddsOracle is a statistics & analytics platform. We do not accept or place bets. Gambling involves risk — please play responsibly. 18+ only.",
    he: "OddsOracle הוא פלטפורמת סטטיסטיקה ואנליטיקה. אנחנו לא מקבלים ולא מבצעים הימורים. הימורים כרוכים בסיכון — שחק באחריות. גיל 18+ בלבד."
  },
};

type I18nContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const Ctx = createContext<I18nContext | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    return (stored as Lang) || "en";
  });

  const dir = lang === "he" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("lang", lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const entry = translations[key];
    let str = entry ? entry[lang] : key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
