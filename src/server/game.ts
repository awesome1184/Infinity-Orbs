import { redis, context } from './devvit-mock.js';
import {
  createInitialState,
  type PlayerState,
  type RollResponse,
  type UpgradeId,
  type PrestigeUpgradeId,
  type Orb,
  AUTO_UNLOCK_COST,
  SHARD_SYNTHESIS_COST,
  PRESTIGE_UPGRADES,
  cooldownMs,
  rollsPerActivation,
  luckMultiplier,
  upgradeCost,
  prestigeUpgradeCost,
  calculatePrestigeDust,
  offlineRollCap,
  getOrbInfo,
  createInitialDailyQuests,
  createInitialWeeklyQuests,
  COSMETICS_LIST,
  rollContinuum,
  coinsForRarity,
} from '../shared/game.js';
import { contribute, recordLeaderboard, addGuildTokens } from './social.js';

const key = () => `player:${context.userId ?? 'unknown'}`;

export async function loadRaw(): Promise<PlayerState> {
  const raw = await redis.get(key());
  if (!raw) return createInitialState();
  const parsed = JSON.parse(raw) as Partial<PlayerState>;
  const base = createInitialState();
  return {
    ...base,
    ...parsed,
    upgrades: { ...base.upgrades, ...(parsed.upgrades ?? {}) },
    prestigeUpgrades: { ...base.prestigeUpgrades, ...(parsed.prestigeUpgrades ?? {}) },
    collection: parsed.collection ?? {},
    claimedAchievements: parsed.claimedAchievements ?? [],
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
    dailyQuests: parsed.dailyQuests?.length ? parsed.dailyQuests : base.dailyQuests,
    weeklyQuests: parsed.weeklyQuests?.length ? parsed.weeklyQuests : base.weeklyQuests,
    unlockedCosmetics: parsed.unlockedCosmetics?.length ? parsed.unlockedCosmetics : base.unlockedCosmetics,
  };
}

export async function save(s: PlayerState) {
  await redis.set(key(), JSON.stringify(s));
}

function advanceQuestProgress(s: PlayerState, type: 'roll' | 'rare' | 'value' | 'unique' | 'social', amount: number) {
  for (const q of s.dailyQuests) {
    if (q.claimed) continue;
    if (type === 'roll' && q.id.includes('rolls')) q.progress = Math.min(q.target, q.progress + amount);
    if (type === 'rare' && q.id.includes('rare') && amount >= 100) q.progress = Math.min(q.target, q.progress + 1);
    if (type === 'unique' && q.id.includes('unique')) q.progress = Math.min(q.target, Object.keys(s.collection).length);
    if (type === 'social' && q.id.includes('social')) q.progress = Math.min(q.target, q.progress + 1);
  }
  for (const q of s.weeklyQuests) {
    if (q.claimed) continue;
    if (type === 'roll' && q.id.includes('grind')) q.progress = Math.min(q.target, q.progress + amount);
    if (type === 'rare' && q.id.includes('epic') && amount >= 1000) q.progress = Math.min(q.target, q.progress + 1);
    if (type === 'value' && q.id.includes('guild')) q.progress = Math.min(q.target, q.progress + amount);
    if (type === 'social' && q.id.includes('share')) q.progress = Math.min(q.target, q.progress + 1);
  }
}

function checkPeriodicResets(s: PlayerState, now: number) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (s.lastDailyReset !== today) {
    s.dailyQuests = createInitialDailyQuests();
    s.lastDailyReset = today;
  }
  const currentWeek = Math.floor(now / 604_800_000);
  const lastWeek = s.lastWeeklyReset ? Math.floor(new Date(s.lastWeeklyReset).getTime() / 604_800_000) : 0;
  if (currentWeek !== lastWeek) {
    s.weeklyQuests = createInitialWeeklyQuests();
    s.lastWeeklyReset = today;
  }
}

