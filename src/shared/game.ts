export type UpgradeId = 'speed' | 'multi' | 'auto' | 'luck';
export type PrestigeUpgradeId =
  | 'permLuck'
  | 'permSpeed'
  | 'vaultCap'
  | 'dustBounty'
  | 'sonarPing'
  | 'instantReveal'
  | 'autoOverclock'
  | 'transmutation'
  | 'shardSynthesis';

export interface Orb {
  rarity: number;
  rolledAt: number;
  tier: string;
  name: string;
  isNew?: boolean;
}

export interface QuestItem {
  id: string;
  title: string;
  desc: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardShards?: number;
  rewardTokens?: number;
  rewardXp?: number;
  claimed: boolean;
}

export interface PlayerStreak {
  count: number;
  lastClaimDate: string; // YYYY-MM-DD
  longestStreak: number;
}

export interface PlayerState {
  coins: number;
  shards: number;
  cosmicDust: number;
  level: number;
  xp: number;
  totalRolls: number;
  highestRarity: number;
  collectionValue: number;
  lifetimeCollectionValue: number;
  collection: Record<string, number>;
  lastRollAt: number | null;
  lastSeenAt: number;
  offlineRolls: number;
  claimedAchievements: string[];
  upgrades: Record<UpgradeId, number>;
  prestigeCount: number;
  prestigeUpgrades: Record<PrestigeUpgradeId, number>;
  streak: PlayerStreak;
  dailyQuests: QuestItem[];
  weeklyQuests: QuestItem[];
  lastDailyReset: string;
  lastWeeklyReset: string;
  rollsSinceBest: number;
  activeCosmetic: string;
  unlockedCosmetics: string[];
  turboRollUntil: number; // timestamp
}

export interface RollResponse {
  orb: Orb;
  batch: Orb[];
  totalValueGained: number;
  totalRollValue: number;
  coinsGained: number;
  shardsGained: number;
  xpGained: number;
  state: PlayerState;
  rollsRemainingUntilNext: number;
  dramaticReveal: boolean;
}

export type RarityTierName =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic'
  | 'Relic'
  | 'Divine'
  | 'Transcendent';

export interface RarityTierInfo {
  rarity: number;
  name: string;
  tier: RarityTierName;
  approxChance: string;
  color: string;
  bgGradient: string;
}

export function getOrbTier(rarity: number): RarityTierName {
  if (rarity >= 100_000_000) return 'Transcendent';
  if (rarity >= 10_000_000) return 'Divine';
  if (rarity >= 1_000_000) return 'Relic';
  if (rarity >= 100_000) return 'Mythic';
  if (rarity >= 10_000) return 'Legendary';
  if (rarity >= 1_000) return 'Epic';
  if (rarity >= 100) return 'Rare';
  if (rarity >= 10) return 'Uncommon';
  return 'Common';
}

const TIER_NAMES: Record<RarityTierName, string[]> = {
  Common: ['Spark Orb', 'Mist Orb', 'Pebble Orb', 'Ember Orb', 'Dew Orb', 'Echo Orb'],
  Uncommon: ['Tide Orb', 'Vapor Orb', 'Gale Orb', 'Frost Orb', 'Amethyst Orb', 'Verdant Orb'],
  Rare: ['Chrono Orb', 'Prism Orb', 'Thunder Orb', 'Aurora Orb', 'Plasma Orb', 'Quartz Orb'],
  Epic: ['Aether Orb', 'Solaris Orb', 'Eclipse Orb', 'Radiant Orb', 'Abyssal Orb', 'Inferno Orb'],
  Legendary: ['Nova Orb', 'Starlight Orb', 'Quasar Orb', 'Vortex Orb', 'Nebula Orb', 'Supernova Orb'],
  Mythic: ['Singularity Orb', 'Cosmic Core Orb', 'Hypernova Orb', 'Dark Star Orb', 'Astral Rift Orb'],
  Relic: ['Infinite Relic', 'Omega Fragment', 'Primordial Core', 'Eternal Horizon', 'Void Monolith'],
  Divine: ['Divine Eternity', 'Celestial Pantheon', 'Omnipresent Eye', 'Seraphic Sphere'],
  Transcendent: ['The Absolute Zero', 'Infinity Point', 'Cosmic Monolith', 'Genesis Void'],
};

