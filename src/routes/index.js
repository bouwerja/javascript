import { Router } from 'express';
import { getUsers, getUserById, createUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const apiRouter = Router();

// --- Health Check Route (Unprotected) ---
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV });
});

// --- User Routes (Protected) ---
apiRouter.get('/users', authenticate, getUsers);
apiRouter.get('/users/:id', authenticate, getUserById);
apiRouter.post('/users', authenticate, createUser);

export default apiRouter;