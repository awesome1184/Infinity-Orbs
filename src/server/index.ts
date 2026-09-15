import { Hono } from 'hono';
import { getMe, roll, buyUpgrade, claimOffline } from './game.js';
import { achievements, claimAchievement, createGuild, guildInfo, joinGuild, leaderboard, shareText } from './social.js';
import { context, reddit } from './devvit-mock.js';

const app = new Hono();
app.get('/api/me', async c => c.json(await getMe()));
app.get('/api/leaderboard', async c => c.json(await leaderboard()));
app.get('/api/guilds', async c => c.json(await guildInfo()));
app.get('/api/achievements', async c => c.json(await achievements(await getMe())));

app.post('/api/roll', async c => {
  try { return c.json(await roll()); }
  catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Roll failed.' }, 400); }
});

app.post('/api/offline/claim', async c => {
  try { return c.json(await claimOffline()); }
  catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Offline claim failed.' }, 400); }
});

app.post('/api/upgrade', async c => {
  try {
    const { id } = await c.req.json<{id?: string}>();
    if (!['speed','multi','auto','luck'].includes(id ?? '')) return c.json({ error: 'Unknown upgrade.' }, 400);
    return c.json({ state: await buyUpgrade(id as 'speed'|'multi'|'auto'|'luck') });
  } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Upgrade failed.' }, 400); }
});

app.post('/api/achievements/claim', async c => {
  try {
    const { id } = await c.req.json<{id?: string}>();
    const s = await getMe();
    return c.json(await claimAchievement(s, id ?? ''));
  } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not claim achievement.' }, 400); }
});

app.post('/api/guilds/create', async c => {
  try { const { name = '', tag = '' } = await c.req.json<{name?: string; tag?: string}>(); return c.json({ guild: await createGuild(name, tag) }); }
  catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not create guild.' }, 400); }
});

app.post('/api/guilds/join', async c => {
  try { const { id } = await c.req.json<{id?: string}>(); return c.json({ guild: await joinGuild(id ?? '') }); }
  catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not join guild.' }, 400); }
});

app.post('/api/share', async c => {
  try {
    const { rarity } = await c.req.json<{rarity?: number}>();
    const s = await getMe();
    const value = Number(rarity);
    if (!Number.isInteger(value) || value <= 0 || value > s.highestRarity) return c.json({ error: 'Invalid Orb.' }, 400);
    const subredditName = context.subredditName;
    if (!subredditName) return c.json({ error: 'This share action must be used from a subreddit game post.' }, 400);
    const text = shareText(s, value);
    const post = await reddit.submitCustomPost({
      runAs: 'USER',
      subredditName,
      title: `I got a 1/${value.toLocaleString()} Orb in Infinity Orbs!`,
      entry: 'default',
      userGeneratedContent: { text },
    });
    return c.json({ success: true, id: post.id, text });
  } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not create Reddit post.' }, 400); }
});

export default app;
