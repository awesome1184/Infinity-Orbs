import { context, redis } from './devvit-mock.js';
import type { Guild, LeaderboardEntry, Achievement, GuildMessage, GuildPerkId } from '../shared/social.js';
import { ACHIEVEMENTS, challengeForWeek } from '../shared/social.js';
import type { PlayerState } from '../shared/game.js';
import { cooldownMs } from '../shared/game.js';

const user = () => context.userId ?? 'unknown';
const username = () => context.username ?? `reddit-user-${user().slice(-8)}`;
const key = (name: string) => `io:${name}`;

async function loadGuilds(): Promise<Guild[]> {
  const raw = await redis.get(key('guilds'));
  const list: Guild[] = raw ? JSON.parse(raw) : [];
  list.forEach(g => {
    if (!g.perks) g.perks = { luckRank: 0, speedRank: 0, vaultRank: 0 };
  });
  return list;
}

async function saveGuilds(guilds: Guild[]) {
  await redis.set(key('guilds'), JSON.stringify(guilds));
}

export async function guildInfo() {
  const guilds = await loadGuilds();
  const mine = guilds.find(g => g.members.some(m => m.username === username()));
  return {
    guilds: guilds.sort((a, b) => b.xp - a.xp).slice(0, 20),
    mine: mine ?? null,
  };
}

export async function addGuildTokens(uname: string, amount: number) {
  if (amount <= 0) return;
  const guilds = await loadGuilds();
  const guild = guilds.find(g => g.members.some(m => m.username === uname));
  if (!guild) return;
  guild.tokens = (guild.tokens ?? 0) + amount;
  if (!guild.chat) guild.chat = [];
  guild.chat.push({
    id: `msg-${Date.now()}`,
    username: 'System',
    text: `${uname} contributed +${amount} Guild Tokens from quest completion!`,
    timestamp: Date.now(),
    isSystem: true,
  });
  await saveGuilds(guilds);
}

export async function buyGuildPerk(perk: GuildPerkId) {
  const guilds = await loadGuilds();
  const guild = guilds.find(g => g.members.some(m => m.username === username()));
  if (!guild) throw new Error('You are not in a guild.');
  if (!guild.perks) guild.perks = { luckRank: 0, speedRank: 0, vaultRank: 0 };

  const current = guild.perks[perk] ?? 0;
  if (current >= 10) throw new Error('Perk is already max rank (10).');

  const cost = (current + 1) * 25;
  if ((guild.tokens ?? 0) < cost) {
    throw new Error(`Guild needs ${cost} Guild Tokens.`);
  }

  guild.tokens -= cost;
  guild.perks[perk] = current + 1;

  const perkNames: Record<GuildPerkId, string> = {
    luckRank: 'Celestial Luck Aura',
    speedRank: 'Chronos Speed Blessing',
    vaultRank: 'Astral Vault Expansion',
  };

  if (!guild.chat) guild.chat = [];
  guild.chat.push({
    id: `msg-${Date.now()}`,
    username: 'System',
    text: `${username()} upgraded ${perkNames[perk]} to Rank ${guild.perks[perk]}!`,
    timestamp: Date.now(),
    isSystem: true,
  });

  await saveGuilds(guilds);
  return { guild, perk, level: guild.perks[perk] };
}

export async function createGuild(name: string, tag: string) {
  const cleanName = name.trim().slice(0, 32);
  const cleanTag = tag.trim().replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase();
  if (cleanName.length < 3 || cleanTag.length < 2) {
    throw new Error('Guild name must be 3+ chars and tag 2-5 letters.');
  }
  const guilds = await loadGuilds();
  if (guilds.some(g => g.name.toLowerCase() === cleanName.toLowerCase() || g.tag === cleanTag)) {
    throw new Error('That guild name or tag is already taken.');
  }
  if (guilds.some(g => g.members.some(m => m.username === username()))) {
    throw new Error('Leave your current guild first.');
  }
  const guild: Guild = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    tag: cleanTag,
    level: 1,
    xp: 0,
    tokens: 0,
    createdAt: Date.now(),
    challenge: challengeForWeek(),
    members: [{ username: username(), contribution: 0, role: 'owner', joinedAt: Date.now() }],
    chat: [{
      id: `msg-${Date.now()}`,
      username: 'System',
      text: `Guild [${cleanTag}] ${cleanName} was founded!`,
      timestamp: Date.now(),
      isSystem: true,
    }],
  };
  guilds.push(guild);
  await saveGuilds(guilds);
  return guild;
}

export async function joinGuild(guildId: string) {
  const guilds = await loadGuilds();
  if (guilds.some(g => g.members.some(m => m.username === username()))) {
    throw new Error('You are already in a guild.');
  }
  const guild = guilds.find(g => g.id === guildId);
  if (!guild) throw new Error('Guild not found.');
  if (guild.members.length >= 50) throw new Error('That guild is full (50/50 members).');
  guild.members.push({ username: username(), contribution: 0, role: 'member', joinedAt: Date.now() });
  if (!guild.chat) guild.chat = [];
  guild.chat.push({
    id: `msg-${Date.now()}`,
    username: 'System',
    text: `${username()} joined the guild.`,
    timestamp: Date.now(),
    isSystem: true,
  });
  await saveGuilds(guilds);
  return guild;
}

