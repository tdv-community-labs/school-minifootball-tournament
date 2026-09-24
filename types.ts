/**
 * TDV BTL Minifootball Tournament - Core Domain Types & UI Contracts
 */

export type DivisionType = '5-6' | '7-9' | '10-11';

export type StageType = 
  | 'Qrup Mərhələsi' 
  | '1/8 Final' 
  | '1/4 Final' 
  | 'Yarımfinal' 
  | '3-cü Yer Uğrunda' 
  | 'Final';

export interface Player {
  id: string | number;
  name: string;
  normalizedName?: string;
  class: string;
  classes?: string[];
  years?: string[];
  division?: DivisionType;
  position: 'Qapıçı' | 'Müdafiəçi' | 'Yarımmüdafiəçi' | 'Hücumçu';
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  cleanSheets?: number;
  isKeeper?: boolean;
  overallRating?: number;
  matchesPlayed?: number;
  matchHistory?: PlayerMatchStat[];
}

export interface PlayerMatchStat {
  matchId: string | number;
  opponent: string;
  score: string;
  goals: number;
  assists: number;
  rating?: number;
  date?: string;
}

export interface Match {
  id: string | number;
  year: string;
  division: DivisionType;
  stage: StageType;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  penaltyScoreA?: number | string | null;
  penaltyScoreB?: number | string | null;
  date?: string;
  videoUrl?: string;
  playerRatings?: Record<string, number>;
  mom?: string; // Man of the match
}

export interface ClassTeam {
  id?: string | number;
  name: string;
  division: DivisionType;
  years: string[];
}

export interface GroupStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

export interface ShotEvent {
  id: string | number;
  minute: number;
  player: string;
  team: string;
  outcome: 'goal' | 'saved' | 'blocked' | 'miss';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  xg?: number;
}

export interface TournamentAwards {
  mvp?: string;
  goldenBoot?: { player: string; goals: number };
  goldenGlove?: string;
  bestPlaymaker?: string;
  dreamTeam?: {
    keeper: string;
    defenders: string[];
    midfielders: string[];
    attackers: string[];
  };
}

export type ThemeMode = 'dark' | 'light';

export interface UIThemeTokens {
  bgBase: string;
  bgCard: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
}
