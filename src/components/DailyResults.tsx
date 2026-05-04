import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/i18n";
import { Calendar, Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiagnosticsPanel, diag } from "@/components/DiagnosticsPanel";

type Game = {
  id: string;
  external_id: string;
  sport: string;
  league: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  starts_at: string | null;
};

type OddsGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: Record<string, {
    title: string;
    markets: {
      h2h?: { home?: number; draw?: number; away?: number };
      totals?: Record<string, { over?: number; under?: number }>;
      spreads?: Record<string, { point: number; price: number }>;
      btts?: { yes?: number; no?: number };
    };
  }>;
  bestOdds: {
    h2h: { home: number; draw: number; away: number };
    btts: { yes: number; no: number };
  };
};

const SPORTS = ["Soccer", "Basketball", "American Football", "Tennis"];
const SPORT_TO_ODDS_KEY: Record<string, string> = {
  Soccer: "soccer_epl",
  Basketball: "basketball_nba",
  "American Football": "americanfootball_nfl",
  Tennis: "tennis_atp_aus_open_singles",
};

export const DailyResults = () => {
  const { lang, t } = useI18n();
  const [games, setGames] = useState<Game[]>([]);
  const [oddsMap, setOddsMap] = useState<Map<string, OddsGame>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("Soccer");
  const [usingMock, setUsingMock] = useState(false);

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  const fetchOdds = async (sport: string) => {
    try {
      const sportKey = SPORT_TO_ODDS_KEY[sport] || "soccer_epl";
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds?sport=${sportKey}&markets=h2h,totals,spreads,btts`;
      const res = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const j = await res.json();
      if (j?.success && Array.isArray(j.games)) {
        const m = new Map<string, OddsGame>();
        j.games.forEach((g: OddsGame) => {
          const key = `${g.homeTeam}|${g.awayTeam}`.toLowerCase();
          m.set(key, g);
        });
        setOddsMap(m);
        diag.log({
          source: "odds",
          status: res.status,
          ok: true,
          count: j.games.length,
          message: `${j.games.length} games · quota left: ${j?.quota?.remaining ?? "?"}`,
          at: Date.now(),
        });
      } else {
        setOddsMap(new Map());
        diag.log({
          source: "odds",
          status: res.status,
          ok: false,
          message: j?.error || "no games returned",
          at: Date.now(),
        });
      }
    } catch (err) {
      setOddsMap(new Map());
      diag.log({
        source: "odds",
        status: null,
        ok: false,
        message: err instanceof Error ? err.message : "network error",
        at: Date.now(),
      });
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("fetch-daily-results", {
        body: { sport: activeSport },
      }).catch(() => null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data } = await supabase
        .from("games_cache")
        .select("*")
        .eq("sport", activeSport)
        .gte("starts_at", today.toISOString())
        .lte("starts_at", tomorrow.toISOString())
        .order("starts_at", { ascending: true })
        .limit(20);

      if (data && data.length > 0) {
        setGames(data as Game[]);
        setUsingMock(false);
      } else {
        setGames(getMockGames(activeSport));
        setUsingMock(true);
      }

      // Always try to fetch odds for the active sport
      fetchOdds(activeSport);
    } catch {
      setGames(getMockGames(activeSport));
      setUsingMock(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSport]);

  const findOdds = (g: Game): OddsGame | undefined => {
    const key = `${g.home_team}|${g.away_team}`.toLowerCase();
    if (oddsMap.has(key)) return oddsMap.get(key);
    // fuzzy match
    for (const [k, v] of oddsMap) {
      if (k.includes(g.home_team.toLowerCase().split(" ")[0]) &&
          k.includes(g.away_team.toLowerCase().split(" ")[0])) {
        return v;
      }
    }
    return undefined;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border" id="results">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-widest mb-3">
            <Calendar className="w-4 h-4" />
            {txt("תוצאות + שערים חיים", "Live results + odds")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
            {txt("כל המשחקים וההימורים", "Every game & every market")}{" "}
            <span className="text-gradient-gold">{txt("של היום", "today")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            {txt(
              "תוצאות חיות + השערים הטובים ביותר לכל שוק: 1X2, מעל/מתחת, הנדיקאפ, שתי הקבוצות יבקיעו ועוד.",
              "Live scores + best odds across every market: 1X2, Over/Under, Handicap, BTTS and more."
            )}
            {usingMock && (
              <span className="block text-xs text-amber-500/80 mt-1">
                ⚠ {txt("מציג נתוני דמו", "Showing demo data")}
              </span>
            )}
          </p>
        </div>

        <Tabs value={activeSport} onValueChange={setActiveSport}>
          <TabsList className="mx-auto flex justify-center mb-8 flex-wrap h-auto">
            {SPORTS.map((s) => (
              <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeSport}>
            {loading ? (
              <div className="text-center text-muted-foreground py-10">{t("board.loading")}</div>
            ) : games.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                {txt("אין משחקים היום בספורט הזה", "No games today in this sport")}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((g) => (
                  <GameCard key={g.id} game={g} odds={findOdds(g)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const GameCard = ({ game, odds }: { game: Game; odds?: OddsGame }) => {
  const { lang } = useI18n();
  const status = game.status || "scheduled";
  const isLive = status === "live" || status === "in_progress";
  const isFinished = status === "finished" || status === "ft";

  return (
    <div className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase truncate">{game.league || game.sport}</span>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${
            isLive
              ? "bg-red-500/20 text-red-400 animate-pulse"
              : isFinished
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isLive ? "LIVE" : isFinished ? (lang === "he" ? "סיום" : "FT") : (lang === "he" ? "מתוכנן" : "SCHED")}
        </span>
      </div>

      <div className="space-y-2">
        <Row team={game.home_team} score={game.home_score} winner={isFinished && (game.home_score ?? 0) > (game.away_score ?? 0)} />
        <Row team={game.away_team} score={game.away_score} winner={isFinished && (game.away_score ?? 0) > (game.home_score ?? 0)} />
      </div>

      {/* Quick best odds */}
      {odds?.bestOdds?.h2h && (odds.bestOdds.h2h.home > 0 || odds.bestOdds.h2h.away > 0) && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-primary uppercase tracking-wider mb-2">
            <TrendingUp className="w-3 h-3" />
            {lang === "he" ? "שערים מובילים" : "Best odds"}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <OddsChip label="1" value={odds.bestOdds.h2h.home} />
            {odds.bestOdds.h2h.draw > 0 && <OddsChip label="X" value={odds.bestOdds.h2h.draw} />}
            <OddsChip label="2" value={odds.bestOdds.h2h.away} />
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {game.starts_at &&
            new Date(game.starts_at).toLocaleTimeString(lang === "he" ? "he-IL" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </span>
        {odds && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                {lang === "he" ? "כל השווקים" : "All markets"}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {game.home_team} vs {game.away_team}
                </DialogTitle>
              </DialogHeader>
              <MarketsView odds={odds} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

const OddsChip = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-muted/40 hover:bg-primary/10 transition rounded-md px-2 py-1.5 text-center cursor-pointer border border-border/50">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <div className="text-sm font-semibold tabular">{value > 0 ? value.toFixed(2) : "—"}</div>
  </div>
);

const MarketsView = ({ odds }: { odds: OddsGame }) => {
  const { lang } = useI18n();
  const txt = (he: string, en: string) => (lang === "he" ? he : en);
  const bookmakers = Object.entries(odds.bookmakers);

  if (bookmakers.length === 0) {
    return <div className="text-sm text-muted-foreground">{txt("אין נתוני שערים זמינים", "No odds available")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 1X2 Market */}
      <MarketSection title={txt("תוצאת משחק (1X2)", "Match Winner (1X2)")}>
        <div className="space-y-1.5">
          {bookmakers.map(([key, bm]) => bm.markets.h2h && (
            <BookmakerRow
              key={key}
              name={bm.title}
              cells={[
                { label: "1", value: bm.markets.h2h.home },
                { label: "X", value: bm.markets.h2h.draw },
                { label: "2", value: bm.markets.h2h.away },
              ]}
            />
          ))}
        </div>
      </MarketSection>

      {/* Totals */}
      {bookmakers.some(([, bm]) => bm.markets.totals) && (
        <MarketSection title={txt("מעל / מתחת (סה\"כ גולים)", "Over / Under (Totals)")}>
          <div className="space-y-1.5">
            {bookmakers.map(([key, bm]) => {
              if (!bm.markets.totals) return null;
              const lines = Object.entries(bm.markets.totals);
              return lines.map(([point, vals]) => (
                <BookmakerRow
                  key={`${key}-${point}`}
                  name={`${bm.title} (${point})`}
                  cells={[
                    { label: `O${point}`, value: vals.over },
                    { label: `U${point}`, value: vals.under },
                  ]}
                />
              ));
            })}
          </div>
        </MarketSection>
      )}

      {/* Spreads / Handicap */}
      {bookmakers.some(([, bm]) => bm.markets.spreads) && (
        <MarketSection title={txt("הנדיקאפ", "Handicap (Spreads)")}>
          <div className="space-y-1.5">
            {bookmakers.map(([key, bm]) => {
              if (!bm.markets.spreads) return null;
              const teams = Object.entries(bm.markets.spreads);
              return (
                <BookmakerRow
                  key={key}
                  name={bm.title}
                  cells={teams.map(([team, v]) => ({
                    label: `${team.split(" ")[0]} ${v.point > 0 ? "+" : ""}${v.point}`,
                    value: v.price,
                  }))}
                />
              );
            })}
          </div>
        </MarketSection>
      )}

      {/* BTTS */}
      {bookmakers.some(([, bm]) => bm.markets.btts) && (
        <MarketSection title={txt("שתי הקבוצות יבקיעו", "Both Teams to Score")}>
          <div className="space-y-1.5">
            {bookmakers.map(([key, bm]) => bm.markets.btts && (
              <BookmakerRow
                key={key}
                name={bm.title}
                cells={[
                  { label: txt("כן", "Yes"), value: bm.markets.btts.yes },
                  { label: txt("לא", "No"), value: bm.markets.btts.no },
                ]}
              />
            ))}
          </div>
        </MarketSection>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        {txt(
          "השערים מתעדכנים כל 60 שניות. הימור באחריות בלבד — 18+",
          "Odds refresh every 60s. Bet responsibly — 18+"
        )}
      </p>
    </div>
  );
};

const MarketSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-sm font-semibold mb-2 text-primary">{title}</h4>
    {children}
  </div>
);

const BookmakerRow = ({
  name,
  cells,
}: {
  name: string;
  cells: { label: string; value: number | undefined }[];
}) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="flex-1 truncate text-muted-foreground">{name}</span>
    <div className="flex gap-1">
      {cells.map((c, i) => (
        <div
          key={i}
          className="bg-muted/50 rounded px-2 py-1 min-w-[60px] flex items-center justify-between gap-2"
        >
          <span className="text-[10px] text-muted-foreground">{c.label}</span>
          <span className="font-semibold tabular">{c.value ? c.value.toFixed(2) : "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

const Row = ({ team, score, winner }: { team: string; score: number | null; winner: boolean }) => (
  <div className={`flex items-center justify-between ${winner ? "text-primary font-semibold" : ""}`}>
    <span className="flex items-center gap-2 truncate">
      {winner && <Trophy className="w-3.5 h-3.5 flex-shrink-0" />}
      <span className="truncate">{team}</span>
    </span>
    <span className="tabular text-lg ml-2">{score ?? "—"}</span>
  </div>
);

function getMockGames(sport: string): Game[] {
  const base = new Date();
  base.setHours(20, 0, 0, 0);
  const teams: Record<string, [string, string][]> = {
    Soccer: [["Maccabi Tel Aviv", "Hapoel BS"], ["Real Madrid", "Barcelona"], ["Man City", "Liverpool"]],
    Basketball: [["Lakers", "Celtics"], ["Warriors", "Heat"], ["Nuggets", "Suns"]],
    "American Football": [["Chiefs", "Bills"], ["49ers", "Cowboys"]],
    Tennis: [["Djokovic", "Alcaraz"], ["Sinner", "Medvedev"]],
  };
  const list = teams[sport] || teams.Soccer;
  return list.map((pair, i) => ({
    id: `mock-${i}`,
    external_id: `mock-${i}`,
    sport,
    league: sport === "Soccer" ? "Premier League" : sport,
    home_team: pair[0],
    away_team: pair[1],
    home_score: i === 0 ? 2 : null,
    away_score: i === 0 ? 1 : null,
    status: i === 0 ? "finished" : i === 1 ? "live" : "scheduled",
    starts_at: new Date(base.getTime() + i * 3600000).toISOString(),
  }));
}
