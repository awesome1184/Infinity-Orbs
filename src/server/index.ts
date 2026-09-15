import {
  createServer,
  getServerPort,
  context as devvitContext,
  redis as devvitRedis,
  reddit as devvitReddit,
} from '@devvit/web/server';
import { createApp } from './app.js';
import { configureDevvitRuntime } from './devvit-mock.js';

// Keep the game logic storage-agnostic: the same route app runs locally with the
// in-memory mock and on Reddit with Devvit's request-scoped services.
configureDevvitRuntime({
  redis: devvitRedis,
  context: devvitContext,
  reddit: devvitReddit,
});

const app = createApp();
const server = createServer(app);

server.on('error', (error) => {
  console.error(`Infinity Orbs Devvit server error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
});

server.listen(getServerPort(), () => {
  console.log('Infinity Orbs Devvit server is listening.');
});
