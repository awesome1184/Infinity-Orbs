import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  getMe,
  roll,
  buyUpgrade,
  claimOffline,
  claimDailyStreak,
  claimQuest,
  prestige,
  buyPrestigeUpgrade,
  synthesizeDust,
  buyCosmetic,
  activateTurbo,
  recordSocialVisit,
  save,
} from './src/server/game.js';
/* --- DEV DEBUG START --- */
import { debugRouter } from './src/server/debug.js';
/* --- DEV DEBUG END --- */
import {
  achievements,
  claimAchievement,
  createGuild,
  guildInfo,
  joinGuild,
  leaveGuild,
  postGuildMessage,
  buyGuildPerk,
  donateToGuild,
  leaderboard,
  shareText,
  getCommunityEvent,
  setCommunityEventConfig,
} from './src/server/social.js';
import { type UpgradeId } from './src/shared/game.js';
import { context, reddit } from './src/server/devvit-mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Game API routes
  app.get('/api/me', async (req: Request, res: Response) => {
    try {
      const me = await getMe();
      res.json(me);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch player state.' });
    }
  });

  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const lb = await leaderboard();
      const s = await getMe();
      recordSocialVisit(s);
      res.json(lb);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch leaderboard.' });
    }
  });

  app.get('/api/guilds', async (req: Request, res: Response) => {
    try {
      const gd = await guildInfo();
      const s = await getMe();
      recordSocialVisit(s);
      res.json(gd);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch guilds.' });
    }
  });

  app.get('/api/world-event', async (req: Request, res: Response) => {
    try {
      const event = await getCommunityEvent();
      res.json(event);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch world event.' });
    }
  });

  app.post('/api/dev/event', async (req: Request, res: Response) => {
    try {
      const { goal, progress, addRolls, tier, buffMultiplier, reset } = req.body || {};
      const updated = await setCommunityEventConfig({ goal, progress, addRolls, tier, buffMultiplier, reset });
      res.json({ event: updated });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update community event.' });
    }
  });

  app.get('/api/achievements', async (req: Request, res: Response) => {
    try {
      const s = await getMe();
      const ach = await achievements(s);
      res.json(ach);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch achievements.' });
    }
  });

  app.post('/api/roll', async (req: Request, res: Response) => {
    try {
      const result = await roll();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Roll failed.' });
    }
  });

  app.post('/api/offline/claim', async (req: Request, res: Response) => {
    try {
      const result = await claimOffline();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Offline claim failed.' });
    }
  });

  app.post('/api/upgrade', async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const validUpgrades: UpgradeId[] = [
        'speed',
        'multi',
        'auto',
        'luck',
        'coinBonus',
        'shardChance',
        'xpBonus',
        'critChance',
        'critPower',
        'offlineRate',
        'valueBonus',
      ];
      if (!validUpgrades.includes(id as UpgradeId)) {
        res.status(400).json({ error: 'Unknown upgrade.' });
        return;
      }
      const state = await buyUpgrade(id as UpgradeId);
      res.json({ state });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Upgrade failed.' });
    }
  });

  app.post('/api/streak/claim', async (req: Request, res: Response) => {
    try {
      const result = await claimDailyStreak();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not claim daily streak.' });
    }
  });

  app.post('/api/quests/claim', async (req: Request, res: Response) => {
    try {
      const { type, id } = req.body || {};
      if (type !== 'daily' && type !== 'weekly') {
        res.status(400).json({ error: 'Invalid quest type.' });
        return;
      }
      const result = await claimQuest(type, id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not claim quest.' });
    }
  });

  app.post('/api/prestige', async (req: Request, res: Response) => {
    try {
      const result = await prestige();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Prestige failed.' });
    }
  });

  app.post('/api/prestige/upgrade', async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const validIds = [
        'permLuck',
        'permSpeed',
        'vaultCap',
        'dustBounty',
        'sonarPing',
        'instantReveal',
        'autoOverclock',
        'autoFilter',
        'resonanceMeter',
        'stellarMagnet',
        'chronoOverdrive',
        'transmutation',
        'shardSynthesis',
      ];
      if (!validIds.includes(id)) {
        res.status(400).json({ error: 'Invalid prestige upgrade.' });
        return;
      }
      const state = await buyPrestigeUpgrade(id);
      res.json({ state });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Prestige upgrade failed.' });
    }
  });

  app.post('/api/prestige/synthesize', async (req: Request, res: Response) => {
    try {
      const result = await synthesizeDust();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Dust synthesis failed.' });
    }
  });

  /* --- DEV DEBUG START --- */
  app.use('/api/dev', debugRouter);
  /* --- DEV DEBUG END --- */

  app.post('/api/cosmetics/buy', async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const state = await buyCosmetic(id);
      res.json({ state });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Cosmetic purchase failed.' });
    }
  });

  app.post('/api/turbo/activate', async (req: Request, res: Response) => {
    try {
      const state = await activateTurbo();
      res.json({ state });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to activate Turbo Roll.' });
    }
  });

  app.post('/api/achievements/claim', async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const s = await getMe();
      const result = await claimAchievement(s, id ?? '');
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not claim achievement.' });
    }
  });

  app.post('/api/guilds/create', async (req: Request, res: Response) => {
    try {
      const { name = '', tag = '' } = req.body || {};
      const guild = await createGuild(name, tag);
      res.json({ guild });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create guild.' });
    }
  });

  app.post('/api/guilds/join', async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const guild = await joinGuild(id ?? '');
      res.json({ guild });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not join guild.' });
    }
  });

  app.post('/api/guilds/leave', async (req: Request, res: Response) => {
    try {
      const result = await leaveGuild();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not leave guild.' });
    }
  });

  app.post('/api/guilds/chat', async (req: Request, res: Response) => {
    try {
      const { text = '' } = req.body || {};
      const msg = await postGuildMessage(text);
      res.json({ message: msg });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not post message.' });
    }
  });

  app.post('/api/guilds/perk', async (req: Request, res: Response) => {
    try {
      const { perk } = req.body || {};
      if (!['luckRank', 'speedRank', 'vaultRank'].includes(perk)) {
        res.status(400).json({ error: 'Invalid guild perk.' });
        return;
      }
      const result = await buyGuildPerk(perk);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to upgrade guild perk.' });
    }
  });

  app.post('/api/guilds/donate', async (req: Request, res: Response) => {
    try {
      const { coins = 0, shards = 0 } = req.body || {};
      const numCoins = Math.max(0, Math.floor(coins));
      const numShards = Math.max(0, Math.floor(shards));
      const s = await getMe();
      if (s.coins < numCoins) throw new Error('Not enough coins.');
      if ((s.shards ?? 0) < numShards) throw new Error('Not enough shards.');
      s.coins -= numCoins;
      s.shards = (s.shards ?? 0) - numShards;
      s.guildContribution = (s.guildContribution ?? 0) + numCoins + (numShards * 1000);
      await save(s);
      const result = await donateToGuild(numCoins, numShards);
      res.json({ ...result, state: s });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Donation failed.' });
    }
  });

  app.post('/api/share', async (req: Request, res: Response) => {
    try {
      const { rarity } = req.body || {};
      const s = await getMe();
      const value = Number(rarity);
      if (!Number.isInteger(value) || value <= 0 || value > s.highestRarity) {
        res.status(400).json({ error: 'Invalid Orb.' });
        return;
      }
      const text = shareText(s, value);
      const post = await reddit.submitCustomPost({
        runAs: 'USER',
        subredditName: context.subredditName,
        title: `I got a 1/${value.toLocaleString()} Orb in Infinity Orbs!`,
        entry: 'default',
        userGeneratedContent: { text },
      });
      res.json({ success: true, id: post.id, text });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create Reddit post.' });
    }
  });

  // Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
