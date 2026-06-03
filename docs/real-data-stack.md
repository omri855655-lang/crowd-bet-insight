# Real Data Stack

המבנה המומלץ למוצר:

## 1. Live odds

- ספק ראשי: `The Odds API`
- שימוש מומלץ: שווקי `h2h`, `totals`, `spreads`, `btts`
- פונקציה קיימת: `supabase/functions/fetch-odds`

משתני סביבה:

```bash
ODDS_API_KEY=
```

## 2. Live scores / fixtures

- ספק ראשי: `API-SPORTS`
- שימוש מומלץ: `football`, `basketball`, `american-football`, `tennis`
- פונקציה קיימת: `supabase/functions/fetch-daily-results`

משתני סביבה:

```bash
API_FOOTBALL_KEY=
```

## 3. Crowd wisdom

- מקור האמת: `public.bets`
- אגרגציה פנימית: `public.crowd_game_summary`
- תצוגה משולבת: `public.market_intelligence_summary`

## 4. External market splits / money flow

בפועל, רוב ספקי ה־`betting splits` או `money percentages` הם ספקי Enterprise ולא API ציבורי פשוט.

לכן הארכיטקטורה שנבנתה כאן היא:

- טבלת cache: `public.market_splits_cache`
- פונקציית ingest גנרית: `supabase/functions/sync-market-splits`
- ברגע שיש ספק חיצוני, ממפים אותו לפורמט אחיד:

```json
{
  "entries": [
    {
      "provider": "sportradar",
      "sport": "Soccer",
      "league": "Premier League",
      "home_team": "Arsenal",
      "away_team": "Liverpool",
      "home_bets_pct": 58.4,
      "away_bets_pct": 30.1,
      "draw_bets_pct": 11.5,
      "home_money_pct": 54.8,
      "away_money_pct": 34.4,
      "draw_money_pct": 10.8
    }
  ]
}
```

משתני סביבה אופציונליים:

```bash
MARKET_SPLITS_PROVIDER=
MARKET_SPLITS_SOURCE_URL=
MARKET_SPLITS_API_KEY=
```

## 5. Production checklist

1. לחבר את כל משתני הסביבה ב־Supabase ובסביבת הפרסום.
2. להריץ את המיגרציות החדשות.
3. להפעיל cron/automation שיריץ:
   - `fetch-daily-results`
   - `fetch-odds`
   - `sync-market-splits`
4. לחבר feed חיצוני ל־`sync-market-splits` ברגע שנבחר ספק.
