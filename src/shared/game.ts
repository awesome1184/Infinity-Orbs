export type UpgradeId =
  | 'speed'
  | 'multi'
  | 'auto'
  | 'luck'
  | 'coinBonus'
  | 'shardChance'
  | 'xpBonus'
  | 'critChance'
  | 'critPower'
  | 'offlineRate'
  | 'valueBonus';

export type MasterySkillId =
  | 'continuumLuck'
  | 'prosperity'
  | 'shardAttunement'
  | 'critMastery'
  | 'chronoFlow'
  | 'infiniteVault'
  | 'cosmicAttunement'
  | 'celestialSurge'
  | 'pityAccelerant'
  | 'apexFortune';

export interface MasterySkillInfo {
  name: string;
  desc: string;
  maxLevel: number;
  costMultiplier: number;
}

export const MASTERY_SKILLS: Record<MasterySkillId, MasterySkillInfo> = {
  continuumLuck: {
    name: 'Continuum Attunement',
    desc: '+3% luck per level.',
    maxLevel: 50,
    costMultiplier: 1,
  },
  prosperity: {
    name: 'Midas Touch',
    desc: '+10% coins earned per level.',
    maxLevel: 30,
    costMultiplier: 1,
  },
  shardAttunement: {
    name: 'Shard Resonance',
    desc: '+0.3% shard drop chance on rolls per level.',
    maxLevel: 25,
    costMultiplier: 2,
  },
  critMastery: {
    name: 'Critical Overdrive',
    desc: '+2% critical chance and +0.2x crit multiplier per level.',
    maxLevel: 25,
    costMultiplier: 2,
  },
  chronoFlow: {
    name: 'Chrono Flow',
    desc: '-50ms cooldown floor per level.',
    maxLevel: 20,
    costMultiplier: 2,
  },
  infiniteVault: {
    name: 'Vault Architecture',
    desc: '+150 offline roll capacity per level.',
    maxLevel: 30,
    costMultiplier: 1,
  },
  cosmicAttunement: {
    name: 'Cosmic Affinity',
    desc: '+5% cosmic dust earned on prestige per level.',
    maxLevel: 20,
    costMultiplier: 3,
  },
  celestialSurge: {
    name: 'Codex Devotion',
    desc: '+1% permanent luck for every 5 unique orbs discovered per level.',
    maxLevel: 10,
    costMultiplier: 3,
  },
  pityAccelerant: {
    name: 'Pity Calibration',
    desc: 'Pity luck meter requires 2 fewer dry rolls per level.',
    maxLevel: 5,
    costMultiplier: 4,
  },
  apexFortune: {
    name: 'Apex Fortune',
    desc: '4% chance per level on multi-rolls to double the luck of that activation.',
    maxLevel: 15,
    costMultiplier: 3,
  },
};

export function masterySkillCost(id: MasterySkillId, currentLevel: number): number {
  const mult = MASTERY_SKILLS[id]?.costMultiplier ?? 1;
  return Math.max(1, Math.round(mult * (1 + currentLevel * 1.5)));
}

export type PrestigeUpgradeId =
  | 'permLuck'
  | 'permSpeed'
  | 'vaultCap'
  | 'dustBounty'
  | 'sonarPing'
  | 'instantReveal'
  | 'autoOverclock'
  | 'autoFilter'
  | 'resonanceMeter'
  | 'stellarMagnet'
  | 'chronoOverdrive'
  | 'transmutation'
  | 'shardSynthesis';

