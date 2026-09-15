import express from 'express';
import { debugRouter } from './debug.js';
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
} from './game.js';
import {
  achievements,
  claimAchievement,
  createGuild,
  guildInfo,
  joinGuild,
  leaveGuild,
  postGuildMessage,
  buyGuildPerk,
  leaderboard,
  shareText,
} from './social.js';
import { COMMUNITY_WORLD_EVENT } from '../shared/social.js';
import { context, reddit } from './devvit-mock.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/me', async (_req, res) => {
    try { res.json(await getMe()); }
    catch (e: any) { res.status(500).json({ error: e?.message || 'Failed to fetch player state.' }); }
  });

  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const lb = await leaderboard();
      const s = await getMe();
      recordSocialVisit(s);
      res.json(lb);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'Failed to fetch leaderboard.' }); }
  });

  app.get('/api/guilds', async (_req, res) => {
    try {
      const gd = await guildInfo();
      const s = await getMe();
      recordSocialVisit(s);
      res.json(gd);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'Failed to fetch guilds.' }); }
  });

  app.get('/api/world-event', (_req, res) => res.json(COMMUNITY_WORLD_EVENT));

  app.get('/api/achievements', async (_req, res) => {
    try { res.json(await achievements(await getMe())); }
    catch (e: any) { res.status(500).json({ error: e?.message || 'Failed to fetch achievements.' }); }
  });

  const badRequest = (res: express.Response, e: unknown, fallback: string) => {
    res.status(400).json({ error: e instanceof Error ? e.message : fallback });
  };

  app.post('/api/roll', async (_req, res) => {
    try { res.json(await roll()); } catch (e) { badRequest(res, e, 'Roll failed.'); }
  });

  app.post('/api/offline/claim', async (_req, res) => {
    try { res.json(await claimOffline()); } catch (e) { badRequest(res, e, 'Offline claim failed.'); }
  });

  app.post('/api/upgrade', async (req, res) => {
    try {
      const { id } = req.body || {};
      if (!['speed', 'multi', 'auto', 'luck'].includes(id ?? '')) return res.status(400).json({ error: 'Unknown upgrade.' });
      res.json({ state: await buyUpgrade(id) });
    } catch (e) { badRequest(res, e, 'Upgrade failed.'); }
  });

  app.post('/api/streak/claim', async (_req, res) => {
    try { res.json(await claimDailyStreak()); } catch (e) { badRequest(res, e, 'Could not claim daily streak.'); }
  });

  app.post('/api/quests/claim', async (req, res) => {
    try {
      const { type, id } = req.body || {};
      if (type !== 'daily' && type !== 'weekly') return res.status(400).json({ error: 'Invalid quest type.' });
      res.json(await claimQuest(type, id));
    } catch (e) { badRequest(res, e, 'Could not claim quest.'); }
  });

  app.post('/api/prestige', async (_req, res) => {
    try { res.json(await prestige()); } catch (e) { badRequest(res, e, 'Prestige failed.'); }
  });

  app.post('/api/prestige/upgrade', async (req, res) => {
    try {
      const { id } = req.body || {};
      const validIds = ['permLuck', 'permSpeed', 'vaultCap', 'dustBounty', 'sonarPing', 'instantReveal', 'autoOverclock', 'transmutation', 'shardSynthesis'];
      if (!validIds.includes(id)) return res.status(400).json({ error: 'Invalid prestige upgrade.' });
      res.json({ state: await buyPrestigeUpgrade(id) });
    } catch (e) { badRequest(res, e, 'Prestige upgrade failed.'); }
  });

  app.post('/api/prestige/synthesize', async (_req, res) => {
    try { res.json(await synthesizeDust()); } catch (e) { badRequest(res, e, 'Dust synthesis failed.'); }
  });

  app.use('/api/dev', debugRouter);

  app.post('/api/cosmetics/buy', async (req, res) => {
    try { res.json({ state: await buyCosmetic(req.body?.id) }); } catch (e) { badRequest(res, e, 'Cosmetic purchase failed.'); }
  });

  app.post('/api/turbo/activate', async (_req, res) => {
    try { res.json({ state: await activateTurbo() }); } catch (e) { badRequest(res, e, 'Failed to activate Turbo Roll.'); }
  });

  app.post('/api/achievements/claim', async (req, res) => {
    try {
      const s = await getMe();
      res.json(await claimAchievement(s, req.body?.id ?? ''));
    } catch (e) { badRequest(res, e, 'Could not claim achievement.'); }
  });

  app.post('/api/guilds/create', async (req, res) => {
    try { res.json({ guild: await createGuild(req.body?.name ?? '', req.body?.tag ?? '') }); }
    catch (e) { badRequest(res, e, 'Could not create guild.'); }
  });

  app.post('/api/guilds/join', async (req, res) => {
    try { res.json({ guild: await joinGuild(req.body?.id ?? '') }); }
    catch (e) { badRequest(res, e, 'Could not join guild.'); }
  });

  app.post('/api/guilds/leave', async (_req, res) => {
    try { res.json(await leaveGuild()); } catch (e) { badRequest(res, e, 'Could not leave guild.'); }
  });

  app.post('/api/guilds/chat', async (req, res) => {
    try { res.json({ message: await postGuildMessage(req.body?.text ?? '') }); }
    catch (e) { badRequest(res, e, 'Could not post message.'); }
  });

  app.post('/api/guilds/perk', async (req, res) => {
    try {
      const { perk } = req.body || {};
      if (!['luckRank', 'speedRank', 'vaultRank'].includes(perk)) return res.status(400).json({ error: 'Invalid guild perk.' });
      res.json(await buyGuildPerk(perk));
    } catch (e) { badRequest(res, e, 'Failed to upgrade guild perk.'); }
  });

  app.post('/api/share', async (req, res) => {
    try {
      const s = await getMe();
      const value = Number(req.body?.rarity);
      if (!Number.isInteger(value) || value <= 0 || value > s.highestRarity) return res.status(400).json({ error: 'Invalid Orb.' });
      const subredditName = context.subredditName;
      if (!subredditName) return res.status(400).json({ error: 'This share action must be used from a subreddit game post.' });
      const text = shareText(s, value);
      const post = await reddit.submitCustomPost({
        runAs: 'USER',
        subredditName,
        title: `I got a 1/${value.toLocaleString()} Orb in Infinity Orbs!`,
        entry: 'default',
        userGeneratedContent: { text },
      });
      res.json({ success: true, id: post.id, text });
    } catch (e) { badRequest(res, e, 'Could not create Reddit post.'); }
  });

  return app;
}
