import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
} from '../entities/reservation.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination.types';

export interface ReservationFilters {
  spaceId?: string;
  placeId?: string;
  clientEmail?: string;
  date?: string;
}

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findAll(
    filters: ReservationFilters,
    params: PaginationParams
  ): Promise<PaginatedResult<Reservation>>;
  findConflicting(
    spaceId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<Reservation[]>;
  countActiveByClientInWeek(clientEmail: string, date: string): Promise<number>;
  create(input: CreateReservationInput & { placeId: string }): Promise<Reservation>;
  update(id: string, input: UpdateReservationInput): Promise<Reservation>;
  delete(id: string): Promise<void>;
}