export interface Orb {
  rarity: number;
  rolledAt: number;
  tier: string;
  name: string;
  isNew?: boolean;
  isCrit?: boolean;
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
  totalCrits: number;
  lifetimeCoins: number;
  lifetimeShards: number;
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
  currentRunRolls?: number;
  questsCompleted?: number;
  guildContribution?: number;
  sacrifices?: {
    coinsSacrificed: number;
    shardsSacrificed: number;
    altarLevel: number;
    luckSurgeUntil?: number; // timestamp
  };
  masteryPoints?: number;
  masterySkills?: Record<MasterySkillId, number>;
  guildPerks?: {
    luckRank: number;
    speedRank: number;
    vaultRank: number;
  };
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
  { id: 'default', name: 'Classic', desc: 'Default orb skin.', costCoins: 0, costShards: 0 },
  { id: 'galaxy', name: 'Galaxy', desc: 'Galaxy orb skin.', costCoins: 1000, costShards: 0 },
  { id: 'solar', name: 'Solar', desc: 'Solar orb skin.', costCoins: 5000, costShards: 5 },
  { id: 'cyber', name: 'Cyber', desc: 'Cyberpunk orb skin.', costCoins: 15000, costShards: 15 },
  { id: 'emerald', name: 'Emerald', desc: 'Emerald orb skin.', costCoins: 50000, costShards: 30 },
  { id: 'divine', name: 'Prismatic', desc: 'Prismatic orb skin.', costCoins: 250000, costShards: 100 },
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
    desc: '+5% luck per level.',
    category: 'core',
    maxLevel: 10,
    costPerLevel: 2,
  },
  permSpeed: {
    name: 'Permanent Speed Floor',
    desc: '-150ms cooldown floor per level.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 3,
  },
  vaultCap: {
    name: 'Vault Expansion',
    desc: '+250 offline roll capacity per level.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 1,
  },
  dustBounty: {
    name: 'Cosmic Dust Bounty',
    desc: '+10% Cosmic Dust from prestige per level.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 5,
  },
  sonarPing: {
    name: 'Silent Alert Mode',
    desc: 'Mute normal rolls. Play audio alert on Rare+ orbs.',
    category: 'qol',
    maxLevel: 1,
    costPerLevel: 2,
    qol: true,
  },
  instantReveal: {
    name: 'Skip Animations',
    desc: 'Skip roll animation delays.',
    category: 'qol',
    maxLevel: 1,
    costPerLevel: 2,
    qol: true,
  },
  autoOverclock: {
    name: 'Auto-Roll Speed',
    desc: 'Auto-roll is 3% faster per level.',
    category: 'qol',
    maxLevel: 5,
    costPerLevel: 2,
    qol: true,
  },
  autoFilter: {
    name: 'Common Salvage',
    desc: '+25% coins from Common and Uncommon rolls.',
    category: 'qol',
    maxLevel: 1,
    costPerLevel: 3,
    qol: true,
  },
  resonanceMeter: {
    name: 'Dry Streak Luck',
    desc: '+1% luck for every 20 rolls without a Rare+ orb.',
    category: 'qol',
    maxLevel: 3,
    costPerLevel: 3,
    qol: true,
  },
  stellarMagnet: {
    name: 'Multi-Roll Extra',
    desc: '10% chance per level to roll +2 extra orbs on multi-roll.',
    category: 'core',
    maxLevel: 5,
    costPerLevel: 3,
  },
  chronoOverdrive: {
    name: 'Turbo Duration',
    desc: 'Turbo lasts 60m with 30% cooldown reduction.',
    category: 'alchemy',
    maxLevel: 2,
    costPerLevel: 4,
    qol: true,
  },
  transmutation: {
    name: 'Transmutation',
    desc: '+15% coins and 1% shard chance on low rarity rolls per level.',
    category: 'alchemy',
    maxLevel: 5,
    costPerLevel: 3,
  },
  shardSynthesis: {
    name: 'Dust Synthesis',
    desc: 'Convert 10 Shards into 1 Cosmic Dust.',
    category: 'alchemy',
    maxLevel: 1,
    costPerLevel: 4,
    qol: true,
  },
};

export function createInitialDailyQuests(): QuestItem[] {
  return [
    { id: 'daily-rolls-25', title: 'Roll 25 Times', desc: 'Perform 25 rolls', target: 25, progress: 0, rewardCoins: 100, rewardXp: 50, claimed: false },
    { id: 'daily-rolls-100', title: 'Roll 100 Times', desc: 'Perform 100 rolls', target: 100, progress: 0, rewardCoins: 500, rewardShards: 2, rewardXp: 150, claimed: false },
    { id: 'daily-rare-100', title: 'Find Rare Orb', desc: 'Obtain an orb with 1/100+ rarity', target: 1, progress: 0, rewardCoins: 300, rewardXp: 100, claimed: false },
    { id: 'daily-unique-3', title: 'Unique Orbs', desc: 'Obtain 3 unique orbs today', target: 3, progress: 0, rewardCoins: 200, rewardXp: 80, claimed: false },
    { id: 'daily-social', title: 'Guild Activity', desc: 'View guild or leaderboard', target: 1, progress: 0, rewardCoins: 150, rewardTokens: 10, rewardXp: 50, claimed: false },
  ];
}

