import { context, redis } from '@devvit/web/server';
import type { Guild, LeaderboardEntry, Achievement } from '../shared/social.js';
import { ACHIEVEMENTS } from '../shared/social.js';
import type { PlayerState } from '../shared/game.js';

const user = () => context.userId ?? 'unknown';
const username = () => `reddit-user-${user().slice(-8)}`;
const key = (name: string) => `io:${name}`;

async function loadGuilds(): Promise<Guild[]> {
  const raw = await redis.get(key('guilds'));
  return raw ? JSON.parse(raw) : [];
}
async function saveGuilds(guilds: Guild[]) { await redis.set(key('guilds'), JSON.stringify(guilds)); }

export async function guildInfo() {
  const guilds = await loadGuilds();
  const mine = guilds.find(g => g.members.some(m => m.username === username()));
  return { guilds: guilds.sort((a, b) => b.xp - a.xp).slice(0, 20), mine: mine ?? null };
}

export async function createGuild(name: string, tag: string) {
  const cleanName = name.trim().slice(0, 32);
  const cleanTag = tag.trim().replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase();
  if (cleanName.length < 3 || cleanTag.length < 2) throw new Error('Guild name must be 3+ chars and tag 2-5 letters.');
  const guilds = await loadGuilds();
  if (guilds.some(g => g.name.toLowerCase() === cleanName.toLowerCase() || g.tag === cleanTag)) throw new Error('That guild name or tag is already taken.');
  if (guilds.some(g => g.members.some(m => m.username === username()))) throw new Error('Leave your current guild first.');
  const guild: Guild = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: cleanName, tag: cleanTag, level: 1, xp: 0, tokens: 0, createdAt: Date.now(), members: [{ username: username(), contribution: 0, role: 'owner' }] };
  guilds.push(guild); await saveGuilds(guilds); return guild;
}

export async function joinGuild(guildId: string) {
  const guilds = await loadGuilds();
  if (guilds.some(g => g.members.some(m => m.username === username()))) throw new Error('You are already in a guild.');
  const guild = guilds.find(g => g.id === guildId);
  if (!guild) throw new Error('Guild not found.');
  if (guild.members.length >= 50) throw new Error('That guild is full.');
  guild.members.push({ username: username(), contribution: 0, role: 'member' });
  await saveGuilds(guilds); return guild;
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
  const next: LeaderboardEntry = { username: name, value: s.collectionValue, highestRarity: s.highestRarity, totalRolls: s.totalRolls };
  const existing = board.find(e => e.username === name);
  if (existing) Object.assign(existing, next); else board.push(next);
  board.sort((a, b) => b.value - a.value);
  await redis.set(key('leaderboard'), JSON.stringify(board.slice(0, 100)));
}

export async function achievements(s: PlayerState): Promise<Achievement[]> {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked:
    (a.id === 'first-roll' && s.totalRolls >= 1) ||
    (a.id === 'ten-rolls' && s.totalRolls >= 10) ||
    (a.id === 'auto' && s.upgrades.auto > 0) ||
    (a.id === 'rare-100' && s.highestRarity >= 100) ||
    (a.id === 'epic-1000' && s.highestRarity >= 1000) ||
    (a.id === 'legendary-10000' && s.highestRarity >= 10000) ||
    (a.id === 'mythic-100k' && s.highestRarity >= 100000) ||
    (a.id === 'roll-1000' && s.totalRolls >= 1000) ||
    (a.id === 'collection-1m' && s.collectionValue >= 1_000_000)
  }));
}

export function shareText(s: PlayerState, rarity: number) {
  return `I just found a 1/${rarity.toLocaleString()} Orb in Infinity Orbs!\\n\\nRoll #${s.totalRolls} • Collection Value ${s.collectionValue.toLocaleString()}\\n\\nCan you beat it?`;
}
