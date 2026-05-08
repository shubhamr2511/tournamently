export type TournamentStatus =
  | 'draft'
  | 'registration'
  | 'league'
  | 'playoffs'
  | 'completed';

export type MatchFormat = 'BO3' | 'BO5' | 'BO7';
export type TournamentFormat = 'round_robin';
export type Tiebreaker =
  | 'bonus_points'
  | 'head_to_head'
  | 'game_diff'
  | 'perfects'
  | 'fast_wins';

export interface ITournamentScoring {
  perfectRoundBonus: number;
  fastWinBonus: number;
  fastWinThresholdSeconds: number;
}

export interface ITournamentRanking {
  primary: 'wins';
  tiebreakers: Tiebreaker[];
}

export interface ITournamentPlayoff {
  format: 'normal' | 'streak';
  size: number;
  matchFormat: MatchFormat;
  streakTarget?: number;
  maxGameCap?: number;
  createdAt?: string;
}

export interface ITournament {
  _id: string;
  name: string;
  slug: string;
  game: string;
  description?: string;
  format: TournamentFormat;
  playerCount: number;
  matchFormat: MatchFormat;
  startDate: string;
  endDate: string;
  matchesPerDay: number;
  weekdaysOnly: boolean;
  status: TournamentStatus;
  scoring: ITournamentScoring;
  ranking: ITournamentRanking;
  characterLock: boolean;
  availableCharacters: string[];
  playoff?: ITournamentPlayoff;
  fixturesGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPlayer {
  _id: string;
  tournament: string;
  name: string;
  gamerTag: string;
  bio?: string;
  avatarUrl?: string;
  department?: string;
  character?: string;
  characterLocked: boolean;
  seed?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGameResult {
  gameNumber: number;
  winner: string;
  perfectRound?: boolean;
  fastWin?: boolean;
}

export interface IMatchPlayerStats {
  perfectRounds: number;
  fastWins: number;
  bonusPoints: number;
}

export interface IMatchResult {
  winner: string;
  loser: string;
  score: '2-0' | '2-1' | string;
  games: IGameResult[];
  playerAStats: IMatchPlayerStats;
  playerBStats: IMatchPlayerStats;
  notes?: string;
  isFeatured: boolean;
  isUpset: boolean;
  completedAt: string;
}

export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IMatch {
  _id: string;
  tournament: string;
  matchNumber: number;
  playerA: string | IPlayer;
  playerB: string | IPlayer;
  scheduledDate?: string;
  status: MatchStatus;
  result?: IMatchResult;
  createdAt: string;
  updatedAt: string;
}

export interface IPlayoffMatch {
  _id: string;
  tournament: string;
  round: number;
  matchNumber: number;
  playerA?: string | IPlayer;
  playerB?: string | IPlayer;
  seedA?: number;
  seedB?: number;
  feederMatchA?: string;
  feederMatchB?: string;
  mode: 'normal' | 'streak';
  normalResult?: {
    winner: string;
    score: string;
    games: IGameResult[];
  };
  streakResult?: {
    winner: string;
    sequence: string[];
    finalStreakA: number;
    finalStreakB: number;
    totalGames: number;
  };
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaderboardRow {
  rank: number;
  player: IPlayer;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  winPercentage: number;
  previousRank?: number | null;
  rankDelta?: number | null;
}

export interface ILeaderboardResponse {
  rows: ILeaderboardRow[];
  snapshotCapturedAt: string | null;
}

export interface ILeaderboardSnapshotSummary {
  _id: string;
  capturedAt: string;
  createdAt: string;
}

export interface IStandingsHistoryRow {
  player: {
    _id: string;
    gamerTag: string;
    name: string;
    character?: string;
  };
  rank: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  winPercentage: number;
}

export interface IStandingsHistorySnapshot {
  _id: string;
  capturedAt: string;
  rows: IStandingsHistoryRow[];
}

export interface IStandingsHistoryResponse {
  snapshots: IStandingsHistorySnapshot[];
}

export interface IBadgePlayer {
  _id: string;
  gamerTag: string;
  name: string;
  character?: string;
}

export interface IBadgeWinner {
  player: IBadgePlayer;
  value: number;
  detail?: string;
}

export interface IBadgeAward {
  key: string;
  name: string;
  description: string;
  winner: IBadgeWinner | null;
}

export interface IPublicTournamentPayload {
  tournament: ITournament;
  leaderboard: ILeaderboardRow[];
  snapshotCapturedAt: string | null;
  todayMatches: IMatch[];
  recentResults: IMatch[];
  upcomingMatches: IMatch[];
  featuredMatches: IMatch[];
  playoffs: IPlayoffMatch[] | null;
  badges: IBadgeAward[];
  stats: {
    totalMatches: number;
    completedMatches: number;
    playersCount: number;
  };
}
