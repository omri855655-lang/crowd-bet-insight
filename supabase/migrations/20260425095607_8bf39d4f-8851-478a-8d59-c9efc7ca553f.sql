-- Enable realtime for bets feed
ALTER TABLE public.bets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON public.bets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_sport ON public.bets (sport);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets (user_id);
CREATE INDEX IF NOT EXISTS idx_games_cache_sport_starts ON public.games_cache (sport, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_cache_status ON public.games_cache (status);