const TIER_COLORS: Record<RarityTierName, { color: string; bgGradient: string }> = {
  Common: {
    color: '#94a3b8',
    bgGradient: 'radial-gradient(circle at 35% 30%, #cbd5e1, #64748b 60%, #1e293b)',
  },
  Uncommon: {
    color: '#38bdf8',
    bgGradient: 'radial-gradient(circle at 35% 30%, #7dd3fc, #0284c7 60%, #0c4a6e)',
  },
  Rare: {
    color: '#c084fc',
    bgGradient: 'radial-gradient(circle at 35% 30%, #d8b4fe, #9333ea 60%, #581c87)',
  },
  Epic: {
    color: '#fb923c',
    bgGradient: 'radial-gradient(circle at 35% 30%, #fed7aa, #ea580c 60%, #7c2d12)',
  },
  Legendary: {
    color: '#4ade80',
    bgGradient: 'radial-gradient(circle at 35% 30%, #86efac, #16a34a 60%, #14532d)',
  },
  Mythic: {
    color: '#a855f7',
    bgGradient: 'radial-gradient(circle at 35% 30%, #d8b4fe, #7e22ce 60%, #3b0764)',
  },
  Relic: {
    color: '#f59e0b',
    bgGradient: 'radial-gradient(circle at 35% 30%, #fde68a, #d97706 60%, #451a03)',
  },
  Divine: {
    color: '#38bdf8',
    bgGradient: 'radial-gradient(circle at 35% 30%, #e0f2fe, #0284c7 40%, #4f46e5 80%)',
  },
  Transcendent: {
    color: '#ffffff',
    bgGradient: 'radial-gradient(circle at 35% 30%, #ffffff, #a855f7 35%, #06b6d4 70%, #030712 100%)',
  },
};

export function getOrbInfo(rarity: number): RarityTierInfo {
  const tier = getOrbTier(rarity);
  const names = TIER_NAMES[tier];
  const name = names[Math.abs(Math.floor(rarity)) % names.length];
  const { color, bgGradient } = TIER_COLORS[tier];

  return {
    rarity,
    name,
    tier,
    approxChance: `1 / ${rarity.toLocaleString()}`,
    color,
    bgGradient,
  };
}

/**
 * Continuous Rarity Distribution (Continuum RNG)
 * P(R >= r) = (2 * luck) / r
 * Every integer >= 2 is on the continuum.
 */
export function rollContinuum(luck: number): number {
  const u = Math.random();
  const effectiveLuck = Math.max(1, luck);
  const denominator = Math.pow(Math.max(1e-10, 1 - u), 1 / effectiveLuck);
  const rarity = Math.floor(2 / denominator);
  return Math.min(10_000_000_000, Math.max(2, rarity));
}

export interface ContinuumTierMilestone {
  tier: RarityTierName;
  minRarity: number;
  label: string;
  approxChance: string;
  coinsPerOrb: string;
  color: string;
}

