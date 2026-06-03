// Realistic mock data for sports betting analytics
export type Sport = "Football" | "Basketball" | "Tennis" | "NFL" | "Baseball";

export type Bookmaker = {
  id: string;
  name: string;
  region: "Global" | "Israel" | "EU" | "US";
  logo: string; // emoji placeholder
};

export const bookmakers: Bookmaker[] = [
  { id: "winner", name: "Winner", region: "Israel", logo: "🇮🇱" },
  { id: "bet365", name: "Bet365", region: "Global", logo: "🌐" },
  { id: "pinnacle", name: "Pinnacle", region: "Global", logo: "📌" },
  { id: "william", name: "William Hill", region: "EU", logo: "🇬🇧" },
  { id: "draftkings", name: "DraftKings", region: "US", logo: "🇺🇸" },
  { id: "fanduel", name: "FanDuel", region: "US", logo: "🎯" },
];

export type Game = {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  startTime: string;
  status: "live" | "upcoming" | "finished";
  liveScore?: { home: number; away: number; minute: string };
  // Odds per bookmaker
  odds: Record<string, { home: number; draw?: number; away: number }>;
  // Crowd wisdom: total $ wagered (in thousands) split by side
  crowdMoney: { home: number; draw?: number; away: number };
  // User reports count
  userReports: number;
  // Total volume in $M
  totalVolume: number;
  trending?: boolean;
  marketConsensus?: {
    provider: string;
    homePct: number;
    awayPct: number;
    drawPct?: number;
  };
};

export const games: Game[] = [
  {
    id: "g1",
    sport: "Football",
    league: "Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    homeFlag: "⚪",
    awayFlag: "🔵",
    startTime: "Today, 22:00",
    status: "upcoming",
    odds: {
      winner: { home: 2.15, draw: 3.6, away: 3.2 },
      bet365: { home: 2.1, draw: 3.5, away: 3.3 },
      pinnacle: { home: 2.18, draw: 3.55, away: 3.15 },
      william: { home: 2.12, draw: 3.6, away: 3.25 },
      draftkings: { home: 2.05, draw: 3.7, away: 3.4 },
      fanduel: { home: 2.2, draw: 3.5, away: 3.1 },
    },
    crowdMoney: { home: 1240, draw: 380, away: 890 },
    userReports: 3421,
    totalVolume: 24.8,
    trending: true,
    marketConsensus: { provider: "Consensus", homePct: 54, drawPct: 17, awayPct: 29 },
  },
  {
    id: "g2",
    sport: "Football",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    homeFlag: "🔴",
    awayFlag: "🔴",
    startTime: "LIVE",
    status: "live",
    liveScore: { home: 2, away: 1, minute: "67'" },
    odds: {
      winner: { home: 1.45, draw: 4.5, away: 6.0 },
      bet365: { home: 1.42, draw: 4.6, away: 6.2 },
      pinnacle: { home: 1.46, draw: 4.4, away: 5.9 },
      william: { home: 1.44, draw: 4.5, away: 6.1 },
      draftkings: { home: 1.4, draw: 4.7, away: 6.3 },
      fanduel: { home: 1.48, draw: 4.3, away: 5.8 },
    },
    crowdMoney: { home: 2100, draw: 220, away: 540 },
    userReports: 5872,
    totalVolume: 41.2,
    trending: true,
    marketConsensus: { provider: "Consensus", homePct: 61, drawPct: 9, awayPct: 30 },
  },
  {
    id: "g3",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    homeFlag: "💜",
    awayFlag: "💚",
    startTime: "Tomorrow, 03:30",
    status: "upcoming",
    odds: {
      winner: { home: 1.85, away: 1.95 },
      bet365: { home: 1.83, away: 1.97 },
      pinnacle: { home: 1.87, away: 1.93 },
      william: { home: 1.84, away: 1.96 },
      draftkings: { home: 1.82, away: 1.98 },
      fanduel: { home: 1.86, away: 1.94 },
    },
    crowdMoney: { home: 980, away: 1120 },
    userReports: 2104,
    totalVolume: 18.5,
    marketConsensus: { provider: "Consensus", homePct: 49, awayPct: 51 },
  },
  {
    id: "g4",
    sport: "Tennis",
    league: "ATP Masters",
    homeTeam: "Djokovic",
    awayTeam: "Alcaraz",
    homeFlag: "🇷🇸",
    awayFlag: "🇪🇸",
    startTime: "Today, 18:30",
    status: "upcoming",
    odds: {
      winner: { home: 2.3, away: 1.65 },
      bet365: { home: 2.25, away: 1.67 },
      pinnacle: { home: 2.32, away: 1.63 },
      william: { home: 2.28, away: 1.66 },
      draftkings: { home: 2.2, away: 1.7 },
      fanduel: { home: 2.35, away: 1.62 },
    },
    crowdMoney: { home: 620, away: 980 },
    userReports: 1543,
    totalVolume: 12.1,
  },
  {
    id: "g5",
    sport: "NFL",
    league: "NFL Week 12",
    homeTeam: "Chiefs",
    awayTeam: "Bills",
    homeFlag: "❤️",
    awayFlag: "🔵",
    startTime: "Sun, 20:00",
    status: "upcoming",
    odds: {
      winner: { home: 1.75, away: 2.05 },
      bet365: { home: 1.73, away: 2.07 },
      pinnacle: { home: 1.77, away: 2.03 },
      william: { home: 1.74, away: 2.06 },
      draftkings: { home: 1.72, away: 2.08 },
      fanduel: { home: 1.78, away: 2.02 },
    },
    crowdMoney: { home: 1450, away: 870 },
    userReports: 4231,
    totalVolume: 32.4,
    trending: true,
  },
  {
    id: "g6",
    sport: "Football",
    league: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Atlético",
    homeFlag: "🔵",
    awayFlag: "🔴",
    startTime: "Sat, 22:00",
    status: "upcoming",
    odds: {
      winner: { home: 1.95, draw: 3.4, away: 3.8 },
      bet365: { home: 1.92, draw: 3.5, away: 3.85 },
      pinnacle: { home: 1.97, draw: 3.38, away: 3.75 },
      william: { home: 1.94, draw: 3.42, away: 3.82 },
      draftkings: { home: 1.9, draw: 3.55, away: 3.9 },
      fanduel: { home: 1.98, draw: 3.35, away: 3.7 },
    },
    crowdMoney: { home: 870, draw: 290, away: 640 },
    userReports: 1987,
    totalVolume: 15.7,
  },
];

