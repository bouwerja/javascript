// src/server.js
import app from './app.js';
import { startScheduler, stopScheduler } from './jobs/index.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {

  const server = app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });

  await startScheduler();

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(async () => {
      await stopScheduler();
      process.exit(1);
    });
  });

  const gracefulShutdown = async (signal) => {
    console.log(`[Process] Received ${signal}. Shutting down worker threads...`);
    server.close(async () => {
      await stopScheduler();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});