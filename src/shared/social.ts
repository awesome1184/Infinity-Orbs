export type GuildRole = 'owner' | 'officer' | 'member';
export type ChallengeType = 'rolls' | 'value' | 'rare';

export interface GuildMember {
  username: string;
  contribution: number;
  role: GuildRole;
  joinedAt?: number;
}

export interface GuildChallenge {
  type: ChallengeType;
  target: number;
  progress: number;
  reward: number;
  label: string;
}

export interface GuildMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GuildPerks {
  luckRank: number; // +2% luck per rank for all guild members
  speedRank: number; // -40ms roll cooldown for all guild members
  vaultRank: number; // +100 offline capacity for all guild members
}

export type GuildPerkId = 'luckRank' | 'speedRank' | 'vaultRank';

export interface Guild {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  tokens: number;
  members: GuildMember[];
  createdAt: number;
  challenge: GuildChallenge;
  perks?: GuildPerks;
  chat?: GuildMessage[];
  bannerEffect?: string;
}

export interface LeaderboardEntry {
  username: string;
  value: number;
  highestRarity: number;
  totalRolls: number;
  level?: number;
  title?: string;
  guildTag?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rewardCoins: number;
  rewardShards?: number;
  unlocked: boolean;
  claimed: boolean;
  category?: 'rolling' | 'rarity' | 'upgrades' | 'prestige';
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  goal: number;
  currentProgress: number;
  buffDescription: string;
  endsAt: number;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'claimed'>[] = [
  { id: 'first-roll', name: 'First Roll', description: 'Perform your first roll.', rewardCoins: 50, category: 'rolling' },
  { id: 'ten-rolls', name: 'Getting Started', description: 'Perform 10 rolls.', rewardCoins: 150, category: 'rolling' },
  { id: 'roll-100', name: 'Dedicated Roller', description: 'Perform 100 rolls.', rewardCoins: 500, rewardShards: 2, category: 'rolling' },
  { id: 'roll-1000', name: 'The Grind', description: 'Perform 1,000 rolls.', rewardCoins: 2500, rewardShards: 10, category: 'rolling' },
  { id: 'auto', name: 'Automation Nation', description: 'Unlock Auto Roll.', rewardCoins: 300, category: 'upgrades' },
  { id: 'speed-5s', name: 'Faster', description: 'Reach a 5-second or lower cooldown.', rewardCoins: 400, category: 'upgrades' },
  { id: 'speed-1s', name: 'Machine', description: 'Reach a 1-second cooldown.', rewardCoins: 2000, rewardShards: 5, category: 'upgrades' },
  { id: 'multi-10', name: 'Multitasking', description: 'Unlock Multi Roll ×10.', rewardCoins: 1500, rewardShards: 5, category: 'upgrades' },
  { id: 'rare-100', name: 'Something Shiny', description: 'Find a 1/100 Chrono Orb.', rewardCoins: 250, category: 'rarity' },
  { id: 'epic-1000', name: 'Probability Enjoyer', description: 'Find an Epic 1/1,000+ Orb.', rewardCoins: 1000, rewardShards: 5, category: 'rarity' },
  { id: 'legendary-10000', name: 'Statistical Menace', description: 'Find a Legendary 1/10,000+ Orb.', rewardCoins: 3500, rewardShards: 15, category: 'rarity' },
  { id: 'mythic-100k', name: 'Unreasonably Lucky', description: 'Obtain an Orb of 1/100,000+ rarity.', rewardCoins: 12000, rewardShards: 35, category: 'rarity' },
  { id: 'divine-1m', name: 'Statistics Has Failed', description: 'Obtain a 1/1,000,000+ Relic Orb.', rewardCoins: 50000, rewardShards: 100, category: 'rarity' },
  { id: 'collection-100k', name: 'Collector Elite', description: 'Reach 100,000 Collection Value.', rewardCoins: 3000, rewardShards: 10, category: 'rarity' },
  { id: 'collection-1m', name: 'Millionaire', description: 'Reach 1,000,000 Collection Value.', rewardCoins: 15000, rewardShards: 50, category: 'rarity' },
  { id: 'first-prestige', name: 'Cosmic Awakening', description: 'Perform your first Prestige and claim Cosmic Dust.', rewardCoins: 10000, rewardShards: 25, category: 'prestige' },
];

export const CHALLENGE_POOL: GuildChallenge[] = [
  { type: 'rolls', target: 500, progress: 0, reward: 250, label: 'The Great Roll: 500 guild rolls' },
  { type: 'value', target: 50_000, progress: 0, reward: 500, label: 'Treasure Hunt: 50,000 collection value' },
  { type: 'rare', target: 5, progress: 0, reward: 750, label: 'Hunt the Mythic: discover five 1/100+ Orbs' },
];

export function challengeForWeek() {
  const week = Math.floor(Date.now() / 604_800_000);
  return { ...CHALLENGE_POOL[week % CHALLENGE_POOL.length] };
}

export const COMMUNITY_WORLD_EVENT: WorldEvent = {
  id: 'world-event-1',
  title: 'Community 1 Billion Roll Odyssey',
  description: 'The entire r/infinityorbs community is pooling luck to reach 1,000,000,000 collective rolls!',
  goal: 1_000_000_000,
  currentProgress: 642_184_920,
  buffDescription: '+20% Community Luck Surge Active',
  endsAt: Date.now() + 86400000 * 6,
};
