export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // In development, automatically grant access if no header is supplied or dev-token is used
  if (process.env.NODE_ENV === 'development' && (!authHeader || authHeader === 'Bearer dev-token')) {
    req.user = { id: 1, name: 'Dev Tester', role: 'admin' };
    return next();
  }

  // In testing, require explicit dev-token header
  if (process.env.NODE_ENV === 'test' && authHeader === 'Bearer dev-token') {
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