export async function applyRolls(
  s: PlayerState,
  activationCount = 1,
  forcedRarity?: number
): Promise<{ bestOrb: Orb; batch: Orb[]; totalVal: number; coinsGained: number; shardsGained: number; xpGained: number }> {
  let bestRarity = 0;
  let totalVal = 0;
  let coinsGained = 0;
  let shardsGained = 0;
  let xpGained = 0;
  const batch: Orb[] = [];
  const rarities: number[] = [];
  const rollCount = rollsPerActivation(s) * activationCount;
  const now = Date.now();

  for (let i = 0; i < rollCount; i++) {
    // Continuum RNG generation or forced debug rarity
    const rarity = (forcedRarity && i === 0) ? forcedRarity : rollContinuum(luckMultiplier(s));
    totalVal += rarity;
    rarities.push(rarity);
    s.totalRolls++;
    s.collectionValue += rarity;
    s.lifetimeCollectionValue = (s.lifetimeCollectionValue ?? 0) + rarity;

    const isNew = !s.collection[String(rarity)];
    s.collection[String(rarity)] = (s.collection[String(rarity)] ?? 0) + 1;

    if (rarity > s.highestRarity) {
      s.highestRarity = rarity;
      s.rollsSinceBest = 0;
    } else {
      s.rollsSinceBest = (s.rollsSinceBest ?? 0) + 1;
    }

    if (rarity > bestRarity) {
      bestRarity = rarity;
    }

    const earnedXp = Math.min(200, 5 + Math.floor(Math.log10(rarity + 1) * 8));

    // Shards bonus for rare orbs (1,000+)
    let earnedShards = 0;
    if (rarity >= 1_000_000) earnedShards = 25;
    else if (rarity >= 100_000) earnedShards = 10;
    else if (rarity >= 10_000) earnedShards = 3;
    else if (rarity >= 1_000) earnedShards = 1;

    shardsGained += earnedShards;
    xpGained += earnedXp;

    const orbInfo = getOrbInfo(rarity);
    if (batch.length < 50) {
      batch.push({
        rarity,
        rolledAt: now,
        tier: orbInfo.tier,
        name: orbInfo.name,
        isNew,
      });
    }
  }

  // Balanced Gold progression: top rolled orb gives 100% coins; extra orbs in multi-roll give 20% bonus coins
  const dustBountyMul = 1 + (s.prestigeUpgrades?.dustBounty ?? 0) * 0.1;
  rarities.sort((a, b) => b - a);
  const topCoins = Math.round(coinsForRarity(rarities[0]) * dustBountyMul);
  const extraCoins = rarities.slice(1).reduce((acc, r) => acc + Math.max(1, Math.round(coinsForRarity(r) * dustBountyMul * 0.20)), 0);
  coinsGained = topCoins + extraCoins;

  // Alchemical Transmutation Prestige Upgrade: bonus coins & chance for shards
  const transLevel = s.prestigeUpgrades?.transmutation ?? 0;
  if (transLevel > 0) {
    coinsGained = Math.round(coinsGained * (1 + transLevel * 0.15));
    for (let i = 0; i < rollCount; i++) {
      if (Math.random() < 0.01 * transLevel) {
        shardsGained += 1;
      }
    }
  }

  s.coins += coinsGained;
  s.shards = (s.shards ?? 0) + shardsGained;
  s.xp += xpGained;
  s.level = 1 + Math.floor(s.xp / 100);

  advanceQuestProgress(s, 'roll', rollCount);
  if (bestRarity >= 100) advanceQuestProgress(s, 'rare', bestRarity);
  advanceQuestProgress(s, 'value', totalVal);
  advanceQuestProgress(s, 'unique', 0);

  void contribute(totalVal);

  const bestInfo = getOrbInfo(bestRarity);
  const bestOrb: Orb = {
    rarity: bestRarity,
    rolledAt: now,
    tier: bestInfo.tier,
    name: bestInfo.name,
    isNew: s.collection[String(bestRarity)] === 1,
  };

  return { bestOrb, batch, totalVal, coinsGained, shardsGained, xpGained };
}

export async function settleOffline(s: PlayerState): Promise<PlayerState> {
  const now = Date.now();
  checkPeriodicResets(s, now);

  const diff = now - (s.lastSeenAt || now);
  const cd = cooldownMs(s);
  if (diff >= cd) {
    const earned = Math.floor(diff / cd);
    const cap = offlineRollCap(s);
    s.offlineRolls = Math.min(cap, (s.offlineRolls || 0) + earned);
  }
  s.lastSeenAt = now;
  return s;
}

export async function getState(): Promise<PlayerState> {
  const s = await settleOffline(await loadRaw());
  await save(s);
  return s;
}

export const getMe = getState;

export async function checkOffline(): Promise<PlayerState> {
  const s = await loadRaw();
  return settleOffline(s);
}

