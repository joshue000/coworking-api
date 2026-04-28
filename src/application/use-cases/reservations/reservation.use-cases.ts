import { ReservationRepository } from "../../../domain/repositories/reservation.repository";
import { SpaceRepository } from "../../../domain/repositories/space.repository";
import { CreateReservationInput, UpdateReservationInput } from "../../../domain/entities/reservation.entity";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/domain.errors";
import { PaginationParams } from "../../../shared/types/pagination.types";
import { MAX_RESERVATIONS_PER_WEEK } from "../../../shared/constants/alert.constants";
import { doTimesOverlap, timeToMinutes } from "../../../shared/utils/time.utils";

export class ReservationUseCases {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly spaceRepository: SpaceRepository
  ) {}

  async getAll(
    filters: { spaceId?: string; placeId?: string; clientEmail?: string; date?: string },
    params: PaginationParams
  ) {
    return this.reservationRepository.findAll(filters, params);
  }

  async getById(id: string) {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) throw new NotFoundError("Reservation", id);
    return reservation;
  }

  async create(input: CreateReservationInput) {
    const space = await this.spaceRepository.findById(input.spaceId);
    if (!space) throw new NotFoundError("Space", input.spaceId);

    this.validateTimeRange(input.startTime, input.endTime);
    await this.assertNoScheduleConflict(input.spaceId, input.reservationDate, input.startTime, input.endTime);
    await this.assertWeeklyLimit(input.clientEmail, input.reservationDate);

    return this.reservationRepository.create({ ...input, placeId: space.placeId });
  }

  async update(id: string, input: UpdateReservationInput) {
    const existing = await this.getById(id);
    const date = input.reservationDate ?? existing.reservationDate.toISOString().split("T")[0];
    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;

    this.validateTimeRange(startTime, endTime);
    await this.assertNoScheduleConflict(existing.spaceId, date, startTime, endTime, id);

    return this.reservationRepository.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.reservationRepository.delete(id);
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new ValidationError("startTime must be earlier than endTime");
    }
  }

  private async assertNoScheduleConflict(
    spaceId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<void> {
    const conflicts = await this.reservationRepository.findConflicting(
      spaceId, date, startTime, endTime, excludeId
    );
    if (conflicts.length > 0) {
      throw new ConflictError(
        `Space is already reserved from ${conflicts[0].startTime} to ${conflicts[0].endTime} on ${date}`
      );
    }
  }

  private async assertWeeklyLimit(clientEmail: string, date: string): Promise<void> {
    const count = await this.reservationRepository.countActiveByClientInWeek(clientEmail, date);
    if (count >= MAX_RESERVATIONS_PER_WEEK) {
      throw new ConflictError(
        `Client '${clientEmail}' has reached the maximum of ${MAX_RESERVATIONS_PER_WEEK} reservations per week`
      );
    }
  }
}
