CREATE OR REPLACE VIEW public.crowd_game_summary AS
WITH normalized_bets AS (
  SELECT
    COALESCE(
      NULLIF(game_id, ''),
      lower(trim(sport)) || '|' ||
      lower(trim(COALESCE(league, ''))) || '|' ||
      lower(trim(home_team)) || '|' ||
      lower(trim(away_team))
    ) AS game_key,
    sport,
    league,
    home_team,
    away_team,
    amount,
    currency,
    bookmaker,
    created_at,
    CASE
      WHEN lower(trim(bet_on)) = lower(trim(home_team)) THEN 'home'
      WHEN lower(trim(bet_on)) = lower(trim(away_team)) THEN 'away'
      WHEN lower(trim(bet_on)) IN ('draw', 'tie', 'x', 'תיקו') THEN 'draw'
      ELSE 'other'
    END AS pick_side
  FROM public.bets
)
SELECT
  game_key,
  sport,
  league,
  home_team,
  away_team,
  COUNT(*)::bigint AS report_count,
  COALESCE(SUM(amount), 0)::numeric(14,2) AS total_amount,
  COALESCE(SUM(amount) FILTER (WHERE pick_side = 'home'), 0)::numeric(14,2) AS home_amount,
  COALESCE(SUM(amount) FILTER (WHERE pick_side = 'away'), 0)::numeric(14,2) AS away_amount,
  COALESCE(SUM(amount) FILTER (WHERE pick_side = 'draw'), 0)::numeric(14,2) AS draw_amount,
  COALESCE(SUM(amount) FILTER (WHERE pick_side = 'other'), 0)::numeric(14,2) AS other_amount,
  MAX(created_at) AS last_reported_at,
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'bookmaker', bookmaker,
      'currency', currency
    )
  ) FILTER (WHERE bookmaker IS NOT NULL) AS sources
FROM normalized_bets
GROUP BY game_key, sport, league, home_team, away_team;
