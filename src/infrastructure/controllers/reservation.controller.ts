import { Request, Response, NextFunction } from 'express';
import { ReservationUseCases } from '../../application/use-cases/reservations/reservation.use-cases';
import { PaginationSchema, ReservationFiltersSchema } from '../../application/dtos/reservation.dto';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.utils';

export class ReservationController {
  constructor(private readonly useCases: ReservationUseCases) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = PaginationSchema.parse(req.query);
      const filters = ReservationFiltersSchema.parse(req.query);
      const result = await this.useCases.getAll(filters, params);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reservation = await this.useCases.getById(req.params['id'] as string);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reservation = await this.useCases.create(req.body);
      sendSuccess(res, reservation, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reservation = await this.useCases.update(req.params['id'] as string, req.body);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.delete(req.params['id'] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