export async function roll(): Promise<RollResponse> {
  const s = await settleOffline(await loadRaw());
  const now = Date.now();
  const cd = cooldownMs(s);
  if (s.lastRollAt !== null && now - s.lastRollAt < cd) {
    throw new Error(`Cooldown: ${((cd - now + s.lastRollAt) / 1000).toFixed(1)}s`);
  }

  const { bestOrb, batch, totalVal, coinsGained, shardsGained, xpGained } = await applyRolls(s);
  s.lastRollAt = now;
  s.lastSeenAt = now;
  await save(s);
  await recordLeaderboard(s);

  return {
    orb: bestOrb,
    batch,
    totalValueGained: totalVal,
    totalRollValue: totalVal,
    coinsGained,
    shardsGained,
    xpGained,
    state: s,
    rollsRemainingUntilNext: cd,
    dramaticReveal: bestOrb.rarity >= 100,
  };
}

export async function claimOffline(): Promise<RollResponse> {
  const s = await settleOffline(await loadRaw());
  if (s.offlineRolls <= 0) throw new Error('No offline rolls waiting.');
  const batches = s.offlineRolls;
  s.offlineRolls = 0;
  const { bestOrb, batch, totalVal, coinsGained, shardsGained, xpGained } = await applyRolls(s, batches);
  const now = Date.now();
  s.lastRollAt = now;
  s.lastSeenAt = now;
  await save(s);
  await recordLeaderboard(s);

  return {
    orb: bestOrb,
    batch,
    totalValueGained: totalVal,
    totalRollValue: totalVal,
    coinsGained,
    shardsGained,
    xpGained,
    state: s,
    rollsRemainingUntilNext: cooldownMs(s),
    dramaticReveal: bestOrb.rarity >= 100,
  };
}

export async function buyUpgrade(id: UpgradeId): Promise<PlayerState> {
  const s = await settleOffline(await loadRaw());
  const level = s.upgrades[id] ?? 0;
  const cost = upgradeCost(id, level);
  if (id === 'auto' && level === 0 && s.totalRolls < 10) {
    throw new Error('Auto Roll unlocks after 10 total rolls.');
  }
  if (!Number.isFinite(cost) || s.coins < cost) {
    throw new Error(`Need ${cost.toLocaleString()} Coins.`);
  }
  s.coins -= cost;
  s.upgrades[id] = (s.upgrades[id] ?? 0) + 1;
  await save(s);
  return s;
}

export async function claimDailyStreak(): Promise<{ state: PlayerState; rewardCoins: number; rewardShards: number; day: number }> {
  const s = await settleOffline(await loadRaw());
  const today = new Date().toISOString().slice(0, 10);
  if (s.streak.lastClaimDate === today) {
    throw new Error('Already claimed daily reward for today.');
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.streak.lastClaimDate === yesterday) {
    s.streak.count++;
  } else if (!s.streak.lastClaimDate) {
    s.streak.count = 1;
  } else {
    s.streak.count = 1;
  }

  s.streak.longestStreak = Math.max(s.streak.longestStreak, s.streak.count);
  s.streak.lastClaimDate = today;

  const day = ((s.streak.count - 1) % 7) + 1;
  const rewardCoins = day * 100;
  const rewardShards = day === 7 ? 15 : day === 3 ? 3 : 0;

  s.coins += rewardCoins;
  s.shards = (s.shards ?? 0) + rewardShards;

  await save(s);
  return { state: s, rewardCoins, rewardShards, day };
}

export async function claimQuest(type: 'daily' | 'weekly', id: string): Promise<{ state: PlayerState; rewardCoins: number; rewardShards: number; rewardTokens: number }> {
  const s = await settleOffline(await loadRaw());
  const list = type === 'daily' ? s.dailyQuests : s.weeklyQuests;
  const quest = list.find(q => q.id === id);
  if (!quest) throw new Error('Quest not found.');
  if (quest.claimed) throw new Error('Quest already claimed.');
  if (quest.progress < quest.target) throw new Error('Quest requirement not met.');

  quest.claimed = true;
  s.coins += quest.rewardCoins;
  s.shards = (s.shards ?? 0) + (quest.rewardShards ?? 0);
  s.xp += quest.rewardXp ?? 0;
  s.level = 1 + Math.floor(s.xp / 100);

  if (quest.rewardTokens && quest.rewardTokens > 0) {
    const username = context.username ?? `reddit-user-${(context.userId ?? 'unknown').slice(-8)}`;
    void addGuildTokens(username, quest.rewardTokens);
  }

  await save(s);
  return {
    state: s,
    rewardCoins: quest.rewardCoins,
    rewardShards: quest.rewardShards ?? 0,
    rewardTokens: quest.rewardTokens ?? 0,
  };
}

