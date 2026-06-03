import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type MarketIntelligenceSummary = {
  game_key: string;
  sport: string | null;
  league: string | null;
  home_team: string | null;
  away_team: string | null;
  report_count: number;
  total_amount: number;
  home_amount: number;
  away_amount: number;
  draw_amount: number;
  other_amount: number;
  last_reported_at: string | null;
  crowd_home_pct: number | null;
  crowd_away_pct: number | null;
  crowd_draw_pct: number | null;
  market_provider: string | null;
  external_game_id: string | null;
  home_bets_pct: number | null;
  away_bets_pct: number | null;
  draw_bets_pct: number | null;
  home_money_pct: number | null;
  away_money_pct: number | null;
  draw_money_pct: number | null;
  market_updated_at: string | null;
};

type MarketIntelligenceState = {
  summaries: MarketIntelligenceSummary[];
  loading: boolean;
  error: string | null;
};

export const useMarketIntelligenceSummaries = () => {
  const [state, setState] = useState<MarketIntelligenceState>({
    summaries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setState({
        summaries: [],
        loading: false,
        error: "Supabase is not configured for this deployment",
      });
      return;
    }

    const load = async () => {
      const { data, error } = await supabase
        .from("market_intelligence_summary")
        .select("*")
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
          crowd_home_pct: row.crowd_home_pct == null ? null : Number(row.crowd_home_pct),
          crowd_away_pct: row.crowd_away_pct == null ? null : Number(row.crowd_away_pct),
          crowd_draw_pct: row.crowd_draw_pct == null ? null : Number(row.crowd_draw_pct),
          home_bets_pct: row.home_bets_pct == null ? null : Number(row.home_bets_pct),
          away_bets_pct: row.away_bets_pct == null ? null : Number(row.away_bets_pct),
          draw_bets_pct: row.draw_bets_pct == null ? null : Number(row.draw_bets_pct),
          home_money_pct: row.home_money_pct == null ? null : Number(row.home_money_pct),
          away_money_pct: row.away_money_pct == null ? null : Number(row.away_money_pct),
          draw_money_pct: row.draw_money_pct == null ? null : Number(row.draw_money_pct),
        })),
        loading: false,
        error: null,
      });
    };

    load();

    const channel = supabase
      .channel("market-intelligence")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "market_splits_cache" }, load)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
};
