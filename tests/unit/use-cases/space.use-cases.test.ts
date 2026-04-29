import { SpaceUseCases } from '../../../src/application/use-cases/spaces/space.use-cases';
import { SpaceRepository } from '../../../src/domain/repositories/space.repository';
import { PlaceRepository } from '../../../src/domain/repositories/place.repository';
import { NotFoundError, ValidationError } from '../../../src/domain/errors/domain.errors';

const mockPlace = {
  id: 'place-1',
  name: 'HQ',
  latitude: 8.99,
  longitude: -79.51,
  timezone: 'America/Panama',
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

function makePlaceRepo(overrides: Partial<PlaceRepository> = {}): PlaceRepository {
  return {
    findById: jest.fn().mockResolvedValue(mockPlace),
    findAll: jest
      .fn()
      .mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    create: jest.fn().mockResolvedValue(mockPlace),
    update: jest.fn().mockResolvedValue(mockPlace),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('SpaceUseCases', () => {
  describe('create', () => {
    it('creates a space when place exists and hours are valid', async () => {
      const useCases = new SpaceUseCases(makeSpaceRepo(), makePlaceRepo());

      const result = await useCases.create({
        placeId: 'place-1',
        name: 'Room A',
        capacity: 10,
        opensAt: '08:00',
        closesAt: '18:00',
      });

      expect(result).toEqual(mockSpace);
    });

    it('throws NotFoundError when place does not exist', async () => {
      const useCases = new SpaceUseCases(
        makeSpaceRepo(),
        makePlaceRepo({ findById: jest.fn().mockResolvedValue(null) })
      );

      await expect(
        useCases.create({
          placeId: 'ghost',
          name: 'X',
          capacity: 5,
          opensAt: '08:00',
          closesAt: '18:00',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when opensAt >= closesAt', async () => {
      const useCases = new SpaceUseCases(makeSpaceRepo(), makePlaceRepo());

      await expect(
        useCases.create({
          placeId: 'place-1',
          name: 'X',
          capacity: 5,
          opensAt: '18:00',
          closesAt: '08:00',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when opensAt equals closesAt', async () => {
      const useCases = new SpaceUseCases(makeSpaceRepo(), makePlaceRepo());

      await expect(
        useCases.create({
          placeId: 'place-1',
          name: 'X',
          capacity: 5,
          opensAt: '09:00',
          closesAt: '09:00',
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
