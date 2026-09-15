import { redis, context } from '@devvit/web/server';
import { createInitialState, type PlayerState, type RollResponse, type UpgradeId, AUTO_UNLOCK_ROLLS, cooldownMs, rollsPerActivation, luckMultiplier, upgradeCost, offlineRollCap } from '../shared/game.js';
import { contribute, recordLeaderboard } from './social.js';

const key = () => `player:${context.userId ?? 'unknown'}`;

async function loadRaw(): Promise<PlayerState> {
  const raw = await redis.get(key());
  if (!raw) return createInitialState();
  const parsed = JSON.parse(raw) as Partial<PlayerState>;
  return {
    ...createInitialState(),
    ...parsed,
    upgrades: { ...createInitialState().upgrades, ...(parsed.upgrades ?? {}) },
    collection: parsed.collection ?? {},
    claimedAchievements: parsed.claimedAchievements ?? [],
  };
}

async function save(s: PlayerState) { await redis.set(key(), JSON.stringify(s)); }

const table = [
  [2, 5000], [5, 2000], [10, 1500], [25, 750], [100, 400], [1000, 100], [10000, 40], [100000, 9], [1000000, 1]
] as const;

function weightedOrb(luck: number) {
  const weights = table.map(([rarity, weight], i) => ({ rarity, weight: weight * (i === 0 ? 1 : 1 + luck * i * 0.08) }));
  const total = weights.reduce((a, x) => a + x.weight, 0);
  let r = Math.random() * total;
  for (const item of weights) { r -= item.weight; if (r <= 0) return item.rarity; }
  return 2;
}

async function applyRolls(s: PlayerState, activationCount = 1) {
  let best = 0;
  let contributionValue = 0;
  const rollCount = rollsPerActivation(s) * activationCount;
  for (let i = 0; i < rollCount; i++) {
    const rarity = weightedOrb(luckMultiplier(s));
    best = Math.max(best, rarity);
    contributionValue += rarity;
    s.totalRolls++;
    s.collectionValue += rarity;
    s.highestRarity = Math.max(s.highestRarity, rarity);
    s.collection[String(rarity)] = (s.collection[String(rarity)] ?? 0) + 1;
    s.coins += 10 + Math.min(100, Math.floor(Math.log10(rarity + 1) * 5));
    s.xp += 5 + Math.min(100, Math.floor(Math.log10(rarity + 1) * 3));
  }
  s.level = 1 + Math.floor(s.xp / 100);
  await contribute(contributionValue);
  return best;
}

async function settleOffline(s: PlayerState, now = Date.now()) {
  const elapsed = Math.max(0, now - s.lastSeenAt);
  if (s.upgrades.auto > 0 && elapsed >= 1000) {
    const gained = Math.floor(elapsed / cooldownMs(s));
    s.offlineRolls = Math.min(offlineRollCap(s), s.offlineRolls + gained);
  }
  s.lastSeenAt = now;
  await save(s);
  return s;
}

export async function getMe() {
  const s = await loadRaw();
  return settleOffline(s);
}

export async function claimOffline(): Promise<RollResponse> {
  const s = await settleOffline(await loadRaw());
  if (s.offlineRolls <= 0) throw new Error('No offline rolls are waiting.');
  const batches = s.offlineRolls;
  s.offlineRolls = 0;
  const best = await applyRolls(s, batches);
  const now = Date.now();
  s.lastRollAt = now;
  s.lastSeenAt = now;
  await save(s);
  await recordLeaderboard(s);
  return { orb: { rarity: best, rolledAt: now }, state: s, rollsRemainingUntilNext: cooldownMs(s) };
}

export async function roll(): Promise<RollResponse> {
  const s = await settleOffline(await loadRaw());
  const now = Date.now();
  const cd = cooldownMs(s);
  if (s.lastRollAt !== null && now - s.lastRollAt < cd) {
    throw new Error(`Cooldown: ${((cd - now + s.lastRollAt) / 1000).toFixed(1)}s`);
  }
  const best = await applyRolls(s);
  s.lastRollAt = now;
  s.lastSeenAt = now;
  await save(s);
  await recordLeaderboard(s);
  return { orb: { rarity: best, rolledAt: now }, state: s, rollsRemainingUntilNext: cd };
}

export async function buyUpgrade(id: UpgradeId) {
  const s = await settleOffline(await loadRaw());
  const level = s.upgrades[id];
  const cost = upgradeCost(id, level);
  if (id === 'auto' && level === 0 && s.totalRolls < AUTO_UNLOCK_ROLLS) {
    throw new Error(`Auto Roll unlocks after ${AUTO_UNLOCK_ROLLS} rolls.`);
  }
  if (!Number.isFinite(cost) || s.coins < cost) {
    throw new Error(`Need ${Number.isFinite(cost) ? cost.toLocaleString() : 'no more'} Coins.`);
  }
  s.coins -= cost;
  s.upgrades[id]++;
  await save(s);
  return s;
}