export const CONTINUUM_TIERS: ContinuumTierMilestone[] = [
  { tier: 'Common', minRarity: 2, label: '1 / 2+', approxChance: '~50.0%', coinsPerOrb: '2 - 9 Coins', color: '#94a3b8' },
  { tier: 'Uncommon', minRarity: 10, label: '1 / 10+', approxChance: '~20.0%', coinsPerOrb: '10 - 99 Coins', color: '#38bdf8' },
  { tier: 'Rare', minRarity: 100, label: '1 / 100+', approxChance: '~2.0%', coinsPerOrb: '100 - 999 Coins', color: '#c084fc' },
  { tier: 'Epic', minRarity: 1000, label: '1 / 1,000+', approxChance: '~0.2% (1 in 500)', coinsPerOrb: '1,000 - 9,999 Coins', color: '#fb923c' },
  { tier: 'Legendary', minRarity: 10000, label: '1 / 10,000+', approxChance: '~0.02% (1 in 5,000)', coinsPerOrb: '10,000 - 99,999 Coins', color: '#4ade80' },
  { tier: 'Mythic', minRarity: 100000, label: '1 / 100,000+', approxChance: '~0.002% (1 in 50,000)', coinsPerOrb: '100,000 - 999,999 Coins', color: '#a855f7' },
  { tier: 'Relic', minRarity: 1000000, label: '1 / 1,000,000+', approxChance: '~0.0002% (1 in 500,000)', coinsPerOrb: '1,000,000 - 9,999,999 Coins', color: '#f59e0b' },
  { tier: 'Divine', minRarity: 10000000, label: '1 / 10,000,000+', approxChance: '~0.00002% (1 in 5,000,000)', coinsPerOrb: '10,000,000 - 99,999,999 Coins', color: '#38bdf8' },
  { tier: 'Transcendent', minRarity: 100000000, label: '1 / 100,000,000+', approxChance: '~0.000002% (1 in 50,000,000)', coinsPerOrb: '100,000,000+ Coins', color: '#ffffff' },
];

export interface CosmeticItem {
  id: string;
  name: string;
  desc: string;
  costCoins: number;
  costShards: number;
}

export const COSMETICS_LIST: CosmeticItem[] = [
  { id: 'default', name: 'Astral Classic', desc: 'Classic cosmic orb style.', costCoins: 0, costShards: 0 },
  { id: 'galaxy', name: 'Galaxy Void', desc: 'Swirling spiral galaxy aura.', costCoins: 1000, costShards: 0 },
  { id: 'solar', name: 'Solar Corona', desc: 'Sun flares and radiant corona.', costCoins: 5000, costShards: 5 },
  { id: 'cyber', name: 'Neon Cyberpunk', desc: 'Digital grid and pulsing matrix.', costCoins: 15000, costShards: 15 },
  { id: 'emerald', name: 'Emerald Aether', desc: 'Green crystalline orbiters.', costCoins: 50000, costShards: 30 },
  { id: 'divine', name: 'Divine Prismatic', desc: 'Golden halos and light rays.', costCoins: 250000, costShards: 100 },
];

export const COSMETICS = COSMETICS_LIST;

export interface PrestigeUpgradeInfo {
  name: string;
  desc: string;
  category: 'core' | 'qol' | 'alchemy';
  maxLevel: number;
  costPerLevel: number;
  qol?: boolean;
}

export const PRESTIGE_UPGRADES: Record<PrestigeUpgradeId, PrestigeUpgradeInfo> = {
  permLuck: {
    name: 'Permanent Luck',
    desc: '+5% luck on all future rolls.',
    category: 'core',
    maxLevel: 10,
    costPerLevel: 2,
  },
  permSpeed: {
    name: 'Permanent Speed Floor',
    desc: '-150ms lower cooldown limit.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 3,
  },
  vaultCap: {
    name: 'Vault Expansion',
    desc: '+250 offline roll storage capacity.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 1,
  },
  dustBounty: {
    name: 'Cosmic Dust Bounty',
    desc: '+10% bonus Dust earned on prestiges.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 5,
  },
  sonarPing: {
    name: 'Celestial Sonar',
    desc: 'Silent Mode with Rare Pings: Mutes routine rolls and pings a crystal chime whenever you roll a Rare or higher orb.',
    category: 'qol',
    maxLevel: 1,
    costPerLevel: 2,
    qol: true,
  },
  instantReveal: {
    name: 'Chrono-Skip',
    desc: 'Quick Roll: Unlocks an Instant Batch toggle that bypasses roll animation delays for instantaneous batch reveals.',
    category: 'qol',
    maxLevel: 1,
    costPerLevel: 2,
    qol: true,
  },
  autoOverclock: {
    name: 'Hyper-Automation',
    desc: 'Auto-roll runs 3% faster per rank and continues rolling without interruption.',
    category: 'qol',
    maxLevel: 5,
    costPerLevel: 2,
    qol: true,
  },
  transmutation: {
    name: 'Alchemical Transmutation',
    desc: 'Common & Uncommon rolls award +15% extra coins and have a 1% chance per rank to yield bonus Shards.',
    category: 'alchemy',
    maxLevel: 5,
    costPerLevel: 3,
  },
  shardSynthesis: {
    name: 'Astral Forge',
    desc: 'Unlocks the Astral Forge in the Prestige menu to transmute 10 Shards into 1 Cosmic Dust anytime.',
    category: 'alchemy',
    maxLevel: 1,
    costPerLevel: 4,
    qol: true,
  },
};

