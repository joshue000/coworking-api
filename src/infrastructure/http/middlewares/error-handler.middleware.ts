import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/domain.errors';

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ success: false, error: { message: err.message } });
    return;
  }

  console.error('[Unhandled error]', err);
  res.status(500).json({ success: false, error: { message: 'Internal server error' } });
}
