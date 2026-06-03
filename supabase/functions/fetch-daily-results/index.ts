import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map our sport names to API-Football endpoints
const SPORT_MAP: Record<string, { host: string; endpoint: string; useSeason?: boolean }> = {
  Soccer: { host: "v3.football.api-sports.io", endpoint: "fixtures" },
  Basketball: { host: "v1.basketball.api-sports.io", endpoint: "games" },
  "American Football": {
    host: "v1.american-football.api-sports.io",
    endpoint: "games",
    useSeason: true,
  },
  Tennis: { host: "v1.tennis.api-sports.io", endpoint: "fixtures" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport = "Soccer", date: customDate } = await req.json().catch(() => ({}));
    const config = SPORT_MAP[sport] || SPORT_MAP.Soccer;

    const API_KEY = Deno.env.get("API_FOOTBALL_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (!API_KEY) {
      console.log("No API_FOOTBALL_KEY configured");
      return new Response(
        JSON.stringify({ error: "API_FOOTBALL_KEY not configured", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = customDate || new Date().toISOString().split("T")[0];
    const season = new Date().getFullYear();

    // Build URL — some sports require season param
    let url = `https://${config.host}/${config.endpoint}?date=${today}`;
    if (config.useSeason) url += `&season=${season}`;

    console.log(`Fetching ${sport} from: ${url}`);

    const apiRes = await fetch(url, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": config.host,
      },
    });

    const data = await apiRes.json();
    console.log(`API response status: ${apiRes.status}, results count: ${data?.results ?? 0}, errors:`, data?.errors);

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({
          error: `API-Football returned ${apiRes.status}`,
          details: data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // API-Football returns errors as object/array even on 200
    const apiErrors = data?.errors;
    if (apiErrors && (Array.isArray(apiErrors) ? apiErrors.length > 0 : Object.keys(apiErrors).length > 0)) {
      console.error("API-Football errors:", apiErrors);
      return new Response(
        JSON.stringify({ error: "API-Football error", details: apiErrors }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fixtures = data.response || [];

    const rows = fixtures.slice(0, 50).map((f: any) => {
      const homeTeam = f.teams?.home?.name || f.home?.name || "TBD";
      const awayTeam = f.teams?.away?.name || f.away?.name || "TBD";
      const homeScore = f.goals?.home ?? f.scores?.home?.total ?? f.scores?.home ?? null;
      const awayScore = f.goals?.away ?? f.scores?.away?.total ?? f.scores?.away ?? null;
      const startsAt = f.fixture?.date || f.date || f.time || new Date().toISOString();
      const statusRaw = f.fixture?.status?.short || f.status?.short || f.status || "NS";
      let status = "scheduled";
      if (["1H", "2H", "HT", "ET", "P", "LIVE", "Q1", "Q2", "Q3", "Q4", "OT"].includes(statusRaw)) status = "live";
      else if (["FT", "AET", "PEN", "AOT"].includes(statusRaw)) status = "finished";

      const externalId = `${sport}-${f.fixture?.id || f.id || crypto.randomUUID()}`;

      return {
        external_id: externalId,
        sport,
        league: f.league?.name || null,
        home_team: homeTeam,
        away_team: awayTeam,
        home_score: homeScore,
        away_score: awayScore,
        status,
        starts_at: startsAt,
        finished_at: status === "finished" ? new Date().toISOString() : null,
        raw: f,
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase
        .from("games_cache")
        .upsert(rows, { onConflict: "external_id" });
      if (error) console.error("Upsert error:", error);
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-daily-results error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