export function createInitialWeeklyQuests(): QuestItem[] {
  return [
    { id: 'weekly-grind', title: 'Weekly Rolls', desc: 'Perform 1,000 rolls this week', target: 1000, progress: 0, rewardCoins: 5000, rewardShards: 15, rewardXp: 600, claimed: false },
    { id: 'weekly-epic', title: 'Find Epic Orb', desc: 'Obtain an Epic orb (1/1,000+)', target: 1, progress: 0, rewardCoins: 3000, rewardShards: 10, rewardXp: 400, claimed: false },
    { id: 'weekly-guild', title: 'Collection Value', desc: 'Contribute 10,000 collection value', target: 10000, progress: 0, rewardCoins: 4000, rewardTokens: 50, rewardXp: 500, claimed: false },
    { id: 'weekly-share', title: 'Share Post', desc: 'Share an orb to Reddit', target: 1, progress: 0, rewardCoins: 1500, rewardShards: 5, rewardXp: 200, claimed: false },
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
    totalCrits: 0,
    lifetimeCoins: 50,
    lifetimeShards: 5,
    highestRarity: 0,
    collectionValue: 0,
    lifetimeCollectionValue: 0,
    collection: {},
    lastRollAt: null,
    lastSeenAt: now,
    offlineRolls: 0,
    claimedAchievements: [],
    upgrades: {
      speed: 0,
      multi: 0,
      auto: 0,
      luck: 0,
      coinBonus: 0,
      shardChance: 0,
      xpBonus: 0,
      critChance: 0,
      critPower: 0,
      offlineRate: 0,
      valueBonus: 0,
    },
    prestigeCount: 0,
    prestigeUpgrades: {
      permLuck: 0,
      permSpeed: 0,
      vaultCap: 0,
      dustBounty: 0,
      sonarPing: 0,
      instantReveal: 0,
      autoOverclock: 0,
      autoFilter: 0,
      resonanceMeter: 0,
      stellarMagnet: 0,
      chronoOverdrive: 0,
      transmutation: 0,
      shardSynthesis: 0,
    },
    streak: { count: 1, lastClaimDate: '', longestStreak: 1 },
    dailyQuests: createInitialDailyQuests(),
    weeklyQuests: createInitialWeeklyQuests(),
    lastDailyReset: today,
    lastWeeklyReset: today,
    rollsSinceBest: 0,
    activeCosmetic: 'default',
    unlockedCosmetics: ['default'],
    turboRollUntil: 0,
    currentRunRolls: 0,
    questsCompleted: 0,
    guildContribution: 0,
    sacrifices: {
      coinsSacrificed: 0,
      shardsSacrificed: 0,
      altarLevel: 0,
      luckSurgeUntil: 0,
    },
    masteryPoints: 0,
    masterySkills: {
      continuumLuck: 0,
      prosperity: 0,
      shardAttunement: 0,
      critMastery: 0,
      chronoFlow: 0,
      infiniteVault: 0,
      cosmicAttunement: 0,
      celestialSurge: 0,
      pityAccelerant: 0,
      apexFortune: 0,
    },
    guildPerks: { luckRank: 0, speedRank: 0, vaultRank: 0 },
  };
}

// Paced cooldown and offline tick (slowed down for balanced, long-term progression)
export const BASE_COOLDOWN_MS = 8_000;
export const AUTO_UNLOCK_COST = 200;
export const MAX_OFFLINE_ROLLS = 1_000;
export const OFFLINE_TICK_MS = 60_000; // 1 offline roll every 60 seconds

export const SHARD_SYNTHESIS_COST = 10;

export function effectiveOfflineTickMs(s: PlayerState): number {
  const rateReduction = (s.upgrades.offlineRate ?? 0) * 0.08;
  return Math.max(20_000, Math.round(OFFLINE_TICK_MS * (1 - Math.min(0.6, rateReduction))));
}

export function critMultiplier(s: PlayerState): number {
  const masteryCritPower = (s.masterySkills?.critMastery ?? 0) * 0.20;
  return 2.0 + (s.upgrades.critPower ?? 0) * 0.25 + masteryCritPower;
}

export function cooldownMs(s: PlayerState, isAuto = false) {
  const permReduction = (s.prestigeUpgrades?.permSpeed ?? 0) * 150;
  const guildSpeedReduction = (s.guildPerks?.speedRank ?? 0) * 40;
  const masteryChronoReduction = (s.masterySkills?.chronoFlow ?? 0) * 50;
  let cd = Math.max(
    800,
    Math.round(
      (BASE_COOLDOWN_MS - permReduction - guildSpeedReduction - masteryChronoReduction) *
        Math.pow(0.92, s.upgrades.speed ?? 0)
    )
  );
  if (isAuto && (s.prestigeUpgrades?.autoOverclock ?? 0) > 0) {
    const overclockFactor = 1 - (s.prestigeUpgrades.autoOverclock * 0.03);
    cd = Math.max(700, Math.round(cd * overclockFactor));
  }
  if (s.turboRollUntil && Date.now() < s.turboRollUntil) {
    const turboReduction = (s.prestigeUpgrades?.chronoOverdrive ?? 0) > 0 ? 0.70 : 0.80;
    cd = Math.max(600, Math.round(cd * turboReduction));
  }
  return cd;
}

export function rollsPerActivation(s: PlayerState) {
  const steps = [1, 2, 3, 5, 8, 12, 20, 50, 100];
  const level = s.upgrades.multi ?? 0;
  return steps[Math.min(steps.length - 1, level)];
}

