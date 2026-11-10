export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const rawStatus = err.statusCode || err.status;
  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 
    ? rawStatus : 500;

  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(`[ErrorHandler] ${req.method} ${req.originalUrl} -> ${statusCode}`, err);
  }

  const message = isServerError ? 'Internal Server Error' : err.message || 'Request Failed';

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...err(isDevelopment && { stack: err.stack }),
    },
  });
};