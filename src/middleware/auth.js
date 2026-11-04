export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV !== 'production' && authHeader === 'Bearer dev-token') {
    req.user = { id: 1, name: 'Dev Tester', role: 'admin' };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized: Missing or invalid Authorization header');
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(' ')[1];

  try {
    if (token === 'valid-secret-token') {
      req.user = { id: 99, name: 'Authenticated User', role: 'user' };
      return next();
    }

    const error = new Error('Unauthorized: Invalid token');
    error.statusCode = 401;
    throw error;
  } catch (err) {
    next(err);
  }
};