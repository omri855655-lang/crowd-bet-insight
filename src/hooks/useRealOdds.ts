import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RealGame = {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  bookmakers: Record<string, { home: number; draw?: number; away: number }>;
};

export type OddsResponse = {
  games: RealGame[];
  quota?: { remaining: string | null; used: string | null };
  loading: boolean;
  error: string | null;
};

export const useRealOdds = (sport: string = "soccer_epl") => {
  const [state, setState] = useState<OddsResponse>({
    games: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-odds", {
          body: null,
          method: "GET",
        });

        // supabase-js v2 doesn't easily forward GET query params; refetch via raw URL fallback
        let payload = data;
        if (!payload || error) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds?sport=${sport}`;
          const r = await fetch(url, {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          });
          payload = await r.json();
        }

        if (!mounted) return;

        if (payload?.success && Array.isArray(payload.games)) {
          setState({
            games: payload.games,
            quota: payload.quota,
            loading: false,
            error: null,
          });
        } else {
          setState({
            games: [],
            loading: false,
            error: payload?.error ?? "Failed to load odds",
          });
        }
      } catch (e) {
        if (!mounted) return;
        setState({
          games: [],
          loading: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sport]);

  return state;
};