export function createInitialDailyQuests(): QuestItem[] {
  return [
    { id: 'daily-rolls-25', title: 'Warm-Up', desc: 'Perform 25 rolls', target: 25, progress: 0, rewardCoins: 100, rewardXp: 50, claimed: false },
    { id: 'daily-rolls-100', title: 'Dedicated', desc: 'Perform 100 rolls', target: 100, progress: 0, rewardCoins: 500, rewardShards: 2, rewardXp: 150, claimed: false },
    { id: 'daily-rare-100', title: 'Lucky Day', desc: 'Obtain an Orb with rarity 1/100 or higher', target: 1, progress: 0, rewardCoins: 300, rewardXp: 100, claimed: false },
    { id: 'daily-unique-3', title: 'Collector', desc: 'Obtain 3 unique Orbs today', target: 3, progress: 0, rewardCoins: 200, rewardXp: 80, claimed: false },
    { id: 'daily-social', title: 'Guild Visitor', desc: 'Open guilds or leaderboards', target: 1, progress: 0, rewardCoins: 150, rewardTokens: 10, rewardXp: 50, claimed: false },
  ];
}

export function createInitialWeeklyQuests(): QuestItem[] {
  return [
    { id: 'weekly-grind', title: 'The Grind', desc: 'Perform 1,000 rolls this week', target: 1000, progress: 0, rewardCoins: 5000, rewardShards: 15, rewardXp: 600, claimed: false },
    { id: 'weekly-epic', title: 'Rare Find', desc: 'Obtain an Epic Orb (1/1,000+) this week', target: 1, progress: 0, rewardCoins: 3000, rewardShards: 10, rewardXp: 400, claimed: false },
    { id: 'weekly-guild', title: 'Guild Duty', desc: 'Contribute 10,000 collection value', target: 10000, progress: 0, rewardCoins: 4000, rewardTokens: 50, rewardXp: 500, claimed: false },
    { id: 'weekly-share', title: 'Show-Off', desc: 'Share an Orb or milestone to Reddit', target: 1, progress: 0, rewardCoins: 1500, rewardShards: 5, rewardXp: 200, claimed: false },
  ];
}

export function createInitialState(now = Date.now()): PlayerState {
  const today = new Date(now).toISOString().slice(0, 10);
  return {
    coins: 50,
    shards: 5,
    cosmicDust: 0,
    level: 1,
    xp: 0,
    totalRolls: 0,
    highestRarity: 0,
    collectionValue: 0,
    lifetimeCollectionValue: 0,
    collection: {},
    lastRollAt: null,
    lastSeenAt: now,
    offlineRolls: 0,
    claimedAchievements: [],
    upgrades: { speed: 0, multi: 0, auto: 0, luck: 0 },
    prestigeCount: 0,
    prestigeUpgrades: { permLuck: 0, permSpeed: 0, vaultCap: 0, dustBounty: 0 },
    streak: { count: 1, lastClaimDate: '', longestStreak: 1 },
    dailyQuests: createInitialDailyQuests(),
    weeklyQuests: createInitialWeeklyQuests(),
    lastDailyReset: today,
    lastWeeklyReset: today,
    rollsSinceBest: 0,
    activeCosmetic: 'default',
    unlockedCosmetics: ['default'],
    turboRollUntil: 0,
  };
}

