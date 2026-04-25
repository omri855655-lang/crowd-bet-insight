import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/i18n";
import { Calendar, Trophy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

const SPORTS = ["Soccer", "Basketball", "American Football", "Tennis"];

export const DailyResults = () => {
  const { lang, t } = useI18n();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("Soccer");
  const [usingMock, setUsingMock] = useState(false);

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  const fetchGames = async () => {
    setLoading(true);
    try {
      // Trigger backend refresh
      await supabase.functions.invoke("fetch-daily-results", {
        body: { sport: activeSport },
      }).catch(() => null);

      // Read from cache
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
        // Fallback mock
        setGames(getMockGames(activeSport));
        setUsingMock(true);
      }
    } catch {
      setGames(getMockGames(activeSport));
      setUsingMock(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
    // Auto-refresh every 60s to pick up live score updates
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSport]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border" id="results">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-widest mb-3">
            <Calendar className="w-4 h-4" />
            {txt("תוצאות יומיות", "Daily results")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
            {txt("כל המשחקים", "Every game")}{" "}
            <span className="text-gradient-gold">{txt("של היום", "today")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            {txt(
              "תוצאות, לוחות זמנים וסטטוסים מעודכנים. נשלפים אוטומטית מ-API-Football.",
              "Live results, schedules and statuses. Auto-fetched from API-Football."
            )}
            {usingMock && (
              <span className="block text-xs text-amber-500/80 mt-1">
                ⚠ {txt("מציג נתוני דמו (חבר את מפתח API-Football)", "Showing demo data (connect API-Football key)")}
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
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const GameCard = ({ game }: { game: Game }) => {
  const { lang } = useI18n();
  const status = game.status || "scheduled";
  const isLive = status === "live" || status === "in_progress";
  const isFinished = status === "finished" || status === "ft";

  return (
    <div className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase">{game.league || game.sport}</span>
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

      {game.starts_at && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          {new Date(game.starts_at).toLocaleTimeString(lang === "he" ? "he-IL" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
};

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
