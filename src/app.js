import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createApiRouter } from './routes/index.js';
import { NotFoundError } from './errors.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ models, config = {} }) {
  
  const { corsOrigin = false, apiPrefix = '/api/v1' } = config;

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use(apiPrefix, createApiRouter({ models }));

  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}