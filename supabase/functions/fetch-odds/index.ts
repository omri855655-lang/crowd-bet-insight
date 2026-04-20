// Edge function: fetch real odds from The Odds API
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
    outcomes: Array<{ name: string; price: number }>;
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

const SPORT_KEYS: Record<string, string> = {
  football: "soccer_epl,soccer_uefa_champs_league,soccer_spain_la_liga",
  basketball: "basketball_nba",
  tennis: "tennis_atp_aus_open_singles",
  nfl: "americanfootball_nfl",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      throw new Error("ODDS_API_KEY is not configured");
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get("sport") ?? "soccer";
    const region = url.searchParams.get("regions") ?? "uk,eu,us";

    // We support a couple of sport "categories" or pass-through specific keys
    let sportKey = sport;
    if (sport === "all") {
      // Pull a curated mix - we'll do soccer EPL as default for the "all" view
      sportKey = "soccer_epl";
    }

    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${region}&markets=h2h&oddsFormat=decimal`;

    const response = await fetch(oddsUrl);

    // Quota tracking headers
    const requestsRemaining = response.headers.get("x-requests-remaining");
    const requestsUsed = response.headers.get("x-requests-used");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Odds API error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({
          error: `Odds API returned ${response.status}`,
          details: errorText,
          quota: { remaining: requestsRemaining, used: requestsUsed },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const games: OddsApiGame[] = await response.json();

    // Normalize to our app's shape
    const normalized = games.slice(0, 12).map((g) => {
      const bms: Record<string, { home: number; draw?: number; away: number }> = {};

      g.bookmakers.forEach((bm) => {
        const h2h = bm.markets.find((m) => m.key === "h2h");
        if (!h2h) return;

        const home = h2h.outcomes.find((o) => o.name === g.home_team)?.price;
        const away = h2h.outcomes.find((o) => o.name === g.away_team)?.price;
        const draw = h2h.outcomes.find((o) => o.name === "Draw")?.price;

        if (home && away) {
          bms[bm.key] = { home, away, ...(draw ? { draw } : {}) };
        }
      });

      return {
        id: g.id,
        sport: g.sport_title,
        league: g.sport_title,
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        startTime: g.commence_time,
        bookmakers: bms,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        games: normalized,
        quota: {
          remaining: requestsRemaining,
          used: requestsUsed,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
