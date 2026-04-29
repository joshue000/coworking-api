import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { DesiredPublisher } from '../mqtt/publishers/desired.publisher';
import { UpdateDeviceDesiredSchema } from '../../application/dtos/device.dto';
import { sendSuccess } from '../../shared/utils/response.utils';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { PaginationSchema } from '../../application/dtos/reservation.dto';

export class IoTController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly desiredPublisher: DesiredPublisher
  ) {}

  getSpaceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const spaceId = req.params['spaceId'] as string;

      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
        include: { place: true, deviceDesired: true, deviceReported: true },
      });
      if (!space) throw new NotFoundError('Space', spaceId);

      const latestAggregation = await this.prisma.telemetryAggregation.findFirst({
        where: { spaceId: space.id },
        orderBy: { windowEnd: 'desc' },
      });

      const activeAlert = await this.prisma.alert.findFirst({
        where: { spaceId: space.id, resolvedAt: null },
        orderBy: { startedAt: 'desc' },
      });

      sendSuccess(res, {
        space: {
          id: space.id,
          name: space.name,
          capacity: space.capacity,
          opensAt: space.opensAt,
          closesAt: space.closesAt,
        },
        place: { id: space.place.id, name: space.place.name, timezone: space.place.timezone },
        deviceDesired: space.deviceDesired,
        deviceReported: space.deviceReported,
        latestTelemetry: latestAggregation,
        activeAlert,
      });
    } catch (err) {
      next(err);
    }
  };

  updateDesired = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const spaceId = req.params['spaceId'] as string;

      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
        include: { place: true },
      });
      if (!space) throw new NotFoundError('Space', spaceId);

      const dto = UpdateDeviceDesiredSchema.parse(req.body);

      const desired = await this.prisma.deviceDesired.upsert({
        where: { spaceId: space.id },
        update: dto,
        create: { spaceId: space.id, ...dto },
      });

      await this.desiredPublisher.publish(space.placeId, space.id, {
        samplingIntervalSec: desired.samplingIntervalSec,
        co2AlertThreshold: desired.co2AlertThreshold,
      });

      sendSuccess(res, desired);
    } catch (err) {
      next(err);
    }
  };

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const spaceId = req.params['spaceId'] as string;

      const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
      if (!space) throw new NotFoundError('Space', spaceId);

      const { page, pageSize } = PaginationSchema.parse(req.query);
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.alert.findMany({
          where: { spaceId: space.id },
          skip,
          take: pageSize,
          orderBy: { startedAt: 'desc' },
        }),
        this.prisma.alert.count({ where: { spaceId: space.id } }),
      ]);

      res.status(200).json({
        success: true,
        data,
        meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  };

  getTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const spaceId = req.params['spaceId'] as string;

      const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
      if (!space) throw new NotFoundError('Space', spaceId);

      const { page, pageSize } = PaginationSchema.parse(req.query);
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.telemetryAggregation.findMany({
          where: { spaceId: space.id },
          skip,
          take: pageSize,
          orderBy: { windowEnd: 'desc' },
        }),
        this.prisma.telemetryAggregation.count({ where: { spaceId: space.id } }),
      ]);

      res.status(200).json({
        success: true,
        data,
        meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  };
}
