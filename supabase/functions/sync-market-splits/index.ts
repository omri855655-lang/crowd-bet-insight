import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type IncomingSplit = {
  game_key?: string;
  provider?: string;
  market?: string;
  external_game_id?: string;
  sport: string;
  league?: string | null;
  home_team: string;
  away_team: string;
  home_bets_pct?: number | null;
  away_bets_pct?: number | null;
  draw_bets_pct?: number | null;
  home_money_pct?: number | null;
  away_money_pct?: number | null;
  draw_money_pct?: number | null;
  raw?: unknown;
};

const buildGameKey = (sport: string, league: string | null | undefined, homeTeam: string, awayTeam: string) =>
  `${sport.trim().toLowerCase()}|${(league ?? "").trim().toLowerCase()}|${homeTeam.trim().toLowerCase()}|${awayTeam.trim().toLowerCase()}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sourceUrl = Deno.env.get("MARKET_SPLITS_SOURCE_URL");
    const sourceApiKey = Deno.env.get("MARKET_SPLITS_API_KEY");
    const defaultProvider = Deno.env.get("MARKET_SPLITS_PROVIDER") ?? "external-market-splits";

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    let entries: IncomingSplit[] = Array.isArray(body?.entries) ? body.entries : [];

    if (entries.length === 0 && sourceUrl) {
      const url = new URL(sourceUrl);
      const sport = body?.sport || req.headers.get("x-sport");
      if (sport) url.searchParams.set("sport", sport);

      const upstream = await fetch(url.toString(), {
        headers: sourceApiKey ? { Authorization: `Bearer ${sourceApiKey}` } : undefined,
      });

      const payload = await upstream.json();
      entries = Array.isArray(payload?.entries) ? payload.entries : Array.isArray(payload) ? payload : [];
    }

    if (entries.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No market split entries provided and no upstream source returned data",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = entries.map((entry) => ({
      game_key: entry.game_key || buildGameKey(entry.sport, entry.league, entry.home_team, entry.away_team),
      provider: entry.provider || defaultProvider,
      market: entry.market || "h2h",
      external_game_id: entry.external_game_id || null,
      sport: entry.sport,
      league: entry.league || null,
      home_team: entry.home_team,
      away_team: entry.away_team,
      home_bets_pct: entry.home_bets_pct ?? null,
      away_bets_pct: entry.away_bets_pct ?? null,
      draw_bets_pct: entry.draw_bets_pct ?? null,
      home_money_pct: entry.home_money_pct ?? null,
      away_money_pct: entry.away_money_pct ?? null,
      draw_money_pct: entry.draw_money_pct ?? null,
      raw: entry.raw ?? entry,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("market_splits_cache")
      .upsert(rows, { onConflict: "provider,game_key,market" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
