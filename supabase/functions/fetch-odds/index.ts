// Edge function: fetch real odds from The Odds API with extended markets
// Docs: https://the-odds-api.com/liveapi/guides/v4/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookmakerOdds {
  key: string;
  title: string;
  last_update: string;
  markets: Array<{
    key: string;
    outcomes: Array<{ name: string; price: number; point?: number }>;
  }>;
}

interface OddsApiGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: BookmakerOdds[];
}

const normalizeSportKeys = (sportParam: string | null) => {
  if (!sportParam || sportParam === "upcoming") return ["upcoming"];
  if (sportParam === "all") {
    return [
      "soccer_epl",
      "basketball_nba",
      "americanfootball_nfl",
      "tennis_atp_french_open",
      "baseball_mlb",
    ];
  }
  return sportParam
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ODDS_API_KEY not configured", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get("sport") ?? "upcoming";
    const region = url.searchParams.get("regions") ?? "uk,eu,us";
    // Markets: h2h (1X2), totals (over/under goals), spreads (handicap), btts (both teams to score)
    const markets = url.searchParams.get("markets") ?? "h2h,totals,spreads,btts";

    const sportKeys = normalizeSportKeys(sport);
    const allGames: OddsApiGame[] = [];
    let requestsRemaining: string | null = null;
    let requestsUsed: string | null = null;

    for (const sportKey of sportKeys) {
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${region}&markets=${markets}&oddsFormat=decimal`;
      const response = await fetch(oddsUrl);
      requestsRemaining = response.headers.get("x-requests-remaining");
      requestsUsed = response.headers.get("x-requests-used");

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Odds API error [${response.status}] for ${sportKey}:`, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Odds API returned ${response.status}`,
            details: errorText,
            fallback: true,
            quota: { remaining: requestsRemaining, used: requestsUsed },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const games: OddsApiGame[] = await response.json();
      allGames.push(...games);
    }

    // Normalize: extract best odds per market across bookmakers
    const normalized = allGames
      .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
      .slice(0, 40)
      .map((g) => {
      const marketsByType: Record<string, any> = {};
      const bookmakers: Record<string, any> = {};

      g.bookmakers.forEach((bm) => {
        bookmakers[bm.key] = { title: bm.title, markets: {} as Record<string, any> };

        bm.markets.forEach((m) => {
          // Build per-market structure
          if (m.key === "h2h") {
            const home = m.outcomes.find((o) => o.name === g.home_team)?.price;
            const away = m.outcomes.find((o) => o.name === g.away_team)?.price;
            const draw = m.outcomes.find((o) => o.name === "Draw")?.price;
            bookmakers[bm.key].home = home;
            bookmakers[bm.key].draw = draw;
            bookmakers[bm.key].away = away;
            bookmakers[bm.key].markets.h2h = { home, away, draw };
          } else if (m.key === "totals") {
            // Over/Under — group by point
            const lines: Record<string, { over?: number; under?: number }> = {};
            m.outcomes.forEach((o) => {
              const pt = String(o.point ?? "");
              lines[pt] = lines[pt] || {};
              if (o.name === "Over") lines[pt].over = o.price;
              if (o.name === "Under") lines[pt].under = o.price;
            });
            bookmakers[bm.key].markets.totals = lines;
          } else if (m.key === "spreads") {
            const teams: Record<string, { point: number; price: number }> = {};
            m.outcomes.forEach((o) => {
              teams[o.name] = { point: o.point ?? 0, price: o.price };
            });
            bookmakers[bm.key].markets.spreads = teams;
          } else if (m.key === "btts") {
            const yes = m.outcomes.find((o) => o.name === "Yes")?.price;
            const no = m.outcomes.find((o) => o.name === "No")?.price;
            bookmakers[bm.key].markets.btts = { yes, no };
          }
        });
      });

      // Compute best (highest) odds across all bookmakers per outcome
      const bestH2h = { home: 0, draw: 0, away: 0 };
      const bestBtts = { yes: 0, no: 0 };
      Object.values(bookmakers).forEach((b: any) => {
        if (b.markets.h2h) {
          bestH2h.home = Math.max(bestH2h.home, b.markets.h2h.home || 0);
          bestH2h.draw = Math.max(bestH2h.draw, b.markets.h2h.draw || 0);
          bestH2h.away = Math.max(bestH2h.away, b.markets.h2h.away || 0);
        }
        if (b.markets.btts) {
          bestBtts.yes = Math.max(bestBtts.yes, b.markets.btts.yes || 0);
          bestBtts.no = Math.max(bestBtts.no, b.markets.btts.no || 0);
        }
      });

      return {
        id: g.id,
        sport: g.sport_title,
        league: g.sport_title,
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        startTime: g.commence_time,
        bookmakers,
        bestOdds: { h2h: bestH2h, btts: bestBtts },
        source: {
          provider: "the-odds-api",
          sportKey: g.sport_key,
        },
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        games: normalized,
        quota: { remaining: requestsRemaining, used: requestsUsed },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
