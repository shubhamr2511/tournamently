import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err?.name === 'ValidationError') {
    res
      .status(400)
      .json({ error: true, message: 'Validation error', details: err.errors });
    return;
  }

  if (err?.name === 'CastError') {
    res.status(400).json({ error: true, message: 'Invalid id format' });
    return;
  }

  console.error('[unhandled error]', err);
  res.status(500).json({
    error: true,
    message: err?.message || 'Internal server error',
  });
};
