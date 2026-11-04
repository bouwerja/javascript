import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Single routes entry point
app.use('/api/v1', apiRouter);

// Global 404
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;