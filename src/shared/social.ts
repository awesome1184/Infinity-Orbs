export type GuildRole = 'owner' | 'officer' | 'member';

export interface GuildMember {
  username: string;
  contribution: number;
  role: GuildRole;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  tokens: number;
  members: GuildMember[];
  createdAt: number;
}

export interface LeaderboardEntry {
  username: string;
  value: number;
  highestRarity: number;
  totalRolls: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
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