export function autoUnlocked(s: PlayerState) {
  return (s.upgrades.auto ?? 0) > 0;
}

export function luckMultiplier(s: PlayerState) {
  const permBonus = (s.prestigeUpgrades?.permLuck ?? 0) * 0.05;
  const levelBonus = Math.max(0, (s.level || 1) - 1) * 0.01;
  const guildLuckBonus = (s.guildPerks?.luckRank ?? 0) * 0.02;

  // Sacrificial Altar Devotion Luck
  const altarDevotionLuck = (s.sacrifices?.altarLevel ?? 0) * 0.01;
  const shardInfusionLuck = (s.sacrifices?.shardsSacrificed ?? 0) * 0.02;
  const isSurgeActive = Boolean(s.sacrifices?.luckSurgeUntil && Date.now() < s.sacrifices.luckSurgeUntil);
  const surgeLuck = isSurgeActive ? 0.25 : 0;

  // Celestial Mastery Tree Luck
  const masteryLuck = (s.masterySkills?.continuumLuck ?? 0) * 0.03;
  const codexTier = Math.floor(Object.keys(s.collection || {}).length / 5);
  const codexDevotionLuck = (s.masterySkills?.celestialSurge ?? 0) * (codexTier * 0.01);

  let resonanceBonus = 0;
  if ((s.prestigeUpgrades?.resonanceMeter ?? 0) > 0) {
    const dryRolls = s.rollsSinceBest ?? 0;
    const interval = Math.max(8, 20 - (s.masterySkills?.pityAccelerant ?? 0) * 2);
    resonanceBonus = s.prestigeUpgrades.resonanceMeter * (Math.min(100, Math.floor(dryRolls / interval)) * 0.01);
  }

  return (
    1 +
    (s.upgrades.luck ?? 0) * 0.08 +
    permBonus +
    levelBonus +
    guildLuckBonus +
    altarDevotionLuck +
    shardInfusionLuck +
    surgeLuck +
    masteryLuck +
    codexDevotionLuck +
    resonanceBonus
  );
}

export function offlineRollCap(s: PlayerState) {
  const permVaultBonus = (s.prestigeUpgrades?.vaultCap ?? 0) * 250;
  const guildVaultBonus = (s.guildPerks?.vaultRank ?? 0) * 100;
  return Math.min(
    MAX_OFFLINE_ROLLS,
    Math.round((30 + (s.upgrades.auto ?? 0) * 20) * (1 + (s.upgrades.speed ?? 0) * 0.04)) +
      permVaultBonus +
      guildVaultBonus
  );
}

/**
 * Paced coin progression formula.
 */
export function coinsForRarity(rarity: number): number {
  if (rarity <= 1) return 1;
  return Math.max(1, Math.round(Math.pow(rarity, 0.68)));
}

/**
 * Sustainable upgrade costs
 */
export function upgradeCost(id: UpgradeId, level: number) {
  if (id === 'auto') return level ? Infinity : AUTO_UNLOCK_COST;
  const configs: Record<Exclude<UpgradeId, 'auto'>, { base: number; mult: number }> = {
    speed: { base: 35, mult: 1.50 },
    multi: { base: 100, mult: 1.65 },
    luck: { base: 75, mult: 1.55 },
    coinBonus: { base: 50, mult: 1.45 },
    shardChance: { base: 150, mult: 1.60 },
    xpBonus: { base: 45, mult: 1.40 },
    critChance: { base: 100, mult: 1.55 },
    critPower: { base: 120, mult: 1.55 },
    offlineRate: { base: 90, mult: 1.50 },
    valueBonus: { base: 80, mult: 1.50 },
  };
  const { base, mult } = configs[id];
  return Math.floor(base * Math.pow(mult, level));
}

// Prestige formula: floor(sqrt(Collection Value / 1,000,000))
// Strictly based on current prestige run's collection value so you cannot prestige infinitely.
export function calculatePrestigeDust(collectionValue: number): number {
  if (!collectionValue || collectionValue < 1_000_000) return 0;
  return Math.floor(Math.sqrt(collectionValue / 1_000_000));
}

export function calculateCosmicDust(s: PlayerState): number {
  const currentVal = s.collectionValue ?? 0;
  if (currentVal < 1_000_000) return 0;
  const base = calculatePrestigeDust(currentVal);
  if (base <= 0) return 0;
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
    autoFilter: 3,
    resonanceMeter: 3,
    stellarMagnet: 3,
    chronoOverdrive: 4,
    transmutation: 3,
    shardSynthesis: 4,
  };
  const base = bases[id] ?? 2;
  return Math.round(base * Math.pow(1.5, level));
}
