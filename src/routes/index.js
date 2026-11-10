import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createUserController } from '../controllers/userController.js';

export function createApiRouter({ models }) {

  const userController = createUserController({ userModel: models.user });

  const router = Router();

  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router.use(authenticate);

  router.get('/users', userController.list);
  router.get('/users/:id', userController.getById);
  router.post('/users', userController.create);

  return router;
}
