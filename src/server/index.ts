import { Hono } from 'hono';
import { getMe, roll, buyUpgrade } from './game.js';
import { achievements, createGuild, guildInfo, joinGuild, leaderboard, shareText } from './social.js';

const app = new Hono();
app.get('/api/me', async c => c.json(await getMe()));
app.get('/api/leaderboard', async c => c.json(await leaderboard()));
app.get('/api/guilds', async c => c.json(await guildInfo()));
app.get('/api/achievements', async c => c.json(await achievements(await getMe())));
app.post('/api/roll', async c => { try { return c.json(await roll()); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Roll failed.' }, 400); } });
app.post('/api/upgrade', async c => {
  try {
    const { id } = await c.req.json<{id?: string}>();
    if (!['speed','multi','auto','luck'].includes(id ?? '')) return c.json({ error: 'Unknown upgrade.' }, 400);
    return c.json({ state: await buyUpgrade(id as 'speed'|'multi'|'auto'|'luck') });
  } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Upgrade failed.' }, 400); }
});
app.post('/api/guilds/create', async c => { try { const { name = '', tag = '' } = await c.req.json<{name?: string; tag?: string}>(); return c.json({ guild: await createGuild(name, tag) }); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not create guild.' }, 400); } });
app.post('/api/guilds/join', async c => { try { const { id } = await c.req.json<{id?: string}>(); return c.json({ guild: await joinGuild(id ?? '') }); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not join guild.' }, 400); } });
app.post('/api/share', async c => { try { const { rarity } = await c.req.json<{rarity?: number}>(); const s = await getMe(); if (!rarity || rarity > s.highestRarity) return c.json({ error: 'Invalid Orb.' }, 400); return c.json({ text: shareText(s, rarity) }); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Could not prepare share.' }, 400); } });

export default app;
