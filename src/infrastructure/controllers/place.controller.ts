import { Request, Response, NextFunction } from "express";
import { PlaceUseCases } from "../../application/use-cases/places/place.use-cases";
import { PaginationSchema } from "../../application/dtos/reservation.dto";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.utils";

export class PlaceController {
  constructor(private readonly useCases: PlaceUseCases) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = PaginationSchema.parse(req.query);
      const result = await this.useCases.getAll(params);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const place = await this.useCases.getById(req.params["id"] as string);
      sendSuccess(res, place);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const place = await this.useCases.create(req.body);
      sendSuccess(res, place, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const place = await this.useCases.update(req.params["id"] as string, req.body);
      sendSuccess(res, place);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.delete(req.params["id"] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
