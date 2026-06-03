CREATE TABLE public.market_splits_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'h2h',
  external_game_id TEXT,
  sport TEXT NOT NULL,
  league TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_bets_pct NUMERIC(5,2),
  away_bets_pct NUMERIC(5,2),
  draw_bets_pct NUMERIC(5,2),
  home_money_pct NUMERIC(5,2),
  away_money_pct NUMERIC(5,2),
  draw_money_pct NUMERIC(5,2),
  raw JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, game_key, market)
);

ALTER TABLE public.market_splits_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_market_splits_game_key ON public.market_splits_cache (game_key, updated_at DESC);
CREATE INDEX idx_market_splits_sport ON public.market_splits_cache (sport, updated_at DESC);

CREATE POLICY "Market splits are viewable by everyone"
  ON public.market_splits_cache FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.market_intelligence_summary AS
WITH latest_market AS (
  SELECT DISTINCT ON (game_key)
    game_key,
    provider,
    market,
    external_game_id,
    sport,
    league,
    home_team,
    away_team,
    home_bets_pct,
    away_bets_pct,
    draw_bets_pct,
    home_money_pct,
    away_money_pct,
    draw_money_pct,
    updated_at
  FROM public.market_splits_cache
  WHERE market = 'h2h'
  ORDER BY game_key, updated_at DESC
)
SELECT
  crowd.game_key,
  crowd.sport,
  crowd.league,
  crowd.home_team,
  crowd.away_team,
  crowd.report_count,
  crowd.total_amount,
  crowd.home_amount,
  crowd.away_amount,
  crowd.draw_amount,
  crowd.other_amount,
  crowd.last_reported_at,
  CASE
    WHEN crowd.total_amount > 0 THEN ROUND((crowd.home_amount / crowd.total_amount) * 100, 2)
    ELSE NULL
  END AS crowd_home_pct,
  CASE
    WHEN crowd.total_amount > 0 THEN ROUND((crowd.away_amount / crowd.total_amount) * 100, 2)
    ELSE NULL
  END AS crowd_away_pct,
  CASE
    WHEN crowd.total_amount > 0 THEN ROUND((crowd.draw_amount / crowd.total_amount) * 100, 2)
    ELSE NULL
  END AS crowd_draw_pct,
  latest.provider AS market_provider,
  latest.external_game_id,
  latest.home_bets_pct,
  latest.away_bets_pct,
  latest.draw_bets_pct,
  latest.home_money_pct,
  latest.away_money_pct,
  latest.draw_money_pct,
  latest.updated_at AS market_updated_at
FROM public.crowd_game_summary crowd
LEFT JOIN latest_market latest
  ON latest.game_key = crowd.game_key;
