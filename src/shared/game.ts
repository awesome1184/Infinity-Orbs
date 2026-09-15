export type UpgradeId = 'speed' | 'multi' | 'auto' | 'luck';

export interface Orb { rarity: number; rolledAt: number; }
export interface PlayerState {
  coins: number; level: number; xp: number; totalRolls: number; highestRarity: number;
  collectionValue: number; collection: Record<string, number>; lastRollAt: number | null;
  lastSeenAt: number; offlineRolls: number; claimedAchievements: string[];
  upgrades: Record<UpgradeId, number>;
}
export interface RollResponse { orb: Orb; state: PlayerState; rollsRemainingUntilNext: number; }

export function createInitialState(now = Date.now()): PlayerState {
  return {
    coins: 100, level: 1, xp: 0, totalRolls: 0, highestRarity: 0,
    collectionValue: 0, collection: {}, lastRollAt: null,
    lastSeenAt: now, offlineRolls: 0, claimedAchievements: [],
    upgrades: { speed: 0, multi: 0, auto: 0, luck: 0 }
  };
}

export const INITIAL_STATE = createInitialState();
export const BASE_COOLDOWN_MS = 10_000;
export const AUTO_UNLOCK_ROLLS = 10;
export const AUTO_UNLOCK_COST = 200;
export const MAX_OFFLINE_ROLLS = 10_000;

export function cooldownMs(s: PlayerState) {
  return Math.max(1000, Math.round(BASE_COOLDOWN_MS * Math.pow(0.86, s.upgrades.speed)));
}
export function rollsPerActivation(s: PlayerState) { return Math.min(100, 2 ** s.upgrades.multi); }
export function autoUnlocked(s: PlayerState) { return s.upgrades.auto > 0; }
export function luckMultiplier(s: PlayerState) { return 1 + s.upgrades.luck * 0.08; }
export function offlineRollCap(s: PlayerState) {
  return Math.min(MAX_OFFLINE_ROLLS, Math.round((60 + s.upgrades.auto * 60) * (1 + s.upgrades.speed * 0.05)));
}
export function upgradeCost(id: UpgradeId, level: number) {
  if (id === 'auto') return level ? Infinity : AUTO_UNLOCK_COST;
  const base = { speed: 50, multi: 100, luck: 200 }[id];
  return Math.floor(base * Math.pow(1.18, level));
}
