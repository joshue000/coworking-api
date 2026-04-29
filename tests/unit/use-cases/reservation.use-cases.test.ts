import { ReservationUseCases } from '../../../src/application/use-cases/reservations/reservation.use-cases';
import { ReservationRepository } from '../../../src/domain/repositories/reservation.repository';
import { SpaceRepository } from '../../../src/domain/repositories/space.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../src/domain/errors/domain.errors';

const mockSpace = {
  id: 'space-1',
  placeId: 'place-1',
  name: 'Room A',
  reference: null,
  capacity: 10,
  description: null,
  opensAt: '08:00',
  closesAt: '18:00',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReservation = {
  id: 'res-1',
  spaceId: 'space-1',
  placeId: 'place-1',
  clientName: 'Alice Test',
  clientEmail: 'client@test.com',
  reservationDate: new Date('2025-12-01'),
  startTime: '09:00',
  endTime: '11:00',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeReservationRepo(
  overrides: Partial<ReservationRepository> = {}
): ReservationRepository {
  return {
    findById: jest.fn().mockResolvedValue(mockReservation),
    findAll: jest
      .fn()
      .mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    findConflicting: jest.fn().mockResolvedValue([]),
    countActiveByClientInWeek: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue(mockReservation),
    update: jest.fn().mockResolvedValue(mockReservation),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSpaceRepo(overrides: Partial<SpaceRepository> = {}): SpaceRepository {
  return {
    findById: jest.fn().mockResolvedValue(mockSpace),
    findAll: jest
      .fn()
      .mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    findByPlaceId: jest
      .fn()
      .mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    create: jest.fn().mockResolvedValue(mockSpace),
    update: jest.fn().mockResolvedValue(mockSpace),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ReservationUseCases', () => {
  describe('create', () => {
    it('creates a reservation when no conflicts and within weekly limit', async () => {
      const reservationRepo = makeReservationRepo();
      const spaceRepo = makeSpaceRepo();
      const useCases = new ReservationUseCases(reservationRepo, spaceRepo);

      const result = await useCases.create({
        spaceId: 'space-1',
        clientName: 'Alice Test',
        clientEmail: 'client@test.com',
        reservationDate: '2025-12-01',
        startTime: '09:00',
        endTime: '11:00',
      });

      expect(result).toEqual(mockReservation);
      expect(reservationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ spaceId: 'space-1', placeId: 'place-1' })
      );
    });

    it('throws NotFoundError when space does not exist', async () => {
      const reservationRepo = makeReservationRepo();
      const spaceRepo = makeSpaceRepo({ findById: jest.fn().mockResolvedValue(null) });
      const useCases = new ReservationUseCases(reservationRepo, spaceRepo);

      await expect(
        useCases.create({
          spaceId: 'ghost',
          clientName: 'Bob',
          clientEmail: 'c@t.com',
          reservationDate: '2025-12-01',
          startTime: '09:00',
          endTime: '11:00',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when startTime >= endTime', async () => {
      const useCases = new ReservationUseCases(makeReservationRepo(), makeSpaceRepo());

      await expect(
        useCases.create({
          spaceId: 'space-1',
          clientName: 'Bob',
          clientEmail: 'c@t.com',
          reservationDate: '2025-12-01',
          startTime: '11:00',
          endTime: '09:00',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError when schedule overlaps an existing reservation', async () => {
      const reservationRepo = makeReservationRepo({
        findConflicting: jest.fn().mockResolvedValue([mockReservation]),
      });
      const useCases = new ReservationUseCases(reservationRepo, makeSpaceRepo());

      await expect(
        useCases.create({
          spaceId: 'space-1',
          clientName: 'Bob',
          clientEmail: 'c@t.com',
          reservationDate: '2025-12-01',
          startTime: '10:00',
          endTime: '12:00',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when client exceeds 3 reservations per week', async () => {
      const reservationRepo = makeReservationRepo({
        countActiveByClientInWeek: jest.fn().mockResolvedValue(3),
      });
      const useCases = new ReservationUseCases(reservationRepo, makeSpaceRepo());

      await expect(
        useCases.create({
          spaceId: 'space-1',
          clientName: 'Bob',
          clientEmail: 'c@t.com',
          reservationDate: '2025-12-01',
          startTime: '14:00',
          endTime: '16:00',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('allows the same client to have exactly 3 reservations in the same week', async () => {
      const reservationRepo = makeReservationRepo({
        countActiveByClientInWeek: jest.fn().mockResolvedValue(2),
      });
      const useCases = new ReservationUseCases(reservationRepo, makeSpaceRepo());

      await expect(
        useCases.create({
          spaceId: 'space-1',
          clientName: 'Bob',
          clientEmail: 'c@t.com',
          reservationDate: '2025-12-01',
          startTime: '14:00',
          endTime: '16:00',
        })
      ).resolves.toBeDefined();
    });
  });

  describe('delete', () => {
    it('deletes an existing reservation', async () => {
      const reservationRepo = makeReservationRepo();
      const useCases = new ReservationUseCases(reservationRepo, makeSpaceRepo());

      await useCases.delete('res-1');

      expect(reservationRepo.delete).toHaveBeenCalledWith('res-1');
    });

    it('throws NotFoundError when reservation does not exist', async () => {
      const reservationRepo = makeReservationRepo({ findById: jest.fn().mockResolvedValue(null) });
      const useCases = new ReservationUseCases(reservationRepo, makeSpaceRepo());

      await expect(useCases.delete('ghost')).rejects.toThrow(NotFoundError);
    });
  });
});
