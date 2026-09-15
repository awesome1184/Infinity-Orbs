import { Hono } from 'hono';
import { getMe, roll, buyUpgrade } from './game.js';
const app = new Hono();
app.get('/api/me', async c => c.json(await getMe()));
app.post('/api/roll', async c => { try { return c.json(await roll()); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Roll failed.' }, 400); } });
app.post('/api/upgrade', async c => { try { const { id } = await c.req.json<{id?: string}>(); if (!['speed','multi','auto','luck'].includes(id ?? '')) return c.json({ error: 'Unknown upgrade.' }, 400); return c.json({ state: await buyUpgrade(id as any) }); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Upgrade failed.' }, 400); } });
export default app;
