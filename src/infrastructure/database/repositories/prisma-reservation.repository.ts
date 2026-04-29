import { PrismaClient } from '@prisma/client';
import {
  ReservationRepository,
  ReservationFilters,
} from '../../../domain/repositories/reservation.repository';
import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
} from '../../../domain/entities/reservation.entity';
import { PaginationParams, PaginatedResult } from '../../../shared/types/pagination.types';
import { getWeekBounds } from '../../../shared/utils/time.utils';

export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({ where: { id }, include: { space: true } });
  }

  async findAll(
    filters: ReservationFilters,
    params: PaginationParams
  ): Promise<PaginatedResult<Reservation>> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhereClause(filters);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { reservationDate: 'desc' },
        include: { space: true },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }

  async findConflicting(
    spaceId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<Reservation[]> {
    const reservationDate = new Date(date);

    return this.prisma.reservation.findMany({
      where: {
        spaceId,
        reservationDate,
        id: excludeId ? { not: excludeId } : undefined,
        // startTime < endTime AND endTime > startTime → overlap
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
  }

  async countActiveByClientInWeek(clientEmail: string, date: string): Promise<number> {
    const { weekStart, weekEnd } = getWeekBounds(new Date(date));

    return this.prisma.reservation.count({
      where: {
        clientEmail,
        reservationDate: { gte: weekStart, lt: weekEnd },
      },
    });
  }

  async create(input: CreateReservationInput & { placeId: string }): Promise<Reservation> {
    return this.prisma.reservation.create({
      data: {
        spaceId: input.spaceId,
        placeId: input.placeId,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        reservationDate: new Date(input.reservationDate),
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
  }

  async update(id: string, input: UpdateReservationInput): Promise<Reservation> {
    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...(input.clientName && { clientName: input.clientName }),
        ...(input.reservationDate && { reservationDate: new Date(input.reservationDate) }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reservation.delete({ where: { id } });
  }

  private buildWhereClause(filters: ReservationFilters) {
    return {
      ...(filters.spaceId && { spaceId: filters.spaceId }),
      ...(filters.placeId && { placeId: filters.placeId }),
      ...(filters.clientEmail && { clientEmail: filters.clientEmail }),
      ...(filters.date && { reservationDate: new Date(filters.date) }),
    };
  }
}
