import { SpaceRepository } from '../../../domain/repositories/space.repository';
import { PlaceRepository } from '../../../domain/repositories/place.repository';
import { CreateSpaceInput, UpdateSpaceInput } from '../../../domain/entities/space.entity';
import { NotFoundError, ValidationError } from '../../../domain/errors/domain.errors';
import { PaginationParams } from '../../../shared/types/pagination.types';
import { timeToMinutes } from '../../../shared/utils/time.utils';

export class SpaceUseCases {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly placeRepository: PlaceRepository
  ) {}

  async getAll(params: PaginationParams) {
    return this.spaceRepository.findAll(params);
  }

  async getByPlaceId(placeId: string, params: PaginationParams) {
    const place = await this.placeRepository.findById(placeId);
    if (!place) throw new NotFoundError('Place', placeId);
    return this.spaceRepository.findByPlaceId(placeId, params);
  }

  async getById(id: string) {
    const space = await this.spaceRepository.findById(id);
    if (!space) throw new NotFoundError('Space', id);
    return space;
  }

  async create(input: CreateSpaceInput) {
    const place = await this.placeRepository.findById(input.placeId);
    if (!place) throw new NotFoundError('Place', input.placeId);
    this.validateOfficeHours(input.opensAt, input.closesAt);
    return this.spaceRepository.create(input);
  }

  async update(id: string, input: UpdateSpaceInput) {
    const space = await this.getById(id);
    const opensAt = input.opensAt ?? space.opensAt;
    const closesAt = input.closesAt ?? space.closesAt;
    this.validateOfficeHours(opensAt, closesAt);
    return this.spaceRepository.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.spaceRepository.delete(id);
  }

  private validateOfficeHours(opensAt: string, closesAt: string): void {
    if (timeToMinutes(opensAt) >= timeToMinutes(closesAt)) {
      throw new ValidationError('opensAt must be earlier than closesAt');
    }
  }
}
