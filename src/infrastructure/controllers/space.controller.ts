import { Request, Response, NextFunction } from "express";
import { SpaceUseCases } from "../../application/use-cases/spaces/space.use-cases";
import { PaginationSchema } from "../../application/dtos/reservation.dto";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.utils";

export class SpaceController {
  constructor(private readonly useCases: SpaceUseCases) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = PaginationSchema.parse(req.query);
      const result = await this.useCases.getAll(params);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getByPlaceId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = PaginationSchema.parse(req.query);
      const result = await this.useCases.getByPlaceId(req.params["placeId"] as string, params);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const space = await this.useCases.getById(req.params["id"] as string);
      sendSuccess(res, space);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const space = await this.useCases.create(req.body);
      sendSuccess(res, space, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const space = await this.useCases.update(req.params["id"] as string, req.body);
      sendSuccess(res, space);
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
