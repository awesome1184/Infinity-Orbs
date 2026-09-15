export type GuildRole = 'owner' | 'officer' | 'member';
export type ChallengeType = 'rolls' | 'value' | 'rare';

export interface GuildMember { username: string; contribution: number; role: GuildRole; }
export interface GuildChallenge { type: ChallengeType; target: number; progress: number; reward: number; label: string; }
export interface Guild { id: string; name: string; tag: string; level: number; xp: number; tokens: number; members: GuildMember[]; createdAt: number; challenge: GuildChallenge; }
export interface LeaderboardEntry { username: string; value: number; highestRarity: number; totalRolls: number; }
export interface Achievement { id: string; name: string; description: string; reward: number; unlocked: boolean; claimed: boolean; }

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'claimed'>[] = [
  { id: 'first-roll', name: 'First Roll', description: 'Perform your first roll.', reward: 25 },
  { id: 'ten-rolls', name: 'Getting Started', description: 'Perform 10 rolls.', reward: 100 },
  { id: 'auto', name: 'Automation Nation', description: 'Unlock Auto Roll.', reward: 250 },
  { id: 'rare-100', name: 'Something Shiny', description: 'Find a 1/100 Orb.', reward: 200 },
  { id: 'epic-1000', name: 'Probability Enjoyer', description: 'Find a 1/1,000 Orb.', reward: 750 },
  { id: 'legendary-10000', name: 'Statistical Menace', description: 'Find a 1/10,000 Orb.', reward: 2500 },
  { id: 'mythic-100k', name: 'The Outlier', description: 'Find a 1/100,000 Orb.', reward: 10000 },
  { id: 'roll-1000', name: 'The Grind', description: 'Perform 1,000 rolls.', reward: 5000 },
  { id: 'collection-1m', name: 'Millionaire', description: 'Reach 1,000,000 Collection Value.', reward: 10000 },
];

export const CHALLENGE_POOL: GuildChallenge[] = [
  { type: 'rolls', target: 500, progress: 0, reward: 250, label: 'Roll Together: 500 guild rolls' },
  { type: 'value', target: 50_000, progress: 0, reward: 500, label: 'Treasure Hunt: 50,000 collection value' },
  { type: 'rare', target: 5, progress: 0, reward: 750, label: 'Rare Hunt: discover five 1/100+ Orbs' },
];

export function challengeForWeek() {
  const week = Math.floor(Date.now() / 604_800_000);
  return { ...CHALLENGE_POOL[week % CHALLENGE_POOL.length] };
}
