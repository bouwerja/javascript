import http from 'node:http';
import { createApp } from './app.js';
import { db, pool } from './db/index.js';
import { UserModel } from './models/userModel.js';
import { startScheduler, stopScheduler } from './jobs/index.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

/* ---------- Configuration (the only place process.env is read for the app) ---------- */

function loadConfig() {
  const nodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    throw new Error('NODE_ENV must be set (development, test or production).');
  }
  if (nodeEnv === 'production' && process.env.AUTH_DEV_BYPASS === 'true') {
    throw new Error('AUTH_DEV_BYPASS must not be enabled in production.');
  }

  return {
    nodeEnv,
    port: Number(process.env.PORT) || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : false,
    schedulerEnabled: process.env.SCHEDULER_ENABLED === 'true',
  };
}


const state = {
  server: null,
  schedulerStarted: false,
  shuttingDown: false,
};


async function bootstrap() {
  const config = loadConfig();

  // Fail fast if the database is unreachable.
  await pool.query('SELECT 1');

  const app = createApp({
    models: { user: new UserModel(db) },
    config,
  });

  state.server = http.createServer(app);
  await new Promise((resolve, reject) => {
    state.server.once('error', reject); // e.g. EADDRINUSE
    state.server.listen(config.port, resolve);
  });
  console.log(`[Server] API running on http://localhost:${config.port}${config.apiPrefix}`);

  if (config.schedulerEnabled) {
    await startScheduler();
    state.schedulerStarted = true;
  } else {
    console.log('[Scheduler] Disabled (set SCHEDULER_ENABLED=true to enable).');
  }
}


async function shutdown(reason, exitCode = 0) {
  if (state.shuttingDown) return; // ignore repeated signals
  state.shuttingDown = true;
  console.log(`[Server] Shutting down (${reason})...`);

  const forceExit = setTimeout(() => {
    console.error(`[Server] Shutdown exceeded ${SHUTDOWN_TIMEOUT_MS} ms; forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (state.server) {
      await new Promise((resolve) => state.server.close(() => resolve()));
    }
    if (state.schedulerStarted) {
      await stopScheduler();
    }
    await pool.end();
  } catch (err) {
    console.error('[Server] Error during shutdown:', err);
    exitCode = 1;
  } finally {
    clearTimeout(forceExit);
    process.exit(exitCode);
  }
}


process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
  shutdown('uncaughtException', 1);
});

bootstrap().catch((err) => {
  console.error('[Server] Failed to start:', err);
  shutdown('startup failure', 1);
});