// Recent user-reported bets (crowd wisdom feed)
export type UserBet = {
  id: string;
  user: string;
  avatar: string;
  bookmaker: string;
  game: string;
  pick: string;
  amount: number;
  odds: number;
  timeAgo: string;
};

export const recentUserBets: UserBet[] = [
  { id: "u1", user: "ronen_92", avatar: "🦁", bookmaker: "Winner", game: "Real Madrid vs Man City", pick: "Real Madrid", amount: 500, odds: 2.15, timeAgo: "2m" },
  { id: "u2", user: "sarah.k", avatar: "🎯", bookmaker: "Bet365", game: "Arsenal vs Liverpool", pick: "Arsenal", amount: 1200, odds: 1.45, timeAgo: "4m" },
  { id: "u3", user: "betking", avatar: "👑", bookmaker: "Pinnacle", game: "Real Madrid vs Man City", pick: "Man City", amount: 7000, odds: 3.15, timeAgo: "7m" },
  { id: "u4", user: "yossi_il", avatar: "⚽", bookmaker: "Winner", game: "Barcelona vs Atlético", pick: "Barcelona", amount: 350, odds: 1.95, timeAgo: "11m" },
  { id: "u5", user: "tennisfan", avatar: "🎾", bookmaker: "William Hill", game: "Djokovic vs Alcaraz", pick: "Alcaraz", amount: 800, odds: 1.65, timeAgo: "15m" },
  { id: "u6", user: "nba_guru", avatar: "🏀", bookmaker: "DraftKings", game: "Lakers vs Celtics", pick: "Celtics", amount: 2500, odds: 1.95, timeAgo: "18m" },
  { id: "u7", user: "shai_tlv", avatar: "🔥", bookmaker: "Winner", game: "Arsenal vs Liverpool", pick: "Liverpool", amount: 200, odds: 6.0, timeAgo: "22m" },
  { id: "u8", user: "vegasvic", avatar: "🎰", bookmaker: "FanDuel", game: "Chiefs vs Bills", pick: "Chiefs", amount: 5000, odds: 1.78, timeAgo: "26m" },
];

// Volume trend data
export const volumeTrend = [
  { time: "00:00", volume: 12.4 },
  { time: "04:00", volume: 8.2 },
  { time: "08:00", volume: 18.6 },
  { time: "12:00", volume: 32.1 },
  { time: "16:00", volume: 45.8 },
  { time: "20:00", volume: 68.3 },
  { time: "Now", volume: 84.7 },
];

export const stats = {
  totalVolume24h: 144.7, // millions
  activeBets: 28394,
  totalUsers: 124800,
  liveGames: 12,
  volumeChange: 12.4, // %
  betsChange: 8.7,
};
