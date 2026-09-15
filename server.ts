import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createApp } from './src/server/app.js';
import { context } from './src/server/devvit-mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Local development deliberately avoids the Devvit Vite plugin. The Devvit plugin
  // is production-only here; loading it in the standalone Express harness can prevent
  // Vite from serving the browser app in Codespaces.
  const app = createApp();
  const vite = await createViteServer({
    root: process.cwd(),
    configFile: false,
    plugins: [react(), tailwindcss()],
    server: {
      middlewareMode: true,
      host: '0.0.0.0',
      port: 3000,
      strictPort: false,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Infinity Orbs local server running at http://localhost:${port}`);
    console.log(`Local identity: ${context.username} (${context.userId}) in r/${context.subredditName}`);
    void __filename;
    void __dirname;
  });
}

startServer().catch((error) => {
  console.error('Failed to start Infinity Orbs:', error);
  process.exit(1);
});