export async function leaveGuild() {
  const guilds = await loadGuilds();
  const guild = guilds.find(g => g.members.some(m => m.username === username()));
  if (!guild) throw new Error('You are not in a guild.');
  guild.members = guild.members.filter(m => m.username !== username());
  if (!guild.chat) guild.chat = [];
  guild.chat.push({
    id: `msg-${Date.now()}`,
    username: 'System',
    text: `${username()} left the guild.`,
    timestamp: Date.now(),
    isSystem: true,
  });
  await saveGuilds(guilds);
  return { success: true };
}

export async function postGuildMessage(text: string) {
  const clean = text.trim().slice(0, 200);
  if (!clean) throw new Error('Message cannot be empty.');
  const guilds = await loadGuilds();
  const guild = guilds.find(g => g.members.some(m => m.username === username()));
  if (!guild) throw new Error('You are not in a guild.');
  if (!guild.chat) guild.chat = [];
  const msg: GuildMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: username(),
    text: clean,
    timestamp: Date.now(),
  };
  guild.chat.push(msg);
  if (guild.chat.length > 50) guild.chat.shift();
  await saveGuilds(guilds);
  return msg;
}

export async function contribute(value: number) {
  if (value <= 0) return;
  const guilds = await loadGuilds();
  const guild = guilds.find(g => g.members.some(m => m.username === username()));
  if (!guild) return;
  const member = guild.members.find(m => m.username === username());
  if (!member) return;
  member.contribution += value;
  guild.xp += Math.max(1, Math.floor(value / 100));
  guild.level = 1 + Math.floor(guild.xp / 100);
  guild.tokens += Math.max(1, Math.floor(value / 10000));

  // Progress guild challenge
  if (guild.challenge) {
    if (guild.challenge.type === 'value') {
      guild.challenge.progress = Math.min(guild.challenge.target, guild.challenge.progress + value);
    } else if (guild.challenge.type === 'rolls') {
      guild.challenge.progress = Math.min(guild.challenge.target, guild.challenge.progress + 1);
    } else if (guild.challenge.type === 'rare' && value >= 100) {
      guild.challenge.progress = Math.min(guild.challenge.target, guild.challenge.progress + 1);
    }
  }

  await saveGuilds(guilds);
}

export async function leaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await redis.get(key('leaderboard'));
  const board: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
  return board.sort((a, b) => b.value - a.value).slice(0, 25);
}

export async function recordLeaderboard(s: PlayerState) {
  const board = await leaderboard();
  const name = username();
  const next: LeaderboardEntry = {
    username: name,
    value: s.collectionValue,
    highestRarity: s.highestRarity,
    totalRolls: s.totalRolls,
    level: s.level,
  };
  const existing = board.find(e => e.username === name);
  if (existing) Object.assign(existing, next);
  else board.push(next);
  board.sort((a, b) => b.value - a.value);
  await redis.set(key('leaderboard'), JSON.stringify(board.slice(0, 100)));
}

function unlocked(a: { id: string }, s: PlayerState): boolean {
  switch (a.id) {
    case 'first-roll': return s.totalRolls >= 1;
    case 'ten-rolls': return s.totalRolls >= 10;
    case 'roll-100': return s.totalRolls >= 100;
    case 'roll-1000': return s.totalRolls >= 1000;
    case 'auto': return s.upgrades.auto > 0;
    case 'speed-5s': return cooldownMs(s) <= 5000;
    case 'speed-1s': return cooldownMs(s) <= 1000;
    case 'multi-10': return s.upgrades.multi >= 4; // 10 rolls
    case 'rare-100': return s.highestRarity >= 100;
    case 'epic-1000': return s.highestRarity >= 1000;
    case 'legendary-10000': return s.highestRarity >= 10000;
    case 'mythic-100k': return s.highestRarity >= 100000;
    case 'divine-1m': return s.highestRarity >= 1000000;
    case 'collection-100k': return s.collectionValue >= 100000;
    case 'collection-1m': return s.collectionValue >= 1000000;
    case 'first-prestige': return s.prestigeCount > 0;
    default: return false;
  }
}

export async function achievements(s: PlayerState): Promise<Achievement[]> {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked(a, s),
    claimed: s.claimedAchievements.includes(a.id),
  }));
}

export async function claimAchievement(s: PlayerState, id: string) {
  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (!achievement) throw new Error('Achievement not found.');
  if (!unlocked(achievement, s)) throw new Error('Achievement is not unlocked yet.');
  if (s.claimedAchievements.includes(id)) throw new Error('Achievement reward already claimed.');
  s.claimedAchievements.push(id);
  s.coins += achievement.rewardCoins;
  s.shards = (s.shards ?? 0) + (achievement.rewardShards ?? 0);
  const raw = await redis.get(`player:${user()}`);
  if (!raw) throw new Error('Player state unavailable.');
  await redis.set(`player:${user()}`, JSON.stringify(s));
  return { state: s, rewardCoins: achievement.rewardCoins, rewardShards: achievement.rewardShards ?? 0 };
}

export function shareText(s: PlayerState, rarity: number) {
  return `I just found a 1/${rarity.toLocaleString()} Orb in ORBS — The Infinite Roll!\n\nPlayer: ${username()}\nRoll #${s.totalRolls.toLocaleString()} • Collection Value ${s.collectionValue.toLocaleString()}\n\nCan you beat probability?`;
}
