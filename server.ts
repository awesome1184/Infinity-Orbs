import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app.js';
import { context, reddit } from './src/server/devvit-mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Local development stays fully offline and uses the in-memory Devvit mock.
  const app = createApp();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Infinity Orbs local server running at http://localhost:${port}`);
    console.log(`Local identity: ${context.username} (${context.userId}) in r/${context.subredditName}`);
    void reddit;
    void __filename;
    void __dirname;
  });
}

startServer().catch((error) => {
  console.error('Failed to start Infinity Orbs:', error);
  process.exit(1);
});
