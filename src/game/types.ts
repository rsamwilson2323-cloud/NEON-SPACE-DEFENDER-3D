export type WeaponId = "laser" | "plasma" | "missile";

export type GraphicsQuality = "LOW" | "MEDIUM" | "HIGH" | "ULTRA";

export interface Settings {
  audio: boolean;
  music: boolean;
  sfx: boolean;
  graphics: GraphicsQuality;
  bloom: boolean;
  particles: boolean;
  screenShake: boolean;
  groqApiKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  audio: true,
  music: true,
  sfx: true,
  graphics: "HIGH",
  bloom: true,
  particles: true,
  screenShake: true,
  groqApiKey: "",
};

export const SETTINGS_KEY = "nsd3d.settings";
export const HIGHSCORE_KEY = "nsd3d.highscore";

export interface TargetInfo {
  name: string;
  distance: number;
  healthPct: number;
  isBoss: boolean;
}

export interface HudState {
  score: number;
  highScore: number;
  wave: number;
  level: number;
  enemiesLeft: number;
  hull: number;
  shield: number;
  energy: number;
  weapon: WeaponId;
  missiles: number;
  combo: number;
  specialReady: number; // 0..1
  boosting: boolean;
  lowEnergy: boolean;
  shieldOffline: boolean;
  target: TargetInfo | null;
  boss: { name: string; health: number; shield: number } | null;
  banner: string | null;
  countdown: number | null;
  fps: number;
  kills: number;
  time: number;
  bossesDefeated: number;
}

export type GamePhase =
  | "menu"
  | "howto"
  | "settings"
  | "playing"
  | "paused"
  | "gameover"
  | "victory";

export const ENEMY_SCORE = {
  scout: 100,
  drone: 150,
  fighter: 250,
  tank: 500,
  elite: 1000,
  boss: 5000,
} as const;

export type EnemyKind = keyof typeof ENEMY_SCORE;