export const BASE_COOLDOWN_MS = 5_000;
export const AUTO_UNLOCK_COST = 150;
export const MAX_OFFLINE_ROLLS = 10_000;

export const SHARD_SYNTHESIS_COST = 10;

export function cooldownMs(s: PlayerState, isAuto = false) {
  const permReduction = (s.prestigeUpgrades?.permSpeed ?? 0) * 150;
  let cd = Math.max(800, Math.round((BASE_COOLDOWN_MS - permReduction) * Math.pow(0.88, s.upgrades.speed)));
  if (isAuto && (s.prestigeUpgrades?.autoOverclock ?? 0) > 0) {
    const overclockFactor = 1 - (s.prestigeUpgrades.autoOverclock * 0.03);
    cd = Math.max(600, Math.round(cd * overclockFactor));
  }
  if (s.turboRollUntil && Date.now() < s.turboRollUntil) {
    cd = Math.max(600, Math.round(cd * 0.8));
  }
  return cd;
}

export function rollsPerActivation(s: PlayerState) {
  const steps = [1, 2, 3, 5, 10, 25, 50, 100];
  const level = s.upgrades.multi ?? 0;
  return steps[Math.min(steps.length - 1, level)];
}

export function autoUnlocked(s: PlayerState) {
  return (s.upgrades.auto ?? 0) > 0;
}

export function luckMultiplier(s: PlayerState) {
  const permBonus = (s.prestigeUpgrades?.permLuck ?? 0) * 0.05;
  const levelBonus = Math.max(0, (s.level || 1) - 1) * 0.01;
  return 1 + (s.upgrades.luck ?? 0) * 0.08 + permBonus + levelBonus;
}

export function offlineRollCap(s: PlayerState) {
  const permVaultBonus = (s.prestigeUpgrades?.vaultCap ?? 0) * 250;
  return Math.min(MAX_OFFLINE_ROLLS, Math.round((60 + (s.upgrades.auto ?? 0) * 60) * (1 + s.upgrades.speed * 0.05)) + permVaultBonus);
}

/**
 * Paced coin progression formula.
 * Scales sublinearly with high rarity drops so gold accumulation is steady and meaningful.
 */
export function coinsForRarity(rarity: number): number {
  if (rarity <= 1) return 1;
  return Math.max(1, Math.round(Math.pow(rarity, 0.70)));
}

/**
 * Sustainable upgrade costs for steady gold progression
 */
export function upgradeCost(id: UpgradeId, level: number) {
  if (id === 'auto') return level ? Infinity : AUTO_UNLOCK_COST;
  const configs: Record<'speed' | 'multi' | 'luck', { base: number; mult: number }> = {
    speed: { base: 35, mult: 1.50 },
    multi: { base: 100, mult: 1.65 },
    luck: { base: 75, mult: 1.55 },
  };
  const { base, mult } = configs[id];
  return Math.floor(base * Math.pow(mult, level));
}

// Prestige formula: floor(sqrt(Lifetime Collection Value / 1,000,000))
export function calculatePrestigeDust(lifetimeCollectionValue: number): number {
  if (lifetimeCollectionValue < 1_000_000) return 0;
  return Math.floor(Math.sqrt(lifetimeCollectionValue / 1_000_000));
}

export function calculateCosmicDust(s: PlayerState): number {
  const base = calculatePrestigeDust(s.lifetimeCollectionValue);
  const bonus = (s.prestigeUpgrades?.dustBounty ?? 0) * 0.1;
  return Math.floor(base * (1 + bonus));
}

export function prestigeUpgradeCost(id: PrestigeUpgradeId, level: number): number {
  const bases: Record<PrestigeUpgradeId, number> = {
    permLuck: 2,
    permSpeed: 3,
    vaultCap: 1,
    dustBounty: 5,
    sonarPing: 2,
    instantReveal: 2,
    autoOverclock: 2,
    transmutation: 3,
    shardSynthesis: 4,
  };
  const base = bases[id] ?? 2;
  return Math.round(base * Math.pow(1.5, level));
}