export async function prestige(): Promise<{ state: PlayerState; cosmicDustEarned: number }> {
  const s = await settleOffline(await loadRaw());
  const lifetime = s.lifetimeCollectionValue || s.collectionValue;
  const dustEarned = calculatePrestigeDust(lifetime);
  if (dustEarned <= 0) {
    throw new Error('Requires at least 1,000,000 Lifetime Collection Value.');
  }

  s.cosmicDust = (s.cosmicDust ?? 0) + dustEarned;
  s.prestigeCount = (s.prestigeCount ?? 0) + 1;

  // Reset coins & standard upgrades
  s.coins = 50;
  s.upgrades = { speed: 0, multi: 0, auto: 0, luck: 0 };
  s.collectionValue = 0;
  s.offlineRolls = 0;

  if (!s.claimedAchievements.includes('first-prestige')) {
    s.claimedAchievements.push('first-prestige');
  }

  await save(s);
  return { state: s, cosmicDustEarned: dustEarned };
}

export async function buyPrestigeUpgrade(id: PrestigeUpgradeId): Promise<PlayerState> {
  const s = await settleOffline(await loadRaw());
  const info = PRESTIGE_UPGRADES[id];
  if (!info) throw new Error('Unknown prestige upgrade.');
  if (!s.prestigeUpgrades) {
    s.prestigeUpgrades = {
      permLuck: 0,
      permSpeed: 0,
      vaultCap: 0,
      dustBounty: 0,
      sonarPing: 0,
      instantReveal: 0,
      autoOverclock: 0,
      transmutation: 0,
      shardSynthesis: 0,
    };
  }
  const current = s.prestigeUpgrades[id] ?? 0;
  if (current >= info.maxLevel) {
    throw new Error(`Upgrade ${info.name} is already at max level (${info.maxLevel}).`);
  }
  const cost = prestigeUpgradeCost(id, current);
  if (s.cosmicDust < cost) {
    throw new Error(`Need ${cost} Cosmic Dust.`);
  }

  s.cosmicDust -= cost;
  s.prestigeUpgrades[id] = current + 1;
  await save(s);
  return s;
}

export async function synthesizeDust(): Promise<{ state: PlayerState; dustEarned: number }> {
  const s = await settleOffline(await loadRaw());
  if ((s.prestigeUpgrades?.shardSynthesis ?? 0) < 1) {
    throw new Error('Astral Forge prestige upgrade is required to synthesize Cosmic Dust.');
  }
  if ((s.shards ?? 0) < SHARD_SYNTHESIS_COST) {
    throw new Error(`Synthesizing requires at least ${SHARD_SYNTHESIS_COST} Shards.`);
  }

  s.shards -= SHARD_SYNTHESIS_COST;
  s.cosmicDust = (s.cosmicDust ?? 0) + 1;
  await save(s);
  return { state: s, dustEarned: 1 };
}

export async function buyCosmetic(id: string): Promise<PlayerState> {
  const s = await settleOffline(await loadRaw());
  const cosmetic = COSMETICS_LIST.find(c => c.id === id);
  if (!cosmetic) throw new Error('Cosmetic not found.');
  if (s.unlockedCosmetics.includes(id)) {
    s.activeCosmetic = id;
    await save(s);
    return s;
  }

  if (s.coins < cosmetic.costCoins || s.shards < cosmetic.costShards) {
    throw new Error('Not enough Coins or Shards.');
  }

  s.coins -= cosmetic.costCoins;
  s.shards -= cosmetic.costShards;
  s.unlockedCosmetics.push(id);
  s.activeCosmetic = id;
  await save(s);
  return s;
}

export async function activateTurbo(): Promise<PlayerState> {
  const s = await settleOffline(await loadRaw());
  const costShards = 5;
  if (s.shards < costShards) {
    throw new Error('Turbo Roll requires 5 Shards.');
  }
  s.shards -= costShards;
  s.turboRollUntil = Math.max(Date.now(), s.turboRollUntil ?? 0) + 30 * 60 * 1000;
  await save(s);
  return s;
}

export function recordSocialVisit(s: PlayerState) {
  advanceQuestProgress(s, 'social', 1);
  void save(s);
}
