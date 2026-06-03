import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CrowdGameSummary = {
  game_key: string;
  sport: string;
  league: string | null;
  home_team: string;
  away_team: string;
  report_count: number;
  total_amount: number;
  home_amount: number;
  away_amount: number;
  draw_amount: number;
  other_amount: number;
  last_reported_at: string | null;
};

type CrowdGameSummariesState = {
  summaries: CrowdGameSummary[];
  loading: boolean;
  error: string | null;
};

export const buildGameKey = (sport: string, league: string | null, homeTeam: string, awayTeam: string) =>
  `${sport.trim().toLowerCase()}|${(league ?? "").trim().toLowerCase()}|${homeTeam.trim().toLowerCase()}|${awayTeam.trim().toLowerCase()}`;

export const useCrowdGameSummaries = () => {
  const [state, setState] = useState<CrowdGameSummariesState>({
    summaries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("crowd_game_summary")
        .select("game_key, sport, league, home_team, away_team, report_count, total_amount, home_amount, away_amount, draw_amount, other_amount, last_reported_at")
        .order("last_reported_at", { ascending: false })
        .limit(100);

      if (!mounted) return;

      if (error) {
        setState({
          summaries: [],
          loading: false,
          error: error.message,
        });
        return;
      }

      setState({
        summaries: (data ?? []).map((row) => ({
          ...row,
          report_count: Number(row.report_count ?? 0),
          total_amount: Number(row.total_amount ?? 0),
          home_amount: Number(row.home_amount ?? 0),
          away_amount: Number(row.away_amount ?? 0),
          draw_amount: Number(row.draw_amount ?? 0),
          other_amount: Number(row.other_amount ?? 0),
        })),
        loading: false,
        error: null,
      });
    };

    load();

    const channel = supabase
      .channel("crowd-game-summary")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, load)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
};
