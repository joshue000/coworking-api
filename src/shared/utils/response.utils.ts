import { Response } from 'express';
import { PaginatedResult } from '../types/pagination.types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendPaginated<T>(res: Response, result: PaginatedResult<T>): void {
  res.status(200).json({ success: true, ...result });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown
): void {
  res
    .status(statusCode)
    .json({ success: false, error: { message, ...(details ? { details } : {}) } });
}
